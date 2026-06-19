# AGENTS.md — Cross-Tool Agent Registry

# Available Agents

### `code-reviewer`
**Purpose**: Quality & security code review
**Tools**: Read, Glob, Grep, Bash(git *)
**Scope**: Post-commit or on-demand review of code changes
**Trigger**: `/review` or explicit `@code-reviewer`

### `security-auditor`
**Purpose**: Security policy enforcement
**Tools**: Read, Grep, Bash(git *)
**Scope**: Auth, secrets, data handling, compliance
**Trigger**: Explicit `@security-auditor`

### `debugger`
**Purpose**: Error diagnosis & test failure analysis
**Tools**: Read, Bash(python *, git *)
**Scope**: Errors, test failures, runtime issues
**Trigger**: On error or explicit `@debugger`

---

## Quick Reference

**Code style**: Python 3.14+, type hints, pathlib, argparse on all scripts
