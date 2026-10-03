---
name: platform-porting
description: Move code between macOS, Linux and Windows. Use when OS-specific APIs, paths or shell calls break on another platform.
effort: high
---

# Platform porting

## Sweep for these first
- Paths: `pathlib.Path` everywhere; backslashes, drive letters, `C:\Users\...` in docs or code.
- Shell: `bash`-only syntax, `rm -rf`, `sed -i`, `grep -r`, `&&` chains, `~` expansion.
- Line endings: CRLF in a repo that is not configured for it; add `.gitattributes` if mixed.
- Case sensitivity: imports that only work on a case-insensitive filesystem.
- OS-specific UI/input APIs: mouse/screen control, window focus, keycodes.
- Conda/env activation differs per shell (`conda activate` vs `source activate` vs `call activate`).
- Home paths differ: Windows `C:\Users\fpirahansiah`, macOS/Linux `/Users/farshid`.

## Method
1. Run the entry point on the target platform and collect the first real failure.
2. Fix one layer at a time: path -> shell -> API -> encoding.
3. Replace shell-outs with Python stdlib (`shutil`, `subprocess` with a list argv) where practical.
4. Add the platform check as an explicit branch with a comment, not a silent fallback.
5. Re-run on the original platform to prove nothing regressed.
