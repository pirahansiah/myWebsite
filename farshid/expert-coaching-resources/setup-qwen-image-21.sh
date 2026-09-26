#!/usr/bin/env bash
#
# setup-qwen-image-21.sh
# Full install of Qwen-Image-2.1 text-to-image on an 8 GB NVIDIA GPU.
#
# Tested on Windows 11 + git-bash (MSYS) with an RTX 4060 Laptop.
# The script also runs on Linux; the only Windows-specific part is the
# venv python path, which is detected automatically.
#
# What this does, in order:
#   1. check prerequisites (python, git, curl, nvidia-smi)
#   2. create the folder tree
#   3. download the three model files and verify their SHA256
#   4. fix the GGUF header (adds general.architecture = qwen_image21)
#   5. clone ComfyUI and build a venv
#   6. install cu130 PyTorch
#   7. clone ComfyUI-GGUF
#   8. write extra_model_paths.yaml, gen.py and the server launcher
#   9. start the server and generate one test image
#
# Usage:
#   bash setup-qwen-image-21.sh              # install into ./ollama (next to the script)
#   bash setup-qwen-image-21.sh /d/ollama    # install into a given path
#
# Re-running is safe. Downloads resume, existing folders are reused.
#
set -u

# ----------------------------------------------------------------------------
# arguments and paths
# ----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${1:-$SCRIPT_DIR/ollama}"

# Normalise a Windows drive path (D:\x or /d/x or D:/x) to /d/x for bash.
norm_path() {
  local p="$1"
  case "$p" in
    [A-Za-z]:[\\/]*) p="/$(printf '%s' "$p" | cut -c1 | tr 'A-Z' 'a-z')$(printf '%s' "$p" | cut -c3- | tr '\\' '/')" ;;
    [A-Za-z]:)        p="/$(printf '%s' "$p" | cut -c1 | tr 'A-Z' 'a-z')" ;;
  esac
  printf '%s' "$p"
}

ROOT="$(norm_path "$ROOT")"
COMFY="$ROOT/comfyui"
MODELS="$ROOT/qwen-image-2.1"
TE_DIR="$MODELS/text_encoders"
VAE_DIR="$MODELS/vae"
DM_DIR="$MODELS/diffusion_models"

echo "============================================================"
echo " Qwen-Image-2.1 local installer"
echo "============================================================"
echo " install path : $ROOT"
echo " comfyui      : $COMFY"
echo " models       : $MODELS"
echo "============================================================"
echo

# ----------------------------------------------------------------------------
# 0. helpers
# ----------------------------------------------------------------------------
FAIL=0
warn() { echo "  WARN: $*"; }
die()  { echo "  ERROR: $*" >&2; exit 1; }

# Use the venv python when it exists, else the system python.
PY=""
pick_python() {
  if [ -x "$COMFY/.venv/Scripts/python.exe" ]; then
    PY="$COMFY/.venv/Scripts/python.exe"
  elif [ -x "$COMFY/.venv/Scripts/python" ]; then
    PY="$COMFY/.venv/Scripts/python"
  elif [ -x "$COMFY/.venv/bin/python" ]; then
    PY="$COMFY/.venv/bin/python"
  else
    if command -v python3 >/dev/null 2>&1; then PY="$(command -v python3)"
    elif command -v python  >/dev/null 2>&1; then PY="$(command -v python)"
    else PY=""; fi
  fi
}

# Download with resume. $1 = url, $2 = output path
fetch() {
  local url="$1" out="$2" name
  name="$(basename "$out")"
  if [ -s "$out" ]; then
    echo "  already present: $name"
    return 0
  fi
  echo "  downloading: $name"
  curl -L -C - --retry 5 --retry-delay 5 -f -o "$out" "$url" \
    || { warn "download failed: $name"; return 1; }
  return 0
}

# Verify a sha256. $1 = file, $2 = expected hex
verify_sha() {
  local f="$1" want="$2" got
  [ -f "$f" ] || { warn "missing file: $(basename "$f")"; return 1; }
  got="$(sha256sum "$f" 2>/dev/null | awk '{print $1}')"
  if [ -z "$got" ]; then
    got="$(shasum -a 256 "$f" 2>/dev/null | awk '{print $1}')"
  fi
  if [ "$got" = "$want" ]; then
    echo "  OK  $(basename "$f")"
    return 0
  else
    echo "  BAD $(basename "$f")"
    echo "        expected $want"
    echo "        got      $got"
    return 1
  fi
}

echo "--- [1/9] prerequisites ---"
for c in curl git; do
  command -v "$c" >/dev/null 2>&1 || die "$c not found on PATH"
  echo "  $c: $(command -v "$c")"
done
if command -v nvidia-smi >/dev/null 2>&1; then
  echo "  GPU: $(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null | head -1)"
  echo "  driver CUDA: $(nvidia-smi 2>/dev/null | grep -o 'CUDA Version: [0-9.]*' | head -1)"
else
  warn "nvidia-smi not found - this script assumes an NVIDIA GPU"
fi
pick_python
[ -n "$PY" ] || die "python not found on PATH"
echo "  python: $PY"
echo

echo "--- [2/9] folder tree ---"
mkdir -p "$TE_DIR" "$VAE_DIR" "$DM_DIR" "$ROOT"
echo "  $DM_DIR"
echo "  $TE_DIR"
echo "  $VAE_DIR"
echo

echo "--- [3/9] model files ---"
echo "  source: huggingface.co/abenzerps/Qwen-Image-2.1-Uncensored-GGUF"
echo "          huggingface.co/Comfy-Org/Qwen3-VL (text encoder, official)"
echo
HF_GGUF="https://huggingface.co/abenzerps/Qwen-Image-2.1-Uncensored-GGUF/resolve/main"
HF_TE="https://huggingface.co/Comfy-Org/Qwen3-VL/resolve/main/text_encoders"
HF_VAE="https://huggingface.co/abenzerps/Qwen-Image-2.1-Uncensored-GGUF/resolve/main"

fetch "$HF_GGUF/qwen-image-2.1-Q4_K_M.gguf" "$DM_DIR/qwen-image-2.1-Q4_K_M.gguf"
fetch "$HF_TE/qwen3vl_8b_int8_convrot.safetensors" "$TE_DIR/qwen3vl_8b_int8_convrot.safetensors"
fetch "$HF_VAE/vae/qwen_image_2.1_vae_bf16.safetensors" "$VAE_DIR/qwen_image_2.1_vae_bf16.safetensors"
echo

echo "--- verifying downloads ---"
verify_sha "$DM_DIR/qwen-image-2.1-Q4_K_M.gguf" \
  "833439e91bc1152d28f37aa198c7f6f4218b7de95754c2f7a318a2422ab4b2f8" || FAIL=1
verify_sha "$TE_DIR/qwen3vl_8b_int8_convrot.safetensors" \
  "8bfd0f6e12abf2d2d697ecc888e5e90b0d6741d6708f05799f53afa560452e8f" || FAIL=1
verify_sha "$VAE_DIR/qwen_image_2.1_vae_bf16.safetensors" \
  "bb21f7473051e1ac368515dd3f2e15cd44d7a11748ee8823e1ddca3e4876b7c9" || FAIL=1
[ "$FAIL" = "0" ] || die "one or more files failed verification. Delete the bad file and re-run."
echo

echo "--- [4/9] GGUF header fix ---"
# The downloaded GGUF has no general.architecture key. ComfyUI needs that key
# to identify the model; without it the loader guesses from tensor names.
# This writes a second file with the two keys added, copying the body unchanged.
ARCH_GGUF="$DM_DIR/qwen-image-2.1-Q4_K_M-arch.gguf"
if [ -s "$ARCH_GGUF" ]; then
  echo "  already present: $(basename "$ARCH_GGUF")"
else
  "$PY" - "$DM_DIR/qwen-image-2.1-Q4_K_M.gguf" "$ARCH_GGUF" <<'PYEOF'
import os
import struct
import sys

src, dst = sys.argv[1], sys.argv[2]

if not os.path.exists(src):
    print("  ERROR: source gguf not found: %s" % src)
    sys.exit(1)

f = open(src, "rb")
if f.read(4) != b"GGUF":
    print("  ERROR: not a GGUF file")
    sys.exit(1)
version = struct.unpack("<I", f.read(4))[0]
tensor_count = struct.unpack("<Q", f.read(8))[0]
kv_count = struct.unpack("<Q", f.read(8))[0]

TYPE_SIZE = {0: 1, 1: 1, 2: 2, 3: 2, 4: 4, 5: 4, 6: 4, 7: 1, 10: 8, 11: 8, 12: 8}


def read_string():
    n = struct.unpack("<Q", f.read(8))[0]
    return f.read(n).decode("utf-8", "replace")


def skip_value(t):
    """Advance past one value of gguf type t."""
    if t == 8:
        read_string()
    elif t == 9:
        et = struct.unpack("<I", f.read(4))[0]
        n = struct.unpack("<Q", f.read(8))[0]
        for _ in range(n):
            skip_value(et)
    elif t in TYPE_SIZE:
        f.read(TYPE_SIZE[t])
    else:
        print("  ERROR: unknown gguf value type %d" % t)
        sys.exit(1)


# Record each kv pair's raw byte range so it can be copied out verbatim.
kv_ranges = []
names = []
for _ in range(kv_count):
    start = f.tell()
    names.append(read_string())
    t = struct.unpack("<I", f.read(4))[0]
    skip_value(t)
    kv_ranges.append((start, f.tell(), t))

# The tensor-info block plus the tensor data: everything after the kv block.
data_from = f.tell()
f.close()

have = set(names)
add = []
if "general.architecture" not in have:
    add.append(("general.architecture", "qwen_image21"))
if "general.name" not in have:
    add.append(("general.name", "qwen_image21"))

src_f = open(src, "rb")
tmp = dst + ".tmp"
with open(tmp, "wb") as out:
    out.write(b"GGUF")
    out.write(struct.pack("<I", version))
    out.write(struct.pack("<Q", tensor_count))
    out.write(struct.pack("<Q", kv_count + len(add)))

    # copy the existing kv pairs byte for byte
    for (start, end, _t) in kv_ranges:
        src_f.seek(start)
        out.write(src_f.read(end - start))

    # append the new keys
    for key, val in add:
        kb = key.encode("utf-8")
        out.write(struct.pack("<Q", len(kb)))
        out.write(kb)
        out.write(struct.pack("<I", 8))          # GGUF_VALUE_TYPE_STRING
        vb = val.encode("utf-8")
        out.write(struct.pack("<Q", len(vb)))
        out.write(vb)

    # copy the rest of the file unchanged
    src_f.seek(data_from)
    while True:
        chunk = src_f.read(8 * 1024 * 1024)
        if not chunk:
            break
        out.write(chunk)

src_f.close()
os.replace(tmp, dst)

# read back the result to prove the keys are there
from importlib.util import find_spec
import importlib

ok = False
try:
    from gguf import GGUFReader
    r = GGUFReader(dst)
    arch = r.fields.get("general.architecture")
    ok = arch is not None
    print("  arch key : %s" % ("qwen_image21" if ok else "MISSING"))
    print("  tensors  : %d" % len(r.tensors))
except Exception as e:
    print("  (could not re-read with gguf lib: %s)" % e)

print("  wrote %s (%d bytes)" % (os.path.basename(dst), os.path.getsize(dst)))
sys.exit(0 if ok else 2)
PYEOF
  if [ $? -ne 0 ]; then
    warn "header fix did not verify. The model may still load in compatibility mode."
  fi
fi
echo

echo "--- [5/9] ComfyUI ---"
if [ -d "$COMFY/.git" ]; then
  echo "  already cloned: $COMFY"
else
  git clone https://github.com/comfyanonymous/ComfyUI "$COMFY" || die "git clone ComfyUI failed"
fi
cd "$COMFY" || die "cannot enter $COMFY"

if [ -x "$COMFY/.venv/Scripts/python.exe" ] || [ -x "$COMFY/.venv/bin/python" ]; then
  echo "  venv already exists"
else
  echo "  creating venv"
  "${PY:-python}" -m venv .venv || die "venv creation failed"
fi

echo "--- [6/9] PyTorch cu130 ---"
pick_python
echo "  using: $PY"
"$PY" -m pip install --upgrade pip -q 2>&1 | tail -2
if "$PY" -c "import torch,sys; sys.exit(0 if torch.version.cuda=='13.0' else 1)" >/dev/null 2>&1; then
  echo "  torch cu130 already installed"
else
  echo "  installing torch 2.14.0+cu130 (this is the large download, ~2.5 GB)"
  "$PY" -m pip install --no-cache-dir \
    "torch==2.14.0+cu130" "torchvision==0.29.0+cu130" "torchaudio==2.11.0+cu130" \
    --index-url https://download.pytorch.org/whl/cu130 2>&1 | tail -5
fi
echo "  ComfyUI requirements"
"$PY" -m pip install -r requirements.txt -q 2>&1 | tail -3

echo
echo "--- [7/9] ComfyUI-GGUF ---"
mkdir -p custom_nodes
if [ -d "custom_nodes/ComfyUI-GGUF/.git" ]; then
  echo "  already cloned"
else
  git clone https://github.com/city96/ComfyUI-GGUF custom_nodes/ComfyUI-GGUF \
    || die "git clone ComfyUI-GGUF failed"
fi
if [ -f "custom_nodes/ComfyUI-GGUF/requirements.txt" ]; then
  "$PY" -m pip install -r custom_nodes/ComfyUI-GGUF/requirements.txt -q 2>&1 | tail -2
fi

echo
echo "--- [8/9] configuration and scripts ---"
cat > "$COMFY/extra_model_paths.yaml" <<YAMLEOF
# ComfyUI extra model paths
# Keeps the Qwen-Image-2.1 weights in one place.
qwen_image_21:
    base_path: $MODELS/
    diffusion_models: |
        diffusion_models
    unet: |
        diffusion_models
    text_encoders: |
        text_encoders
    clip: |
        text_encoders
    vae: |
        vae
YAMLEOF
echo "  wrote extra_model_paths.yaml"

# the prompt file
if [ ! -f "$ROOT/im.txt" ]; then
  cat > "$ROOT/im.txt" <<'TXTEOF'
a red apple on a wooden table, studio lighting, photorealistic
TXTEOF
  echo "  wrote im.txt"
fi

# gen.py
cat > "$ROOT/gen.py" <<'PYEOF'
#!/usr/bin/env python
"""
gen.py - prompt file to image, one command.

Usage:
    ./gen.py                 # reads im.txt
    ./gen.py other.txt       # another prompt file
    ./gen.py --steps 40      # override a setting
    ./gen.py --encoder 4b    # experimental, expected to fail (wrong hidden size)
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid

COMFY = "http://127.0.0.1:8188"
HERE = os.path.dirname(os.path.abspath(__file__))

UNET = "qwen-image-2.1-Q4_K_M-arch.gguf"
VAE = "qwen_image_2.1_vae_bf16.safetensors"

ENCODERS = {
    "8b": "qwen3vl_8b_int8_convrot.safetensors",
    "4b": "qwen3vl_4b_fp8_scaled.safetensors",
}
DEFAULT_ENCODER = "8b"


def post(path, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        COMFY + path, data=data, headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=300).read())


def get(path):
    return json.loads(urllib.request.urlopen(COMFY + path, timeout=60).read())


def build(prompt, negative, steps, width, height, seed, cfg, prefix,
          encoder=DEFAULT_ENCODER):
    """ComfyUI API graph for Qwen-Image-2.1.

    Node 2 MUST be the built-in CLIPLoader. CLIPLoaderGGUF wraps the
    safetensors encoder in GGMLOps (dequantize-on-the-fly), which bypasses
    the native int8 convrot kernel and destroys the conditioning: every
    prompt comes out as texture noise. Node 1 stays UnetLoaderGGUF because
    only a GGUF file exists for the transformer.
    """
    return {
        "1": {"class_type": "UnetLoaderGGUF",
              "inputs": {"unet_name": UNET}},
        "2": {"class_type": "CLIPLoader",
              "inputs": {"clip_name": ENCODERS[encoder],
                         "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader",
              "inputs": {"vae_name": VAE}},
        "4": {"class_type": "TextEncodeQwenImage21",
              "inputs": {"clip": ["2", 0], "prompt": prompt,
                         "negative_prompt": negative, "resolution": 1024}},
        "6": {"class_type": "EmptyLatentImage",
              "inputs": {"width": width, "height": height, "batch_size": 1}},
        "7": {"class_type": "KSampler",
              "inputs": {"model": ["1", 0], "positive": ["4", 0],
                         "negative": ["4", 1], "latent_image": ["6", 0],
                         "seed": seed, "steps": steps, "cfg": cfg,
                         "sampler_name": "euler", "scheduler": "simple",
                         "denoise": 1.0}},
        "8": {"class_type": "VAEDecode",
              "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage",
              "inputs": {"images": ["8", 0], "filename_prefix": prefix}},
    }


def main():
    ap = argparse.ArgumentParser(description="Text file to image.")
    ap.add_argument("promptfile", nargs="?", default="im.txt")
    ap.add_argument("--negative", default="")
    ap.add_argument("--steps", type=int, default=25)
    ap.add_argument("--width", type=int, default=1024)
    ap.add_argument("--height", type=int, default=1024)
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--cfg", type=float, default=1.0)
    ap.add_argument("--out", default="image")
    ap.add_argument("--encoder", default=DEFAULT_ENCODER, choices=sorted(ENCODERS))
    args = ap.parse_args()

    path = args.promptfile
    if not os.path.isabs(path):
        path = os.path.join(HERE, path)
    if not os.path.isfile(path):
        print("ERROR: prompt file not found: %s" % path)
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        prompt = f.read().strip()
    if not prompt:
        print("ERROR: prompt file is empty: %s" % path)
        sys.exit(1)

    seed = args.seed if args.seed is not None else uuid.uuid4().int % (2 ** 31)

    print("prompt file : %s" % path)
    print("prompt      : %s" % prompt)
    print("size        : %dx%d   steps: %d   cfg: %s   seed: %d"
          % (args.width, args.height, args.steps, args.cfg, seed))
    print("encoder     : %s -> %s" % (args.encoder, ENCODERS[args.encoder]))

    try:
        urllib.request.urlopen(COMFY + "/system_stats", timeout=10).read()
    except Exception:
        print("")
        print("ERROR: ComfyUI is not answering on %s" % COMFY)
        print("Start it first, then re-run this script.")
        sys.exit(1)

    wf = build(prompt, args.negative, args.steps, args.width, args.height,
               seed, args.cfg, args.out, encoder=args.encoder)

    t0 = time.time()
    try:
        resp = post("/prompt", {"prompt": wf, "client_id": str(uuid.uuid4())})
    except urllib.error.HTTPError as e:
        print("SUBMIT FAILED:")
        print(e.read().decode()[:4000])
        sys.exit(1)

    pid = resp["prompt_id"]
    print("queued      : %s" % pid)
    print("generating ...")

    while True:
        time.sleep(3)
        try:
            hist = get("/history/%s" % pid)
        except Exception:
            continue
        if pid not in hist:
            continue
        h = hist[pid]
        status = h.get("status", {})
        s = status.get("status_str", "")
        if status.get("completed") or s == "success":
            print("")
            print("DONE in %.1f seconds" % (time.time() - t0))
            for node in h.get("outputs", {}).values():
                for img in node.get("images", []):
                    full = os.path.join(HERE, "comfyui", "output",
                                        img.get("subfolder", ""), img["filename"])
                    print("IMAGE: %s" % full)
            return
        if s == "error":
            print("")
            print("GENERATION FAILED:")
            print(json.dumps(status, indent=2)[:4000])
            sys.exit(1)


if __name__ == "__main__":
    main()
PYEOF
chmod +x "$ROOT/gen.py"
echo "  wrote gen.py"

# server launcher (bash)
cat > "$ROOT/start-server.sh" <<SHEOF
#!/usr/bin/env bash
# Start the ComfyUI server in the background.
#
# IMPORTANT: output goes to a FILE, never a pipe. The tqdm progress bar
# flushes stderr, and a closed pipe makes the sampler die with
# OSError [Errno 22] Invalid argument.
cd "$COMFY" || exit 1
nohup "$PY" main.py --listen 127.0.0.1 --port 8188 --preview-method none \\
  >> "$COMFY/server.log" 2>&1 &
echo "server starting, pid \$!"
echo "log: $COMFY/server.log"
echo "wait ~60 seconds, then run:  ./gen.py"
SHEOF
chmod +x "$ROOT/start-server.sh"
echo "  wrote start-server.sh"

echo
echo "--- [9/9] verification ---"
pick_python
echo "  torch check:"
"$PY" -c "
import torch
print('    torch :', torch.__version__)
print('    cuda  :', torch.version.cuda)
print('    avail :', torch.cuda.is_available())
if torch.cuda.is_available():
    print('    device:', torch.cuda.get_device_name(0))
" 2>&1 | sed 's/^/  /'

echo
echo "============================================================"
echo " INSTALL COMPLETE"
echo "============================================================"
echo
echo " Next steps:"
echo "   1. start the server:   bash $ROOT/start-server.sh"
echo "      (or on Windows:    $ROOT/start-server.bat)"
echo "   2. wait about 60 seconds"
echo "   3. generate an image:  cd $ROOT && ./gen.py"
echo
echo " Your prompt file : $ROOT/im.txt"
echo " Images land in   : $COMFY/output"
echo
echo " If the image is noise on every prompt, node 2 is using the wrong"
echo " loader. It must be CLIPLoader, not CLIPLoaderGGUF."
echo