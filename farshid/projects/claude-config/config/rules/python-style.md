# Python style

- Python 3.14+ (`conda activate py314`). Strict type hints on public APIs.
- `pathlib.Path` for every path. No `os.path` in new code.
- Every script is a standalone CLI: `argparse` + `--help`, `main()` guard, exit codes.
- Guard heavy imports:
  `try: import torch` / `except ImportError: sys.exit("Install torch: pip install torch")`.
- Section banners `# --- name ---`. Progress logs tagged `[DATA] [TRAIN] [EXPORT] [QUANT] [BUILD] [DEPLOY]`.
- f-strings only. No wildcard imports. No mutable default arguments.
- Density over ceremony: no empty lines inside functions, no comments that restate the code.
- No `.bak` files, no commented-out code, no speculative abstractions.
- Never print or log secrets, tokens, credentials, email addresses or phone numbers.
