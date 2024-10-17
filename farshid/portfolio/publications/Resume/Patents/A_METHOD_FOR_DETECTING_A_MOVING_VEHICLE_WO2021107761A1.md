---
layout: default
author: Dr. Farshid Pirahansiah
categories: [image-processing, LLM, computer-vision]
tags: [AI, deep-learning, image-processing, neural-networks, object-detection]
description: "An in-depth exploration of advanced algorithms and techniques in computer vision, including real-time processing and AI integration."
excerpt: "Dive deep into the latest advancements in computer vision, including deep learning methodologies, real-time image processing, and their applications in modern technology."
featured: true
seo_title: "Advanced Computer Vision Techniques: From Theory to Practice"
seo_description: "Explore cutting-edge computer vision techniques and their applications in modern technology, including deep learning and real-time processing."
show_sidebar: true
toc: true
comments: true
share: true
published: true
sitemap: true
lang: en
mathjax: true
mermaid: true
keywords: [computer vision, deep learning, image processing, object detection, neural networks, AI]
header:
  caption: "Advanced Computer Vision Techniques"
footer: "© 2024 Dr. Farshid Pirahansiah. All rights reserved."



read_time: 15
title: "A METHOD FOR DETECTING A MOVING VEHICLE WO2021107761A1"
date: 2024-10-12
date_modified: 2024-10-12
---


[spotify](https://podcasters.spotify.com/pod/show/pirahansiah/episodes/A-METHOD-FOR-DETECTING-A-MOVING-VEHICLE-WO2021107761A1-e2pk5mj)



<audio controls>
  <source src="/farshid/portfolio/publications/Resume/Patents/A_METHOD_FOR_DETECTING_A_MOVING_VEHICLE_WO2021107761A1.mp3" type="audio/mpeg">
  Your browser does not support the audio element.
</audio>

[PDF Download](https://patentimages.storage.googleapis.com/16/41/83/2576e20c4a0af5/WO2021107761A1.pdf  )


{% if page.extname == ".md" %}
  ![A METHOD FOR DETECTING A MOVING VEHICLE WO2021107761A1](/farshid/portfolio/publications/Resume/Patents/A_METHOD_FOR_DETECTING_A_MOVING_VEHICLE_WO2021107761A1.png)
{% else %}
  <img src="/farshid/portfolio/publications/Resume/Patents/A_METHOD_FOR_DETECTING_A_MOVING_VEHICLE_WO2021107761A1.png" alt="A METHOD FOR DETECTING A MOVING VEHICLE WO2021107761A1" style="max-width: 100%; height: auto;">
{% endif %}



Patent Summary:


Field of Invention:

This patent relates to a method for detecting moving vehicles, specifically in the field of traffic surveillance and law enforcement. It aims to improve vehicle detection accuracy under poor lighting conditions.

Background:

Existing methods for detecting moving vehicles, such as edge processing and comparison between target and reference images, struggle under low light or bad weather conditions. This patent seeks to overcome these challenges.

Summary of Invention:

The patented method enhances the detection of moving vehicles by processing video streams, focusing on improving the illumination and edge detection of the vehicle in the captured image. It involves:

	1.	Grabbing an initial image from a video stream.
	2.	Enhancing illumination of the image using Contrast Limited Adaptive Histogram Equalization (CLAHE) if necessary.
	3.	Enhancing edges using Sobel edge detection to create a binary image that highlights object edges.
	4.	Detecting the vehicle based on the homogenous properties of the vehicle body. This includes:
	•	Closing open edges.
	•	Inverting the binary image.
	•	Segmenting the image into multiple parts.
	•	Filtering noise based on geometric features and relationships.

Key Steps in the Process:

	•	Image Enhancement: Adjusts image illumination based on darkness or brightness, improving visibility.
	•	Edge Detection: Highlights edges in the image, which is crucial for distinguishing vehicles from the background.
	•	Binary Image Processing: Converts images to binary form, filters noise, and identifies vehicles based on homogenous vehicle body properties.

Claims:

The patent claims cover:

	1.	A method for detecting a moving vehicle involving image grabbing, illumination enhancement, edge enhancement, and vehicle location detection based on homogenous properties.
	2.	Techniques for improving illumination and edge detection, including the use of CLAHE and Sobel edge detection.
	3.	Steps for filtering noise and improving detection accuracy by evaluating geometric features and relationships between image segments.

Applications:

This method is intended for use in traffic surveillance systems, law enforcement, and smart city technologies, where it can be applied to monitor and analyze traffic, even under challenging conditions such as poor lighting.

Technical Advantages:

	•	Improved accuracy of vehicle detection under varying lighting conditions.
	•	The method handles both dark and bright images effectively, making it more robust than previous methods that rely heavily on good lighting.
	•	Sophisticated noise filtering ensures that irrelevant objects are not mistakenly detected as vehicles.

This invention provides a significant advancement in vehicle detection for traffic management, reducing errors caused by lighting conditions and improving the robustness of detection systems in real-world environments.




# Mind Map: A Method for Detecting a Moving Vehicle

## 1. Field of Invention
- **Traffic surveillance**
- **Vehicle detection under poor lighting conditions**
- **Law enforcement applications**

## 2. Background
- **Problems in Existing Methods:**
  - Poor accuracy in low light conditions
  - Challenges with edge processing and image comparison
  - Inability to detect vehicles reliably in overcast or dark conditions

## 3. Summary of Invention
- **Goal:** Improve vehicle detection under challenging conditions
- **Steps in Detection:**
  - Grab initial image from a video stream
  - Enhance illumination of the image
  - Enhance edges within the image
  - Detect vehicle based on homogenous properties

### 3.1. Image Processing Steps
- **Step 1: Grab Initial Image**
  - From video stream
  - Video can be real-time or pre-recorded
  - Image suspected to contain a vehicle
- **Step 2: Enhance Illumination**
  - **CLAHE:** Adjust contrast for dark images
  - Check brightness and tag the image (dark/bright)
- **Step 3: Enhance Edges**
  - Use **Sobel edge detection** to highlight object edges
  - Convert image to a binary format (black & white)
- **Step 4: Detect Vehicle**
  - Identify vehicle based on body properties
  - Close open edges
  - Invert binary image
  - Segment the image into parts
  - Filter noise based on geometric features and relationships

## 4. Detailed Steps
### 4.1. Enhancing Illumination
- Analyze grayscale levels and density distribution
- Apply **CLAHE** to dark images
- Tag image as dark or bright based on grayscale density

### 4.2. Enhancing Edges
- Assign threshold values for edge detection
- Generate two grayscale images
- Apply **Sobel edge detection** to create binary images
- Choose the best binary image for vehicle detection based on white density

### 4.3. Detecting Vehicle Based on Properties
- Close open edges in the binary image
- Invert the binary image
- Segment the image into parts
- Filter out noise:
  - Based on geometric features
  - Based on relationships (distance, similarity)

## 5. System Components
- **Vehicle Detection Module (1100)**
- **Vehicle Classification Module (1200)**
- **Vehicle Tracking Module (1300)**
- **Post-Analyzer Module (1400)**

## 6. Claims
### Claim 1
- Steps for detecting a moving vehicle:
  1. Grabbing image
  2. Enhancing illumination
  3. Enhancing edges
  4. Detecting vehicle based on homogenous properties
### Claim 2-9
- Methods for enhancing illumination and edges
- Filtering noise based on geometric and relational properties