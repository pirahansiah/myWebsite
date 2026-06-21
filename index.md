---
layout: farshid_default
title: "Dr. Farshid Pirahansiah — Embedded Computer Vision & Edge AI"
---

<style>
.hero-section {
  text-align: center;
  padding: 60px 24px 40px;
  position: relative;
}
.hero-section h1 {
  font-size: 2.8rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #0a84ff 0%, #bf5af2 50%, #ff375f 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-muted);
  max-width: 640px;
  margin: 0 auto 32px;
  line-height: 1.6;
}
.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 36px;
  background: linear-gradient(135deg, #0a84ff, #5ac8fa);
  color: #fff;
  text-decoration: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 20px rgba(10,132,255,0.3);
}
.hero-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(10,132,255,0.4);
}

.expertise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto 48px;
  padding: 0 16px;
}
.expertise-card {
  border-radius: 18px;
  padding: 28px 24px;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.expertise-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 50%);
  pointer-events: none;
  opacity: 0.5;
}
.expertise-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
}
.expertise-icon {
  font-size: 2rem;
  margin-bottom: 12px;
  display: block;
}
.expertise-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 8px;
}
.expertise-card p {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
}
.expertise-card .tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.expertise-card .tag {
  font-size: 0.72rem;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(10,132,255,0.12);
  color: #0a84ff;
  font-weight: 600;
}

.stats-row {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin: 48px 0;
  flex-wrap: wrap;
}
.stat-block {
  text-align: center;
}
.stat-number {
  font-size: 2.4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #0a84ff, #bf5af2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stat-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.content-links {
  max-width: 800px;
  margin: 0 auto 48px;
  padding: 0 16px;
}
.content-links h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
}
.content-links .link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.content-links a {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  background: rgba(255,255,255,0.06);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
.content-links a:hover {
  background: rgba(10,132,255,0.1);
  border-color: rgba(10,132,255,0.25);
  transform: translateX(3px);
}
.content-links a .arr {
  opacity: 0;
  color: #0a84ff;
  transition: opacity 0.2s ease;
}
.content-links a:hover .arr { opacity: 1; }

.cta-section {
  text-align: center;
  padding: 48px 24px 60px;
}
.cta-section h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.cta-section p {
  color: var(--text-muted);
  max-width: 500px;
  margin: 0 auto 24px;
  line-height: 1.6;
}
.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 40px;
  background: #0a65c5;
  color: #fff;
  text-decoration: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 700;
  transition: all 0.2s ease;
}
.cta-btn:hover {
  background: #004182;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(10,101,197,0.35);
}
.cta-btn svg { width: 20px; height: 20px; fill: currentColor; }

@media (max-width: 768px) {
  .hero-section h1 { font-size: 1.8rem; }
  .stats-row { gap: 24px; }
  .stat-number { font-size: 1.8rem; }
}
</style>

<div class="hero-section">
  <h1>Embedded Computer Vision<br>&amp; Edge AI at Scale</h1>
  <p class="hero-subtitle">
    I help businesses turn computer vision research into production-ready embedded applications.
    From model optimization to multi-camera deployment — on NVIDIA Jetson, Raspberry Pi, Hailo, Axelera, and beyond.
  </p>
  <a href="https://www.linkedin.com/in/pirahansiah/" class="hero-cta" target="_blank" rel="noopener">
    <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    Let's Talk on LinkedIn
  </a>
</div>

<div class="stats-row">
  <div class="stat-block"><div class="stat-number">12+</div><div class="stat-desc">Years Experience</div></div>
  <div class="stat-block"><div class="stat-number">3</div><div class="stat-desc">Patents</div></div>
  <div class="stat-block"><div class="stat-number">17+</div><div class="stat-desc">Publications</div></div>
  <div class="stat-block"><div class="stat-number">141+</div><div class="stat-desc">Citations</div></div>
</div>

<div class="expertise-grid">

  <div class="expertise-card">
    <span class="expertise-icon">&#128065;</span>
    <h3>Embedded Computer Vision</h3>
    <p>Real-time object detection, tracking, and classification on edge devices. From prototype to production deployment on Jetson, Coral, Hailo, and Axelera accelerators.</p>
    <div class="tags">
      <span class="tag">OpenCV</span>
      <span class="tag">YOLO</span>
      <span class="tag">TensorRT</span>
      <span class="tag">ONNX</span>
    </div>
  </div>

  <div class="expertise-card">
    <span class="expertise-icon">&#128200;</span>
    <h3>Model Optimization &amp; Quantization</h3>
    <p>INT8/FP16 quantization, pruning, and knowledge distillation. Reduce model size 4-10x while maintaining accuracy for real-time inference on resource-constrained hardware.</p>
    <div class="tags">
      <span class="tag">TensorRT</span>
      <span class="tag">OpenVINO</span>
      <span class="tag">QDQ</span>
      <span class="tag">Pruning</span>
    </div>
  </div>

  <div class="expertise-card">
    <span class="expertise-icon">&#127909;</span>
    <h3>Multi-Camera Systems</h3>
    <p>Synchronized multi-camera setups for 3D reconstruction, stereo vision, and surveillance. Scaling from 2 to 100+ cameras with GStreamer and GPU-accelerated pipelines.</p>
    <div class="tags">
      <span class="tag">GStreamer</span>
      <span class="tag">CUDA</span>
      <span class="tag">DeepStream</span>
      <span class="tag">SLAM</span>
    </div>
  </div>

  <div class="expertise-card">
    <span class="expertise-icon">&#129302;</span>
    <h3>LLM &amp; AI Integration</h3>
    <p>Integrate vision-LLMs, RAG pipelines, and multi-agent systems into CV workflows. Local inference with Ollama, or cloud APIs for production-scale AI applications.</p>
    <div class="tags">
      <span class="tag">LLMs</span>
      <span class="tag">RAG</span>
      <span class="tag">Ollama</span>
      <span class="tag">Agents</span>
    </div>
  </div>

  <div class="expertise-card">
    <span class="expertise-icon">&#9881;</span>
    <h3>MLOps &amp; CI/CD</h3>
    <p>End-to-end ML pipelines: data collection, training, evaluation, deployment, and monitoring. Docker, Kubernetes, MLflow, and automated model versioning.</p>
    <div class="tags">
      <span class="tag">Docker</span>
      <span class="tag">K8s</span>
      <span class="tag">MLflow</span>
      <span class="tag">CI/CD</span>
    </div>
  </div>

  <div class="expertise-card">
    <span class="expertise-icon">&#128204;</span>
    <h3>Hardware Selection &amp; Prototyping</h3>
    <p>Evaluate and select the right AI accelerators for your use case. NVIDIA Jetson, Intel NPU, Hailo-15, Axelera Metis, Google Coral, FPGA, or custom solutions.</p>
    <div class="tags">
      <span class="tag">Jetson</span>
      <span class="tag">Hailo</span>
      <span class="tag">Axelera</span>
      <span class="tag">FPGA</span>
    </div>
  </div>

</div>

<div class="content-links">
  <h2>Technical Deep Dives</h2>
  <div class="link-grid">
    <a href="/contents/public/cv/3d/"><span class="arr">&#8594;</span> 3D Vision & Multi-Camera</a>
    <a href="/contents/public/cv/optical-flow/"><span class="arr">&#8594;</span> Optical Flow</a>
    <a href="/contents/public/cuda-gpu/numba-jit/"><span class="arr">&#8594;</span> Numba JIT Tutorial</a>
    <a href="/contents/public/cuda-gpu/pycuda-kernels/"><span class="arr">&#8594;</span> PyCUDA Kernels</a>
    <a href="/contents/public/Optimization/"><span class="arr">&#8594;</span> CV/DL/ML Optimization</a>
    <a href="/contents/public/ai-llm/advanced-llm-concepts/"><span class="arr">&#8594;</span> Advanced LLM Concepts</a>
    <a href="/contents/public/ai-llm/orchestrating-agents/"><span class="arr">&#8594;</span> Orchestrating AI Agents</a>
    <a href="/contents/public/coaching/"><span class="arr">&#8594;</span> CV Coaching Roadmap</a>
  </div>
</div>

<div class="cta-section">
  <h2>Ready to Scale Your CV Application?</h2>
  <p>
    Whether you need to optimize a model for edge deployment, build a multi-camera pipeline,
    or integrate AI into your product — I can help.
  </p>
  <a href="https://www.linkedin.com/in/pirahansiah/" class="cta-btn" target="_blank" rel="noopener">
    <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    Connect on LinkedIn
  </a>
</div>
