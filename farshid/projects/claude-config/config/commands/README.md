# Commands

| Command | Agent(s) | Model | Purpose |
|---|---|---|---|
| `/plan` | researcher + cv-ml-expert | opus | Design an experiment, feature or architecture change |
| `/build` | cv-ml-expert | opus | Train -> export -> quantize -> compile |
| `/test` | debugger | opus | Unit, integration, model and deployment validation |
| `/review` | code-reviewer | opus | Review the current diff |
| `/ship` | security-auditor + code-reviewer | opus | Pre-release audit |
| `/explain` | explainer | opus | Explain the last result as text, a diagram, a page or a video |

Effort is per-command: `xhigh` for `/build` and `/ship`, `high` elsewhere. A command never raises the
session model - it declares the model it needs for its own run.
