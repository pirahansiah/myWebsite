---
name: test
description: Run unit, integration, model and deployment validation.
model: opus
effort: high
tools: Read, Bash, Glob, Grep
---

# /test

1. Unit: `pytest tests/unit/ -q` (add `--cov` when changing shared code).
2. Integration: `pytest tests/integration/ -q` - the real pipeline, not mocks.
3. Model: accuracy on the frozen regression set; FP32 vs INT8 delta; latency mean/P95.
4. Deployment: input shape/signature matches the target; quantized model compiles; no CPU fallback.
5. Report to `test-report.md`: command, result, and any regression with its baseline number.

Rules: paste the real command output; never report a test as passing that was not run. A skipped
test is reported as skipped, with the reason.
