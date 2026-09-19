---
title: Hermes Agent for Research Assistance
description: Autonomous AI research partner for academia and engineering: setup, configuration, workflow automation, ArXiv integration, and multi-agent execution.
---

<div class="presentation-panel">
  <div class="nav-hint">Tap the right side for the next slide · tap the left side to go back · swipe or arrow keys work too</div>
  <div class="reveal">
    <div class="slides">

      
      <section>
        <span class="tag">UNIVERSITY LECTURE & RESEARCH SEMINAR</span>
        <h1>Hermes Agent for Research Assistance</h1>
        <h2>Autonomous Workflows, Literature Sweeps, Code Execution & Paper Drafting</h2>
        <p style="color:#6b7280; margin-top:1.2em; font-size: 0.95em">
          <strong>Dr. Farshid Pirahansiah</strong><br>
          <span style="color:#1a56db">AI & Computer Vision Engineer • pirahansiah.com</span>
        </p>
      </section>

      
      <section>
        <h2>Why Hermes Agent for Researchers?</h2>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#b42318">⚠️ Academic Research Pain Points</h3>
            <p>• <strong>10,000+ papers/year</strong> per field (ArXiv overload).</p>
            <p>• <strong>Manual literature synthesis</strong> & BibTeX management.</p>
            <p>• <strong>Broken code repos</strong>, missing dependencies, failed builds.</p>
            <p>• Passive LLM chats lose context and cannot touch local files/tools.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#15803d">🚀 Hermes Agent Solution</h3>
            <p>• <strong>Autonomous tool calling</strong>: Terminal, ArXiv, Python, Web extraction.</p>
            <p>• <strong>Persistent Memory</strong> & reusable <strong>Skill System</strong>.</p>
            <p>• <strong>Parallel subagents</strong> (`delegate_task`) for concurrent sweeps.</p>
            <p>• Runs on <strong>Local LLMs</strong> (oMLX/llama.cpp) & <strong>Cloud Providers</strong>.</p>
          </div>
        </div>
        <p style="margin-top:0.8em; color:#2b3038">A unified terminal & GUI agent that acts as a full-time research assistant.</p>
      </section>

      
      <section>
        <h2>Hermes Research Skills Catalog</h2>
        <p style="font-size:0.7em; color:#6b7280; text-align:center">8 new research skills installed + 8 existing — full toolkit for literature sweeps, critique & synthesis.</p>
        <div style="width:96%; max-height:62vh; overflow-y:auto; font-size:0.5em; margin:0.3em auto">
          <table style="width:100%; border-collapse:collapse; color:#2b3038">
            <thead>
              <tr style="color:#1a56db; text-align:left">
                <th style="padding:5px 10px; border-bottom:1px solid rgba(26,86,219,.35)">Skill</th>
                <th style="padding:5px 10px; border-bottom:1px solid rgba(26,86,219,.35)">Trigger / what it does</th>
                <th style="padding:5px 10px; border-bottom:1px solid rgba(26,86,219,.35)">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>deepdive</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Deep multi-source investigation; cited synthesis with confidence + disagreement mapping</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><span class="tag">NEW</span></td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>researchgap</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Finds gaps, contradictions & open problems in a topic's literature; proposes research questions</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><span class="tag">NEW</span></td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>critic</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Rigorous critique of a paper/claim/argument with severity-rated weaknesses + verdict</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><span class="tag">NEW</span></td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>literature-review</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Themed survey of a topic with annotated bibliography</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><span class="tag">NEW</span></td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>synthesise</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Merges several sources into one attributed synthesis; flags consensus vs open questions</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><span class="tag">NEW</span></td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>factcheck</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Verifies claims against sources; labels each supported/contradicted/unverifiable</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><span class="tag">NEW</span></td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>question-storm</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Generates diverse, prioritized research questions across levels</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><span class="tag">NEW</span></td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>cite</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Formats references in a citation style (APA/MLA/IEEE/BibTeX); finds real sources</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><span class="tag">NEW</span></td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>arxiv</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Search arXiv papers by keyword/author/category</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">existing</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>llm-wiki</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Build/query interlinked markdown knowledge base</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">existing</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>grounded-citations</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Ground answers in cited verifiable sources</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">existing</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>reference-curation</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Audit/curate doc reference links</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">existing</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>polymarket</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Query Polymarket markets/prices</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">existing</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>competitor-news-monitor</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Watch companies for material news</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">existing</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>blogwatcher</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Monitor blogs/RSS feeds</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">existing</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><code>research-paper-writing</code></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Authoring structure for research papers</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">existing</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      
      <section>
        <h2>Hermes Core Architecture</h2>
        <div class="m">
          <div class="c">
            <div class="n b">Skills</div>
            <p style="text-align:center"><strong>Procedural Memory</strong><br>ArXiv, LaTeX, W&B, PyTorch, Git workflows.</p>
          </div>
          <div class="c">
            <div class="n g">Memory</div>
            <p style="text-align:center"><strong>Durable Profile</strong><br>User bio, SSH nodes, GPU clusters, research domain.</p>
          </div>
          <div class="c">
            <div class="n p">Subagents</div>
            <p style="text-align:center"><strong>Parallel Workers</strong><br>`delegate_task` for parallel experiments & sweeps.</p>
          </div>
          <div class="c">
            <div class="n o">Gateway</div>
            <p style="text-align:center"><strong>Multi-Surface</strong><br>CLI, Desktop GUI, Web Dashboard, Telegram, Discord.</p>
          </div>
        </div>
        <p style="margin-top:0.8em; font-size: 0.8em; color:#6b7280">Supports 35+ providers: Local oMLX, vLLM, OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter.</p>
      </section>

      
      <section>
        <h2>Installation & Research Environment Setup</h2>
        <div class="code-box">
          <pre><span class="cmt"># 1. Official Hermes Shell Installer (uv + python venv + launcher)</span>
<span class="cmd">curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash</span>

<span class="cmt"># 2. Interactive setup wizard (Pick provider: Local LLM, Gemini, OpenAI, etc.)</span>
<span class="cmd">hermes setup</span>

<span class="cmt"># 3. Check environment health & dependencies</span>
<span class="cmd">hermes doctor</span>

<span class="cmt"># 4. Launch Hermes interactive CLI or Desktop GUI</span>
<span class="cmd">hermes</span>           <span class="cmt"># Terminal REPL</span>
<span class="cmd">hermes desktop</span>   <span class="cmt"># Native Electron GUI</span></pre>
        </div>
      </section>

      
      <section>
        <h2>Tailored Research Configuration</h2>
        <p style="color:#1a56db">Configuring <code>~/.hermes/config.yaml</code> for Research Labs</p>
        <div class="code-box">
          <pre><span class="kw">model</span>:
  <span class="kw">default</span>: <span class="str">Qwen3.5-4B-OptiQ-4bit</span>        <span class="cmt"># Fast local model for baseline task</span>
  <span class="kw">provider</span>: <span class="str">custom</span>
  <span class="kw">base_url</span>: <span class="str">"http://127.0.0.1:8000/v1"</span>   <span class="cmt"># oMLX / llama-server local endpoint</span>
  <span class="kw">aliases</span>:
    <span class="kw">reasoning</span>: <span class="str">gemini/gemini-2.0-flash-lite</span>
    <span class="kw">deep-coder</span>: <span class="str">deepseek/deepseek-coder</span>

<span class="kw">agent</span>:
  <span class="kw">max_turns</span>: <span class="str">30</span>
  <span class="kw">context_compression</span>: <span class="str">true</span>            <span class="cmt"># Preserves state on huge paper reads</span>

<span class="kw">terminal</span>:
  <span class="kw">backend</span>: <span class="str">local</span>
  <span class="kw">workdir</span>: <span class="str">"/Users/farshid/research-projects"</span></pre>
        </div>
      </section>

      
      <section>
        <h2>Essential Hermes Skills for Academic Work</h2>
        <div class="m-3">
          <div class="c c-left">
            <h3 style="color:#1a56db">📚 Paper & Lit Review</h3>
            <p>• <code>arxiv</code> — Direct paper search & downloading.</p>
            <p>• <code>grounded-citations</code> — Verified source grounding.</p>
            <p>• <code>llm-wiki</code> — Karpathy-style Markdown Knowledge Base.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#15803d">📊 Code & Execution</h3>
            <p>• <code>jupyter-live-kernel</code> — Live Python kernel.</p>
            <p>• <code>evaluating-llms-harness</code> — Benchmark suites.</p>
            <p>• <code>systematic-debugging</code> — 4-phase root cause analysis.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#6d28d9">📝 Publishing & Docs</h3>
            <p>• <code>docx</code> / <code>pdf</code> — Parse & edit research papers.</p>
            <p>• <code>architecture-diagram</code> — Dark-theme SVG diagrams.</p>
            <p>• <code>markdown-to-pdf</code> — Export clean PDF preprints.</p>
          </div>
        </div>
      </section>

      
      <section>
        <h2>Workflow 1: Automated ArXiv Literature Sweeps</h2>
        <p style="color:#15803d">Command: <em>"Find recent papers on 3D SLAM and build a literature matrix"</em></p>
        <div class="code-box">
          <pre><span class="cmt"># Hermes executes ArXiv search -> parses PDFs -> builds references matrix</span>
<span class="kw">from</span> hermes_tools <span class="kw">import</span> web_search, read_file, write_file

<span class="cmt"># 1. Search ArXiv by domain & topic</span>
results = arxiv_search(query=<span class="str">"cat:cs.CV AND title:SLAM"</span>, max_results=<span class="str">10</span>)

<span class="cmt"># 2. Extract key contributions, equations, and benchmarks</span>
matrix = []
<span class="kw">for</span> paper <span class="kw">in</span> results:
    pdf_text = web_extract(urls=[paper[<span class="str">'pdf_url'</span>]])
    summary = extract_key_innovations(pdf_text)
    matrix.append({<span class="str">"title"</span>: paper[<span class="str">'title'</span>], <span class="str">"bibtex"</span>: paper[<span class="str">'bib'</span>], <span class="str">"notes"</span>: summary})

<span class="cmt"># 3. Output clean Markdown matrix + references.bib</span>
write_file(<span class="str">"literature_review.md"</span>, format_matrix(matrix))
write_file(<span class="str">"references.bib"</span>, format_bibtex(matrix))</pre>
        </div>
      </section>

      
      <section>
        <h2>Workflow 2: Reproducing Code & Experiments</h2>
        <div class="m-2">
          <div class="c c-left">
            <h3>🔬 Automated Setup & Run</h3>
            <p>1. <strong>Clone GitHub Repo</strong>: Autonomous git checkout.</p>
            <p>2. <strong>Inspect & Resolve Deps</strong>: Reads <code>requirements.txt</code> / <code>environment.yml</code>.</p>
            <p>3. <strong>Fix Runtime Errors</strong>: Applies <code>systematic-debugging</code> to fix PyTorch CUDA mismatches or API changes.</p>
            <p>4. <strong>Log Metrics</strong>: Generates W&B or TensorBoard plots.</p>
          </div>
          <div class="c c-left">
            <h3>💻 Live Tool Output</h3>
            <div style="background:#f6f7f9; border-radius:6px; padding:8px; font-family:monospace; font-size:0.75em; color:#1a56db">
              $ hermes chat -q "Clone repository X, fix bugs, and run benchmark script"<br><br>
              <span style="color:#15803d">[tool call]</span> terminal("git clone ...")<br>
              <span style="color:#15803d">[tool call]</span> search_files(pattern="CUDA")<br>
              <span style="color:#15803d">[tool call]</span> patch(file="model.py", old=..., new=...)<br>
              <span style="color:#15803d">[tool call]</span> terminal("python eval.py --batch 32")<br>
              <span style="color:#92400e">✓ Benchmark Complete: Accuracy = 94.2%</span>
            </div>
          </div>
        </div>
      </section>

      
      <section>
        <h2>Workflow 3: Drafting LaTeX & Research Papers</h2>
        <div class="m-3">
          <div class="c">
            <div class="n b">1. Outline</div>
            <p>Generates structured IEEE/ACM template with Abstract, Introduction, Methodology, Experiments, Related Work.</p>
          </div>
          <div class="c">
            <div class="n g">2. Citation Check</div>
            <p>Uses <code>grounded-citations</code> to ensure every claim in the text links to a real ArXiv/DOI paper in <code>references.bib</code>.</p>
          </div>
          <div class="c">
            <div class="n p">3. Diagrams</div>
            <p>Produces publication-ready SVG architecture diagrams, flowcharts, or Manim mathematical animations.</p>
          </div>
        </div>
        <p style="margin-top:0.8em; font-size:0.8em; color:#6b7280">Zero hallucinated citations: claims are mechanically verified against PDF extractions.</p>
      </section>

      
      <section>
        <h2>Workflow 4: Parallel Research Swarms (`delegate_task`)</h2>
        <p style="color:#6d28d9">Spawning Concurrent Subagents for Heavy Academic Workloads</p>
        <div class="code-box">
          <pre><span class="cmt"># Main Hermes Agent dispatches 3 subagents in parallel</span>
delegate_task(tasks=[
  {
    <span class="str">"goal"</span>: <span class="str">"Search ArXiv for 2025-2026 Vision-Language-Action models and extract benchmarks"</span>,
    <span class="str">"context"</span>: <span class="str">"Focus on robotics manipulation"</span>
  },
  {
    <span class="str">"goal"</span>: <span class="str">"Benchmark Qwen3.5 vs K2-Horizon on local M3 GPU using llama.cpp"</span>,
    <span class="str">"context"</span>: <span class="str">"Log tokens/sec, memory usage, and context latency"</span>
  },
  {
    <span class="str">"goal"</span>: <span class="str">"Format collected findings into an IEEE LaTeX draft"</span>,
    <span class="str">"context"</span>: <span class="str">"Save to ~/paper_draft/main.tex"</span>
  }
])</pre>
        </div>
      </section>

      
      <section>
        <h2>Persistent Memory & Custom Lab Skills</h2>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#1a56db">🧠 Persistent Memory (<code>memory</code>)</h3>
            <p>Stores facts that survive across every terminal session:</p>
            <p>• Primary research focus (e.g. <em>Computer Vision, 3D Reconstruction</em>).</p>
            <p>• Lab GPU Cluster details (e.g. <em>SLURM partition <code>a100-80gb</code>, node IPs</em>).</p>
            <p>• Preferred paper format & writing style guidelines.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#92400e">⚡ Custom Skills (<code>skill_manage</code>)</h3>
            <p>Teaches Hermes specialized lab procedures:</p>
            <p>• <strong>Slurm Job Submission</strong>: <code>sbatch</code> script creation & queue monitoring.</p>
            <p>• <strong>HuggingFace Dataset Uploads</strong>: Automated push of custom datasets.</p>
            <p>• <strong>Lab Calibration Pipeline</strong>: Multi-camera camera intrinsic sweeps.</p>
          </div>
        </div>
      </section>

      
      <section>
        <h2>Cost & Token Efficiency Comparison</h2>
        <div class="m">
          <div class="c">
            <div class="n g">0 $</div>
            <p><strong>Local oMLX / Ollama</strong><br>100% private, zero cost, runs on Mac/Linux.</p>
          </div>
          <div class="c">
            <div class="n b">90%</div>
            <p><strong>Prompt Caching</strong><br>Free cache hits on long paper context blocks.</p>
          </div>
          <div class="c">
            <div class="n p">99%</div>
            <p><strong>Codebase Memory</strong><br>Graph queries replace reading full repos.</p>
          </div>
          <div class="c">
            <div class="n o">10x</div>
            <p><strong>Speedup</strong><br>Parallel subagent sweeps vs manual searching.</p>
          </div>
        </div>
        <p style="margin-top:0.8em; font-size: 0.85em">Local models handle draft tasks & code execution; Cloud models handle complex reasoning.</p>
      </section>

      
      <section>
        <h2>Case Study: Computer Vision & 3D Reconstruction</h2>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#1a56db">Project Goal</h3>
            <p>Build an end-to-end multi-camera 3D point cloud generation pipeline and publish open source benchmarks on pirahansiah.com.</p>
            <p><strong>Hermes Execution</strong>:</p>
            <p>• Pulled 15 camera calibration papers from ArXiv.</p>
            <p>• Debugged OpenCV / GStreamer C++ DMA pipeline.</p>
            <p>• Generated benchmark tables and SVG pipeline diagrams.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#15803d">Deliverables Produced</h3>
            <p>✓ <code>3d-vision.md</code> documentation page on website.</p>
            <p>✓ Verified OpenCV C++ code with zero memory leaks.</p>
            <p>✓ BibTeX reference database with 15 verified citations.</p>
            <p>✓ Interactive web visualizer demo.</p>
          </div>
        </div>
      </section>

      
      <section>
        <h1>Summary & Key Takeaways</h1>
        <div style="text-align:left; max-width:800px; margin:0.8em auto; font-size:0.9em; line-height:1.7">
          <p>✔ <strong>Autonomous Research Agent</strong>: Move from passive chatting to active tool execution.</p>
          <p>✔ <strong>End-to-End Workflow</strong>: Literature review → Code reproduction → Experimentation → Paper drafting.</p>
          <p>✔ <strong>Lab Privacy & Local Serving</strong>: Run on local oMLX / llama.cpp or Cloud APIs seamlessly.</p>
          <p>✔ <strong>Parallel Power</strong>: Use subagents (`delegate_task`) for concurrent paper sweeps.</p>
        </div>
        <p style="margin-top:1.2em; color:#1a56db; font-size:1.1em; font-weight: bold">
          Explore the Knowledge Base & Code: pirahansiah.com
        </p>
      </section>

      
      <section>
        <h2>How to Write a Paper — Write in This Order</h2>
        <p style="font-size:0.7em; color:#6b7280; text-align:center">Draft bottom-up: build the evidence first, then frame it. Read top-down.</p>
        <ol style="text-align:left; max-width:860px; margin:0.5em auto; font-size:0.82em; line-height:1.6; color:#2b3038; counter-reset:step">
          <li style="margin:0.25em 0"><strong style="color:#1a56db">1 · Methods</strong> — Lock the protocol, setup, datasets & metrics. The foundation everything cites.</li>
          <li style="margin:0.25em 0"><strong style="color:#1a56db">2 · Results</strong> — Report what happened, raw: numbers, curves, observed behaviour.</li>
          <li style="margin:0.25em 0"><strong style="color:#1a56db">3 · Figures</strong> — Build the visuals: plots, diagrams, architecture art. One idea each.</li>
          <li style="margin:0.25em 0"><strong style="color:#1a56db">4 · Tables</strong> — Assemble comparison/benchmark tables; numbers must match figures.</li>
          <li style="margin:0.25em 0"><strong style="color:#6d28d9">5 · Discussion</strong> — Interpret: why it works, limits, implications, relation to prior work.</li>
          <li style="margin:0.25em 0"><strong style="color:#6d28d9">6 · Introduction</strong> — Open with the gap & motivation; now you know what you proved.</li>
          <li style="margin:0.25em 0"><strong style="color:#15803d">7 · Abstract</strong> — Written last: the 200-word distillation of the finished paper.</li>
        </ol>
        <p style="margin-top:0.5em; font-size:0.74em; color:#6b7280">Hermes: <code>researchgap</code> scopes the gap · <code>critic</code> stress-tests claims · <code>cite</code> formats refs · <code>research-paper-writing</code> structures the draft.</p>
      </section>

      
      <section>
        <h2>PaperBanana: Automating Academic Illustration</h2>
        <p style="font-size:0.68em; color:#6b7280; text-align:center">Text-to-figure AI for researchers — publication-ready diagrams & charts from a description.</p>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#1a56db">🔧 What it does</h3>
            <p>• <strong>Methodology diagrams</strong> — model architectures, algorithm flows, encoders, system pipelines.</p>
            <p>• <strong>Statistical plots</strong> — generates executable <strong>Matplotlib code</strong> from raw data (no numeric hallucination).</p>
            <p>• <strong>Aesthetic enhancement</strong> — turns hand sketches / whiteboard notes into top-venue art.</p>
            <p>• <strong>Styles</strong> — Transformer, GAN, RAG, Multi-Agent templates; posters & more.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#6d28d9">🤖 How it works</h3>
            <p>• <strong>5-agent closed loop</strong> (Planner → Visualizer → …) for faithful, precise, polished figures.</p>
            <p>• <strong>Planner</strong> turns text into structured visual layouts.</p>
            <p>• <strong>Visualizer</strong> renders via Nano-Banana-Pro — exact shapes, connectors, icons.</p>
            <p>• <strong>Trusted by</strong> SNU, Stanford, UC Berkeley, CMU, Tsinghua, SJTU, Yonsei, IIT Madras, Monash, Broad Institute.</p>
          </div>
        </div>
        <p style="margin-top:0.5em; font-size:0.74em; color:#6b7280">Example: prompt <em>"encoder–decoder segmentation pipeline with skip connections"</em> → ready architecture diagram in seconds. Reference: <a href="https://paper-banana.org" style="color:#1a56db; text-decoration:underline">paper-banana.org</a></p>
      </section>

      
      <section>
        <h2>Academic Peer-Review Loop</h2>
        <p style="font-size:0.68em; color:#6b7280; text-align:center">From submission to camera-ready — and how Hermes shortens each cycle.</p>
        <div class="m-3">
          <div class="c c-left">
            <h3 style="color:#1a56db">📤 Submit</h3>
            <p>• Format to venue template (IEEE/ACM).</p>
            <p>• <code>grounded-citations</code> checks every claim links to a real source.</p>
            <p>• <code>cite</code> exports clean BibTeX/references.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#6d28d9">🔍 Review</h3>
            <p>• Editors assign 2–3 anonymous reviewers.</p>
            <p>• <code>critic</code> pre-empts weaknesses before submission.</p>
            <p>• <code>factcheck</code> flags unsupported claims.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#15803d">✏️ Revise</h3>
            <p>• Address each point (accept / rebut).</p>
            <p>• <code>deepdive</code> gathers new evidence for gaps.</p>
            <p>• <code>synthesise</code> merges reviewer feedback.</p>
          </div>
        </div>
        <p style="margin-top:0.6em; font-size:0.74em; color:#6b7280">Loop repeats per round (R1 → R2 → …) until <strong>accept</strong>; then camera-ready + <code>research-paper-writing</code> polish. Average: 2–4 months per round.</p>
      </section>

      
      <section>
        <h2>Agent Swarms: Parallel Research at Scale</h2>
        <p style="font-size:0.68em; color:#6b7280; text-align:center">One orchestrator fans out to many specialized workers, then merges results.</p>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#1a56db">🐝 How a swarm runs</h3>
            <p>• <strong>Orchestrator</strong> splits the task into independent sub-goals.</p>
            <p>• <strong>Swarm</strong> = N parallel subagents, each with its own context & tools.</p>
            <p>• <strong>Merge</strong>: results aggregated, deduplicated, cross-checked.</p>
            <p>• <strong>Hermes</strong>: <code>delegate_task</code> spawns concurrent workers (no shared context bloat).</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#6d28d9">🌊 Example: kimi.com → swarm</h3>
            <p>1. <strong>kimi.com</strong> receives the research question (e.g. "compare 2025 VLM agents").</p>
            <p>2. <strong>→ swarm</strong>: fans out to subagents — ArXiv sweep, benchmark mining, repo cloning.</p>
            <p>3. <strong>→ …</strong>: each worker returns findings; orchestrator synthesizes one report + BibTeX.</p>
            <p>• Same pattern in Hermes: 3 <code>delegate_task</code> calls → one literature matrix.</p>
          </div>
        </div>
        <p style="margin-top:0.5em; font-size:0.74em; color:#6b7280">Why: 10× speedup vs serial search, isolated failures, no single context overflow. Pair with <code>synthesise</code> + <code>critic</code>.</p>
      </section>

      
      <section>
        <h2>LeapSpace &amp; Your Research Profile</h2>
        <p style="font-size:0.66em; color:#6b7280; text-align:center">Elsevier's research-grade AI workspace (Scopus data) — and the author record it surfaces.</p>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#1a56db">🪐 LeapSpace (Elsevier)</h3>
            <p>• AI workspace powered by <strong>Scopus</strong> + Elsevier full-text.</p>
            <p>• <strong>Deep Research</strong> reports: patterns, contradictions, evidence gaps.</p>
            <p>• <strong>Trust Cards</strong> + <strong>Claim Radar</strong>: sources &amp; contradictions shown.</p>
            <p>• <strong>Writing Coach</strong>, Funding Scout, Author Search, collaborators.</p>
            <p>• <a href="https://researcher.elsevier.com/eur/" style="color:#1a56db; text-decoration:underline">researcher.elsevier.com/eur</a></p>
          </div>
          <div class="c c-left">
            <h3 style="color:#6d28d9">👤 Farshid Pirahansiah — Scopus</h3>
            <p>• <strong>h-index 6</strong> · <strong>12 publications</strong> · <strong>73 citations</strong></p>
            <p>• Affiliation: Center for AI Technology, Bangi, Malaysia.</p>
            <p>• Active years: 2010–2022.</p>
            <p>• Topics: camera calibration, robot localization, image segmentation, OCR, license-plate recognition.</p>
            <p>• Profile generated by LeapSpace, Sun Sep 06 2026.</p>
          </div>
        </div>
        <p style="margin-top:0.5em; font-size:0.72em; color:#6b7280">Hermes mapping: <code>deepdive</code>/<code>literature-review</code> ≈ Deep Research · <code>grounded-citations</code>/<code>factcheck</code> ≈ Trust Cards/Claim Radar · <code>cite</code> ≈ Author Search/BibTeX.</p>
      </section>

      
      <section>
        <h2>Best Reference Finder — AI Citation Tools</h2>
        <p style="font-size:0.66em; color:#6b7280; text-align:center">Dedicated finders query Crossref / Semantic Scholar — no hallucinated refs like chatbots.</p>
        <div style="width:97%; max-height:58vh; overflow-y:auto; font-size:0.5em; margin:0.3em auto">
          <table style="width:100%; border-collapse:collapse; color:#2b3038">
            <thead>
              <tr style="color:#1a56db; text-align:left">
                <th style="padding:3px 8px; border-bottom:1px solid rgba(26,86,219,.35)">Tool</th>
                <th style="padding:3px 8px; border-bottom:1px solid rgba(26,86,219,.35)">Best for</th>
                <th style="padding:3px 8px; border-bottom:1px solid rgba(26,86,219,.35)">Standout</th>
                <th style="padding:3px 8px; border-bottom:1px solid rgba(26,86,219,.35)">Styles</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><a href="https://www.sourcely.net/" style="color:#1a56db">Sourcely</a></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Bulk / paragraph</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Scans essays, highlights text needing support, summaries</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">700+ (BibTeX, RIS)</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><a href="https://citely.ai/citation-finder" style="color:#1a56db">Citely AI</a></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Claim verification</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Paste claim → matched to verified DOIs</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">APA, MLA</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><a href="https://www.grammarly.com/ai-agents/citation-finder" style="color:#1a56db">Grammarly</a></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">In-line writing</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Flags missing sources in editor, inserts citations</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">APA, MLA, Chicago</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><a href="https://paperpal.com/tools/citation-generator" style="color:#1a56db">Paperpal</a></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">MS Word flow</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">250M+ articles, search by title/DOI</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">10,000+</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><a href="https://scispace.com/agents/citation-finder-6ewdpowc" style="color:#1a56db">SciSpace</a></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Partial metadata</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Broken URL/author → complete citation</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">BibTeX, RIS, CSV</td></tr>
              <tr><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec"><a href="https://writeless.ai/ai-reference-finder" style="color:#1a56db">Writeless</a></td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">PDF uploads</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">Filter by min year, inline insertion</td><td style="padding:3px 8px; border-bottom:1px solid #e6e8ec">APA, MLA, Harvard…</td></tr>
            </tbody>
          </table>
        </div>
        <p style="margin-top:0.4em; font-size:0.7em; color:#6b7280">Beyond find: <strong>Scite</strong> labels citations support/challenge/mention · <strong>Google Scholar</strong> (free, manual) · <strong>Consensus</strong> (Consensus Meter) · manage with <strong>Zotero / Mendeley / <a href="https://www.mybib.com/" style="color:#1a56db">MyBib</a></strong>. Hermes: <code>cite</code> formats, <code>factcheck</code> verifies, <code>grounded-citations</code> grounds.</p>
      </section>

      
      <section>
        <h2>Second Brain: Obsidian &times; Hermes</h2>
        <p style="font-size:0.66em; color:#6b7280; text-align:center">Turn your notes into a queryable, agent-editable knowledge base.</p>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#1a56db">🧠 Connect Obsidian</h3>
            <p>• Vault = plain markdown; Hermes reads/writes via the <code>obsidian</code> skill.</p>
            <p>• Path from <code>OBSIDIAN_VAULT_PATH</code> or <code>~/Documents/Obsidian Vault</code>.</p>
            <p>• Use <code>[[wikilinks]]</code> + YAML frontmatter (tags, aliases) for structure.</p>
            <p>• Two-way sync: edit in Obsidian, Hermes sees it next turn.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#6d28d9">🔌 Hermes skills for your vault</h3>
            <p>• <code>obsidian</code> — search, read, create, edit notes & wikilinks.</p>
            <p>• <code>llm-wiki</code> — build interlinked markdown KB.</p>
            <p>• <code>synthesise</code> — merge notes into one.</p>
            <p>• <code>cite</code> — attach BibTeX to literature notes.</p>
            <p>• <code>factcheck</code> / <code>grounded-citations</code> — verify before saving.</p>
          </div>
        </div>
        <p style="margin-top:0.5em; font-size:0.72em; color:#6b7280">Flow: capture → Hermes tags & links → query with <code>search_files</code> → surface in <code>deepdive</code> / <code>literature-review</code>. Your second brain, always current.</p>
      </section>

      
      <section>
        <h2>Google Opal <span class="tag">Experiment</span></h2>
        <p style="font-size:0.66em; color:#6b7280; text-align:center">Google's experimental AI app platform — verified facts only; function not yet documented publicly.</p>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#1a56db">🔎 What is confirmed</h3>
            <p>• Official Google product labelled <strong>"Opal [Experiment]"</strong>.</p>
            <p>• Web app (opal.google) loading in a sandboxed iframe.</p>
            <p>• Requires <strong>Google sign-in</strong> (OAuth) to use.</p>
            <p>• Requests <strong>camera &amp; microphone</strong> permissions.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#6d28d9">❓ Not yet public</h3>
            <p>• Exact purpose / feature set is not in the page source.</p>
            <p>• Positioned in Google's "experiments" track (like Labs).</p>
            <p>• Likely an AI app-/agent-building surface — <em>unconfirmed</em>.</p>
            <p>• Check <a href="https://opal.google" style="color:#1a56db; text-decoration:underline">opal.google</a> after sign-in for live capability.</p>
          </div>
        </div>
        <p style="margin-top:0.5em; font-size:0.72em; color:#6b7280">Hermes angle: if Opal is an app/agent builder, it parallels <code>skill_manage</code> (custom skills) &amp; <code>delegate_task</code> (subagents) — but treat as speculation until docs ship.</p>
      </section>

      
      <section>
        <h2>Validated Skills Library <span class="tag">installed &amp; scanned</span></h2>
        <p style="font-size:0.6em; color:#6b7280">All installed via <code>hermes skills install</code>, security-scanned, and verified (valid SKILL.md, enabled).</p>
        <div class="m-3">
          <div class="c"><h3 style="color:#1a56db">Web &amp; Research</h3><p style="font-size:0.6em">agent-reach · youtube-full · defuddle · resemble-detect</p></div>
          <div class="c"><h3 style="color:#6d28d9">Build &amp; Engineering</h3><p style="font-size:0.6em">using-agent-skills · setup-matt-pocock-skills · make-interfaces-feel-better · humanizer</p></div>
          <div class="c"><h3 style="color:#1a56db">Agents &amp; Ops</h3><p style="font-size:0.6em">browser-harness · i-have-adhd · loopy · loop-library · skillclaw</p></div>
        </div>
        <div class="code-box" style="font-size:0.56em; margin-top:10px">
<span class="cmt"># list active skills</span>
hermes skills list
<span class="cmt"># 14 validated community/url skills now active</span>
        </div>
      </section>

      
      <section>
        <h2>Command Cheat Sheet <span class="tag">DESK · CLI · MSG · SHELL</span></h2>
        <p style="font-size:0.5em; color:#6b7280">Everyday commands — Desktop, CLI chat, messaging, shell. (Verified vs current Hermes source, Sep 2026.)</p>
        <div class="m-3">
          <div class="c"><h3 style="color:#1a56db">Sessions &amp; Context</h3><p style="font-size:0.55em">/new · /resume · /sessions · /title · /branch · /compress · /context · /status</p></div>
          <div class="c"><h3 style="color:#1a56db">Control Work</h3><p style="font-size:0.55em">/queue · /steer · /bg · /btw · /agents · /stop</p></div>
          <div class="c"><h3 style="color:#1a56db">Goals, Loops &amp; Plans</h3><p style="font-size:0.55em">/goal · /subgoal · /heartbeat · /loop · /plan · /review · /refine</p></div>
          <div class="c"><h3 style="color:#6d28d9">Models &amp; Behavior</h3><p style="font-size:0.55em">/model · /moa · /personality · /reasoning · /fast · /approvals · /yolo · /busy · /voice</p></div>
          <div class="c"><h3 style="color:#6d28d9">Skills, Memory &amp; Tools</h3><p style="font-size:0.55em">/skills · /learn · /memory · /init · /tools · /browser</p></div>
          <div class="c"><h3 style="color:#6d28d9">Automation &amp; Coord</h3><p style="font-size:0.55em">/cron · /suggestions · /blueprint · /kanban</p></div>
          <div class="c"><h3 style="color:#1a56db">Inspect, Recover &amp; Fix</h3><p style="font-size:0.55em">/retry · /undo · /save · /diff · /rollback · /usage · /debug · /help</p></div>
          <div class="c"><h3 style="color:#be185d">Messaging / Gateway</h3><p style="font-size:0.55em">/sethome · /topic · /commands · /approve · /deny · /pause · /platform · /restart</p></div>
          <div class="c"><h3 style="color:#1a56db">Terminal Essentials</h3><p style="font-size:0.55em">hermes / hermes chat · -z "prompt" · model · status · doctor · gateway status · --safe-mode · update</p></div>
        </div>
        <div class="code-box" style="font-size:0.52em; margin-top:8px">
<span class="cmt"># repeat-work modes</span>
/goal  = work until objective met   /loop  = repeat w/ stop conditions
/heartbeat = one recurring check    /cron  = durable schedule outside chat
<span class="cmt"># type / + letters for autocomplete; /help for full list</span>
        </div>
      </section>

      
      <section>
        <h1>Thank You & Discussion</h1>
        <h2 style="color:#2b3038">Hermes Agent for Research Assistance</h2>
        <p style="margin-top:1.5em">
          <a href="/farshid/content/research-tools.md" style="color:#1a56db; text-decoration:underline">All Presentations</a> • 
          <a href="/farshid/content/atlas.md#publications" style="color:#1a56db; text-decoration:underline">Publications & Notes</a> • 
          <a href="https://github.com/pirahansiah" style="color:#1a56db; text-decoration:underline">GitHub Repositories</a>
        </p>
        <div style="margin-top:2em">
          <button id="restart-btn" style="background:#f1f5f9; color:#1a56db; border:1px solid #d1d5db; padding:12px 24px; border-radius:10px; cursor:pointer; font-size:0.9em; font-weight:bold">
            🔄 Restart Presentation
          </button>
        </div>
      </section>

    </div>
  </div>
</div>
