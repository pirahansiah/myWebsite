---
layout: farshid_default
title: Knowledge Graph
permalink: /graph/
extra_css: graph.css
---

<div class="graph-page">
  <div class="graph-header">
    <h1>Knowledge Graph</h1>
    <a id="graph-open-btn" class="liquid-glass-item graph-open-btn" href="#" style="display:none"></a>
    <span class="graph-stats" id="graph-stats">Loading…</span>
    <div class="graph-controls">
      <button type="button" id="graph-freeze" class="liquid-glass-item">Freeze</button>
      <button type="button" id="graph-reset" class="liquid-glass-item">Reset</button>
      <a href="{{ '/graph-tags/' | relative_url }}" class="liquid-glass-item">Hashtags</a>
      <a href="{{ '/search/' | relative_url }}" class="liquid-glass-item">&#128269; Search</a>
      <a href="{{ '/' | relative_url }}" class="liquid-glass-item">Home</a>
    </div>
  </div>

  <div class="graph-search-wrap">
    <div class="graph-search-box">
      <input type="text" id="graph-search-input" placeholder="Search content..." oninput="graphSearch(this.value)">
      <span class="graph-search-icon">&#128269;</span>
    </div>
    <ul id="graph-search-results" class="graph-search-results"></ul>
  </div>

  <p class="graph-hint">Concept Maps · Tap a node to select · tap again to deselect</p>
  <div id="graph-wrap" class="liquid-glass">
    <canvas id="graph-canvas" aria-label="Interactive knowledge graph"></canvas>
  </div>
  <div class="graph-bottom-bar">
    <div class="graph-legend">
      <span class="legend-moc">Section</span>
      <span class="legend-note">Note</span>
      <span class="legend-tag">Hashtag</span>
    </div>
  </div>
</div>

<style>
  .graph-search-wrap { max-width: 500px; margin: 12px auto; }
  .graph-search-box { position: relative; }
  .graph-search-box input {
    width: 100%; padding: 10px 36px 10px 14px; font-size: 14px;
    border: 1px solid var(--glass-border); border-radius: 10px;
    background: var(--glass-bg); color: var(--text); outline: none;
    box-sizing: border-box;
  }
  .graph-search-box input:focus { border-color: #0a84ff; }
  .graph-search-box input::placeholder { color: var(--text-muted); }
  .graph-search-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem; pointer-events: none; }
  .graph-search-results {
    list-style: none; padding: 0; margin: 8px 0 0; max-height: 250px;
    overflow-y: auto; background: var(--glass-bg); border: 1px solid var(--glass-border);
    border-radius: 8px; display: none;
  }
  .graph-search-results.show { display: block; }
  .graph-search-results li { padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .graph-search-results li:last-child { border-bottom: none; }
  .graph-search-results a { text-decoration: none; color: var(--text); font-size: 0.85rem; display: block; }
  .graph-search-results a:hover { color: #0a84ff; }
  .graph-search-results .gsr-title { font-weight: 600; }
  .graph-search-results .gsr-url { font-size: 0.7rem; color: #0a84ff; }
</style>

<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>
<script>
var CONTENT_INDEX = [
  {"title":"AI Hardware Accelerators","url":"/contents/ai2026/ai-hardware","body":"AI accelerators, NPUs, edge computing chips."},
  {"title":"Book Summaries","url":"/contents/ai2026/book-summary","body":"AI and computer vision book summaries."},
  {"title":"Cloud-Native Kubernetes","url":"/contents/ai2026/cloud-native","body":"Docker, Kubernetes, cloud infrastructure."},
  {"title":"Edge AI Summit","url":"/contents/ai2026/edge-ai-summit","body":"Predictive maintenance, TinyML, neuromorphic."},
  {"title":"Embedded IoT","url":"/contents/ai2026/embedded-iot","body":"Embedded IoT, edge computing."},
  {"title":"Full Stack DL 2022","url":"/contents/ai2026/fsdl-2022","body":"Data, modeling, deployment, monitoring."},
  {"title":"Full Stack DL","url":"/contents/ai2026/full-stack-deep-learning","body":"End-to-end deep learning deployment."},
  {"title":"IoT Scholarship","url":"/contents/ai2026/iot-scholarship","body":"OpenVINO, face recognition, object detection."},
  {"title":"ML Specialization","url":"/contents/ai2026/machine-learning-specialization","body":"Regression, classification, neural networks."},
  {"title":"Metaverse XR","url":"/contents/ai2026/metaverse","body":"Extended reality, spatial computing."},
  {"title":"MLOps","url":"/contents/ai2026/mlops","body":"ML pipelines, deployment, monitoring."},
  {"title":"Modern C++","url":"/contents/ai2026/modern-cpp","body":"C++23 image processing, STL, templates."},
  {"title":"OpenVINO","url":"/contents/ai2026/openvino","body":"Intel deep learning inference optimization."},
  {"title":"Parallel Programming","url":"/contents/ai2026/parallel-programming","body":"Multi-threading, CUDA, distributed computing."},
  {"title":"RISC-V AI","url":"/contents/ai2026/risc-v","body":"RISC-V for AI and edge computing."},
  {"title":"ROS","url":"/contents/ai2026/ros","body":"Robot Operating System, navigation."},
  {"title":"TensorFlow Deploy","url":"/contents/ai2026/tensorflow-deployment","body":"TF.js, TF Lite, data pipelines."},
  {"title":"Tesla AI","url":"/contents/ai2026/tesla","body":"Autonomous driving, AI systems."},
  {"title":"Topics","url":"/contents/ai2026/topics","body":"All AI topics and projects."},
  {"title":"Data DevOps","url":"/contents/pkm/TOC","body":"PARA, Zettelkasten, PKM, Knowledge Graph."},
  {"title":"Use Cases","url":"/contents/pkm/links","body":"AI agents, CV, dev tools links."},
  {"title":"All Links","url":"/contents/pkm/proof","body":"Complete link index."},
  {"title":"Portfolio","url":"/contents/pkm/use-cases","body":"Publications, patents, books, CV."},
  {"title":"Token Presentation","url":"/contents/ppt/farshid-ai-cv-llm-presentation","body":"Token reduction strategies, benchmarks."},
  {"title":"Content Hub","url":"/contents/public/","body":"CV, AI, edge deployment articles."},
  {"title":"C++ Reference","url":"/contents/public/CPP","body":"Hash maps, stacks, queues, vectors."},
  {"title":"Optimization","url":"/contents/public/Optimization","body":"Quantization, pruning, distillation."},
  {"title":"Prompts","url":"/contents/public/Prompts","body":"Prompt engineering templates."},
  {"title":"Python","url":"/contents/public/Python","body":"Config management, argparse, YAML."},
  {"title":"Resources","url":"/contents/public/Resources","body":"Portfolio, publications, patents."},
  {"title":"SEO LLMs","url":"/contents/public/SEO","body":"Optimizing for LLM search engines."},
  {"title":"Startup","url":"/contents/public/StartUp","body":"Edge AI business in Germany."},
  {"title":"LLM Concepts","url":"/contents/public/ai-llm/advanced-llm-concepts","body":"RAG, embeddings, multimodal, agents."},
  {"title":"Avatar Generator","url":"/contents/public/ai-llm/avatar-generator","body":"Local video avatar with Ollama."},
  {"title":"AI Blog","url":"/contents/public/ai-llm/blog","body":"AI, LLMs, computer vision blog."},
  {"title":"AI Agents","url":"/contents/public/ai-llm/orchestrating-agents","body":"Multi-agent systems, orchestration."},
  {"title":"CV Coaching","url":"/contents/public/coaching","body":"CV teaching and coaching."},
  {"title":"MLX CoreML Metal","url":"/contents/public/cuda-gpu/mlx-coreml-metal","body":"Apple Silicon ML frameworks."},
  {"title":"Numba JIT","url":"/contents/public/cuda-gpu/numba-jit","body":"Python acceleration with Numba."},
  {"title":"PyCUDA","url":"/contents/public/cuda-gpu/pycuda-kernels","body":"PyCUDA C kernels on GPU."},
  {"title":"CUDA VS Code","url":"/contents/public/cuda-gpu/vscode-cuda-windows","body":"CUDA dev environment setup."},
  {"title":"3D Vision","url":"/contents/public/cv/3d","body":"Stereo vision, depth sensing, point clouds."},
  {"title":"Multi-Camera","url":"/contents/public/cv/multi-camera-systems","body":"Real-time multi-camera AI."},
  {"title":"Optical Flow","url":"/contents/public/cv/optical-flow","body":"Motion estimation, Lucas-Kanade."},
  {"title":"CV Overview","url":"/contents/public/enter","body":"Computer Vision Research Engineer."},
  {"title":"LinkedIn 2024","url":"/contents/public/linkedin-top-posts","body":"Camera calibration, Python, OpenCV posts."},
  {"title":"Curated Links","url":"/contents/public/links","body":"CV, AI, software engineering tools."},
  {"title":"Product","url":"/contents/public/product","body":"Embedded CV and Edge AI products."},
  {"title":"Research","url":"/contents/public/research","body":"Publications, patents, papers."},
  {"title":"Solutions","url":"/contents/public/solutions","body":"AI and CV business solutions."},
  {"title":"Solutions Map","url":"/contents/public/projects/Solutions/","body":"Impact portfolio overview."},
  {"title":"10 Years Bugs","url":"/contents/publications/10Years","body":"Lessons from fixing CV bugs."},
  {"title":"Books","url":"/contents/publications/Books/","body":"Camera calibration, optical flow, OpenCV 5."},
  {"title":"CV Meets LLM","url":"/contents/publications/Books/AI/computer-vision-meets-llm","body":"Multi-agent RAG for images and video."},
  {"title":"OpenCV 5 Ch.0","url":"/contents/publications/Books/AI/opencv5-chapter0-introduction","body":"Building production-ready AI agents."},
  {"title":"OpenCV 5 Ch.1","url":"/contents/publications/Books/AI/opencv5-chapter1-image-basics","body":"AI and ML glossary."},
  {"title":"OpenCV 5 Ch.2","url":"/contents/publications/Books/AI/opencv5-chapter2-feature-detection","body":"SIFT, SURF, ORB, AKAZE features."},
  {"title":"OpenCV 5 Ch.3","url":"/contents/publications/Books/AI/opencv5-chapter3-advanced","body":"Deep learning, CUDA, G-API."},
  {"title":"Camera Cal Book","url":"/contents/publications/Books/camera-calibration-video-stabilization","body":"Robot localization calibration."},
  {"title":"Optical Flow Book","url":"/contents/publications/Books/computational-intelligence-optical-flow","body":"Video stabilization optical flow."},
  {"title":"CV","url":"/contents/publications/CV","body":"Curriculum Vitae."},
  {"title":"Journals","url":"/contents/publications/Journals/","body":"Image processing, thresholding articles."},
  {"title":"3D SLAM","url":"/contents/publications/Journals/3d-slam-humanoid-robots","body":"SLAM localization and mapping."},
  {"title":"Adaptive PSNR","url":"/contents/publications/Journals/adaptive-thresholding-psnr","body":"PSNR adaptive thresholding."},
  {"title":"Ant Colony","url":"/contents/publications/Journals/ant-colony-optimization","body":"Ant colony image segmentation."},
  {"title":"Character Recognition","url":"/contents/publications/Journals/character-object-recognition","body":"Global feature extraction."},
  {"title":"GSFT-PSNR","url":"/contents/publications/Journals/gsft-psnr-fuzzy-threshold","body":"Fuzzy threshold with PSNR."},
  {"title":"PSNR Segmentation","url":"/contents/publications/Journals/psnr-threshold-segmentation","body":"PSNR threshold segmentation."},
  {"title":"Keynotes","url":"/contents/publications/Keynotes/","body":"LLMs meeting computer vision."},
  {"title":"LLMs CV Keynote","url":"/contents/publications/Keynotes/llms-meet-computer-vision","body":"LLM and CV convergence, multimodal AI."},
  {"title":"Papers","url":"/contents/publications/Papers/","body":"Conference papers on image processing."},
  {"title":"2D 3D Map","url":"/contents/publications/Papers/2d-3d-map-movement","body":"2D vs 3D mapping movement objects."},
  {"title":"Seg PSNR","url":"/contents/publications/Papers/adaptive-image-segmentation-psnr","body":"License plate segmentation."},
  {"title":"Camera Multi-Modal","url":"/contents/publications/Papers/camera-calibration-multi-modal","body":"Multi-modal robot vision calibration."},
  {"title":"Char Recognition","url":"/contents/publications/Papers/character-recognition-global-feature","body":"Global feature character recognition."},
  {"title":"Classification","url":"/contents/publications/Papers/classification-geometrical-topological","body":"Geometrical topological features."},
  {"title":"Thresholding HW","url":"/contents/publications/Papers/comparison-thresholding-handwritten","body":"Handwritten image segmentation."},
  {"title":"License Entropy","url":"/contents/publications/Papers/license-plate-recognition-entropy","body":"Entropy-based license plate."},
  {"title":"Multi License","url":"/contents/publications/Papers/multi-threshold-license-plate","body":"Multi-threshold license plate."},
  {"title":"Pattern Cal","url":"/contents/publications/Papers/pattern-image-calibration","body":"Pattern image camera calibration."},
  {"title":"TafreshGrid","url":"/contents/publications/Papers/tafreshgrid-grid-computing","body":"Grid computing at Tafresh University."},
  {"title":"Patents","url":"/contents/publications/Patents/","body":"Face augmentation, vehicle detection."},
  {"title":"Face Augment","url":"/contents/publications/Patents/face-image-augmentation","body":"GAN face image augmentation patent."},
  {"title":"Facial Ad Patent","url":"/contents/publications/Patents/facial-analysis-advertisement","body":"Facial analysis advertising patent."},
  {"title":"Vehicle Patent","url":"/contents/publications/Patents/vehicle-detection","body":"Moving vehicle detection patent."},
  {"title":"Sitemap","url":"/contents/sitemap","body":"All pages sitemap."},
  {"title":"Wiki","url":"/contents/wiki","body":"Wikipedia-style page index."}
];

var gFuse = new Fuse(CONTENT_INDEX, {
  keys: [{ name: 'title', weight: 2 }, { name: 'body', weight: 1 }],
  threshold: 0.4, distance: 200, includeMatches: true, minMatchCharLength: 2
});

function graphSearch(q) {
  var resultsEl = document.getElementById('graph-search-results');
  if (!q || q.length < 2) { resultsEl.className = 'graph-search-results'; resultsEl.innerHTML = ''; return; }
  var results = gFuse.search(q);
  if (results.length === 0) { resultsEl.className = 'graph-search-results'; resultsEl.innerHTML = '<li style="color:var(--text-muted);padding:8px 12px;">No results</li>'; resultsEl.classList.add('show'); return; }
  var html = '';
  results.slice(0, 8).forEach(function(r) {
    html += '<li><a href="' + r.item.url + '"><div class="gsr-title">' + r.item.title + '</div><div class="gsr-url">' + r.item.url + '</div></a></li>';
  });
  resultsEl.innerHTML = html;
  resultsEl.classList.add('show');
}

document.addEventListener('click', function(e) {
  var r = document.getElementById('graph-search-results');
  if (r && !e.target.closest('.graph-search-wrap')) r.classList.remove('show');
});
</script>

<script src="{{ '/assets/js/graph-view.js' | relative_url }}" defer></script>
