---
layout: default
author: Dr. Farshid Pirahansiah
categories: [image-processing, LLM, computer-vision, ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding]
tags: [AI, deep-learning, image-processing, neural-networks, object-detection, ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding]
description: "An in-depth exploration of advanced algorithms and techniques in computer vision, , ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding, including real-time processing and AI integration."
excerpt: "Dive deep into the latest advancements in computer vision, including deep learning methodologies,, ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding,  real-time image processing, and their applications in modern technology."
featured: true
seo_title: "Advanced Computer Vision Techniques: From Theory to Practice, , ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding"
seo_description: "Explore cutting-edge computer vision techniques and their applications in modern technology, including deep learning and real-time processing., ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding"
show_sidebar: true
toc: true
comments: true
share: true
published: true
sitemap: true
lang: en
mathjax: true
mermaid: true
keywords: [computer vision, deep learning, image processing, object detection, neural networks, AI, ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding]
header:
  caption: "Advanced Computer Vision Techniques"
footer: "© 2024 Dr. Farshid Pirahansiah. All rights reserved."


title: "3D SLAM Simultaneous Localization And Mapping Trends And Humanoid Robot Linkages"
date: 2024-10-18
---
3D_SLAM_Simultaneous_Localization_And_Mapping_Trends_And_Humanoid_Robot_Linkages

https://www.pirahansiah.com/farshid/portfolio/publications/Journals/3D_SLAM_Simultaneous_Localization_And_Mapping_Trends_And_Humanoid_Robot_Linkages/

[spotify](https://podcasters.spotify.com/pod/show/pirahansiah/episodes/3D-SLAM-Simultaneous-Localization-And-Mapping-Trends-And-Humanoid-Robot-Linkages-e2prg07)

[PDF Download](http://journalarticle.ukm.my/6644/1/4429-10302-1-SM.pdf  )


{% if page.extname == ".md" %}
  ![3D SLAM Simultaneous Localization And Mapping Trends And Humanoid Robot Linkages](/farshid/portfolio/publications/Journals/3D_SLAM_Simultaneous_Localization_And_Mapping_Trends_And_Humanoid_Robot_Linkages.png)
{% else %}
  <img src="/farshid/portfolio/publications/Journals/3D_SLAM_Simultaneous_Localization_And_Mapping_Trends_And_Humanoid_Robot_Linkages.png" alt="Simultaneous Localization And Mapping Trends And Humanoid Robot Linkages" style="max-width: 100%; height: auto;">
{% endif %}


# Simultaneous Localization and Mapping Trends and Humanoid Robot Linkages

## 1. Introduction
- SLAM: Simultaneous Localization and Mapping
  - Real-time map creation and localization
  - Robotics application: goal determination, motion planning
  - Usage in rescue missions, medical field, pipeline inspection, and more
  - Challenges: sensor uncertainty, correspondence, loop closing, time complexity

## 2. SLAM Methods
- Kalman Filter (KF)
  - Bayesian filter handling uncertainty
  - Extended KF (EKF), Unscented KF (UKF), SEIF improvements
  - Challenges: computational resources, landmark growth
- Particle Filter
  - Non-parametric recursive algorithm
  - Handles non-linearity and non-Gaussian noise
  - FastSLAM algorithms: O(P log L) complexity
- Graph-based SLAM
  - Nodes as robot poses, edges as spatial constraints
  - State-of-the-art for speed and accuracy
- Feature-based SLAM
  - Describes environments using point features
  - Laser ranging systems for mapping

## 3. SLAM Evaluation Methods
- Allocated Resources
  - Processing time and memory usage
  - EKF, CEKF, and UKF comparisons
- Precision and Noise
  - Reducing drift and noise
  - Odometry, laser, radar, camera usage
- Environmental Factors
  - Outdoor, indoor, underwater, dynamic environments
  - 3D maps, point maps for environmental challenges

## 4. SLAM for Humanoid Robots
- Humanoid challenges: degrees of freedom, camera variability
- Solutions:
  - Stereo vision setup
  - Local 3D maps for footstep planning
  - Real-time VSLAM using single camera (e.g., HRP-2)
  - GPU-accelerated tracking for humanoid tasks

## 5. Datasets for SLAM
- Online datasets for SLAM research
  - Indoor and outdoor datasets
  - Popular datasets: Intel research lab, MIT CSAIL, FHW Museum
- Benchmark datasets
  - Ground truth needed for accurate mapping

## 6. Conclusion and Future Work
- New combinatory SLAM methods: grid-based FastSLAM, graph-based SLAM
- Challenges: 3D SLAM for humanoid robots, noisy vision from robot motion
- Future research: stereo vision SLAM in real-world environments, stereo video stabilization, 3D mapping