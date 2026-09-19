> **Hermes Agent for Big Computer Vision Projects** — Production-Scale CV Engineering with Autonomous Agents — https://www.pirahansiah.com/notes/slides/presentation-cv/
> Presentation: Setup, bots, multi-agent orchestration, research, profiling, cron jobs, messaging, group bots, and artifacts for large CV teams.

*Last updated: 2026-09-06.*

<style>
  #content { background: #050b14 !important; }
  .site-main { padding: 0 !important; margin: 0 !important; background: #000 !important; border: none !important; box-shadow: none !important; max-width: none !important; width: 100% !important; }
  .toolbar, .site-footer, footer { display: none !important; }
  .presentation-panel { position: relative; width: 100%; height: min(72vh, 760px); overflow: hidden; background: #050b14; }
  .reveal .slides section { height: 100%; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; padding: 20px !important; box-sizing: border-box !important; }
  .reveal { height: 100%; } .reveal .slides { height: 100%; }
  .reveal { height: 100%; width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .reveal h1 { font-size: 1.9em; margin-bottom: 0.2em; color: #fff; text-align: center; font-weight: 800; background: linear-gradient(135deg, #22D3EE, #06B6D4, #3B82F6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .reveal h2 { font-size: 1.3em; margin: 0.2em 0 0.5em; color: #22D3EE; text-align: center; font-weight: 700; }
  .reveal h3 { font-size: 1.05em; color: #A855F7; margin: 0.2em 0; }
  .reveal p, .reveal li { font-size: 0.82em; color: #cbd5e1; line-height: 1.5; }
  .reveal ul { list-style: none; padding: 0; text-align: left; margin: 0.5em 0; }
  .reveal .controls { color: #22D3EE; }
  .reveal .progress { color: #22D3EE; height: 4px; }

  .m { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; width: 98%; max-width: 1100px; margin: 0.5em auto; }
  .m-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; width: 98%; max-width: 1100px; margin: 0.5em auto; }
  .m-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; width: 98%; max-width: 1100px; margin: 0.5em auto; }

  .c { background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 16px; text-align: center; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.37); }
  .c-left { text-align: left; }
  .c p { text-align: left; margin: 6px 0; font-size: 0.8em; }

  .n { font-size: 2.0em; font-weight: 800; margin: 0; line-height: 1.1; }
  .n.g { color: #30d158; } .n.r { color: #0284C7; } .n.b { color: #22D3EE; } .n.p { color: #A855F7; } .n.o { color: #ff9f0a; }

  .code-box { background: #090d16; border: 1px solid rgba(34,211,238,0.3); border-radius: 8px; padding: 12px 16px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 0.72em; color: #38bdf8; text-align: left; width: 95%; max-width: 1000px; overflow-x: auto; box-shadow: inset 0 2px 8px rgba(0,0,0,0.6); }
  .code-box pre { margin: 0; padding: 0; }
  .code-box .cmd { color: #34d399; font-weight: bold; }
  .code-box .cmt { color: #64748b; font-style: italic; }
  .code-box .str { color: #fbbf24; }
  .code-box .kw { color: #f472b6; font-weight: bold; }

  .tag { display: inline-block; background: rgba(34, 211, 238, 0.15); border: 1px solid rgba(34, 211, 238, 0.4); color: #38bdf8; padding: 2px 8px; border-radius: 6px; font-size: 0.72em; font-weight: 600; margin-right: 4px; }

  .nav-hint { position: absolute; bottom: 8px; font-size: 0.55em; opacity: 0.4; color: #94a3b8; pointer-events: none; z-index: 10; }

  @media (max-width: 768px) { .m, .m-2, .m-3 { grid-template-columns: 1fr; } .n { font-size: 1.5em; } .reveal h1 { font-size: 1.3em; } .reveal h2 { font-size: 1.05em; } .code-box { font-size: 0.62em; } }
</style>

<div class="presentation-panel">
  <div class="nav-hint">← Tap Left / Press Left Arrow | Tap Right / Press Right Arrow →</div>
  <div class="reveal">
    <div class="slides">

      
      <section>
        <span class="tag">COMPUTER VISION ENGINEERING AT SCALE</span>
        <h1>Hermes Agent for Big Computer Vision Projects</h1>
        <h2>Setup · Bots · Multi-Agent · Profiling · Cron · Messaging · Artifacts</h2>
        <p style="color:#94a3b8; margin-top:1.2em; font-size: 0.95em;">
          <strong>Dr. Farshid Pirahansiah</strong><br>
          <span style="color:#38bdf8;">AI & Computer Vision Engineer • pirahansiah.com</span>
        </p>
      </section>

      
      <section>
        <h2>Big CV Projects: Why Standard Tooling Fails</h2>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#f87171;">⚠️ Scale & Complexity</h3>
            <p>• <strong>100+ camera</strong> multi-stream ingestion pipelines.</p>
            <p>• <strong>Model zoo sprawl</strong>: YOLO, SAM2, Depth Anything, custom transformers.</p>
            <p>• <strong>GPU scheduling</strong> across clusters & edge nodes.</p>
            <p>• Repetitive ops: labeling QA, dataset diffs, eval reports.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#34d399;">🤖 Hermes as CV Control Plane</h3>
            <p>• One agent orchestrates <strong>code, GPUs, data, comms</strong>.</p>
            <p>• <strong>Persistent memory</strong> of your pipeline topology.</p>
            <p>• <strong>Parallel subagents</strong> per model/camera group.</p>
            <p>• <strong>Group bots</strong> push results to Slack/Telegram/Discord.</p>
          </div>
        </div>
      </section>

      
      <section>
        <h2>Hermes CV Control-Plane Architecture</h2>
        <div class="m">
          <div class="c"><div class="n b">Gateway</div><p style="text-align:center;">Single control plane for CLI, GUI, Web, Messaging bots.</p></div>
          <div class="c"><div class="n g">Memory</div><p style="text-align:center;">Pipeline topology, GPU inventory, dataset schemas.</p></div>
          <div class="c"><div class="n p">Subagents</div><p style="text-align:center;">Per-model / per-camera swarm workers.</p></div>
          <div class="c"><div class="n o">Cron</div><p style="text-align:center;">Nightly eval, retraining triggers, report pushes.</p></div>
        </div>
        <p style="margin-top:0.8em; font-size: 0.8em; color:#94a3b8;">Local LLMs (oMLX) for private code; Cloud for heavy reasoning — same agent core.</p>
      </section>

      
      <section>
        <h2>Project Setup & Configuration</h2>
        <div class="code-box">
          <pre><span class="cmt"># Install + init a CV project workspace</span>
<span class="cmd">curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash</span>
<span class="cmd">hermes setup</span>             <span class="cmt"># pick provider (local oMLX / Gemini / OpenAI)</span>
<span class="cmd">hermes doctor</span>            <span class="cmt"># verify ffmpeg, CUDA, Python, torch</span>

<span class="cmt"># ~/.hermes/config.yaml (CV-tuned)</span>
<span class="kw">model</span>:
  <span class="kw">default</span>: <span class="str">Qwen3.5-4B-OptiQ-4bit</span>
  <span class="kw">base_url</span>: <span class="str">"http://127.0.0.1:8000/v1"</span>
  <span class="kw">aliases</span>:
    <span class="kw">coder</span>: <span class="str">deepseek/deepseek-coder</span>
    <span class="kw">vision</span>: <span class="str">gemini/gemini-2.0-flash-lite</span>
<span class="kw">agent</span>:
  <span class="kw">max_turns</span>: <span class="str">40</span>
  <span class="kw">tools</span>: [terminal, search_files, browser, vision_analyze]</pre>
        </div>
      </section>

      
      <section>
        <h2>Building Reusable CV Skills</h2>
        <p style="color:#38bdf8;">Teach Hermes your pipeline once — reuse forever via <code>skill_manage</code></p>
        <div class="m-3">
          <div class="c c-left">
            <h3 style="color:#22D3EE;">🎯 Detection</h3>
            <p>• YOLOv8/v11 finetune & inference skill.</p>
            <p>• Auto-annotate + label-QA loop.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#30D158;">🧩 Segmentation</h3>
            <p>• SAM2 prompt + box masking skill.</p>
            <p>• COCO→custom mask converter.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#A855F7;">📷 Calibration</h3>
            <p>• Multi-camera intrinsic/extrinsic solver.</p>
            <p>• Charuco board + stereo rectify.</p>
          </div>
        </div>
        <p style="margin-top:0.6em; font-size:0.8em;">Skills load automatically when the task matches — no re-prompting.</p>
      </section>

      
      <section>
        <h2>Multi-Agent: CV Swarm Orchestration</h2>
        <div class="code-box">
          <pre><span class="cmt"># One coordinator dispatches parallel CV workers</span>
delegate_task(tasks=[
  {<span class="str">"goal"</span>: <span class="str">"Fine-tune YOLOv11 on /data/coco-subset, export ONNX"</span>,
   <span class="str">"context"</span>: <span class="str">"imgsz=640, epochs=50, device=cuda:0"</span>},
  {<span class="str">"goal"</span>: <span class="str">"Run SAM2 on /data/video/*.mp4, emit mask JSON"</span>,
   <span class="str">"context"</span>: <span class="str">"checkpoint=sam2_hiera_large"</span>},
  {<span class="str">"goal"</span>: <span class="str">"Profile GPU memory of inference server under 50 streams"</span>,
   <span class="str">"context"</span>: <span class="str">"tool=nvidia-smi + py-spy"</span>}
])
<span class="cmt"># Each returns a verified summary; coordinator merges + writes report.</span></pre>
        </div>
      </section>

      
      <section>
        <h2>Profiling CV Pipelines</h2>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#22D3EE;">⚡ GPU & Inference</h3>
            <p>• <code>nvidia-smi</code> dmon loop captured by agent.</p>
            <p>• <code>py-spy dump</code> for Python GIL stalls.</p>
            <p>• <code>torch.profiler</code> trace → flamegraph SVG.</p>
            <p>• Memory ceiling detection before OOM.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#30D158;">📊 Throughput</h3>
            <p>• FPS per model under N streams.</p>
            <p>• Batch-size sweep (1→32) auto-table.</p>
            <p>• Edge vs Datacenter latency compare.</p>
            <p>• Bottleneck callout in final report.</p>
          </div>
        </div>
      </section>

      
      <section>
        <h2>Scheduled Jobs: Nightly CV Ops</h2>
        <div class="code-box">
          <pre><span class="cmt"># Nightly eval + dataset drift report at 02:00</span>
<span class="cmd">hermes cron create "0 2 * * *" \</span>
<span class="cmd">  --name "Nightly CV Eval" \</span>
<span class="cmd">  --script nightly_eval.py \</span>
<span class="cmd">  --deliver telegram</span>

<span class="cmt"># Weekly retrain trigger if mAP drops &gt; 2%</span>
<span class="cmd">hermes cron create "0 4 * * 1" \</span>
<span class="cmd">  --name "Weekly Retrain Gate" \</span>
<span class="cmd">  --no-agent --script retrain_gate.sh</span></pre>
        </div>
        <p style="font-size:0.8em; color:#94a3b8; margin-top:0.5em;">Cron survives reboots; results delivered to chat or messaging automatically.</p>
      </section>

      
      <section>
        <h2>Messaging & Group Bots</h2>
        <div class="m-3">
          <div class="c"><div class="n b">Telegram</div><p>Channel & group posting of eval dashboards.</p></div>
          <div class="c"><div class="n g">Discord</div><p>Slash commands: <code>/eval</code>, <code>/profile</code>, <code>/status</code>.</p></div>
          <div class="c"><div class="n p">Slack</div><p>Webhook alerts on training failure.</p></div>
        </div>
        <div class="code-box" style="margin-top:0.6em;">
          <pre><span class="cmt"># Connect a bot (one-time OAuth / token)</span>
<span class="cmd">hermes auth add telegram</span>     <span class="cmt"># or discord / slack</span>
<span class="cmd">hermes bot create cv-alerts --platform telegram --group "CV War Room"</span></pre>
        </div>
      </section>

      
      <section>
        <h2>Artifact Management</h2>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#38bdf8;">📦 What Hermes Produces</h3>
            <p>• Trained <strong>weights</strong> (ONNX, GGUF, safetensors).</p>
            <p>• <strong>Benchmarks</strong>: CSV + interactive HTML charts.</p>
            <p>• <strong>Diagrams</strong>: pipeline SVG, architecture graphs.</p>
            <p>• <strong>Datasets</strong>: diff reports, schema validation.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#fbbf24;">☁️ Storage & Traceability</h3>
            <p>• Auto-push to HuggingFace Datasets / Models.</p>
            <p>• Git-LFS for large binaries.</p>
            <p>• Every artifact tagged with <strong>commit + eval hash</strong>.</p>
            <p>• Reproducible via <code>skill_manage</code> replay.</p>
          </div>
        </div>
      </section>

      
      <section>
        <h2>Closing the Research → Production Loop</h2>
        <div class="m">
          <div class="c"><div class="n b">1. Lit</div><p>ArXiv sweep → SOTA table.</p></div>
          <div class="c"><div class="n g">2. Proto</div><p>Reproduce repo, patch bugs.</p></div>
          <div class="c"><div class="n p">3. Train</div><p>Subagent swarm fine-tunes.</p></div>
          <div class="c"><div class="n o">4. Ship</div><p>Artifact + bot alert + doc.</p></div>
        </div>
        <p style="margin-top:0.8em; font-size:0.82em;">Memory retains lessons; next cycle starts faster.</p>
      </section>

      
      <section>
        <h2>Case Study: 100-Camera Edge CV Fleet</h2>
        <div class="m-2">
          <div class="c c-left">
            <h3 style="color:#22D3EE;">Challenge</h3>
            <p>Real-time detection across 100 USB cameras on edge NPUs; central eval nightly.</p>
            <p><strong>Hermes role</strong>: spawn 10 subagents (10 cams each), profile NPU memory, push daily mAP to Telegram group.</p>
          </div>
          <div class="c c-left">
            <h3 style="color:#30D158;">Outcome</h3>
            <p>✓ 3× faster camera onboarding.</p>
            <p>✓ OOM eliminated via profiling skill.</p>
            <p>✓ Zero manual eval reports.</p>
            <p>✓ Full artifact lineage per site.</p>
          </div>
        </div>
      </section>

      
      <section>
        <h1>Key Takeaways</h1>
        <div style="text-align:left; max-width:820px; margin:0.8em auto; font-size:0.88em; line-height:1.7;">
          <p>✔ <strong>Setup once</strong>: config + CV skills become permanent lab memory.</p>
          <p>✔ <strong>Orchestrate at scale</strong>: multi-agent swarms per model/camera group.</p>
          <p>✔ <strong>Operate autonomously</strong>: cron jobs + group bots run the ops loop.</p>
          <p>✔ <strong>Profile & ship</strong>: bottleneck calls + traced artifact lineage.</p>
        </div>
        <p style="margin-top:1em; color:#22D3EE; font-size:1.05em; font-weight:bold;">pirahansiah.com/notes/docs/cv/</p>
      </section>

      
      <section>
        <h2>Validated Skills Library <span class="tag">installed &amp; scanned</span></h2>
        <p style="font-size:0.6em; color:#94a3b8;">All installed via <code>hermes skills install</code>, security-scanned, and verified (valid SKILL.md, enabled).</p>
        <div class="m-3">
          <div class="c"><h3 style="color:#38bdf8;">Web &amp; Research</h3><p style="font-size:0.6em;">agent-reach · youtube-full · defuddle · resemble-detect</p></div>
          <div class="c"><h3 style="color:#a855f7;">Build &amp; Engineering</h3><p style="font-size:0.6em;">using-agent-skills · setup-matt-pocock-skills · make-interfaces-feel-better · humanizer</p></div>
          <div class="c"><h3 style="color:#22d3ee;">Agents &amp; Ops</h3><p style="font-size:0.6em;">browser-harness · i-have-adhd · loopy · loop-library · skillclaw</p></div>
        </div>
        <div class="code-box" style="font-size:0.56em; margin-top:10px;">
<span class="cmt"># list active skills</span>
hermes skills list
<span class="cmt"># 14 validated community/url skills now active</span>
        </div>
      </section>

      
      <section>
        <h2>Command Cheat Sheet <span class="tag">DESK · CLI · MSG · SHELL</span></h2>
        <p style="font-size:0.5em; color:#94a3b8;">Everyday commands — Desktop, CLI chat, messaging, shell. (Verified vs current Hermes source, Sep 2026.)</p>
        <div class="m-3">
          <div class="c"><h3 style="color:#38bdf8;">Sessions &amp; Context</h3><p style="font-size:0.55em;">/new · /resume · /sessions · /title · /branch · /compress · /context · /status</p></div>
          <div class="c"><h3 style="color:#38bdf8;">Control Work</h3><p style="font-size:0.55em;">/queue · /steer · /bg · /btw · /agents · /stop</p></div>
          <div class="c"><h3 style="color:#38bdf8;">Goals, Loops &amp; Plans</h3><p style="font-size:0.55em;">/goal · /subgoal · /heartbeat · /loop · /plan · /review · /refine</p></div>
          <div class="c"><h3 style="color:#a855f7;">Models &amp; Behavior</h3><p style="font-size:0.55em;">/model · /moa · /personality · /reasoning · /fast · /approvals · /yolo · /busy · /voice</p></div>
          <div class="c"><h3 style="color:#a855f7;">Skills, Memory &amp; Tools</h3><p style="font-size:0.55em;">/skills · /learn · /memory · /init · /tools · /browser</p></div>
          <div class="c"><h3 style="color:#a855f7;">Automation &amp; Coord</h3><p style="font-size:0.55em;">/cron · /suggestions · /blueprint · /kanban</p></div>
          <div class="c"><h3 style="color:#22d3ee;">Inspect, Recover &amp; Fix</h3><p style="font-size:0.55em;">/retry · /undo · /save · /diff · /rollback · /usage · /debug · /help</p></div>
          <div class="c"><h3 style="color:#f472b6;">Messaging / Gateway</h3><p style="font-size:0.55em;">/sethome · /topic · /commands · /approve · /deny · /pause · /platform · /restart</p></div>
          <div class="c"><h3 style="color:#22d3ee;">Terminal Essentials</h3><p style="font-size:0.55em;">hermes / hermes chat · -z "prompt" · model · status · doctor · gateway status · --safe-mode · update</p></div>
        </div>
        <div class="code-box" style="font-size:0.52em; margin-top:8px;">
<span class="cmt"># repeat-work modes</span>
/goal  = work until objective met   /loop  = repeat w/ stop conditions
/heartbeat = one recurring check    /cron  = durable schedule outside chat
<span class="cmt"># type / + letters for autocomplete; /help for full list</span>
        </div>
      </section>

      
      <section>
        <h1>Thank You & Discussion</h1>
        <h2 style="color:#cbd5e1;">Hermes Agent for Big Computer Vision Projects</h2>
        <p style="margin-top:1.5em;">
          <a href="https://www.pirahansiah.com/notes/docs/cv/" style="color:#38bdf8; text-decoration:underline;">CV Documentation</a> •
          <a href="https://github.com/pirahansiah" style="color:#38bdf8; text-decoration:underline;">GitHub</a>
        </p>
        <div style="margin-top:2em;">
          <button id="restart-btn" style="background:rgba(34,211,238,0.2); color:#22D3EE; border:1px solid #22D3EE; padding:12px 24px; border-radius:10px; cursor:pointer; font-size:0.9em; font-weight:bold;">🔄 Restart Presentation</button>
        </div>
      </section>

    </div>
  </div>
</div>

