#!/usr/bin/env python3
"""Agent layer in front of llama-server: adds working tools (web search, open URL,
datetime), a modern chat GUI with model badges, and PER-PROFILE persistence.

Every prompt, response and memory fact is saved as separate files under
$LLM_CHAT_STORE (default /opt/llm-chat):

    /opt/llm-chat/
      public/                 <- default profile
        profile.json          {"name","created","model"}
        memory.json           [{ts, text}]
        memory.md             human-readable dump
        conversations.json    index [{id,title,updated,count}]
        conv/<id>.json        full transcript of one conversation
      farshid/                <- any profile you create by saying: profile = farshid
        ...

In the chat box:
    profile = NAME      switch / create profile (its own chats + memory)
    memory = TEXT       save a memory fact to the CURRENT profile
    remember TEXT       same as memory =
    show memory         print the current profile's memory
    clear memory        erase current profile memory
    forget profile NAME delete that profile entirely

Listens on 0.0.0.0:8080, proxies to raw llama-server on 127.0.0.1:8100."""
import aiohttp
from aiohttp import web, ClientSession, ClientTimeout
import json, asyncio, datetime, re, html, time, urllib.parse, os, uuid
from pathlib import Path
from collections import deque

UPSTREAM = "http://127.0.0.1:8100"

# ---- Per-profile persistent storage ----------------------------------------
STORAGE = Path(os.environ.get("LLM_CHAT_STORE", "/opt/llm-chat"))
DEFAULT_PROFILE = "public"

# ---- Friend-sharing auth (optional) -------------------------------------
# Create /opt/api.keys with one key per line. If the file exists, every
# /v1/* request must carry "Authorization: Bearer ***" or ?key=<key>.
# If it does NOT exist, the API is open (local/LAN/Tailscale only).
API_KEYS = set()
try:
    with open("/opt/api.keys") as _f:
        API_KEYS = {ln.strip() for ln in _f if ln.strip() and not ln.startswith("#")}
except Exception:
    pass

def check_auth(request):
    if not API_KEYS:
        return None  # open mode
    # The built-in web page served from this same server is trusted: it cannot
    # carry a key itself, so let it through. External /v1 API clients still
    # need a key. Reachable only by whoever can hit :8080 anyway.
    if request.headers.get("X-Local-UI") == "webui":
        return None
    h = request.headers.get("Authorization", "")
    key = h[7:].strip() if h.startswith("Bearer ") else ""
    if not key:
        key = request.rel_url.query.get("key", "")
    return None if key in API_KEYS else web.json_response(
        {"error": {"message": "Invalid or missing API key. Ask Farshid for a key.",
                   "type": "authentication_error"}}, status=401)

MODELS = {
    "ornith":    {"label": "Ornith-1.5-9B (Q4_K_M)",      "file": "/models/Ornith-1.5-9B-Q4_K_M.gguf"},
    "qwen-coder": {"label": "Qwen2.5-Coder-7B (Q4_K_M, 128K)", "file": "/models/Qwen2.5-Coder-7B-Q4_K_M.gguf"},
    "qwen-iq1s": {"label": "Qwen3.8-27B (UD-IQ1_S, GPU)",  "file": "/models/Qwen-UD-IQ1_S.gguf"},
    "qwen-iq2x": {"label": "Qwen3.8-27B (IQ2_XXS, hybrid)","file": "/models/Qwen-IQ2_XXS.gguf"},
    "qwen38-9b": {"label": "Qwen3.8-9B Distill (Q4_K_M, fast)", "file": "/models/Qwen38-9B-Q4_K_M.gguf"},
    "qwen38-2b": {"label": "Qwen3.8-2B Distill (Q4_K_M, tiny/fast)", "file": "/models/Qwen38-2B-Q4_K_M.gguf"},
}

TOOLS = [
    {"type": "function", "function": {
        "name": "web_search",
        "description": "Search the web. Returns a list of results with title, url and snippet.",
        "parameters": {"type": "object", "properties": {
            "query": {"type": "string", "description": "search query"}}, "required": ["query"]}}},
    {"type": "function", "function": {
        "name": "open_url",
        "description": "Fetch a web page and return readable text (first ~4000 chars). Use after web_search to read a result.",
        "parameters": {"type": "object", "properties": {
            "url": {"type": "string", "description": "full http(s) URL"}}, "required": ["url"]}}},
    {"type": "function", "function": {
        "name": "get_datetime",
        "description": "Get current date and time.",
        "parameters": {"type": "object", "properties": {}}}},
]

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

def _ddgs_search(q):
    """Run ddgs library in a thread (it's blocking); rotates engines/backends itself."""
    import asyncio
    from ddgs import DDGS
    def _run():
        with DDGS(timeout=20) as d:
            for backend in ("auto", "brave", "bing"):
                try:
                    rows = list(d.text(q, max_results=6, backend=backend))
                    if rows:
                        return [{"title": (r.get("title") or "")[:120],
                                 "url": r.get("href", ""),
                                 "snippet": (r.get("body") or "")[:300]} for r in rows]
                except Exception:
                    continue
        return []
    return asyncio.get_event_loop().run_in_executor(None, _run)

async def tool_web_search(args):
    q = args.get("query", "").strip().strip('"').strip("'").strip()
    results = await _ddgs_search(q)
    if not results and q != q.lower():
        results = await _ddgs_search(q.lower())
    if not results:
        return {"error": "no results; try different keywords"}
    return {"engine": "web", "results": results}

def _readable(html_text):
    html_text = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", html_text, flags=re.S | re.I)
    txt = re.sub(r"<[^>]+>", " ", html_text)
    txt = html.unescape(txt)
    return re.sub(r"\s+", " ", txt).strip()

async def tool_open_url(args):
    u = args.get("url", "").strip()
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", u) and not u.lower().startswith(("http://", "https://")):
        return {"error": f"unsupported URL '{u}' - provide a normal web address like https://example.com"}
    if not u.startswith("http"):
        u = "https://" + u
    host = re.sub(r"^https?://", "", u).split("/")[0].split(":")[0].lower()
    if "." not in host or host in ("localhost",):
        return {"error": f"'{u}' is not a reachable web address - use a full URL like https://example.com/page"}
    async with ClientSession(timeout=ClientTimeout(total=30), headers=UA) as s:
        async with s.get(u, allow_redirects=True, max_redirects=5) as r:
            ctype = r.headers.get("Content-Type", "")
            if "html" not in ctype and "text" not in ctype:
                return {"url": str(r.url), "note": f"non-text content ({ctype})"}
            body = await r.text(errors="ignore")
    return {"url": u, "text": _readable(body)[:4000]}

async def tool_get_datetime(_args):
    now = datetime.datetime.now()
    return {"datetime": now.isoformat(), "weekday": now.strftime("%A")}

IMPLEMENTATIONS = {"web_search": tool_web_search, "open_url": tool_open_url, "get_datetime": tool_get_datetime}

MAX_STEPS = 6
SYSTEM_PROMPT = ("You are a helpful assistant with tool access. You MUST use the web_search tool "
                 "whenever the user asks to find, look up, or search anything (URLs, facts, news, "
                 "people, products) — never answer such questions from memory. After using tools, "
                 "give a clear final answer including any relevant URLs.")

def current_model_id():
    try:
        txt = open("/opt/llama.env").read()
        m = re.search(r'MODEL=(.+)', txt).group(1).strip()
        for mid, info in MODELS.items():
            if info["file"] == m:
                return mid
    except Exception:
        pass
    return None

def model_label(mid):
    return MODELS.get(mid, {}).get("label", mid or "unknown")

def resolve_model_id(req_model):
    """Match a client-sent model id (e.g. Continue sends the configured `model:`)
    to a key in MODELS. Accepts the key itself or its label, case-insensitive."""
    if not req_model:
        return None
    r = str(req_model).strip()
    if r in MODELS:
        return r
    for mid, info in MODELS.items():
        if r.lower() == mid.lower() or r.lower() == info["label"].lower():
            return mid
    return None

async def run_cmd(*args):
    p = await asyncio.create_subprocess_exec(*args,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
    out, _ = await p.communicate()
    return out.decode(errors="replace").strip()

async def wait_upstream(timeout=300):
    async with ClientSession() as s:
        deadline = asyncio.get_event_loop().time() + timeout
        while asyncio.get_event_loop().time() < deadline:
            try:
                async with s.get(UPSTREAM + "/health", timeout=ClientTimeout(total=5)) as r:
                    if r.status == 200:
                        return True
            except Exception:
                pass
            await asyncio.sleep(3)
    return False

# ============================ PROFILES / STORAGE ==============================
def _slug(name):
    s = re.sub(r"[^a-z0-9_-]+", "-", (name or "").lower()).strip("-")
    return s[:40]

def _write_json(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = str(path) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)

def _read_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def _now_iso():
    return datetime.datetime.now().isoformat(timespec="seconds")

PROFILES_CACHE = {"current": None}   # slug of active profile (server-lifetime)

def profile_dir(name):
    return STORAGE / _slug(name or DEFAULT_PROFILE)

def ensure_profile(name):
    d = profile_dir(name)
    d.mkdir(parents=True, exist_ok=True)
    (d / "conv").mkdir(exist_ok=True)
    pj = d / "profile.json"
    if not pj.exists():
        _write_json(pj, {"name": _slug(name), "display": (name or DEFAULT_PROFILE).strip(),
                         "created": _now_iso(), "model": current_model_id()})
    for fn, default in (("memory.json", []), ("conversations.json", []), ("notes.json", [])):
        if not (d / fn).exists():
            _write_json(d / fn, default)
    if not (d / "notes.md").exists():
        (d / "notes.md").write_text("# Notes — %s\n" % _slug(name), encoding="utf-8")
    if not (d / "memory.md").exists():
        (d / "memory.md").write_text("# Memory — %s\n" % _slug(name), encoding="utf-8")
    return d

def current_profile():
    if not PROFILES_CACHE["current"]:
        ensure_profile(DEFAULT_PROFILE)
        PROFILES_CACHE["current"] = _slug(DEFAULT_PROFILE)
    return PROFILES_CACHE["current"]

def set_current_profile(slug):
    ensure_profile(slug)
    PROFILES_CACHE["current"] = _slug(slug)

def list_profiles():
    out = []
    if STORAGE.exists():
        for d in sorted(STORAGE.iterdir()):
            if d.is_dir() and (d / "profile.json").exists():
                pj = _read_json(d / "profile.json", {})
                facts = len(_read_json(d / "memory.json", []))
                convs = len(_read_json(d / "conversations.json", []))
                out.append({"name": d.name, "display": pj.get("display", d.name),
                            "created": pj.get("created"), "model": pj.get("model"),
                            "facts": facts, "conversations": convs})
    if not out:
        ensure_profile(DEFAULT_PROFILE)
        return list_profiles()
    return out

CURRENT_CONV = {}   # profile slug -> conversation id (server-lifetime pointer)

def conv_index_path(prof):
    return profile_dir(prof) / "conversations.json"

def get_conv_index(prof):
    idx = _read_json(conv_index_path(prof), [])
    return sorted(idx, key=lambda c: c.get("updated", ""), reverse=True)

def save_conv_index(prof, idx):
    _write_json(conv_index_path(prof), idx)

def load_conv(prof, cid):
    return _read_json(profile_dir(prof) / "conv" / (cid + ".json"), None)

def save_conv(prof, conv):
    _write_json(profile_dir(prof) / "conv" / (conv["id"] + ".json"), conv)
    idx = [c for c in get_conv_index(prof) if c["id"] != conv["id"]]
    idx.insert(0, {"id": conv["id"], "title": conv.get("title", ""),
                   "updated": conv.get("updated"), "count": len(conv.get("messages", []))})
    save_conv_index(prof, idx)

def new_conv(prof, first_text=""):
    cid = datetime.datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + uuid.uuid4().hex[:6]
    conv = {"id": cid, "profile": prof, "title": (first_text or "New chat")[:60],
            "created": _now_iso(), "updated": _now_iso(), "messages": []}
    save_conv(prof, conv)
    return conv

def append_message(prof, cid, msg):
    conv = load_conv(prof, cid)
    if not conv:
        conv = new_conv(prof)
        cid = conv["id"]
    conv["messages"].append(msg)
    conv["updated"] = _now_iso()
    save_conv(prof, conv)
    return conv

def memory_path(prof):
    return profile_dir(prof) / "memory.json"

def get_memory(prof=None):
    prof = prof or current_profile()
    return _read_json(memory_path(prof), [])

def add_memory_fact(prof, text):
    text = re.sub(r"\s+", " ", (text or "").strip())[:200]
    if not text:
        return False
    facts = get_memory(prof)
    key = text.lower()
    if any(f.get("text", "").lower() == key for f in facts):
        return False
    facts.append({"ts": _now_iso(), "text": text})
    if len(facts) > 400:
        facts = facts[-400:]
    _write_json(memory_path(prof), facts)
    dump_memory_md(prof)
    return True

def clear_memory(prof=None):
    prof = prof or current_profile()
    _write_json(memory_path(prof), [])
    dump_memory_md(prof)

def dump_memory_md(prof):
    lines = ["# Memory — %s" % prof, ""]
    for f in get_memory(prof):
        lines.append("- (%s) %s" % (f.get("ts", ""), f.get("text", "")))
    (profile_dir(prof) / "memory.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

# ---- deterministic PKM capture: verbatim notes + tags, NO model involved ----
TAG_CATEGORIES = [
    (re.compile(r"https?://", re.I), ["web", "url"]),
    (re.compile(r"python", re.I), ["python"]),
    (re.compile(r"\.py\b", re.I), ["code", "script"]),
    (re.compile(r"server", re.I), ["server"]),
    (re.compile(r"file", re.I), ["file"]),
    (re.compile(r"\bpc\b|windows|wsl", re.I), ["pc"]),
    (re.compile(r"pdf|document|doc\b", re.I), ["document"]),
    (re.compile(r"image|photo|screenshot", re.I), ["image"]),
    (re.compile(r"\bllm\b|model|inferenc", re.I), ["llm"]),
    (re.compile(r"note|idea|todo|remind", re.I), ["note"]),
]

def get_capture(prof=None):
    """Whether 'capture everything verbatim' is ON for this profile."""
    prof = prof or current_profile()
    return bool(_read_json(profile_dir(prof) / "profile.json", {}).get("capture"))

def set_capture(prof, on):
    pj = _read_json(profile_dir(prof) / "profile.json", {})
    pj["capture"] = bool(on)
    _write_json(profile_dir(prof) / "profile.json", pj)

def derive_tags(text):
    """Hashtags already in text + keyword categories + a safe default."""
    tags = list(dict.fromkeys(re.findall(r"#([A-Za-z][\w-]*)", text or "")))
    for pat, cats in TAG_CATEGORIES:
        if pat.search(text or ""):
            tags.extend(c for c in cats if c not in tags)
    if not tags:
        tags.append("note")
    return tags

def notes_path(prof):
    return profile_dir(prof) / "notes.json"

def get_notes(prof=None):
    prof = prof or current_profile()
    return _read_json(notes_path(prof), [])

def add_note(prof, text):
    """Save an entry VERBATIM with tags. Returns the tags list."""
    text = (text or "").strip()
    if not text:
        return []
    tags = derive_tags(text)
    notes = get_notes(prof)
    notes.append({"id": uuid.uuid4().hex[:8], "ts": _now_iso(), "text": text, "tags": tags})
    _write_json(notes_path(prof), notes)
    # keep a human-readable append-only .md mirror for easy browsing on the PC
    md_path = profile_dir(prof) / "notes.md"
    with md_path.open("a", encoding="utf-8") as fh:
        fh.write("\n## %s  (#%s)\n%s\n" % (_now_iso(), ", #".join(tags), text))
    return tags

# --- automatic memory extraction from ordinary conversation ------------------
AUTO_MEMORY_PATTERNS = [
    (re.compile(r"\bmy name is\s+([A-Za-z][\w'-]{1,30})", re.I), lambda m: "Name: " + m.group(1)),
    (re.compile(r"\bi am\s+(\d{1,2})\s*(?:years old|yo\b)", re.I), lambda m: "Age: " + m.group(1)),
    (re.compile(r"\bi (?:live|am based) in\s+([A-Za-z ,.\-]{2,50})", re.I), lambda m: "Location: " + m.group(1)),
    (re.compile(r"\bi work (?:as|at|on)\s+([A-Za-z0-9 ,.+&/\-]{2,60})", re.I), lambda m: "Work: " + m.group(1)),
    (re.compile(r"\bmy (?:favorite|favourite)\s+([\w -]{2,30})\s+is\s+([\w \-.]{1,60})", re.I),
     lambda m: "Favorite %s: %s" % (m.group(1), m.group(2))),
    (re.compile(r"\bi (?:like|love|enjoy|prefer)\s+([^.!?\n]{3,80})", re.I), lambda m: "Likes: " + m.group(1)),
    (re.compile(r"\bi (?:hate|dislike|don't like|do not like|can't stand)\s+([^.!?\n]{3,80})", re.I),
     lambda m: "Dislikes: " + m.group(1)),
    (re.compile(r"\bi (?:use|am using)\s+([A-Za-z0-9 ,.+&#/\-]{2,60})", re.I), lambda m: "Uses: " + m.group(1)),
    (re.compile(r"\bi have\s+(?:an?\s+)?([A-Za-z0-9 ,.+\-]{3,60})", re.I), lambda m: "Has: " + m.group(1)),
]

def auto_extract_memories(prof, user_text):
    added = []
    for pat, fmt in AUTO_MEMORY_PATTERNS:
        for m in pat.finditer(user_text or ""):
            fact = fmt(m).strip(" .,-")
            if 3 < len(fact) <= 200 and add_memory_fact(prof, fact):
                added.append(fact)
    return added

def memory_block_for_prompt(prof=None):
    facts = get_memory(prof)[-20:]
    if not facts:
        return ""
    lines = "\n".join("- " + f["text"] for f in reversed(facts))
    return ("\n\n[PERSISTENT USER FACTS — always honor these. The user genuinely does have this "
            "information and it is stored in memory. When the user's question relates to any of "
            "these facts (their name, where they live, their job, likes/dislikes, etc.), answer "
            "DIRECTLY using the fact below. NEVER claim you lack this memory or ask the user to "
            "repeat something that is listed here — you already know it.]\n" + lines)

def profile_meta_prompt():
    mid = current_model_id() or "local"
    return ("You are '%s' (%s), a large language model running LOCALLY on a private "
            "machine. If asked who/what you are, say exactly that." % (model_label(mid), mid))

# ---- chat-box command handling ----------------------------------------------
RE_CMD_PROFILE = re.compile(r"^\s*profile\s*(?:=|\bis\b|:)\s*([A-Za-z0-9_\- ]{1,40})\s*$", re.I)
RE_CMD_PROFILE_BARE = re.compile(r"^\s*profile\s+([A-Za-z0-9_\-]{1,40})\s*$", re.I)
RE_CMD_MEMORY_SET = re.compile(r"^\s*(?:memory|remember)\s*[=:]\s*(.+)$", re.I | re.S)
RE_CMD_REMEMBER = re.compile(r"^\s*remember\s+(?:that\s+)?(.+)$", re.I | re.S)
RE_CMD_MEMORY_SHOW = re.compile(r"^\s*(?:show\s+)?memory\s*[=?]?\s*$", re.I)
RE_CMD_MEMORY_CLEAR = re.compile(r"^\s*(?:clear|erase|reset)\s+memory\s*$", re.I)
RE_CMD_FORGET = re.compile(r"^\s*forget\s+profile\s+([A-Za-z0-9_\-]{1,40})\s*$", re.I)
RE_CMD_PKM_ON = re.compile(r"^\s*(?:pkm|capture)\s+(?:on|start)\s*$", re.I)
RE_CMD_PKM_OFF = re.compile(r"^\s*(?:pkm|capture)\s+(?:off|stop|end)\s*$", re.I)
RE_CMD_PKM_STATUS = re.compile(r"^\s*(?:pkm|capture)\s*(?:status|state)?\s*[=?]?\s*$", re.I)
RE_CMD_PKM_LIST = re.compile(r"^\s*(?:pkm|capture|notes?)\s+(?:list|show|view|all)\s*$", re.I)
RE_CMD_PKM_CLEAR = re.compile(r"^\s*(?:pkm|capture|notes?)\s+clear\s*$", re.I)
# one-shot save: "note: ..." / "save: ..." / "pkm: ..." — verbatim, no model
RE_CMD_NOTE = re.compile(r"^\s*(?:note|save|pkm)\s*[:#]\s*(.+)$", re.I | re.S)

def handle_commands(text):
    """Return an OpenAI-shaped direct reply if the text was a storage command, else None."""
    prof = current_profile()
    t = (text or "").strip()

    m = RE_CMD_PROFILE.match(t) or RE_CMD_PROFILE_BARE.match(t)
    if m:
        name = m.group(1).strip()
        slug = _slug(name)
        existed = (profile_dir(slug) / "profile.json").exists()
        set_current_profile(slug)
        CURRENT_CONV.pop(slug, None)   # start a fresh conversation under this profile
        pj = _read_json(profile_dir(slug) / "profile.json", {})
        verb = "Switched to existing profile" if existed else "Created new profile"
        return _sys_reply("%s **%s** (`%s`). From now on every prompt, response and memory "
                          "fact is saved under this profile. Say `public` as `profile = public` "
                          "to go back to the shared one." % (verb, pj.get("display", slug), slug))

    m = RE_CMD_MEMORY_SET.match(t) or RE_CMD_REMEMBER.match(t)
    if m:
        add_memory_fact(prof, m.group(1))
        n = len(get_memory(prof))
        return _sys_reply("Saved to **%s** memory (%d facts). It will be included in every "
                          "future answer for this profile." % (prof, n))

    if RE_CMD_MEMORY_SHOW.match(t):
        facts = get_memory(prof)
        if not facts:
            return _sys_reply("Memory for **%s** is empty. Save facts with `memory = ...` "
                              "or just tell me about yourself." % prof)
        body = "\n".join("- " + f["text"] for f in facts[-25:])
        return _sys_reply("**%s** memory (%d facts, newest last):\n%s" % (prof, len(facts), body))

    if RE_CMD_MEMORY_CLEAR.match(t):
        clear_memory(prof)
        return _sys_reply("Cleared all memory for **%s**." % prof)

    m = RE_CMD_FORGET.match(t)
    if m:
        slug = _slug(m.group(1))
        if slug == DEFAULT_PROFILE:
            return _sys_reply("`public` is the default profile and cannot be deleted.")
        import shutil
        shutil.rmtree(profile_dir(slug), ignore_errors=True)
        if prof == slug:
            set_current_profile(DEFAULT_PROFILE)
            CURRENT_CONV.pop(DEFAULT_PROFILE, None)
        return _sys_reply("Deleted profile **%s** (chats + memory)." % slug)

    # ---- PKM capture mode (verbatim notes, model NEVER involved) ----
    if RE_CMD_PKM_ON.match(t):
        set_capture(prof, True)
        return _sys_reply("📥 **PKM capture ON** for **%s**. Every message you send from now on "
                          "is saved VERBATIM (with auto tags) and the model is NOT asked to "
                          "process it. Stop it any time with `pkm off`." % prof)

    if RE_CMD_PKM_OFF.match(t):
        set_capture(prof, False)
        return _sys_reply("PKM capture OFF for **%s**. Next messages go to the chat model "
                          "as normal." % prof)

    if RE_CMD_PKM_STATUS.match(t):
        on = get_capture(prof)
        return _sys_reply("**%s** PKM capture is **%s**. `%s`"
                          % (prof, "ON (verbatim save)" if on else "OFF (normal chat)",
                             "type `pkm off` to switch" if on else "type `pkm on` to enable"))

    if RE_CMD_PKM_LIST.match(t):
        notes = get_notes(prof)
        if not notes:
            return _sys_reply("No notes saved for **%s** yet. Send `pkm on` then just type "
                              "what you want to keep, or use `note: <text>`." % prof)
        body = "\n".join("- (%s) `#%s` — %s"
                         % (n["ts"], ", #".join(n.get("tags", [])), n["text"][:90])
                         for n in notes[-25:])
        return _sys_reply("**%s** notes (%d total, newest last):\n%s" % (prof, len(notes), body))

    if RE_CMD_PKM_CLEAR.match(t):
        _write_json(notes_path(prof), [])
        (profile_dir(prof) / "notes.md").write_text("# Notes — %s\n" % prof, encoding="utf-8")
        return _sys_reply("Cleared all notes for **%s**." % prof)

    return None

def _sys_reply(text):
    return {"choices": [{"message": {"role": "assistant", "content": text},
                         "finish_reason": "stop"}],
            "model": "storage", "model_label": "storage"}

def export_markdown(prof):
    parts = ["# Local LLM export — profile: %s — generated %s\n" % (prof, _now_iso())]
    for c in get_conv_index(prof):
        conv = load_conv(prof, c["id"]) or {}
        parts.append("\n---\n\n## %s\n_%s · %d messages_\n" %
                     (conv.get("title", c["id"]), c.get("updated", ""), c.get("count", 0)))
        for m in conv.get("messages", []):
            who = "You" if m.get("role") == "user" else (m.get("model_label") or "Assistant")
            parts.append("\n**%s · %s:**\n\n%s\n" % (who, m.get("ts", ""), m.get("content", "")))
    facts = get_memory(prof)
    parts.append("\n---\n\n## Memory (%d facts)\n" % len(facts))
    for f in facts:
        parts.append("- (%s) %s\n" % (f.get("ts", ""), f.get("text", "")))
    notes = get_notes(prof)
    parts.append("\n---\n\n## Notes (%d, verbatim captures)\n" % len(notes))
    for n in notes:
        parts.append("- (%s) `#%s` — %s\n"
                     % (n.get("ts", ""), ", #".join(n.get("tags", [])), n.get("text", "")))
    return "".join(parts)

# ---- live tool activity feed (page polls while thinking) ---------------------
ACTIVITY = deque(maxlen=40)

def note_activity(kind, detail):
    ACTIVITY.append({"ts": time.time(), "kind": kind, "detail": str(detail)[:160]})

# ============================ HTTP handlers ===================================
async def models_handler(request):
    cur = current_model_id()
    return web.json_response({
        "current": cur,
        "models": [{"id": k, "label": v["label"]} for k, v in MODELS.items()]})

async def switch_handler(request):
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "bad json"}, status=400)
    mid = body.get("id")
    if mid not in MODELS:
        return web.json_response({"error": f"unknown model {mid}"}, status=400)
    note_activity("switch", "loading " + MODELS[mid]["label"])
    out1 = await run_cmd("/opt/bin/use-model", mid)
    out2 = await run_cmd("systemctl", "restart", "llama-server")
    ok = await wait_upstream(300)
    # persist the model choice on the active profile
    prof = current_profile()
    pj = _read_json(profile_dir(prof) / "profile.json", {})
    pj["model"] = mid
    _write_json(profile_dir(prof) / "profile.json", pj)
    note_activity("switch", "ready: " + MODELS[mid]["label"])
    return web.json_response({"ok": ok, "id": mid, "label": MODELS[mid]["label"],
                              "use_model_out": out1, "restart_out": out2})

async def state_handler(request):
    prof = current_profile()
    mid = current_model_id()
    conv = load_conv(prof, CURRENT_CONV.get(prof, "")) if CURRENT_CONV.get(prof) else None
    return web.json_response({
        "profile": prof,
        "profiles": list_profiles(),
        "conversations": get_conv_index(prof),
        "conversation": conv,
        "memory": get_memory(prof),
        "notes": get_notes(prof)[-15:],
        "capture": get_capture(prof),
        "model": {"id": mid or "", "label": model_label(mid)},
        "models": [{"id": k, "label": v["label"]} for k, v in MODELS.items()],
        "storage": str(STORAGE),
        "now": _now_iso(),
    })

async def profiles_switch_handler(request):
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "bad json"}, status=400)
    name = (body.get("name") or "").strip()
    if not name:
        return web.json_response({"error": "missing name"}, status=400)
    set_current_profile(name)
    return web.json_response({"ok": True, "profile": current_profile()})

async def new_chat_handler(request):
    prof = current_profile()
    CURRENT_CONV[prof] = None
    return web.json_response({"ok": True})

async def select_chat_handler(request):
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "bad json"}, status=400)
    prof = current_profile()
    cid = body.get("id", "")
    conv = load_conv(prof, cid)
    if not conv:
        return web.json_response({"error": "no such conversation"}, status=404)
    CURRENT_CONV[prof] = cid
    return web.json_response(conv)

async def delete_chat_handler(request):
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "bad json"}, status=400)
    prof = current_profile()
    cid = body.get("id", "")
    conv_file = profile_dir(prof) / "conv" / (cid + ".json")
    if conv_file.exists():
        conv_file.unlink()
    save_conv_index(prof, [c for c in get_conv_index(prof) if c["id"] != cid])
    if CURRENT_CONV.get(prof) == cid:
        CURRENT_CONV[prof] = None
    return web.json_response({"ok": True})

async def conversation_handler(request):
    prof = current_profile()
    cid = request.rel_url.query.get("id", "")
    conv = load_conv(prof, cid)
    if not conv:
        return web.json_response({"error": "no such conversation"}, status=404)
    return web.json_response(conv)

async def memory_post_handler(request):
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "bad json"}, status=400)
    prof = current_profile()
    if body.get("action") == "clear":
        clear_memory(prof)
        return web.json_response({"ok": True, "memory": []})
    ok = add_memory_fact(prof, body.get("text", ""))
    return web.json_response({"ok": ok, "memory": get_memory(prof)})

async def memory_clear_handler(request):
    prof = current_profile()
    clear_memory(prof)
    return web.json_response({"ok": True, "memory": []})

async def export_handler(request):
    prof = current_profile()
    fmt = request.rel_url.query.get("format", "md")
    if fmt == "json":
        payload = {"profile": prof, "generated": _now_iso(),
                   "profiles": list_profiles(),
                   "memory": get_memory(prof),
                   "conversations": [load_conv(prof, c["id"]) for c in get_conv_index(prof)]}
        body = json.dumps(payload, ensure_ascii=False, indent=1)
        return web.Response(text=body, content_type="application/json",
                            headers={"Content-Disposition":
                                     'attachment; filename="llm-export-%s.json"' % prof})
    return web.Response(text=export_markdown(prof), content_type="text/plain",
                        headers={"Content-Disposition":
                                 'attachment; filename="llm-export-%s.md"' % prof})

async def activity_handler(request):
    try:
        since = float(request.rel_url.query.get("since", "0"))
    except ValueError:
        since = 0.0
    return web.json_response({"events": [e for e in ACTIVITY if e["ts"] > since],
                              "now": time.time()})

async def v1_models_handler(request):
    """Strict OpenAI-style model list (extra fields rejected by some clients)."""
    deny = check_auth(request)
    if deny:
        return deny
    data = []
    for mid, info in MODELS.items():
        data.append({"id": mid, "object": "model", "created": 1700000000,
                     "owned_by": "local"})
    return web.json_response({"object": "list", "data": data})

PAGE = r"""<!DOCTYPE html><html lang="en" data-theme="dark"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Local LLM</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11/styles/github-dark.min.css">
<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/highlight.js@11/lib/common.min.js"></script>
<style>
:root{
  --bg:#101014;--panel:#17171d;--panel2:#1e1e26;--border:#2a2a34;
  --text:#e8e8ee;--muted:#8b8b99;--accent:#4f8cff;--accent2:#7c5cff;
  --user:#2f6fed;--bot:#1e1e26;--ok:#3ecf8e;--warn:#ffb454;--err:#ff6b6b;
  --radius:14px;--shadow:0 8px 28px rgba(0,0,0,.45);
}
[data-theme="light"]{
  --bg:#f4f4f8;--panel:#ffffff;--panel2:#eef0f6;--border:#dcdfe8;
  --text:#1c1e26;--muted:#666b7d;--user:#2f6fed;--bot:#ffffff;
  --shadow:0 8px 24px rgba(30,32,50,.10);
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;
  background:var(--bg);color:var(--text);font-size:15px;line-height:1.55;
  height:100vh;height:100dvh;display:flex;overflow:hidden}
button{font-family:inherit}

/* ---------- sidebar ---------- */
#sidebar{width:264px;background:var(--panel);border-right:1px solid var(--border);
  display:flex;flex-direction:column;flex-shrink:0;transition:transform .22s ease;z-index:40}
#sidehead{padding:14px 14px 8px}
#brand{font-weight:700;font-size:15px;letter-spacing:.2px;display:flex;align-items:center;gap:8px;margin-bottom:12px}
#newchat{width:100%;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:0;
  border-radius:12px;padding:11px;font-size:14px;font-weight:600;cursor:pointer}
#newchat:hover{filter:brightness(1.08)}
.sect{padding:10px 14px 4px;font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);
  display:flex;justify-content:space-between;align-items:center}
.sect button{background:none;border:0;color:var(--muted);cursor:pointer;font-size:14px;padding:2px 6px;border-radius:6px}
.sect button:hover{color:var(--text);background:var(--panel2)}
#profiles{display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 8px}
.chip{border:1px solid var(--border);background:var(--panel2);color:var(--text);border-radius:999px;
  padding:4px 12px;font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.chip.active{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border-color:transparent}
.chip .x{opacity:.55;font-size:11px}.chip:hover .x{opacity:1}
#convlist{flex:1;overflow-y:auto;padding:4px 8px 10px}
.convitem{padding:9px 10px;border-radius:10px;cursor:pointer;font-size:13px;color:var(--text);
  display:flex;justify-content:space-between;gap:6px;align-items:center}
.convitem:hover{background:var(--panel2)}
.convitem.active{background:var(--panel2);outline:1px solid var(--border)}
.convitem .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.convitem .d{font-size:10.5px;color:var(--muted);flex-shrink:0}
.convitem .del{visibility:hidden;border:0;background:none;color:var(--muted);cursor:pointer;font-size:13px;padding:0 2px}
.convitem:hover .del{visibility:visible}
.convitem .del:hover{color:var(--err)}
#sidefoot{padding:10px 14px;border-top:1px solid var(--border);font-size:12px;color:var(--muted)}
#sidefoot a{color:var(--muted)}

/* ---------- main ---------- */
#main{flex:1;display:flex;flex-direction:column;min-width:0}
header{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--panel);
  border-bottom:1px solid var(--border)}
#burger{display:none;background:none;border:0;color:var(--text);font-size:19px;cursor:pointer;padding:4px 8px}
#modelbadge{display:inline-flex;align-items:center;gap:7px;background:var(--panel2);border:1px solid var(--border);
  border-radius:999px;padding:5px 12px;font-size:12.5px;cursor:pointer}
#mdot{width:8px;height:8px;border-radius:50%;background:var(--ok);flex-shrink:0;
  transition:background .3s}
#mdot.busy{background:var(--warn);animation:pulse 1.2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
header h1{font-size:14px;margin:0;font-weight:600}
#hspace{flex:1}
.icobtn{background:none;border:1px solid var(--border);color:var(--muted);border-radius:10px;
  font-size:15px;cursor:pointer;padding:6px 10px}
.icobtn:hover{color:var(--text);background:var(--panel2)}

/* ---------- chat ---------- */
#chatwrap{flex:1;overflow-y:auto;scroll-behavior:smooth}
#chat{max-width:860px;margin:0 auto;padding:18px 16px 8px;display:flex;flex-direction:column;gap:14px}
.msg{max-width:82%;padding:11px 15px;border-radius:var(--radius);position:relative;
  animation:fadein .18s ease;word-wrap:break-word;overflow-wrap:break-word}
@keyframes fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.user{align-self:flex-end;background:var(--user);color:#fff;border-bottom-right-radius:5px;white-space:pre-wrap}
.bot{align-self:flex-start;background:var(--bot);border:1px solid var(--border);border-bottom-left-radius:5px;box-shadow:var(--shadow)}
.sys{align-self:center;background:none;color:var(--muted);font-size:12.5px;text-align:center;max-width:92%;
  border:1px dashed var(--border);border-radius:10px;padding:7px 14px}
.meta{margin-top:7px;font-size:10.5px;color:var(--muted);display:flex;gap:8px;align-items:center}
.msg.bot .meta{border-top:1px solid var(--border);padding-top:5px}
.mtag{background:rgba(79,140,255,.15);color:var(--accent);border-radius:6px;padding:1px 7px;font-weight:600}
[data-theme="light"] .mtag{background:rgba(47,111,237,.10)}
/* markdown */
.bot p{margin:.35em 0}.bot p:first-child{margin-top:0}.bot p:last-child{margin-bottom:0}
.bot h1,.bot h2,.bot h3,.bot h4{margin:.7em 0 .3em;line-height:1.3}
.bot ul,.bot ol{margin:.35em 0;padding-left:1.35em}
.bot code{background:rgba(127,127,155,.18);padding:.12em .4em;border-radius:5px;font-size:.88em;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.bot pre{background:#0d0d12;border:1px solid var(--border);border-radius:10px;padding:12px;
  overflow-x:auto;margin:.55em 0;font-size:13px}
[data-theme="light"] .bot pre{background:#f6f7fa}
.bot pre code{background:none;padding:0;font-size:13px}
.bot table{border-collapse:collapse;margin:.5em 0;width:100%;font-size:.92em}
.bot th,.bot td{border:1px solid var(--border);padding:5px 9px;text-align:left}
.bot blockquote{margin:.4em 0;padding:.1em .9em;border-left:3px solid var(--accent);color:var(--muted)}
.bot a{color:var(--accent)}
/* thinking */
.think{display:flex;flex-direction:column;gap:4px}
.think .dots span{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--muted);
  margin-right:4px;animation:bounce 1.2s infinite}
.think .dots span:nth-child(2){animation-delay:.15s}.think .dots span:nth-child(3){animation-delay:.3s}
@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
#actline{font-size:11.5px;color:var(--muted);min-height:15px}

/* ---------- composer ---------- */
#bar{display:flex;gap:9px;align-items:flex-end;padding:11px 14px calc(11px + env(safe-area-inset-bottom));
  background:var(--panel);border-top:1px solid var(--border)}
#barinner{max-width:860px;margin:0 auto;display:flex;gap:9px;align-items:flex-end;width:100%}
#inp{flex:1;background:var(--panel2);border:1px solid var(--border);border-radius:14px;padding:11px 14px;
  color:var(--text);font-size:14.5px;font-family:inherit;resize:none;outline:none;max-height:160px;line-height:1.45}
#inp:focus{border-color:var(--accent)}
#send,#stop{background:linear-gradient(135deg,var(--accent),var(--accent2));border:0;color:#fff;
  border-radius:12px;padding:11px 20px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap}
#stop{background:var(--err)}
button:disabled{opacity:.45;cursor:not-allowed}
.hint{text-align:center;color:var(--muted);font-size:11px;padding:0 0 6px}

/* ---------- modal ---------- */
#overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:90;backdrop-filter:blur(2px)}
#modal{display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100;
  width:min(680px,94vw);max-height:84vh;background:var(--panel);border:1px solid var(--border);
  border-radius:16px;box-shadow:var(--shadow);flex-direction:column;overflow:hidden}
#modalhead{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;
  border-bottom:1px solid var(--border);font-weight:700;font-size:14px}
#modalbody{padding:14px 18px;overflow-y:auto;font-size:13.5px}
#modalbody ul{padding-left:1.2em;margin:.3em 0}
#modalbody li{margin:.28em 0;color:var(--text)}
#modalbody .ts{color:var(--muted);font-size:11px;margin-right:6px}
#scrim{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:35}

/* ---------- responsive ---------- */
@media(max-width:820px){
  #sidebar{position:fixed;top:0;bottom:0;left:0;transform:translateX(-105%);box-shadow:var(--shadow)}
  #sidebar.open{transform:none}
  #scrim.show{display:block}
  #burger{display:block}
  .msg{max-width:94%}
  #modelbadge{max-width:46vw}#modelbadge span.lbl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
}
::-webkit-scrollbar{width:9px;height:9px}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:8px}
</style></head><body>

<nav id="sidebar">
  <div id="sidehead">
    <div id="brand">🤖 Local LLM</div>
    <button id="newchat">＋ New chat</button>
  </div>
  <div class="sect"><span>Profiles</span><button id="addprof" title="New profile">＋</button></div>
  <div id="profiles"></div>
  <div class="sect"><span>Conversations</span><button id="reloadconv" title="Refresh">⟳</button></div>
  <div id="convlist"></div>
  <div id="sidefoot">💾 Saved per-profile under<br><span id="storepath" style="word-break:break-all"></span>
    <br><a href="/__export?format=md" target="_blank">⬇ export .md</a> ·
    <a href="/__export?format=json" target="_blank">.json</a></div>
</nav>
<div id="scrim"></div>

<div id="main">
  <header>
    <button id="burger">☰</button>
    <span id="modelbadge" title="Click to change model">
      <span id="mdot"></span><span class="lbl" id="mlabel">…</span>
    </span>
    <select id="modelSel" style="display:none"></select>
    <h1 id="proftitle">public</h1>
    <div id="hspace"></div>
    <button class="icobtn" id="membtn" title="Memory">🧠</button>
    <button class="icobtn" id="theme" title="Light/dark">☀️</button>
  </header>

  <div id="chatwrap"><div id="chat"></div></div>

  <div class="hint">Say <b>profile = name</b> to isolate chats+memory · <b>memory = fact</b> to remember · <b>pkm on</b> to save everything verbatim</div>
  <div id="bar"><div id="barinner">
    <textarea id="inp" rows="1" placeholder="Message…  (Enter to send, Shift+Enter for newline)"></textarea>
    <button id="send">Send</button>
    <button id="stop" style="display:none">■ Stop</button>
  </div></div>
</div>

<div id="overlay"></div>
<div id="modal">
  <div id="modalhead"><span>🧠 Memory — <span id="memprof"></span></span>
    <span><button class="icobtn" id="memclear" title="Clear memory">🗑</button>
    <button class="icobtn" id="memclose">✕</button></span></div>
  <div id="modalbody"></div>
</div>

<script>
const $=id=>document.getElementById(id);
const chat=$('chat'),inp=$('inp'),sendBtn=$('send'),stopBtn=$('stop');
let S=null,msgs=[],busy=false,aborter=null,pollTimer=null,sinceAct=Date.now()/1000;

marked.setOptions({breaks:true,mangle:false,headerIds:false});
function esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function md(t){
  try{
    let h=marked.parse(t);
    if(window.DOMPurify)h=DOMPurify.sanitize(h);
    return h;
  }catch(e){return '<p>'+esc(t)+'</p>'}
}
function decorate(el){
  el.querySelectorAll('pre code').forEach(c=>{try{hljs.highlightElement(c)}catch(e){}});
  el.querySelectorAll('a').forEach(a=>{a.target='_blank';a.rel='noopener'});
}
function scroll(){const w=$('chatwrap');w.scrollTop=w.scrollHeight}

function addMsg(cls,text,meta,raw){
  const d=document.createElement('div');d.className='msg '+cls;
  if(raw){d.textContent=text;}
  else{d.innerHTML=cls==='user'?esc(text):md(text);decorate(d);}
  if(meta){
    const m=document.createElement('div');m.className='meta';
    m.innerHTML='<span class="mtag">'+esc(meta.label||'')+'</span>'+
      (meta.tps?'<span>'+meta.tps.toFixed(1)+' tok/s</span>':'')+
      (meta.elapsed?'<span>'+meta.elapsed.toFixed(1)+'s</span>':'')+
      (meta.ts?'<span>'+esc(meta.ts)+'</span>':'');
    d.appendChild(m);
  }
  chat.appendChild(d);scroll();return d;
}
function addSys(t){return addMsg('sys',t,null,true)}

/* ---------- state ---------- */
async function jget(u){const r=await fetch(u);return r.json()}
async function jpost(u,b){const r=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify(b||{})});return r.json()}

async function refreshState(){
  S=await jget('/__state');
  $('proftitle').textContent = S.capture ? (S.profile + ' 📥') : S.profile;
  $('proftitle').title = S.capture ? 'PKM capture ON — every message saved verbatim' : 'profile';
  $('mlabel').textContent=S.model.label||S.model.id||'unknown';
  $('storepath').textContent=S.storage;
  renderProfiles();renderConvs();
  if(S.conversation&&!msgs.length)loadConvInto(S.conversation);
}
function renderProfiles(){
  const p=$('profiles');p.innerHTML='';
  for(const pr of S.profiles){
    const b=document.createElement('button');b.className='chip'+(pr.name===S.profile?' active':'');
    b.innerHTML=(pr.name===S.profile?'👤 ':'')+esc(pr.display)+
      ' <span class="x">'+pr.facts+'🧠 '+pr.conversations+'💬</span>';
    b.title='facts: '+pr.facts+' · chats: '+pr.conversations+' · click to switch';
    b.onclick=()=>switchProfile(pr.name);
    p.appendChild(b);
  }
}
async function switchProfile(name){
  await jpost('/__profiles/switch',{name});
  msgs=[];chat.innerHTML='';
  addSys('Profile → **'+name+'**');
  await refreshState();
}
function renderConvs(){
  const l=$('convlist');l.innerHTML='';
  const cur=S.conversation?S.conversation.id:null;
  for(const c of S.conversations){
    const it=document.createElement('div');it.className='convitem'+(c.id===cur?' active':'');
    const t=document.createElement('span');t.className='t';t.textContent=c.title||c.id;
    const d=document.createElement('span');d.className='d';d.textContent=(c.updated||'').slice(5,10);
    const del=document.createElement('button');del.className='del';del.textContent='🗑';del.title='Delete';
    del.onclick=async ev=>{ev.stopPropagation();
      if(!confirm('Delete this conversation permanently?'))return;
      await jpost('/__delete_chat',{id:c.id});msgs=[];chat.innerHTML='';
      addSys('Conversation deleted.');await refreshState();};
    it.append(t,d,del);
    it.onclick=async()=>{
      const cv=await jpost('/__select_chat',{id:c.id});
      if(cv&&cv.messages)loadConvInto(cv);
    };
    l.appendChild(it);
  }
}
function loadConvInto(cv){
  chat.innerHTML='';msgs=[];
  addSys('Loaded "'+(cv.title||cv.id)+'" ('+cv.messages.length+' messages)');
  for(const m of cv.messages){
    if(m.role==='user')addMsg('user',m.content,null);
    else addMsg('bot',m.content,{label:m.model_label||m.model||'assistant',tps:m.tps,ts:(m.ts||'').slice(0,16)});
    msgs.push({role:m.role,content:m.content});
  }
  S.conversation=cv;
  renderConvs();
}

/* ---------- memory modal ---------- */
$('membtn').onclick=async()=>{
  const st=await jget('/__state');
  $('memprof').textContent=st.profile;
  const b=$('modalbody');
  if(!st.memory.length)b.innerHTML='<i>No memories yet for this profile. Say <code>memory = …</code> in chat, or just tell me about yourself.</i>';
  else b.innerHTML='<ul>'+st.memory.slice().reverse().map(f=>
    '<li><span class="ts">'+esc((f.ts||'').slice(0,16))+'</span>'+esc(f.text)+'</li>').join('')+'</ul>';
  $('overlay').style.display='block';$('modal').style.display='flex';
};
$('memclose').onclick=()=>{$('overlay').style.display='none';$('modal').style.display='none'};
$('overlay').onclick=()=>$('memclose').onclick();
$('memclear').onclick=async()=>{
  if(!confirm('Erase ALL memory for profile "'+S.profile+'"?'))return;
  await jpost('/__memory/clear');$('membtn').onclick();};

/* ---------- profiles add / forget ---------- */
$('addprof').onclick=async()=>{
  const n=prompt('New profile name (gets its own chats + memory):');
  if(n&&n.trim()){await switchProfile(n.trim());}
};

/* ---------- model ---------- */
function fillModels(){
  const sel=$('modelSel');sel.innerHTML='';
  for(const m of (S.models||[])){const o=document.createElement('option');
    o.value=m.id;o.textContent=m.label;if(m.id===(S.model&&S.model.id))o.selected=true;sel.appendChild(o);}
}
$('modelbadge').onclick=()=>{
  fillModels();
  const sel=$('modelSel');
  sel.style.display=sel.style.display==='none'?'inline-block':'none';
  if(sel.style.display==='inline-block'){sel.focus();}
};
$('modelSel').onchange=async()=>{
  const sel=$('modelSel');sel.style.display='none';
  const lbl=sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].textContent:sel.value;
  $('mlabel').textContent='loading '+lbl+'…';$('mdot').classList.add('busy');
  addSys('⏳ Switching model to <b>'+esc(lbl)+'</b> — loading can take 1–3 min.');
  try{
    const r=await jpost('/__switch',{id:sel.value});
    if(r.ok){$('mlabel').textContent=r.label||lbl;addSys('✅ Now answering as <b>'+esc(r.label||lbl)+'</b>.');}
    else{$('mlabel').textContent=r.label||lbl;addSys('⚠️ Model switched but llama-server did not report healthy yet.');}
  }catch(e){addSys('❌ Switch failed: '+esc(String(e)));}
  $('mdot').classList.remove('busy');
  refreshState();
};

/* ---------- theme ---------- */
$('theme').onclick=()=>{
  const r=document.documentElement;
  const nx=r.dataset.theme==='dark'?'light':'dark';
  r.dataset.theme=nx;localStorage.setItem('llmtheme',nx);
  $('theme').textContent=nx==='dark'?'☀️':'🌙';
};
(function(){const t=localStorage.getItem('llmtheme');
  if(t){document.documentElement.dataset.theme=t;$('theme').textContent=t==='dark'?'☀️':'🌙'}})();

/* ---------- sidebar mobile ---------- */
$('burger').onclick=()=>{$('sidebar').classList.toggle('open');$('scrim').classList.toggle('show')};
$('scrim').onclick=()=>{$('sidebar').classList.remove('open');$('scrim').classList.remove('show')};
$('newchat').onclick=async()=>{
  await jpost('/__new_chat');msgs=[];chat.innerHTML='';
  addSys('New chat — everything still saves to profile **'+(S?S.profile:'')+'**.');
  refreshState();
  if(window.innerWidth<=820)$('scrim').onclick();
};
$('reloadconv').onclick=refreshState;

/* ---------- ask ---------- */
function autosize(){inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,160)+'px'}
inp.addEventListener('input',autosize);

async function pollActivity(el,lineEl){
  try{
    const a=await jget('/__activity?since='+sinceAct);
    sinceAct=a.now-0.001;
    for(const ev of a.events){
      const icon=ev.kind==='tool'? '🔧':(ev.kind==='step'?'💭':'🔄');
      lineEl.textContent+=lineEl.textContent?'\n'+icon+' '+ev.detail:icon+' '+ev.detail;
      scroll();
    }
  }catch(e){}
}

async function ask(){
  if(busy||!inp.value.trim())return;
  busy=true;sendBtn.style.display='none';stopBtn.style.display='';inp.value='';autosize();
  aborter=new AbortController();

  const q=inp.value.trim?arguments[0]:null; // unused guard
  const text=window.__pendingText||inp.placeholder; // noop
  const userText=ask._t||'';
  addMsg('user',userText,null);
  msgs.push({role:'user',content:userText});

  const think=addMsg('bot','<div class="think"><span class="dots"><span></span><span></span><span></span></span><div id="actline"></div></div>');
  const lineEl=think.querySelector('#actline')||think;
  let secs=0;
  const iv=setInterval(()=>{secs++;if(secs===26)lineEl.textContent+=(lineEl.textContent?'\n':'')+'⏳ tools/model can be slow…';},1000);
  pollTimer=setInterval(()=>pollActivity(think,lineEl),1600);

  try{
    const r=await fetch('/v1/chat/completions',{method:'POST',signal:aborter.signal,
      headers:{'Content-Type':'application/json','X-Local-UI':'webui'},
      body:JSON.stringify({messages:msgs.slice(-24),max_tokens:1500})});
    const d=await r.json();
    clearInterval(iv);clearInterval(pollTimer);

    const ch=d.choices&&d.choices[0];
    const content=(ch&&ch.message&&(ch.message.content||ch.message.reasoning_content))||'(empty reply)';
    const finish=ch&&ch.finish_reason;
    const t1=(d.usage&&d.usage.completion_tokens)||0;
    const label=d.model_label||(d.model||'assistant');
    // measure elapsed from message ts below
    const now=new Date();
    let tps=null;
    if(t1>0&&ask._start)tps=t1/((Date.now()-ask._start)/1000);

    think.innerHTML='';think.remove();
    const b=addMsg('bot',finish==='length'&&content.length<3?content:content,
      {label,tps,elapsed:tps?null:secs,ts:now.toISOString().slice(0,16).replace('T',' ')});
    msgs.push({role:'assistant',content});
  }catch(e){
    clearInterval(iv);clearInterval(pollTimer);
    const aborted=e&&e.name==='AbortError';
    const line=think.querySelector('#actline');
    if(line){line.textContent=aborted?'⏹ stopped by user':'❌ error: '+String(e);}
    else{think.innerHTML=aborted?'⏹ stopped':'❌ '+esc(String(e));}
    if(!aborted)msgs.push({role:'assistant',content:'(error)'});
  }
  busy=false;sendBtn.style.display='';stopBtn.style.display='none';
  refreshState();   // refresh conv list + profile counts
}
stopBtn.onclick=()=>{if(aborter)aborter.abort()};
sendBtn.onclick=()=>{ask._t=inp.value.trim();ask._start=Date.now();ask();inp.value='';autosize()};
inp.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask._t=inp.value.trim();ask._start=Date.now();ask();inp.value='';autosize();}
});

refreshState();
</script></body></html>"""

async def index_handler(request):
    return web.Response(text=PAGE, content_type="text/html")

async def chat_handler(request):
    deny = check_auth(request)
    if deny:
        return deny
    body = await request.json()
    msgs = list(body.get("messages", []))
    stream = bool(body.get("stream"))
    # Honor the model the client selected. llama-server serves ONE loaded gguf,
    # but Continue/Copilot/Cline pick a model by id and put it in `model` —
    # previously that was ignored here, so the VS Code dropdown never switched
    # the backend. If the requested configured model differs from the loaded
    # one, switch llama-server to it before serving (best-effort; 1-3 min load).
    want = resolve_model_id(body.get("model"))
    cur = current_model_id()
    if want and want != cur:
        await run_cmd("/opt/bin/use-model", want)
        await run_cmd("systemctl", "restart", "llama-server")
        if not await wait_upstream(300):
            return web.json_response(
                {"error": {"message": f"switch to '{want}' timed out",
                           "type": "server_error"}}, status=503)
    # Pass-through mode: any API client that brings its own tools OR is not
    # our own web page (marker header) gets a pure proxy to llama-server.
    # This is what Copilot/Continue/Roo must hit - llama.cpp --jinja speaks
    # their native tool protocol and the CLIENT executes tools. Our internal
    # 6-step web-tools loop is reserved for the built-in chat page only,
    # otherwise Continue hits "Stopped after too many tool steps".
    if body.get("tools") or request.headers.get("X-Local-UI") != "webui":
        payload = {k: v for k, v in body.items()}
        payload.setdefault("chat_template_kwargs", {"enable_thinking": False})
        await wait_upstream(600)
        timeout = ClientTimeout(total=None, sock_read=300)
        if not stream:
            async with ClientSession(timeout=timeout) as s:
                async with s.post(UPSTREAM + "/v1/chat/completions", json=payload) as r:
                    return web.json_response(await r.json())
        resp = web.StreamResponse(headers={"Content-Type": "text/event-stream"})
        await resp.prepare(request)
        try:
            async with ClientSession(timeout=timeout) as s:
                async with s.post(UPSTREAM + "/v1/chat/completions", json=payload) as r:
                    while True:
                        line = await r.content.readline()
                        if not line:
                            break
                        await resp.write(line)
        except Exception:
            pass
        await resp.write_eof()
        return resp

    # ---------------- webui agent mode with profiles + persistence ----------
    prof = current_profile()
    ensure_profile(prof)
    last_user = ""
    for m in reversed(msgs):
        if m.get("role") == "user":
            last_user = m.get("content", "")
            break

    # 1) storage commands are answered locally, no model involved
    cmd_reply = handle_commands(last_user)
    if cmd_reply is not None:
        prof = current_profile()   # may have changed via profile = ...
        cid = CURRENT_CONV.get(prof)
        append_message(prof, cid, {"ts": _now_iso(), "role": "user", "content": last_user}) if cid else None
        if not cid:
            conv = new_conv(prof, last_user)
            CURRENT_CONV[prof] = conv["id"]
            append_message(prof, conv["id"], {"ts": _now_iso(), "role": "user", "content": last_user})
        append_message(current_profile(), CURRENT_CONV[current_profile()],
                       {"ts": _now_iso(), "role": "assistant",
                        "content": cmd_reply["choices"][0]["message"]["content"],
                        "model": "storage", "model_label": "storage"})
        return web.json_response(cmd_reply)

    prof = current_profile()

    # 1.5) PKM capture: save VERBATIM, never involve the model.
    #      Triggered by: capture mode ON for this profile, OR a one-shot note:/save:/pkm:
    cap_on = get_capture(prof)
    note_m = RE_CMD_NOTE.match(last_user)
    if cap_on or note_m:
        text = note_m.group(1).strip() if note_m else (last_user or "").strip()
        cid = CURRENT_CONV.get(prof)
        append_message(prof, cid, {"ts": _now_iso(), "role": "user",
                                   "content": last_user}) if cid else None
        if not cid:
            conv = new_conv(prof, "note: " + text[:40])
            CURRENT_CONV[prof] = conv["id"]
            append_message(prof, conv["id"], {"ts": _now_iso(), "role": "user",
                                              "content": last_user})
        if text:
            tags = add_note(prof, text)
            reply = _sys_reply("📥 Saved verbatim to **%s** notes. Tags: `#%s`. "
                               "(model not consulted)"
                               % (prof, ", #".join(tags)))
        else:
            reply = _sys_reply("Nothing to save — the message was empty.")
        append_message(current_profile(), CURRENT_CONV[current_profile()],
                       {"ts": _now_iso(), "role": "assistant",
                        "content": reply["choices"][0]["message"]["content"],
                        "model": "storage", "model_label": "storage"})
        return web.json_response(reply)

    # 2) make sure we have a conversation file and log the user prompt FIRST
    cid = CURRENT_CONV.get(prof)
    if not cid or not load_conv(prof, cid):
        conv = new_conv(prof, last_user)
        CURRENT_CONV[prof] = conv["id"]
        cid = conv["id"]
    append_message(prof, cid, {"ts": _now_iso(), "role": "user", "content": last_user})

    # 3) augment system prompt: who the model is + this profile's memory
    if not msgs or msgs[0].get("role") != "system":
        msgs.insert(0, {"role": "system",
                        "content": SYSTEM_PROMPT + "\n\n" + profile_meta_prompt() +
                                   memory_block_for_prompt(prof)})
    else:
        msgs[0]["content"] += "\n\n" + profile_meta_prompt() + memory_block_for_prompt(prof)

    # 4) run the tool-loop agent
    t0 = time.time()
    if not stream:
        result = await run_agent(msgs, body)
    else:
        # stream path: buffer through run_agent then emit SSE (same as before)
        resp = web.StreamResponse(headers={"Content-Type": "text/event-stream"})
        await resp.prepare(request)
        try:
            final = await run_agent(msgs, body)
            cid_r = final.get("id", "chatcmpl-local")
            model = final.get("model", "local")
            created = int(time.time())
            def chunk(delta, finish=None):
                return {"id": cid_r, "object": "chat.completion.chunk", "created": created,
                        "model": model,
                        "choices": [{"index": 0, "delta": delta, "finish_reason": finish}]}
            await resp.write(("data: " + json.dumps(chunk({"role": "assistant", "content": ""})) + "\n\n").encode())
            content = final["choices"][0]["message"].get("content") or ""
            for i in range(0, len(content), 80):
                await resp.write(("data: " + json.dumps(chunk({"content": content[i:i+80]})) + "\n\n").encode())
            await resp.write(("data: " + json.dumps(chunk({}, "stop")) + "\n\n").encode())
            await resp.write(b"data: [DONE]\n\n")
        except Exception as e:
            try:
                err = {"error": {"message": f"Agent layer error: {e}", "type": "server_error"}}
                await resp.write(("data: " + json.dumps(err) + "\n\n").encode())
                await resp.write(b"data: [DONE]\n\n")
            except Exception:
                pass
        await resp.write_eof()
        return resp

    # 5) stamp actual model info + timing onto the response
    elapsed = time.time() - t0
    mid = current_model_id() or "unknown"
    result.setdefault("model", mid)
    result["model_label"] = model_label(mid)
    try:
        ptok = (result.get("usage") or {}).get("completion_tokens")
        if ptok:
            result["tok_per_sec"] = round(ptok / elapsed, 2)
    except Exception:
        pass

    # 6) log the assistant response + auto-extract memories
    content_out = result["choices"][0]["message"].get("content", "")
    append_message(prof, cid, {"ts": _now_iso(), "role": "assistant", "content": content_out,
                               "model": mid, "model_label": model_label(mid),
                               "tps": result.get("tok_per_sec"), "elapsed": round(elapsed, 1)})
    auto_extract_memories(prof, last_user)

    return web.json_response(result)

async def run_agent(msgs, body):
    async with ClientSession(timeout=ClientTimeout(total=1200)) as s:
        # If the model is loading/restarting, wait for it instead of failing
        await wait_upstream(600)
        work = list(msgs)
        # Thinking models (Qwen3.x) burn tokens on <think> blocks; give headroom
        want_max = max(int(body.get("max_tokens") or 0), 2500)
        retries = 0
        for step in range(MAX_STEPS):
            payload = {**{k: v for k, v in body.items() if k not in ("messages", "stream")},
                       "messages": work, "tools": TOOLS, "tool_choice": "auto",
                       "max_tokens": want_max,
                       "chat_template_kwargs": {"enable_thinking": False}}
            async with s.post(UPSTREAM + "/v1/chat/completions", json=payload) as r:
                data = await r.json()
            # Upstream hiccup (loading, OOM, timeout): retry with backoff
            if not isinstance(data, dict) or not data.get("choices"):
                retries += 1
                if retries > 40:
                    return {"choices": [{"message": {"role": "assistant",
                            "content": "Model is busy or failed to respond. Please try again."}, "finish_reason": "error"}]}
                await asyncio.sleep(4)
                continue
            retries = 0
            msg = data.get("choices", [{}])[0].get("message", {})
            calls = msg.get("tool_calls")
            # Qwen/llama.cpp occasionally emits 1 token & stops -> empty answer.
            # Regenerate the round instead of returning nothing.
            if not calls and not (msg.get("content") or "").strip():
                retries += 1
                if retries > 40:
                    return {"choices": [{"message": {"role": "assistant",
                            "content": "Model produced an empty reply; please try again."}, "finish_reason": "error"}]}
                await asyncio.sleep(1)
                continue
            if not calls:
                return data
            work.append(msg)
            for c in calls:
                fn = c["function"]["name"]
                try:
                    args = json.loads(c["function"].get("arguments") or "{}")
                except Exception:
                    args = {}
                note_activity("tool", "%s(%s)" % (fn, json.dumps(args)[:120]))
                print(f"[tool] {fn} {json.dumps(args)[:200]}", flush=True)
                impl = IMPLEMENTATIONS.get(fn)
                if not impl:
                    result = {"error": f"unknown tool {fn}",
                              "available_tools": list(IMPLEMENTATIONS)}
                else:
                    try:
                        result = await asyncio.wait_for(impl(args), timeout=45)
                    except Exception as e:
                        # Never let a tool failure kill the agent loop - report
                        # it to the model so it can correct itself.
                        result = {"error": f"tool {fn} failed: {e}",
                                  "hint": "fix the arguments and try again, or answer from what you have"}
                work.append({"role": "tool", "tool_call_id": c.get("id"), "name": fn,
                             "content": json.dumps(result)[:6000]})
        return {"choices": [{"message": {"role": "assistant",
                "content": "Stopped after too many tool steps."}, "finish_reason": "length"}]}

async def proxy_handler(request):
    deny = check_auth(request)
    if deny:
        return deny
    target = UPSTREAM + request.rel_url.path_qs
    body = await request.read()
    async with ClientSession(timeout=ClientTimeout(total=600)) as s:
        async with s.request(request.method, target, data=body,
                             headers={k: v for k, v in request.headers.items()
                                      if k.lower() not in ("host", "content-length", "transfer-encoding")}) as up:
            data = await up.read()
            return web.Response(body=data, status=up.status,
                                content_type=up.content_type or "application/octet-stream")

APP = web.Application(client_max_size=64 * 1024 * 1024)
APP.router.add_get("/", index_handler)
APP.router.add_get("/v1/models", v1_models_handler)
APP.router.add_get("/models", v1_models_handler)
APP.router.add_get("/__models", models_handler)
APP.router.add_post("/__switch", switch_handler)
APP.router.add_get("/__state", state_handler)
APP.router.add_post("/__profiles/switch", profiles_switch_handler)
APP.router.add_post("/__new_chat", new_chat_handler)
APP.router.add_post("/__select_chat", select_chat_handler)
APP.router.add_post("/__delete_chat", delete_chat_handler)
APP.router.add_get("/__conversation", conversation_handler)
APP.router.add_post("/__memory", memory_post_handler)
APP.router.add_post("/__memory/clear", memory_clear_handler)
APP.router.add_get("/__export", export_handler)
APP.router.add_get("/__activity", activity_handler)
APP.router.add_post("/v1/chat/completions", chat_handler)
APP.router.add_post("/chat/completions", chat_handler)
APP.router.add_route("*", "/{path:.*}", proxy_handler)

if __name__ == "__main__":
    web.run_app(APP, host="0.0.0.0", port=8080, print=None)
