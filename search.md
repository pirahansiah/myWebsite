---
layout: farshid_default
title: Search
---

<style>
  .search-wrap { max-width: 700px; margin: 0 auto; padding: 0 16px; }
  .search-hero { text-align: center; padding: 40px 0 24px; }
  .search-hero h1 { font-size: 1.8rem; color: var(--text); margin-bottom: 4px; }
  .search-hero p { color: var(--text-muted); font-size: 0.9rem; }
  .search-box { position: relative; margin-bottom: 8px; }
  .search-box input {
    width: 100%; padding: 14px 48px 14px 18px; font-size: 16px;
    border: 1px solid var(--glass-border); border-radius: 12px;
    background: var(--glass-bg); color: var(--text); outline: none;
    box-sizing: border-box; transition: border-color 0.2s;
  }
  .search-box input:focus { border-color: #0a84ff; }
  .search-box input::placeholder { color: var(--text-muted); }
  .search-box .search-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.1rem; pointer-events: none; }
  .search-meta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 20px; }
  .search-meta label { font-size: 0.8rem; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; }
  .search-meta input[type="checkbox"] { accent-color: #0a84ff; }
  .search-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
  .search-tag {
    padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; cursor: pointer;
    background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-muted);
    transition: all 0.2s;
  }
  .search-tag:hover, .search-tag.active { background: rgba(10,132,255,0.15); border-color: #0a84ff; color: #0a84ff; }
  .search-results { list-style: none; padding: 0; margin: 0; }
  .search-result {
    padding: 14px 16px; border-radius: 10px; margin-bottom: 8px;
    background: var(--glass-bg); border: 1px solid var(--glass-border);
    transition: transform 0.15s, border-color 0.2s;
  }
  .search-result:hover { transform: translateX(4px); border-color: #0a84ff; }
  .search-result a { text-decoration: none; color: var(--text); }
  .search-result-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; }
  .search-result-url { font-size: 0.75rem; color: #0a84ff; margin-bottom: 4px; word-break: break-all; }
  .search-result-body { font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; }
  .search-result-body mark { background: rgba(10,132,255,0.25); color: var(--text); border-radius: 2px; padding: 0 2px; }
  .search-result-score { font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; }
  .search-count { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px; }
  .search-empty { text-align: center; padding: 40px 0; color: var(--text-muted); }
  .search-google { text-align: center; margin-top: 20px; padding: 16px; background: var(--glass-bg); border-radius: 10px; border: 1px solid var(--glass-border); }
  .search-google a { color: #0a84ff; text-decoration: none; font-size: 0.9rem; }
  .search-google a:hover { text-decoration: underline; }
  .search-google p { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
  @media (max-width: 480px) { .search-hero h1 { font-size: 1.4rem; } }
</style>

<div class="search-wrap">
  <div class="search-hero">
    <h1>Search</h1>
    <p>Fuzzy + content-based search across all pages</p>
  </div>

  <div class="search-box">
    <input type="text" id="q" placeholder="Search pages, papers, code, topics..." autofocus oninput="doSearch()">
    <span class="search-icon">&#128269;</span>
  </div>

  <div class="search-meta">
    <label><input type="checkbox" id="opt-title" checked onchange="doSearch()"> Title</label>
    <label><input type="checkbox" id="opt-body" checked onchange="doSearch()"> Content</label>
    <label><input type="checkbox" id="opt-fuzzy" checked onchange="doSearch()"> Fuzzy</label>
  </div>

  <div class="search-tags">
    <span class="search-tag" onclick="quickSearch('computer vision')">Computer Vision</span>
    <span class="search-tag" onclick="quickSearch('YOLO')">YOLO</span>
    <span class="search-tag" onclick="quickSearch('OpenCV')">OpenCV</span>
    <span class="search-tag" onclick="quickSearch('LLM')">LLM</span>
    <span class="search-tag" onclick="quickSearch('CUDA')">CUDA</span>
    <span class="search-tag" onclick="quickSearch('patent')">Patent</span>
    <span class="search-tag" onclick="quickSearch('quantization')">Quantization</span>
    <span class="search-tag" onclick="quickSearch('edge AI')">Edge AI</span>
  </div>

  <div id="search-count" class="search-count"></div>
  <ul id="search-results" class="search-results"></ul>

  <div id="search-google" class="search-google" style="display:none;">
    <a id="google-link" href="#" target="_blank">Search on Google (site:pirahansiah.com)</a>
    <p>Powered by Google — for results not found locally</p>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>
<script>
var INDEX = [
  {"title":"Home","url":"/","body":"Dr. Farshid Pirahansiah — Embedded Computer Vision & Edge AI. 15+ years experience in Computer Vision, Medical Image Processing, IoT, Edge AI, and model optimization."},
  {"title":"AI Hardware Accelerators","url":"/contents/ai2026/ai-hardware","body":"Workshop on custom AI accelerators, NPUs, and edge computing chips."},
  {"title":"Book Summaries","url":"/contents/ai2026/book-summary","body":"Book summaries and key takeaways from AI and computer vision literature."},
  {"title":"Cloud-Native with Kubernetes","url":"/contents/ai2026/cloud-native","body":"Docker, Kubernetes, cloud infrastructure for AI deployment."},
  {"title":"Edge AI Summit 2020","url":"/contents/ai2026/edge-ai-summit","body":"Edge AI Summit — predictive maintenance, TinyML, neuromorphic computing."},
  {"title":"Embedded IoT","url":"/contents/ai2026/embedded-iot","body":"Embedded IoT systems and edge computing applications."},
  {"title":"Full Stack Deep Learning 2022","url":"/contents/ai2026/fsdl-2022","body":"Full Stack Deep Learning — data, modeling, deployment, monitoring."},
  {"title":"Full Stack Deep Learning","url":"/contents/ai2026/full-stack-deep-learning","body":"End-to-end deep learning deployment, from prototype to production."},
  {"title":"IoT Scholarship","url":"/contents/ai2026/iot-scholarship","body":"Edge AI with Intel OpenVINO, face recognition, object detection."},
  {"title":"ML Specialization","url":"/contents/ai2026/machine-learning-specialization","body":"Coursera Machine Learning Specialization — regression, classification, neural networks."},
  {"title":"Metaverse & XR","url":"/contents/ai2026/metaverse","body":"Extended reality, spatial computing, immersive technologies."},
  {"title":"MLOps","url":"/contents/ai2026/mlops","body":"Machine Learning Engineering for Production — pipelines, deployment, monitoring."},
  {"title":"Modern C++","url":"/contents/ai2026/modern-cpp","body":"Advanced C++23 for image processing — memory management, templates, STL."},
  {"title":"OpenVINO","url":"/contents/ai2026/openvino","body":"Intel OpenVINO toolkit for optimizing and deploying deep learning models."},
  {"title":"Parallel Programming","url":"/contents/ai2026/parallel-programming","body":"Multi-threading, GPU acceleration with CUDA, distributed computing."},
  {"title":"RISC-V for AI","url":"/contents/ai2026/risc-v","body":"RISC-V architecture for AI and edge computing."},
  {"title":"ROS","url":"/contents/ai2026/ros","body":"Robot Operating System — architecture, navigation, simulation."},
  {"title":"TensorFlow Deployment","url":"/contents/ai2026/tensorflow-deployment","body":"TensorFlow.js, TensorFlow Lite, data pipelines, advanced deployment."},
  {"title":"Tesla AI","url":"/contents/ai2026/tesla","body":"Tesla autonomous driving technology and AI systems."},
  {"title":"Topics & Projects","url":"/contents/ai2026/topics","body":"All AI topics and project index."},
  {"title":"Data & DevOps","url":"/contents/pkm/TOC","body":"PARA, Zettelkasten, Second Brain, Knowledge Graph, PKM methods."},
  {"title":"Use Cases","url":"/contents/pkm/links","body":"Link collection — AI agents, audio, computer vision, development tools."},
  {"title":"All Links","url":"/contents/pkm/proof","body":"Complete link index for pirahansiah.com."},
  {"title":"Complete Portfolio","url":"/contents/pkm/use-cases","body":"Publications, patents, books, journals, papers, keynotes, CV."},
  {"title":"Token Reduction Presentation","url":"/contents/ppt/farshid-ai-cv-llm-presentation","body":"Reducing token usage in AI-assisted development — strategies, benchmarks, tools."},
  {"title":"Content Hub","url":"/contents/public/","body":"Technical articles on computer vision, AI, edge deployment, software engineering."},
  {"title":"C++ Reference","url":"/contents/public/CPP","body":"C++ quick reference — hash maps, stacks, queues, vectors, strings, algorithms."},
  {"title":"Optimization","url":"/contents/public/Optimization","body":"CV, DL, and ML system optimization — quantization, pruning, distillation."},
  {"title":"Prompt Engineering","url":"/contents/public/Prompts","body":"Prompt engineering templates for AI assistants and LLMs."},
  {"title":"Python Config","url":"/contents/public/Python","body":"Python configuration management — argparse, YAML, TOML, environment variables."},
  {"title":"Portfolio & Resources","url":"/contents/public/Resources","body":"Impact portfolio, publications, patents, learning materials."},
  {"title":"SEO for LLMs","url":"/contents/public/SEO","body":"Optimizing websites for LLM-powered search engines."},
  {"title":"Startup Guide","url":"/contents/public/StartUp","body":"Edge AI business, fundraising, strategy in Germany."},
  {"title":"Advanced LLM Concepts","url":"/contents/public/ai-llm/advanced-llm-concepts","body":"RAG, embeddings, multimodal, chain-of-thought, agents."},
  {"title":"Avatar Generator","url":"/contents/public/ai-llm/avatar-generator","body":"Local video avatar generator using Ollama and open-source tools."},
  {"title":"AI Blog","url":"/contents/public/ai-llm/blog","body":"Blog posts on AI, LLMs, and computer vision."},
  {"title":"Orchestrating AI Agents","url":"/contents/public/ai-llm/orchestrating-agents","body":"Multi-agent systems, orchestration patterns, tool use."},
  {"title":"CV Coaching","url":"/contents/public/coaching","body":"Computer vision teaching and coaching services."},
  {"title":"MLX, CoreML & Metal","url":"/contents/public/cuda-gpu/mlx-coreml-metal","body":"Apple Silicon ML frameworks — MLX, CoreML, Metal Performance Shaders."},
  {"title":"Numba JIT","url":"/contents/public/cuda-gpu/numba-jit","body":"Accelerate Python with Numba @jit(nopython=True)."},
  {"title":"PyCUDA Kernels","url":"/contents/public/cuda-gpu/pycuda-kernels","body":"How PyCUDA reads and runs C kernels on GPU."},
  {"title":"CUDA in VS Code","url":"/contents/public/cuda-gpu/vscode-cuda-windows","body":"Setting up CUDA development environment in VS Code on Windows."},
  {"title":"3D Vision & Multi-Camera","url":"/contents/public/cv/3d","body":"Stereo vision, depth sensing, 3D point cloud generation, multi-camera sync."},
  {"title":"Multi-Camera Systems","url":"/contents/public/cv/multi-camera-systems","body":"Real-time multi-camera AI — synchronizing cameras, CPU/GPU/NPU processing."},
  {"title":"Optical Flow","url":"/contents/public/cv/optical-flow","body":"Motion estimation — Lucas-Kanade, deep learning optical flow, challenges."},
  {"title":"Computer Vision Overview","url":"/contents/public/enter","body":"Dr. Farshid Pirahansiah — Computer Vision Research Engineer, Berlin."},
  {"title":"LinkedIn Posts 2024","url":"/contents/public/linkedin-top-posts","body":"Top posts on camera calibration, Python, C++, OpenCV, NVIDIA, AI robotics."},
  {"title":"Curated Links","url":"/contents/public/links","body":"Hand-picked tools, tutorials, references for CV, AI, software engineering."},
  {"title":"Product Page","url":"/contents/public/product","body":"Embedded CV & Edge AI products and solutions."},
  {"title":"Solutions Mind Map","url":"/contents/public/projects/Solutions/","body":"Impact portfolio and solutions overview."},
  {"title":"Research","url":"/contents/public/research","body":"Publications, patents, papers, journals, books, keynotes."},
  {"title":"Solutions","url":"/contents/public/solutions","body":"How I help businesses with AI and computer vision."},
  {"title":"10 Years of Bug Fixing","url":"/contents/publications/10Years","body":"Lessons from 10 years of fixing bugs in computer vision systems."},
  {"title":"Books","url":"/contents/publications/Books/","body":"Books and chapters on camera calibration, optical flow, OpenCV 5."},
  {"title":"CV Meets LLM","url":"/contents/publications/Books/AI/computer-vision-meets-llm","body":"Multi-agent swarm with RAG for images and video."},
  {"title":"OpenCV 5 Ch.0","url":"/contents/publications/Books/AI/opencv5-chapter0-introduction","body":"The New Developer Era — building production-ready AI agents."},
  {"title":"OpenCV 5 Ch.1","url":"/contents/publications/Books/AI/opencv5-chapter1-image-basics","body":"AI and Machine Learning glossary, resources, references."},
  {"title":"OpenCV 5 Ch.2","url":"/contents/publications/Books/AI/opencv5-chapter2-feature-detection","body":"Feature detection — SIFT, SURF, ORB, AKAZE, BRIEF."},
  {"title":"OpenCV 5 Ch.3","url":"/contents/publications/Books/AI/opencv5-chapter3-advanced","body":"Advanced OpenCV topics — deep learning, CUDA, G-API."},
  {"title":"Camera Calibration Book","url":"/contents/publications/Books/camera-calibration-video-stabilization","body":"Camera calibration and video stabilization for robot localization."},
  {"title":"Optical Flow Book","url":"/contents/publications/Books/computational-intelligence-optical-flow","body":"Computational intelligence — augmented optical flow for video stabilization."},
  {"title":"CV","url":"/contents/publications/CV","body":"Curriculum Vitae — Dr. Farshid Pirahansiah."},
  {"title":"Journals","url":"/contents/publications/Journals/","body":"Peer-reviewed journal articles on image processing and thresholding."},
  {"title":"3D SLAM & Humanoid Robots","url":"/contents/publications/Journals/3d-slam-humanoid-robots","body":"SLAM simultaneous localization and mapping trends."},
  {"title":"Adaptive Thresholding PSNR","url":"/contents/publications/Journals/adaptive-thresholding-psnr","body":"PSNR-based adaptive image thresholding."},
  {"title":"Ant Colony Optimization","url":"/contents/publications/Journals/ant-colony-optimization","body":"Ant colony optimization algorithm for image segmentation."},
  {"title":"Character & Object Recognition","url":"/contents/publications/Journals/character-object-recognition","body":"Global feature extraction for character and object recognition."},
  {"title":"GSFT-PSNR Fuzzy Threshold","url":"/contents/publications/Journals/gsft-psnr-fuzzy-threshold","body":"Global single fuzzy threshold with PSNR."},
  {"title":"PSNR Threshold Segmentation","url":"/contents/publications/Journals/psnr-threshold-segmentation","body":"PSNR-based threshold method for image segmentation."},
  {"title":"Keynotes","url":"/contents/publications/Keynotes/","body":"Technical keynotes on LLMs meeting computer vision."},
  {"title":"LLMs Meet CV Keynote","url":"/contents/publications/Keynotes/llms-meet-computer-vision","body":"Convergence of Large Language Models and Computer Vision, token economics, multimodal AI."},
  {"title":"Papers","url":"/contents/publications/Papers/","body":"Peer-reviewed conference papers on image processing and pattern recognition."},
  {"title":"2D vs 3D Map Movement","url":"/contents/publications/Papers/2d-3d-map-movement","body":"2D versus 3D mapping for environment movement objects."},
  {"title":"Adaptive Segmentation PSNR","url":"/contents/publications/Papers/adaptive-image-segmentation-psnr","body":"Adaptive image segmentation based on PSNR for license plate recognition."},
  {"title":"Camera Calibration Multi-Modal","url":"/contents/publications/Papers/camera-calibration-multi-modal","body":"Camera calibration for multi-modal robot vision."},
  {"title":"Character Recognition","url":"/contents/publications/Papers/character-recognition-global-feature","body":"Character recognition based on global feature extraction."},
  {"title":"Classification Geometrical","url":"/contents/publications/Papers/classification-geometrical-topological","body":"Classification using enhanced geometrical topological feature analysis."},
  {"title":"Thresholding Handwritten","url":"/contents/publications/Papers/comparison-thresholding-handwritten","body":"Comparison of thresholding methods for handwritten image segmentation."},
  {"title":"License Plate Entropy","url":"/contents/publications/Papers/license-plate-recognition-entropy","body":"License plate recognition with multi-threshold based on entropy."},
  {"title":"Multi-threshold License Plate","url":"/contents/publications/Papers/multi-threshold-license-plate","body":"Multi-threshold approach for license plate recognition."},
  {"title":"Pattern Image Calibration","url":"/contents/publications/Papers/pattern-image-calibration","body":"Pattern image significance for camera calibration."},
  {"title":"TafreshGrid Computing","url":"/contents/publications/Papers/tafreshgrid-grid-computing","body":"Grid computing infrastructure at Tafresh University."},
  {"title":"Patents","url":"/contents/publications/Patents/","body":"AI and Computer Vision patents — face augmentation, vehicle detection, facial analysis."},
  {"title":"Face Image Augmentation Patent","url":"/contents/publications/Patents/face-image-augmentation","body":"Method for augmenting face images — WO2021060971A1, GAN-based generation."},
  {"title":"Facial Analysis Advertising Patent","url":"/contents/publications/Patents/facial-analysis-advertisement","body":"Advertisement based on facial analysis — WO2020141969A2."},
  {"title":"Vehicle Detection Patent","url":"/contents/publications/Patents/vehicle-detection","body":"Method for detecting moving vehicles — WO2021107761A1."},
  {"title":"Sitemap","url":"/contents/sitemap","body":"Sitemap — all pages on pirahansiah.com."},
  {"title":"Wiki","url":"/contents/wiki","body":"Wikipedia-style index of all pages on pirahansiah.com."},
  {"title":"Knowledge Graph","url":"/farshid-ai-cv-llm-graph","body":"Interactive knowledge graph visualization."},
  {"title":"Hashtag Graph","url":"/farshid-ai-cv-llm-graph-tags","body":"Hashtag relationship graph visualization."},
  {"title":"Search","url":"/search","body":"Search all pages on pirahansiah.com."}
];

var fuse = new Fuse(INDEX, {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'body', weight: 1 }
  ],
  threshold: 0.4,
  distance: 200,
  includeMatches: true,
  minMatchCharLength: 2
});

var fuseStrict = new Fuse(INDEX, {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'body', weight: 0.5 }
  ],
  threshold: 0.3,
  distance: 100,
  includeMatches: true,
  minMatchCharLength: 2
});

function doSearch() {
  var q = document.getElementById('q').value.trim();
  var resultsEl = document.getElementById('search-results');
  var countEl = document.getElementById('search-count');
  var googleEl = document.getElementById('search-google');
  var optTitle = document.getElementById('opt-title').checked;
  var optBody = document.getElementById('opt-body').checked;
  var optFuzzy = document.getElementById('opt-fuzzy').checked;

  if (!q) {
    resultsEl.innerHTML = '';
    countEl.textContent = '';
    googleEl.style.display = 'none';
    return;
  }

  var engine = optFuzzy ? fuse : fuseStrict;
  var results = engine.search(q);

  if (!optTitle) results = results.filter(function(r) { return r.key !== 'title'; });
  if (!optBody && !optTitle) {
    results = INDEX.filter(function(item) {
      return item.title.toLowerCase().includes(q.toLowerCase()) || item.body.toLowerCase().includes(q.toLowerCase());
    }).map(function(item) { return { item: item, score: 0 }; });
  }

  countEl.textContent = results.length + ' result' + (results.length !== 1 ? 's' : '') + ' for "' + q + '"';

  if (results.length === 0) {
    resultsEl.innerHTML = '<div class="search-empty">No results found locally.</div>';
    googleEl.style.display = 'block';
    document.getElementById('google-link').href = 'https://www.google.com/search?q=site:pirahansiah.com+' + encodeURIComponent(q);
    return;
  }

  googleEl.style.display = 'block';
  document.getElementById('google-link').href = 'https://www.google.com/search?q=site:pirahansiah.com+' + encodeURIComponent(q);

  var html = '';
  results.forEach(function(r) {
    var item = r.item || r;
    var score = r.score ? Math.round((1 - r.score) * 100) : 100;
    var snippet = item.body || '';
    if (snippet.length > 160) snippet = snippet.substring(0, 160) + '...';

    if (r.matches) {
      r.matches.forEach(function(m) {
        if (m.key === 'body' && m.indices && m.indices.length > 0) {
          var start = Math.max(0, m.indices[0][0] - 40);
          var end = Math.min(item.body.length, m.indices[0][1] + 60);
          snippet = (start > 0 ? '...' : '') + item.body.substring(start, end) + (end < item.body.length ? '...' : '');
        }
      });
    }

    html += '<li class="search-result">' +
      '<a href="' + item.url + '">' +
      '<div class="search-result-title">' + item.title + '</div>' +
      '<div class="search-result-url">' + item.url + '</div>' +
      '<div class="search-result-body">' + snippet + '</div>' +
      '<div class="search-result-score">' + score + '% match</div>' +
      '</a></li>';
  });

  resultsEl.innerHTML = html;
}

function quickSearch(term) {
  document.getElementById('q').value = term;
  doSearch();
  document.getElementById('q').focus();
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('q').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
  });
});
</script>
