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

  <div class="graph-filters">
    <button class="graph-filter-btn active" data-category="all">All</button>
    <button class="graph-filter-btn active" data-category="hub"><span class="dot" style="background:#0a84ff"></span>Hub</button>
    <button class="graph-filter-btn active" data-category="cv"><span class="dot" style="background:#30d158"></span>CV</button>
    <button class="graph-filter-btn active" data-category="ai"><span class="dot" style="background:#bf5af2"></span>AI</button>
    <button class="graph-filter-btn active" data-category="cuda"><span class="dot" style="background:#ff9f0a"></span>CUDA</button>
    <button class="graph-filter-btn active" data-category="paper"><span class="dot" style="background:#5ac8fa"></span>Papers</button>
    <button class="graph-filter-btn active" data-category="journal"><span class="dot" style="background:#64d2ff"></span>Journals</button>
    <button class="graph-filter-btn active" data-category="book"><span class="dot" style="background:#ffd60a"></span>Books</button>
    <button class="graph-filter-btn active" data-category="patent"><span class="dot" style="background:#ff375f"></span>Patents</button>
    <button class="graph-filter-btn active" data-category="keynote"><span class="dot" style="background:#ff6482"></span>Keynotes</button>
    <button class="graph-filter-btn active" data-category="course"><span class="dot" style="background:#30d158"></span>Courses</button>
    <button class="graph-filter-btn active" data-category="pkm"><span class="dot" style="background:#ac8e68"></span>PKM</button>
    <button class="graph-filter-btn active" data-category="business"><span class="dot" style="background:#8e8e93"></span>Business</button>
  </div>

  <div class="graph-search-wrap">
    <div class="graph-search-box">
      <input type="text" id="graph-search-input" placeholder="Search to highlight nodes..." oninput="graphSearch(this.value)">
      <span class="graph-search-icon">&#128269;</span>
    </div>
    <span id="graph-search-results" class="graph-search-count"></span>
  </div>

  <p class="graph-hint">Scroll to zoom · Drag to pan · Tap node to select · Double-tap to open</p>
  <div id="graph-wrap" class="liquid-glass">
    <canvas id="graph-canvas" aria-label="Interactive knowledge graph"></canvas>
  </div>
  <div class="graph-bottom-bar">
    <div class="graph-legend">
      <span class="legend-hub">Hub</span>
      <span class="legend-cv">CV</span>
      <span class="legend-ai">AI</span>
      <span class="legend-cuda">CUDA</span>
      <span class="legend-paper">Papers</span>
      <span class="legend-journal">Journals</span>
      <span class="legend-book">Books</span>
      <span class="legend-patent">Patents</span>
      <span class="legend-course">Courses</span>
    </div>
  </div>
</div>

<style>
  .graph-search-wrap { max-width: 500px; margin: 8px auto; }
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
  .graph-search-count {
    display: block;
    font-size: 0.75rem;
    color: #0a84ff;
    margin-top: 4px;
    text-align: center;
    min-height: 1em;
  }
</style>

<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>
<script>
var CONTENT_INDEX = [
  {"id":"product","title":"Product","url":"/contents/public/product/","category":"hub","body":"Embedded CV and Edge AI products."},
  {"id":"research","title":"Research","url":"/contents/public/research/","category":"hub","body":"Publications, patents, papers."},
  {"id":"solutions","title":"Solutions","url":"/contents/public/solutions/","category":"hub","body":"AI and CV business solutions."},
  {"id":"content-hub","title":"Content Hub","url":"/contents/public/","category":"hub","body":"CV, AI, edge deployment articles."},
  {"id":"wiki","title":"Wiki","url":"/contents/wiki/","category":"hub","body":"Wikipedia-style page index."},
  {"id":"portfolio","title":"Complete Portfolio","url":"/contents/pkm/use-cases/","category":"hub","body":"Publications, patents, books, CV."},

  {"id":"3d-vision","title":"3D Vision","url":"/contents/public/cv/3d/","category":"cv","body":"Stereo vision, depth sensing, point clouds."},
  {"id":"optical-flow","title":"Optical Flow","url":"/contents/public/cv/optical-flow/","category":"cv","body":"Motion estimation, Lucas-Kanade."},
  {"id":"multi-camera","title":"Multi-Camera","url":"/contents/public/cv/multi-camera-systems/","category":"cv","body":"Real-time multi-camera AI."},
  {"id":"cv-coaching","title":"CV Coaching","url":"/contents/public/coaching/","category":"cv","body":"CV teaching and coaching."},
  {"id":"cv-overview","title":"CV Overview","url":"/contents/public/enter/","category":"cv","body":"Computer Vision Research Engineer."},

  {"id":"llm-concepts","title":"LLM Concepts","url":"/contents/public/ai-llm/advanced-llm-concepts/","category":"ai","body":"RAG, embeddings, multimodal, agents."},
  {"id":"ai-agents","title":"AI Agents","url":"/contents/public/ai-llm/orchestrating-agents/","category":"ai","body":"Multi-agent systems, orchestration."},
  {"id":"ai-blog","title":"AI Blog","url":"/contents/public/ai-llm/blog/","category":"ai","body":"AI, LLMs, computer vision blog."},
  {"id":"avatar-gen","title":"Avatar Generator","url":"/contents/public/ai-llm/avatar-generator/","category":"ai","body":"Local video avatar with Ollama."},

  {"id":"numba-jit","title":"Numba JIT","url":"/contents/public/cuda-gpu/numba-jit/","category":"cuda","body":"Python acceleration with Numba."},
  {"id":"pycuda","title":"PyCUDA","url":"/contents/public/cuda-gpu/pycuda-kernels/","category":"cuda","body":"PyCUDA C kernels on GPU."},
  {"id":"cuda-vscode","title":"CUDA VS Code","url":"/contents/public/cuda-gpu/vscode-cuda-windows/","category":"cuda","body":"CUDA dev environment setup."},
  {"id":"mlx-coreml","title":"MLX CoreML Metal","url":"/contents/public/cuda-gpu/mlx-coreml-metal/","category":"cuda","body":"Apple Silicon ML frameworks."},

  {"id":"paper-seg","title":"Adaptive Segmentation PSNR","url":"/contents/publications/Papers/adaptive-image-segmentation-psnr/","category":"paper","body":"License plate segmentation."},
  {"id":"paper-entropy","title":"License Plate Entropy","url":"/contents/publications/Papers/license-plate-recognition-entropy/","category":"paper","body":"Entropy-based license plate."},
  {"id":"paper-multi","title":"Multi-threshold License Plate","url":"/contents/publications/Papers/multi-threshold-license-plate/","category":"paper","body":"Multi-threshold license plate."},
  {"id":"paper-handwritten","title":"Thresholding Handwritten","url":"/contents/publications/Papers/comparison-thresholding-handwritten/","category":"paper","body":"Handwritten image segmentation."},
  {"id":"paper-calibration","title":"Camera Calibration Multi-Modal","url":"/contents/publications/Papers/camera-calibration-multi-modal/","category":"paper","body":"Multi-modal robot vision calibration."},
  {"id":"paper-pattern","title":"Pattern Image Calibration","url":"/contents/publications/Papers/pattern-image-calibration/","category":"paper","body":"Pattern image camera calibration."},
  {"id":"paper-2d3d","title":"2D vs 3D Map","url":"/contents/publications/Papers/2d-3d-map-movement/","category":"paper","body":"2D vs 3D mapping movement objects."},
  {"id":"paper-char","title":"Character Recognition","url":"/contents/publications/Papers/character-recognition-global-feature/","category":"paper","body":"Global feature character recognition."},
  {"id":"paper-class","title":"Classification Geometrical","url":"/contents/publications/Papers/classification-geometrical-topological/","category":"paper","body":"Geometrical topological features."},
  {"id":"paper-tafresh","title":"TafreshGrid","url":"/contents/publications/Papers/tafreshgrid-grid-computing/","category":"paper","body":"Grid computing at Tafresh University."},

  {"id":"journal-psnr","title":"Adaptive Thresholding PSNR","url":"/contents/publications/Journals/adaptive-thresholding-psnr/","category":"journal","body":"PSNR adaptive thresholding."},
  {"id":"journal-gsft","title":"GSFT-PSNR","url":"/contents/publications/Journals/gsft-psnr-fuzzy-threshold/","category":"journal","body":"Fuzzy threshold with PSNR."},
  {"id":"journal-seg","title":"PSNR Segmentation","url":"/contents/publications/Journals/psnr-threshold-segmentation/","category":"journal","body":"PSNR threshold segmentation."},
  {"id":"journal-char","title":"Character Recognition","url":"/contents/publications/Journals/character-object-recognition/","category":"journal","body":"Global feature extraction."},
  {"id":"journal-slam","title":"3D SLAM","url":"/contents/publications/Journals/3d-slam-humanoid-robots/","category":"journal","body":"SLAM localization and mapping."},
  {"id":"journal-ant","title":"Ant Colony","url":"/contents/publications/Journals/ant-colony-optimization/","category":"journal","body":"Ant colony image segmentation."},

  {"id":"book-optflow","title":"Optical Flow Book","url":"/contents/publications/Books/computational-intelligence-optical-flow/","category":"book","body":"Video stabilization optical flow."},
  {"id":"book-camcal","title":"Camera Calibration Book","url":"/contents/publications/Books/camera-calibration-video-stabilization/","category":"book","body":"Robot localization calibration."},
  {"id":"book-cvllm","title":"CV Meets LLM","url":"/contents/publications/Books/AI/computer-vision-meets-llm/","category":"book","body":"Multi-agent RAG for images and video."},
  {"id":"book-opencv0","title":"OpenCV 5 Ch.0","url":"/contents/publications/Books/AI/opencv5-chapter0-introduction/","category":"book","body":"Building production-ready AI agents."},
  {"id":"book-opencv1","title":"OpenCV 5 Ch.1","url":"/contents/publications/Books/AI/opencv5-chapter1-image-basics/","category":"book","body":"AI and ML glossary."},
  {"id":"book-opencv2","title":"OpenCV 5 Ch.2","url":"/contents/publications/Books/AI/opencv5-chapter2-feature-detection/","category":"book","body":"SIFT, SURF, ORB, AKAZE features."},
  {"id":"book-opencv3","title":"OpenCV 5 Ch.3","url":"/contents/publications/Books/AI/opencv5-chapter3-advanced/","category":"book","body":"Deep learning, CUDA, G-API."},

  {"id":"patent-face","title":"Face Augmentation","url":"/contents/publications/Patents/face-image-augmentation/","category":"patent","body":"GAN face image augmentation patent."},
  {"id":"patent-facial","title":"Facial Analysis Ad","url":"/contents/publications/Patents/facial-analysis-advertisement/","category":"patent","body":"Facial analysis advertising patent."},
  {"id":"patent-vehicle","title":"Vehicle Detection","url":"/contents/publications/Patents/vehicle-detection/","category":"patent","body":"Moving vehicle detection patent."},

  {"id":"keynote-llm","title":"LLMs Meet CV","url":"/contents/publications/Keynotes/llms-meet-computer-vision/","category":"keynote","body":"LLM and CV convergence, multimodal AI."},

  {"id":"course-ml","title":"ML Specialization","url":"/contents/ai2026/machine-learning-specialization/","category":"course","body":"Regression, classification, neural networks."},
  {"id":"course-fsdl","title":"Full Stack DL","url":"/contents/ai2026/full-stack-deep-learning/","category":"course","body":"End-to-end deep learning deployment."},
  {"id":"course-mlops","title":"MLOps","url":"/contents/ai2026/mlops/","category":"course","body":"ML pipelines, deployment, monitoring."},
  {"id":"course-ros","title":"ROS","url":"/contents/ai2026/ros/","category":"course","body":"Robot Operating System, navigation."},
  {"id":"course-parallel","title":"Parallel Programming","url":"/contents/ai2026/parallel-programming/","category":"course","body":"Multi-threading, CUDA, distributed computing."},
  {"id":"course-cpp","title":"Modern C++","url":"/contents/ai2026/modern-cpp/","category":"course","body":"C++23 image processing, STL, templates."},
  {"id":"course-k8s","title":"Cloud-Native","url":"/contents/ai2026/cloud-native/","category":"course","body":"Docker, Kubernetes, cloud infrastructure."},
  {"id":"course-tf","title":"TensorFlow Deploy","url":"/contents/ai2026/tensorflow-deployment/","category":"course","body":"TF.js, TF Lite, data pipelines."},
  {"id":"course-riscv","title":"RISC-V","url":"/contents/ai2026/risc-v/","category":"course","body":"RISC-V for AI and edge computing."},
  {"id":"course-edgeai","title":"Edge AI Summit","url":"/contents/ai2026/edge-ai-summit/","category":"course","body":"Predictive maintenance, TinyML."},
  {"id":"course-iot","title":"Embedded IoT","url":"/contents/ai2026/embedded-iot/","category":"course","body":"Embedded IoT, edge computing."},
  {"id":"course-tesla","title":"Tesla AI","url":"/contents/ai2026/tesla/","category":"course","body":"Autonomous driving, AI systems."},
  {"id":"course-hardware","title":"AI Hardware","url":"/contents/ai2026/ai-hardware/","category":"course","body":"AI accelerators, NPUs, edge chips."},
  {"id":"course-openvino","title":"OpenVINO","url":"/contents/ai2026/openvino/","category":"course","body":"Intel deep learning inference optimization."},
  {"id":"course-metaverse","title":"Metaverse XR","url":"/contents/ai2026/metaverse/","category":"course","body":"Extended reality, spatial computing."},
  {"id":"course-books","title":"Book Summaries","url":"/contents/ai2026/book-summary/","category":"course","body":"AI and computer vision book summaries."},
  {"id":"course-scholarship","title":"IoT Scholarship","url":"/contents/ai2026/iot-scholarship/","category":"course","body":"OpenVINO, face recognition, object detection."},

  {"id":"pkm-toc","title":"Data DevOps","url":"/contents/pkm/TOC/","category":"pkm","body":"PARA, Zettelkasten, PKM, Knowledge Graph."},
  {"id":"pkm-links","title":"Curated Links","url":"/contents/pkm/links/","category":"pkm","body":"AI agents, CV, dev tools links."},
  {"id":"pkm-proof","title":"Site Link Index","url":"/contents/pkm/proof/","category":"pkm","body":"Complete link index."},

  {"id":"startup","title":"Startup Guide","url":"/contents/public/startup/","category":"business","body":"Edge AI business in Germany."},
  {"id":"seo","title":"SEO for LLMs","url":"/contents/public/seo/","category":"business","body":"Optimizing for LLM search engines."},
  {"id":"linkedin","title":"LinkedIn Posts","url":"/contents/public/linkedin-top-posts/","category":"business","body":"Camera calibration, Python, OpenCV posts."},
  {"id":"cpp-ref","title":"C++ Reference","url":"/contents/public/cpp/","category":"business","body":"Hash maps, stacks, queues, vectors."},
  {"id":"python","title":"Python Config","url":"/contents/public/python/","category":"business","body":"Config management, argparse, YAML."},
  {"id":"optimization","title":"Optimization","url":"/contents/public/optimization/","category":"business","body":"Quantization, pruning, distillation."},
  {"id":"prompts","title":"Prompts","url":"/contents/public/prompts/","category":"business","body":"Prompt engineering templates."},
  {"id":"setup","title":"Developer Tools","url":"/contents/public/setup/","category":"business","body":"Shell, vim, dev tools."},
  {"id":"shell","title":"Shell Vim Reference","url":"/contents/public/shell-vim-quickref/","category":"business","body":"Shell, Vim, CLI tools."},
  {"id":"token-ppt","title":"Token Presentation","url":"/contents/ppt/farshid-ai-cv-llm-presentation/","category":"business","body":"Token reduction strategies, benchmarks."},
  {"id":"10years","title":"10 Years Bugs","url":"/contents/publications/10Years/","category":"business","body":"Lessons from fixing CV bugs."},
  {"id":"cv","title":"CV","url":"/contents/publications/CV/","category":"business","body":"Curriculum Vitae."}
];

var gFuse = new Fuse(CONTENT_INDEX, {
  keys: [{ name: 'title', weight: 2 }, { name: 'body', weight: 1 }],
  threshold: 0.4, distance: 200, includeMatches: true, minMatchCharLength: 2
});

function graphSearch(q) {
  var resultsEl = document.getElementById('graph-search-results');
  if (!q || q.length < 2) { resultsEl.textContent = ''; window.graphClearHighlight(); return; }
  var results = gFuse.search(q);
  if (results.length === 0) { resultsEl.textContent = 'No matches'; window.graphClearHighlight(); return; }
  var nodeIds = [];
  results.forEach(function(r) { nodeIds.push(r.item.id); });
  resultsEl.textContent = results.length + ' node' + (results.length !== 1 ? 's' : '') + ' highlighted';
  window.graphHighlightNodes(nodeIds);
}
</script>

<script src="{{ '/assets/js/graph-view.js' | relative_url }}" defer></script>
