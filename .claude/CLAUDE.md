# CLAUDE.md — myWebsite

Jekyll site for pirahansiah.com. Content lives in `contents/` (git submodule from PKM repo).

---

## Environment

```bash
conda activate py314
```

---

## Code Conventions

### Python
- Version: Python 3.14+ (strict type hints on public APIs)
- File operations: `pathlib.Path` everywhere
- CLI scripts: `argparse` with `--help`
- Style: Type hints, no wildcard imports, f-strings only

### Content
- Jekyll markdown files in `contents/`
- YAML frontmatter required (`layout`, `title`)
- Images in `contents/public/images/`
- Use `farshid_default` layout for pages

---

## Behavioral Rules

### Stay in Scope
- Only modify files directly related to current task
- Do not refactor, rename, reorganize outside task scope

### Confirm Before Destructive
- Before deleting files, overwriting code, removing dependencies
- List what will be affected, ask for explicit confirmation

### Communication
- **No preamble**: Skip filler phrases; start with actual answer
- **Terse output**: Match response length to task complexity
- **Explicit commands**: Always show exact test/build command run

---

## Completion Rules

### Reflection Questions (MANDATORY)
Before finishing ANY task, always ask and save to README.md:
1. What are you least confident about it right now?
2. What is the biggest things that i do not realised it now?

### Completion Trigger
If user says: `job done`, `good`, `finished`, `successful`, `complete`, `test ok` → summarize full completion/fix state

---

## Privacy Rules

**NEVER**:
- Use or save email addresses or phone numbers
- Commit PII to GitHub
- Remove PII from files before saving/pushing

---

## Permanent Facts

- Jekyll site: pirahansiah.com (submodule at contents/)
- Don't touch `.env`, secrets, credentials
- If something seems wrong, flag it explicitly

/graphify — Any input to knowledge graph
