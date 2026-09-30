---
layout: farshid_default
title: "Why Hermes: One Agent Over Dots, Muse Code & Grok Build"
permalink: /notes/docs/llm/why-hermes/
description: "Side-by-side comparison of OpenAI Dots, Meta Muse Code, xAI Grok Build and Hermes Agent — why a self-hosted, provider-agnostic harness beats three vendor-locked tools."
tags: [ai, llm, agents, hermes, comparison, openai, meta, xai, self-hosted]
hashtags: "#ai #llm #agents #hermes #comparison #openai #meta #xai #selfhosted"
markmap: |
  # Why Hermes
  ## The four tools
  - Dots (OpenAI, GPT-6 Astra)
  - Muse Code (Meta, muse-spark)
  - Grok Build (xAI, grok-4.7)
  - Hermes (any model, your machine)
  ## Why Hermes wins
  - No model lock-in
  - Self-hosted, open source
  - One agent, every job
  - Memory + self-taught skills
  - Cron, kanban, bot mode
  ## Extras
  - 21+ chat platforms
  - MCP client + server
  - Local models
  - Voice, TTS, image gen
---

> **Why Hermes: One Agent Over Dots, Muse Code & Grok Build** — Dots, Muse Code and Grok Build each give you one vendor-locked tool; Hermes is a self-hosted harness that runs any model (including theirs). — https://www.pirahansiah.com/notes/docs/llm/why-hermes/

Dots, Muse Code and Grok Build are each locked to one vendor's model and one vendor's cloud. Hermes is a harness you own — same jobs, your model, your machine, your memory.

*Last updated: 2026-09-30.*  <!--ENHANCED-->

# Why Hermes: One Agent Over Dots, Muse Code & Grok Build

## The four tools

| | Vendor | What it is | Model | Runs where | Access |
|---|---|---|---|---|---|
| **Dots** | OpenAI | Always-on personal agent — works on a goal in the background, own cloud computer + browser, reachable in ChatGPT/Slack/Teams/iMessage, approval gates on sensitive actions | GPT-6 Astra | OpenAI cloud | ChatGPT Pro $100/mo + Business Premium |
| **Muse Code** | Meta | Terminal coding agent — subagent fan-out with one git worktree per child, replayable per-session event log, `muse exec` headless, `muse resume`, TypeScript SDK | muse-spark-1.2/1.3 | your machine | free install + Meta Model API account |
| **Grok Build** | xAI | Terminal coding agent — parallel subagents in worktrees, AGENTS.md/plugins/hooks/skills/MCP out of the box, headless `-p`, ACP support | grok-4.7 / grok-build-0.1 | your machine | SuperGrok / X Premium+ |
| **Hermes** | Nous Research | General agent — code + ops + chat + automation: 30+ tools, agent-written skills, persistent memory, Bot Mode, cron, delegation, kanban, worktrees, 21+ chat platforms, MCP/plugins/hooks, any model | any (local, OpenRouter, Anthropic, OpenAI, DeepSeek, xAI, Meta…) | your machine, Docker / SSH / Daytona / Modal | open source, bring your own key |

**One line:** Dots, Muse Code and Grok Build are vendor products locked to one model and one cloud. Hermes is a harness you own.

## Head-to-head

| | **Type & model** | **Runs / cost** | **Always-on & scheduling** | **Parallel work** | **Surfaces** | **Memory · skills · audit** |
|---|---|---|---|---|---|---|
| **Dots** | Always-on personal agent · GPT-6 Astra | OpenAI cloud · $100/mo | built-in persistence | delegates to subagents | ChatGPT, Slack, Teams, iMessage | connected-app context · vendor-side audit |
| **Muse Code** | Terminal coding agent · muse-spark-1.2/1.3 | your machine · free + API | — (CI only) | subagent fan-out, worktree per child | terminal (+ SDK) | event log + resume · bundled playbooks |
| **Grok Build** | Terminal coding agent · grok-4.7 | your machine · SuperGrok | — (CI only) | parallel subagents + worktrees | terminal + ACP editors | AGENTS.md, hooks, MCP, skills · event stream |
| **Hermes** | General agent (code + ops + chat) · any model | your machine / Docker / SSH · open source | cron routines + `/goal` + Bot Mode | `delegate_task` + kanban + worktrees | Telegram, Slack, Teams, WhatsApp, iMessage, Email, SMS + 18 more, API, ACP | MEMORY.md + FTS5 search + skills + `state.db` |

## Why Hermes is better

**1. No model lock-in — you can run *their* models inside it.**
Dots is GPT-6 Astra only, Muse Code is Muse Spark only, Grok Build is Grok only. Hermes is provider-agnostic, and its curated catalog already lists `meta/muse-spark-1.3` and `x-ai/grok-4.7`. Switching to Hermes keeps your favourite models and changes only the harness around them.

**2. You own it — no cloud you don't control.**
Dots runs on OpenAI's cloud computer with your connected-app context shared to it, behind a $100/mo subscription. Hermes runs on your machine (or Docker / SSH / Daytona / Modal) with your keys, your data, and your audit trail on disk. Open source, free.

**3. One agent replaces all three — and does more.**
Dots is a personal assistant only. Muse Code and Grok Build are coding only. Hermes does coding, ops, chat, research, automation and messaging from one core — no context-switching between three tools with three subscriptions.

**4. It remembers and teaches itself.**
Muse has a per-session event log, Grok has installable skills, Dots has app context. Only Hermes has persistent memory *and* writes its own skills from experience — a procedure you walk it through once becomes a skill that auto-loads forever.

**5. Deeper orchestration.**
Cron with natural-language scheduling, a durable kanban board for multi-agent work, bot-to-bot DMs across machines (`hermes peer`), and a Bot Mode where each bot is an isolated profile with its own model, memory and skills.

## What Hermes has that they don't

| Feature | Dots | Muse Code | Grok Build | **Hermes** |
|---|---|---|---|---|
| Runs locally / self-hosted | ✗ cloud only | ✓ | ✓ | ✓ (also Docker/SSH/Modal) |
| Any model provider | ✗ | ✗ | ✗ | ✓ (incl. Muse Spark & Grok models) |
| Persistent memory (agent-written) | ~ app context | ✗ | ✗ | ✓ MEMORY.md + FTS5 session search |
| Self-authored skills (learns procedures) | ✗ | ~ bundled playbooks | ~ installable | ✓ writes its own + syncs across devices |
| Natural-language scheduler (cron) | ~ built-in persistence | ✗ | ✗ | ✓ `hermes cron` (+ monitor mode, `--deliver`) |
| Chat-app gateway | ~ ChatGPT/Slack/Teams/iMessage | ✗ | ✗ | ✓ 21+ platforms |
| Named bot roster (isolated agents) | ~ one Dot at a time | ✗ | ✗ | ✓ Bot Mode — profiles as bots, group chats, bot↔bot DMs |
| Kanban multi-agent board | ✗ | ✗ | ✗ | ✓ `hermes kanban` |
| Webhooks (event-driven triggers) | ✗ | ✗ | ✗ | ✓ `hermes webhook` + `hermes send` |
| Credential vault (signs in / pays for you) | ✗ | ✗ | ✗ | ✓ `hermes vault` |
| MCP — client *and* server | ✗ connected apps | ✗ | ✓ client | ✓ client **and** server |
| Plugins + lifecycle hooks | ✗ | ✓ hooks | ✓ | ✓ both, plus Python library + OpenAI-compatible API server |
| Local models (zero cloud, no key) | ✗ | ✗ | ✗ | ✓ Ollama / llama.cpp / MLX |
| Voice, TTS, image-gen, computer-use | ✗ | ✗ | ✗ | ✓ voice mode, TTS, image generation, `hermes computer-use` |
| Persistent goals (`/goal` keep-going loop) | ✓ its pitch | ~ compaction+resume | ✗ | ✓ judge loop + turn budget + quality gates |
| Import from Claude Code / Codex | ✗ | ✗ | ✗ | ✓ `hermes import-agent` |

## Replacement map

### Coding agent (Muse Code / Grok Build)

| Today | Hermes |
|---|---|
| `muse` (interactive) | `hermes` (or `hermes --tui`) |
| `muse exec "…"` / `grok-build -p "…"` | `hermes -z "…"` (stdout only) or `hermes chat -q "…"` |
| `muse resume` | `hermes --continue` / `hermes --resume <id>` |
| `muse --subagent-worktree-isolation` | `hermes -w` + `delegate_task` |
| `muse serve` + MSP SDK | `hermes serve` / API server / `hermes acp` / `hermes peer` |
| Muse `/plan`, `/grill`, `/taste` | a skill you write once + `/goal` + `hermes skills search` |
| Grok Build in your editor (ACP) | `hermes acp --setup` |
| Claude Code / Codex setup | `hermes import-agent` |

### Always-on personal agent (Dots)

| Dots behaviour | Hermes |
|---|---|
| Recurring work for you | `hermes cron create "0 9 * * *" "…" --name daily --deliver telegram` |
| A named agent with its own identity/tools | `hermes profile create <bot>` → Bot Mode |
| Talk to it from chat apps | `hermes gateway start` → Telegram/Slack/Teams/iMessage/… |
| Agents that know each other | Bot group chats, `@mentions`, `hermes peer`, `hermes kanban` |
| "Don't stop until it's done" | `/goal <objective>` |
| Its own cloud computer / browser | terminal backends (`local`/`docker`/`ssh`/`modal`) + `browser` + `hermes computer-use` |
| Connected apps & credentials | MCP servers, webhooks, `hermes vault`, egress proxy |
| Approval for sensitive actions | approval prompts → `hermes approvals`; hard stop with `hermes pause` |

You don't have to abandon anything: keep `opencode`, `codex`, `claude` or `grok` installed and let Hermes drive them as tools — Hermes becomes the memory, scheduler and orchestrator.

## Honest gaps

- **Dots itself** — the hosted product, GPT-6 Astra, OpenAI's managed cloud computer and its safety layer. Not reproducible; replaced functionally, not identically.
- **A bundled frontier subscription** — Dots / Muse Code / Grok Build include model quota. Hermes needs its own provider key or OAuth login.
- **`muse serve` / MSP protocol SDK** — closest equivalents are `hermes serve`, the API server, `hermes acp` and `hermes peer`; the wire protocols differ.
- **Consumer polish** — one-click provisioning of an always-on cloud agent. In Hermes you set up the profile, gateway and routines yourself (about 15 minutes, once).

## Sources

- Dots: [TechCrunch](https://techcrunch.com/2026/09/29/openai-launches-dots-its-bubbly-agentic-avatar/), [WIRED](https://www.wired.com/story/openai-dots-always-on-ai-agents-that-proactively-help/)
- Muse Code: [Meta docs](https://dev.meta.ai/docs/muse-code), [build-with-muse-code](https://developer.meta.com/ai/resources/blog/build-with-muse-code/)
- Grok Build: [x.ai news](https://x.ai/news/grok-build-cli), [x.ai/build](https://x.ai/build)
- Hermes: [hermes-agent.nousresearch.com/docs](https://hermes-agent.nousresearch.com/docs/)
