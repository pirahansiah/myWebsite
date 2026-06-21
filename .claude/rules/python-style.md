# Python Style

- Use `pathlib.Path` for all file/directory operations
- Type-hint all public function signatures
- Guard optional imports with `try/except ImportError -> sys.exit()`
- Every script uses `argparse` with `--help`
- Separate sections with `# ---` comment blocks
- Print progress with `[STAGE]` prefixes: `[TRAIN]`, `[EXPORT]`, `[QUANT]`, `[BUILD]`
- No wildcard imports; prefer f-strings
- `"""docstring"""` on all public functions
- Use `from __future__ import annotations` for Python 3.10+ compatibility
- Prefer `dataclasses` or `Pydantic` for data structures
- Use `concurrent.futures` for parallel operations
- Minimum Python version: 3.15 (target 3.14+)
