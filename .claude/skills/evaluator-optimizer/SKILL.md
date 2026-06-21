---
name: evaluator-optimizer
description: |
  Split the writer from the checker. One agent generates, a second agent
  critiques against an objective standard, loop repeats until the check passes.
  Based on Anthropic's evaluator-optimizer pattern and headroom's output
  token reduction research.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Evaluator-Optimizer Pattern

The model that wrote the code is too nice grading its own homework. A single agent that writes and reviews its own work marks its own work as done more often than it should.

The fix: one agent generates, a second agent critiques against an objective standard, and the loop repeats until the check passes.

## The Pattern

```
┌─────────────┐
│   WRITER     │──→ generates code/answer
└─────────────┘
       │
       ▼
┌─────────────┐
│   CHECKER     │──→ evaluates against HARD GATE
└─────────────┘
       │
       ├── PASS → done
       └── FAIL → feedback → WRITER (loop)
```

## Critical Rule: Hard Gates Only

The checker MUST evaluate against something real:
- Test suite passes
- Type checker passes (mypy, tsc, etc.)
- Build succeeds
- Linter passes
- Specific assertion in the output

NOT:
- "Looks good to me"
- "Seems reasonable"
- "I think this is correct"
- "The code appears clean"

A second agent told to "review this" with no objective signal just adds a second optimist.

## Implementation

### Writer Prompt
```
You are the WRITER. Your job is to implement the task.
Output your implementation. Do not evaluate your own work.
```

### Checker Prompt
```
You are the CHECKER. Your job is to evaluate the WRITER's output.

Criteria (all must pass):
1. [hard criterion 1 — e.g., "tests pass"]
2. [hard criterion 2 — e.g., "no type errors"]
3. [hard criterion 3 — e.g., "matches the spec"]

For each criterion:
- PASS: state what you verified
- FAIL: state specifically what failed and why

If any criterion fails, provide specific feedback for the WRITER to fix.
If all pass, say "APPROVED" and nothing else.
```

### Loop Controller
```python
MAX_ITERATIONS = 5

for i in range(MAX_ITERATIONS):
    writer_output = run_writer(task, previous_feedback)
    check_result = run_checker(writer_output, criteria)
    
    if check_result.approved:
        return writer_output
    
    previous_feedback = check_result.feedback

raise LoopExhausted(f"Failed after {MAX_ITERATIONS} iterations")
```

## When to Use

| Situation | Use Evaluator-Optimizer? |
|-----------|-------------------------|
| Writing code that needs tests | Yes — checker runs tests |
| Writing code that needs types | Yes — checker runs type checker |
| Writing prose/emails | No — use humanizer skill instead |
| Refactoring | Yes — checker runs tests + build |
| Exploring/researching | No — single agent is fine |
| Making decisions | No — use grill-me instead |

## Integration with Other Skills

- **loop-builder**: The evaluator-optimizer IS the loop. Use loop-builder for the full architecture.
- **tdd**: The checker can run the test suite. TDD gives you the hard gate.
- **humanizer**: For prose, the "hard gate" is the humanizer's 33-pattern checklist.

## Anti-Patterns

- **Checker without criteria**: "Review this code" → checker agrees with writer. Fix: define explicit pass/fail criteria.
- **Infinite loop**: Writer and checker keep going. Fix: MAX_ITERATIONS cap.
- **Same model for both**: Writer and checker are the same model with same context. Fix: use different prompts, or different models if available.
- **Soft gate**: "Does this look correct?" → always yes. Fix: "Run `pytest` and report exit code."
