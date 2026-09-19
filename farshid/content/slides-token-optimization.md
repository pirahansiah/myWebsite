---
title: Reducing Token Usage in AI-Assisted Development
description: Practical techniques to reduce token usage and cost when using AI assistants for software development.
---

<div class="presentation-panel">
  <div class="nav-hint">Tap the right side for the next slide · tap the left side to go back · swipe or arrow keys work too</div>
  <div class="reveal">
    <div class="slides">

      <section>
        <h1>Reducing Token Usage</h1>
        <h2>in AI-Assisted Development</h2>
        <p style="color:#6b7280; margin-top:1.5em">Dr. Farshid Pirahansiah</p>
      </section>

      <section>
        <h2>The Problem</h2>
        <div class="m">
          <div class="c"><div class="n r">162 KB</div><p>Full .claude folder</p></div>
          <div class="c"><div class="n r">100%</div><p>Token cost</p></div>
          <div class="c"><div class="n o">Slow</div><p>Response time</p></div>
          <div class="c"><div class="n o">$$$</div><p>API cost</p></div>
        </div>
        <p style="margin-top:1em">1 token ≈ 4 chars • Every file = tokens</p>
      </section>

      <section>
        <h2>Token Cost by Component</h2>
        <div class="m">
          <div class="c"><div class="n b">~10 KB</div><p>Core files<br>✅ Always needed</p></div>
          <div class="c"><div class="n o">~90 KB</div><p>Skills (32 files)<br>Select per project</p></div>
          <div class="c"><div class="n p">~14 KB</div><p>Agents (7 files)<br>Select per domain</p></div>
          <div class="c"><div class="n g">6-10%</div><p>Minimal config<br>Best savings</p></div>
        </div>
      </section>

      <section>
        <h2>Strategy 1: .cursorignore</h2>
        <div class="m">
          <div class="c"><div class="n g">5-10%</div><p><strong>Minimal</strong><br>Core only</p></div>
          <div class="c"><div class="n b">20-30%</div><p><strong>Web</strong><br>Python/backend</p></div>
          <div class="c"><div class="n p">35-45%</div><p><strong>CV/ML</strong><br>YOLO, SAM2</p></div>
          <div class="c"><div class="n o">40-50%</div><p><strong>Edge/C++</strong><br>Inference</p></div>
        </div>
        <p style="margin-top:0.8em">Copy template → project/.cursorignore</p>
      </section>

      <section>
        <h2>Strategy 2: Selective Loading</h2>
        <div class="m">
          <div class="c" style="text-align:left">
            <p style="color:#15803d; font-weight:bold">✅ INCLUDE</p>
            <p>! .claude/skills/cv-pipeline/</p>
            <p>! .claude/agents/debugger.md</p>
            <p>! .claude/CLAUDE.md</p>
          </div>
          <div class="c" style="text-align:left">
            <p style="color:#1a56db; font-weight:bold">❌ EXCLUDE</p>
            <p>.claude/skills/portfolio/</p>
            <p>.claude/workflows/</p>
            <p>.claude/agent-memory/</p>
          </div>
        </div>
        <p style="margin-top:0.8em; color:#15803d">38-45% instead of 100%</p>
      </section>

      <section>
        <h2>Strategy 3: Remove Files</h2>
        <div class="m">
          <div class="c" style="text-align:left">
            <p style="color:#1a56db; font-weight:bold">Delete</p>
            <p>DIRECTORY-TREE.md</p>
            <p>FILE-INVENTORY.md</p>
            <p>PROJECT_PORTFOLIO (4084 lines!)</p>
          </div>
          <div class="c" style="text-align:left">
            <p style="color:#92400e; font-weight:bold">Also remove</p>
            <p>7 .cursorignore variants</p>
            <p>agent-memory/ (other projects)</p>
            <p>myWebsite/ (duplicate)</p>
          </div>
        </div>
        <p style="margin-top:0.8em; color:#15803d">-4,967 lines removed</p>
      </section>

      <section>
        <h2>Before & After</h2>
        <div class="m">
          <div class="c" style="border-color:#1a56db">
            <p style="color:#1a56db; font-weight:bold">BEFORE</p>
            <p>60 files • 162 KB</p>
            <p>4084-line portfolio file</p>
            <p>7 .cursorignore variants</p>
          </div>
          <div class="c" style="border-color:#15803d">
            <p style="color:#15803d; font-weight:bold">AFTER</p>
            <p>12 files • ~30 KB</p>
            <p>73-line focused CLAUDE.md</p>
            <p>81% fewer files</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Strategy 4: codebase-memory</h2>
        <p style="color:#1a56db">Stop "read this file" • Stop grep the repo</p>
        <div class="m">
          <div class="c"><div class="n g">10x</div><p>Fewer tokens</p></div>
          <div class="c"><div class="n b">83%</div><p>Answer quality</p></div>
          <div class="c"><div class="n p">2.1x</div><p>Fewer tool calls</p></div>
          <div class="c"><div class="n o">3 min</div><p>Linux kernel index</p></div>
        </div>
        <p style="margin-top:0.8em">One graph query replaces dozens of grep/read</p>
      </section>

      <section>
        <h2>Impact Analysis</h2>
        <div class="m">
          <div class="c" style="text-align:left">
            <p style="color:#1a56db; font-weight:bold">BEFORE</p>
            <p>grep → scan → read → repeat</p>
            <p>~412,000 tokens per session</p>
          </div>
          <div class="c" style="text-align:left">
            <p style="color:#15803d; font-weight:bold">AFTER</p>
            <p>Index once → one graph query</p>
            <p>~3,400 tokens per session</p>
          </div>
        </div>
        <p style="margin-top:0.8em">99% token reduction</p>
      </section>

      <section>
        <h2>Advanced: AST Skeletonization</h2>
        <p style="color:#1a56db">Hide implementation, keep structure</p>
        <div class="m">
          <div class="c" style="text-align:left">
            <p style="color:#1a56db; font-weight:bold">BEFORE</p>
            <p>Send full 1000-line file</p>
            <p>~50,000 tokens</p>
          </div>
          <div class="c" style="text-align:left">
            <p style="color:#15803d; font-weight:bold">AFTER (Skeleton)</p>
            <p>Signatures + imports only</p>
            <p>~2,000 tokens</p>
          </div>
        </div>
        <p style="margin-top:0.8em">Tree-sitter parses AST → strips function bodies → keeps class/method signatures</p>
      </section>

      <section>
        <h2>Advanced: Prompt Caching</h2>
        <p style="color:#1a56db">The game changer from Anthropic &amp; OpenAI</p>
        <div class="m">
          <div class="c"><div class="n g">90%</div><p>Cost reduction</p></div>
          <div class="c"><div class="n b">100KB</div><p>Cache checkpoint</p></div>
          <div class="c"><div class="n p">Perfect</div><p>Accuracy</p></div>
          <div class="c"><div class="n o">Free</div><p>Cache hits</p></div>
        </div>
        <p style="margin-top:0.8em">Freeze .claude/skills + CLAUDE.md in cache block</p>
      </section>

      <section>
        <h2>Advanced: LLMLingua Compression</h2>
        <p style="color:#1a56db">Microsoft Research • 7B model pre-processor</p>
        <div class="m">
          <div class="c"><div class="n g">20x</div><p>Compression ratio</p></div>
          <div class="c"><div class="n b">&lt;1%</div><p>Accuracy drop</p></div>
          <div class="c"><div class="n p">7B</div><p>Pre-processor model</p></div>
          <div class="c"><div class="n o">90-95%</div><p>Token savings</p></div>
        </div>
        <p style="margin-top:0.8em">AI doesn't need "the, and, a" or verbose boilerplate</p>
      </section>

      <section>
        <h2>Advanced: Multi-Model Routing</h2>
        <p style="color:#1a56db">Don't use Sonnet for everything</p>
        <div class="m">
          <div class="c" style="text-align:left">
            <p style="color:#15803d; font-weight:bold">Step 1: Haiku (cheap)</p>
            <p>"Which 3 files are relevant?"</p>
            <p>Returns file paths only</p>
          </div>
          <div class="c" style="text-align:left">
            <p style="color:#1a56db; font-weight:bold">Step 2: Sonnet (expensive)</p>
            <p>Receives only 3 files</p>
            <p>Does the actual coding</p>
          </div>
        </div>
        <p style="margin-top:0.8em">80% cost reduction • High accuracy</p>
      </section>

      <section>
        <h2>Advanced: Unified Diff Output</h2>
        <p style="color:#1a56db">Stop asking AI to rewrite entire files</p>
        <div class="m">
          <div class="c" style="text-align:left">
            <p style="color:#1a56db; font-weight:bold">BEFORE</p>
            <p>Rewrite entire 1000-line file</p>
            <p>Full re-stream every time</p>
          </div>
          <div class="c" style="text-align:left">
            <p style="color:#15803d; font-weight:bold">AFTER (Diff)</p>
            <p>Output 10 changed lines only</p>
            <p>60-90% token savings</p>
          </div>
        </div>
        <p style="margin-top:0.8em">Tools: Aider search/replace blocks, unified diff format</p>
      </section>

      <section>
        <h2>Advanced: Open Source Tools</h2>
        <div class="m">
          <div class="c"><p style="font-weight:bold; color:#1a56db">Aider</p><p>Repository map with ctags</p><p>Strip comments &amp; whitespace</p></div>
          <div class="c"><p style="font-weight:bold; color:#1a56db">Repomix</p><p>Pack repo → single file</p><p>Token counting + secrets scrub</p></div>
          <div class="c"><p style="font-weight:bold; color:#15803d">grep-ast</p><p>AST-aware grep</p><p>Signatures only, skip bodies</p></div>
          <div class="c"><p style="font-weight:bold; color:#92400e">codebase-memory</p><p>Knowledge graph index</p><p>158 languages, sub-ms queries</p></div>
        </div>
      </section>

      <section>
        <h2>What We Added to .claude</h2>
        <p style="color:#1a56db">New rule: rules/token-reduction.md</p>
        <div class="m">
          <div class="c" style="text-align:left">
            <p style="color:#15803d; font-weight:bold">Added</p>
            <p>token-reduction.md (8 strategies)</p>
            <p>Quick reference table</p>
            <p>Always-loaded coding rule</p>
          </div>
          <div class="c" style="text-align:left">
            <p style="color:#1a56db; font-weight:bold">Result</p>
            <p>.claude folder: cleaned + enhanced</p>
            <p>Agent knows all 8 techniques</p>
            <p>Applied automatically per session</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Technique Comparison</h2>
        <div class="m">
          <div class="c"><div class="n p">70-80%</div><p><strong>AST Skeleton</strong><br>High accuracy</p></div>
          <div class="c"><div class="n g">90%</div><p><strong>Prompt Caching</strong><br>Perfect accuracy</p></div>
          <div class="c"><div class="n b">90-95%</div><p><strong>LLMLingua</strong><br>Medium-high</p></div>
          <div class="c"><div class="n o">60-90%</div><p><strong>Unified Diff</strong><br>High accuracy</p></div>
        </div>
      </section>

      <section>
        <h2>Results</h2>
        <div class="m">
          <div class="c"><div class="n g">-81%</div><p>Files</p></div>
          <div class="c"><div class="n b">-82%</div><p>Size</p></div>
          <div class="c"><div class="n p">-88%</div><p>Lines</p></div>
          <div class="c"><div class="n o">90-99%</div><p>Tokens saved</p></div>
        </div>
      </section>

      <section>
        <h1>Summary</h1>
        <p>→ 10 strategies from file cleanup to AI compression</p>
        <p>→ 60 files → 12, 162KB → 30KB</p>
        <p>→ AST skeleton: 70% savings, full structure</p>
        <p>→ Prompt caching: 90% cost reduction</p>
        <p>→ LLMLingua: 20x compression, &lt;1% accuracy loss</p>
        <p style="margin-top:1em; color:#1a56db">pirahansiah.com</p>
      </section>

      <section>
        <h1>Thank You</h1>
        <button id="restart-btn" style="background:#f1f5f9; color:#111418; border:1px solid #d1d5db; padding:10px; border-radius:10px; cursor:pointer">Restart</button>
      </section>

    </div>
  </div>
</div>
