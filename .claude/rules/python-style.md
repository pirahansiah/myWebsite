# Python Style

- Use `pathlib.Path` for all file/directory operations
- Type-hint all public function signatures
- Guard optional imports with `try/except ImportError -> sys.exit()`
- Every script uses `argparse` with `--help`
- Separate sections with `# ---` comment blocks
- Print progress with `[STAGE]` prefixes: `[TRAIN]`, `[EXPORT]`, `[QUANT]`, `[BUILD]`
- No wildcard imports; prefer f-strings
- `"""docstring"""` on all public functions
