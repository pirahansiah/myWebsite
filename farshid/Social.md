---
layout: default
title: "social"
date: 2024-10-12
author: Dr. Farshid Pirahansiah
categories: [image-processing, LLM, computer-vision]
tags: [AI, deep-learning, image-processing, neural-networks, object-detection]
description: "An in-depth exploration of advanced algorithms and techniques in computer vision, including real-time processing and AI integration."
excerpt: "Dive deep into the latest advancements in computer vision, including deep learning methodologies, real-time image processing, and their applications in modern technology."
featured: true
seo_title: "Advanced Computer Vision Techniques: From Theory to Practice"
seo_description: "Explore cutting-edge computer vision techniques and their applications in modern technology, including deep learning and real-time processing."
related_posts:
  - /farshid/resources.md
  - /farshid/social.md
show_sidebar: true
website_path: https://www.pirahansiah.com
toc: true
comments: true
share: true
read_time: 15
published: true
sitemap: true
canonical_url: https://www.pirahansiah.com
lang: en
mathjax: true
mermaid: true
keywords: [computer vision, deep learning, image processing, object detection, neural networks, AI]
header:
  caption: "Advanced Computer Vision Techniques"
footer: "© 2024 Dr. Farshid Pirahansiah. All rights reserved."
pin: false
rating: 4.8
last_modified_at: 2024-10-17

---
{{ site.author }}
- [Dr. Farshid Pirahansiah CV](/farshid/portfolio/publications/CV)
- [portfolio,projects,Solutions](https://www.pirahansiah.com/farshid/portfolio/projects/Solutions)
  - [Innovations](/farshid/portfolio/projects/Solutions)   
# My portfolio
Explore my Innovations, Projects, and Solutions to see how I can contribute to your startup’s growth and help solve key challenges with innovative approaches.   
  - [List of My Impact Portfolio](/farshid/portfolio/projects/Solutions)      
# CUDA   
Leveraging CUDA for High-Performance GPU Computing with PyCUDA, Numba   
- [Numba JIT Computer Vision, ML, DL, LLM](/farshid/content/CUDA_numba_jit_tutorial)   
    - This file provides a detailed tutorial on how to use the @jit(nopython=True) decorator from the Numba library to optimize Python code for better performance. It explains how Numba compiles Python functions into machine code, improving execution speed for numerical operations and loops. The tutorial includes examples of summing squares, factorial computation, and matrix multiplication.     
- [PyCUDA Kernel Explanation: Computer Vision, ML, DL, LLM](/farshid/content/CUDA_pycuda_kernel_explanation)   
    - This file explains how PyCUDA enables the execution of CUDA kernels written in C/C++ directly from Python. It details how PyCUDA compiles the kernel code at runtime, allocates memory on the GPU, and executes the kernels. The explanation includes an example of running an element-wise addition kernel on the GPU, demonstrating the process from writing C kernels to retrieving the results in Python.    
# LLM
<img src="/farshid/content/Mind_Map_Orchestrating_Agents.png" alt="Mind Map Orchestrating Agents" style="max-width: 100%; height: auto;">
🚀 Orchestrating AI Agents 🌐    

Imagine coordinating multiple AI agents to tackle complex tasks like research, planning, & more! By breaking tasks into subtasks, agents work together efficiently. 🤖🔗

Explore the future of multi-agent collaboration:
#AI #MachineLearning #Automation   

{% assign topic_page = site.pages | where: "path", "farshid/content/Mind_Map_Orchestrating_Agents.md" | first %}

{% if topic_page %}
  {% capture topic_content %}
    {{ topic_page.content }}
  {% endcapture %}
  {{ topic_content | markdownify }}
{% endif %}

