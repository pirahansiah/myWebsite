---
layout: farshid_default
permalink: /ai-toolkit/
title: "AI Prompt & Agent Toolkit"
description: "27 battle-tested Claude Code skills, code-review agents, MCP tools, and coding rules — the AI engineering stack behind pirahansiah.com, packaged as prompt packs for modern LLMs."
tags: [prompts, claude, gpt, mcp, skills, agents, ai-toolkit, etsy]
---
last_modified_at: 2026-08-16
> **AI Toolkit** — 27 skills · 3 agents · MCP tools · coding rules — https://pirahansiah.com/ai-toolkit/
27 battle-tested Claude Code skills, code-review agents, MCP tools, and coding rules — the AI engineering stack behind pirahansiah.com, packaged as prompt packs for modern LLMs.

*Last updated: 2026-08-16.*  <!--ENHANCED-->


<style>
.tk-hero { text-align: center; padding: 36px 20px 12px; }
.tk-hero h1 {
  font-size: 2.3rem; font-weight: 800; line-height: 1.2; margin-bottom: 10px;
  background: linear-gradient(135deg, #22D3EE 0%, #06B6D4 60%, #0284C7 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.tk-hero p { color: var(--text-muted); font-size: 1.08rem; max-width: 700px; margin: 0 auto; line-height: 1.65; }
.tk-eyebrow { font-family: var(--mono); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
.tk-wrap { max-width: 980px; margin: 0 auto; padding: 8px 20px 48px; }
.tk-sec { font-size: 1.3rem; margin: 38px 0 6px; }
.tk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.tk-card {
  border-radius: 16px; padding: 18px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
}
.tk-pack { font-family: var(--mono); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); }
.tk-card h3 { margin: 6px 0 8px; font-size: 1.05rem; line-height: 1.3; }
.tk-card ul { margin: 0; padding-left: 0; list-style: none; }
.tk-card li { margin: 4px 0; font-size: 0.86rem; color: var(--text-muted); line-height: 1.45; }
.tk-card li b { color: var(--text); font-weight: 600; }
.tk-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 4px; }
.tk-tags span { font-size: 0.78rem; color: var(--text-muted); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 5px 12px; border-radius: 12px; }
.tk-note { margin: 22px 0 0; padding: 16px 18px; border-radius: 14px; border-left: 3px solid var(--accent); background: rgba(34, 211, 238,0.07); font-size: 0.9rem; line-height: 1.6; color: var(--text-muted); }
</style>

<div class="tk-hero">
  <div class="tk-eyebrow">AI Engineering Stack</div>
  <h1>AI Prompt &amp; Agent Toolkit</h1>
  <p>Twenty-seven battle-tested Claude Code skills, three code-review agents, MCP tooling, and coding rules — the exact AI engineering stack behind pirahansiah.com, organized into ready-to-use prompt packs for modern LLMs.</p>
</div>

<div class="tk-wrap">

<h2 class="tk-sec">Prompt Packs</h2>
<p>Each pack is a themed collection of skills and prompts. They ship as copy-paste prompt files that drop straight into Claude Code, Cursor, or any instruction-following agent.</p>

<div class="tk-grid">

<div class="tk-card">
  <div class="tk-pack">Pack 01 — Computer Vision &amp; Edge AI</div>
  <h3>CV Engineering</h3>
  <ul>
    <li><b>cv-pipeline</b> — detection, tracking, segmentation, annotation, video analysis.</li>
    <li><b>edge-deploy</b> — Hailo, Axelera, Qualcomm, Apple Neural Engine, Jetson, Movidius.</li>
    <li><b>quantize</b> — INT8/INT4 via NNCF, TensorRT, ONNX Runtime.</li>
  </ul>
</div>

<div class="tk-card">
  <div class="tk-pack">Pack 02 — Code Review &amp; Debugging</div>
  <h3>Quality &amp; Security</h3>
  <ul>
    <li><b>code-reviewer</b> — quality, security, maintainability reviews.</li>
    <li><b>debugger</b> — errors, test failures, unexpected behavior.</li>
    <li><b>security-auditor</b> — auth, data handling, security-sensitive code.</li>
    <li><b>diagnosing-bugs</b> — structured loop for hard bugs and regressions.</li>
  </ul>
</div>

<div class="tk-card">
  <div class="tk-pack">Pack 03 — System Design</div>
  <h3>Architecture &amp; Modeling</h3>
  <ul>
    <li><b>codebase-design</b> — shared vocabulary for deep modules.</li>
    <li><b>domain-modeling</b> — pin down domain terminology and ubiquitous language.</li>
    <li><b>improve-codebase-architecture</b> — find deepening opportunities, visual HTML report.</li>
    <li><b>grill-me / grilling / grill-with-docs</b> — relentless interviews that stress-test a plan and produce ADRs.</li>
  </ul>
</div>

<div class="tk-card">
  <div class="tk-pack">Pack 04 — Agent Workflows</div>
  <h3>Autonomy &amp; Orchestration</h3>
  <ul>
    <li><b>autonomy-ladder</b> — graduated autonomy from suggest-only to full-auto with audit logs.</li>
    <li><b>evaluator-optimizer</b> — split writer from checker, loop until it passes.</li>
    <li><b>loop-builder</b> — scheduled automations with STATE.md memory.</li>
    <li><b>handoff</b> — compact a conversation into a pickup document.</li>
    <li><b>to-prd / to-issues / triage</b> — conversation to PRD to grabbable issues.</li>
  </ul>
</div>

<div class="tk-card">
  <div class="tk-pack">Pack 05 — Engineering Discipline</div>
  <h3>Build &amp; Refactor</h3>
  <ul>
    <li><b>tdd</b> — red-green-refactor, tests before code.</li>
    <li><b>modernize</b> — update Python/C++ to latest standards, add types and tests.</li>
    <li><b>prototype</b> — throwaway runnable prototype to validate a design.</li>
    <li><b>learn-from-failures</b> — mine past failures into reusable rules.</li>
  </ul>
</div>

<div class="tk-card">
  <div class="tk-pack">Pack 06 — Writing &amp; Communication</div>
  <h3>Human Output</h3>
  <ul>
    <li><b>humanizer</b> — strip signs of AI-generated writing.</li>
    <li><b>terse-output</b> — drop ceremony, make every token count.</li>
    <li><b>teach</b> — explain a new skill or concept clearly.</li>
  </ul>
</div>

<div class="tk-card">
  <div class="tk-pack">Pack 07 — Knowledge &amp; Portfolio</div>
  <h3>Graph &amp; Memory</h3>
  <ul>
    <li><b>graphify</b> — turn code, docs, papers, images, video into a knowledge graph.</li>
    <li><b>codebase-memory</b> — query the codebase knowledge graph.</li>
    <li><b>portfolio</b> — generate resumes, update the site, consolidate assets.</li>
  </ul>
</div>

</div>

<h2 class="tk-sec">MCP Servers</h2>
<div class="tk-grid">
<div class="tk-card">
  <div class="tk-pack">MCP</div>
  <h3>codebase-memory-mcp</h3>
  <ul><li>Structured code queries against a persistent codebase knowledge graph — answer "how does this module work" without re-reading the tree.</li></ul>
</div>
</div>

<h2 class="tk-sec">Coding Rules</h2>
<div class="tk-grid">
<div class="tk-card"><div class="tk-pack">Rule</div><h3>cpp-style</h3><ul><li>Modern C++ conventions enforced on every change.</li></ul></div>
<div class="tk-card"><div class="tk-pack">Rule</div><h3>python-style</h3><ul><li>Python style and linting standards.</li></ul></div>
<div class="tk-card"><div class="tk-pack">Rule</div><h3>hardware-optimization</h3><ul><li>Performance patterns for edge and embedded targets.</li></ul></div>
</div>

<h2 class="tk-sec">Commands &amp; Hooks</h2>
<div class="tk-grid">
<div class="tk-card"><div class="tk-pack">Command</div><h3>/review</h3><ul><li>One-shot code review against the project's standards.</li></ul></div>
<div class="tk-card"><div class="tk-pack">Hooks</div><h3>Session lifecycle</h3><ul><li><b>code-discovery-gate</b>, <b>session-reminder</b>, <b>subagent-reminder</b> — keep every session grounded in the codebase knowledge graph.</li></ul></div>
</div>

<div class="tk-tags">
  <span>Claude Code</span><span>Cursor</span><span>OpenAI Codex</span><span>Gemini CLI</span><span>OpenCode</span><span>Continue</span>
</div>

<div class="tk-note">
  <b>Built for the current generation of models.</b> These patterns — evaluator-optimizer loops, autonomy ladders, agent handoffs, and knowledge-graph memory — are designed for the reasoning and tool-use capabilities of Claude 5, GPT-5.6, and equivalent frontier models. The full prompt packs are available on the <a href="/shop/">shop page</a>.
</div>

</div>
