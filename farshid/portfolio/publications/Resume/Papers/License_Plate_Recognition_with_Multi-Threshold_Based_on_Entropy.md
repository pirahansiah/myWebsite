---
layout: default
author: Dr. Farshid Pirahansiah
categories: [My Conference Paper , image-processing, LLM, computer-vision, ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding]
tags: [AI, deep-learning, image-processing, neural-networks, object-detection, ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding]
description: "An in-depth exploration of advanced algorithms and techniques in computer vision, , ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding, including real-time processing and AI integration."
excerpt: "Dive deep into the latest advancements in computer vision, including deep learning methodologies,, ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding,  real-time image processing, and their applications in modern technology."
seo_title: "Advanced Computer Vision Techniques: From Theory to Practice, , ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding"
seo_description: "Explore cutting-edge computer vision techniques and their applications in modern technology, including deep learning and real-time processing., ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding"
keywords: [computer vision, deep learning, image processing, object detection, neural networks, AI, ML, DL, AWS, IoT, Robotics, Adaptive Image Thresholding]
header:
  caption: "Advanced Computer Vision Techniques"
footer: "© 2024 Dr. Farshid Pirahansiah. All rights reserved."
title: "My Conference Paper: License Plate Recognition with Multi-Threshold Based on Entropy"
date: 2024-10-19
---

License_Plate_Recognition_with_Multi-Threshold_Based_on_Entropy



https://www.pirahansiah.com/farshid/portfolio/publications/Resume/Papers/License_Plate_Recognition_with_Multi-Threshold_Based_on_Entropy


[spotify]( https://podcasters.spotify.com/pod/show/pirahansiah/episodes/License-Plate-Recognition-with-Multi-threshold-based-on-Entropy-e2ps290)

[PDF Download My Conference Paper]( https://doi.org/10.1109/ICEEI.2011.6021627 )


{% if page.extname == "License_Plate_Recognition_with_Multi-Threshold_Based_on_Entropy.md" %}
  ![My Conference Paper License Plate Recognition with Multi-Threshold Based on Entropy  ](/farshid/portfolio/publications/Resume/Papers/License_Plate_Recognition_with_Multi-Threshold_Based_on_Entropy.png)
{% else %}
  <img src="/farshid/portfolio/publications/Resume/Papers/License_Plate_Recognition_with_Multi-Threshold_Based_on_Entropy.png" alt="My Conference Paper: License Plate Recognition with Multi-Threshold Based on Entropy "  style="max-width: 100%; height: auto;">
{% endif %}


# License Plate Recognition with Multi-threshold based on Entropy

## 1. Introduction
   - **Objective**: Propose a multi-thresholding method for license plate recognition.
   - **Importance of Thresholding**:
     - Simplifies image segmentation
     - Ensures robustness and accuracy in recognizing license plate characters.
   - **Challenges**:
     - Selecting the correct threshold values for better segmentation results.

## 2. Entropy-based Thresholding
   - **Method**:
     - Based on maximizing the cross entropy between the original image and the segmented image.
     - Entropy is treated as a probability distribution of the image histogram.
   - **Historical Background**:
     - Originally proposed by Pun and later improved by Kapur for image segmentation.
     - Entropy-based thresholding is widely used for bi-level and multi-level thresholding.

## 3. Proposed Method
   - **Multi-thresholding Based on Maximum Entropy**:
     - Selects several threshold values by maximizing the entropy.
     - Integrates partial ranges of the image histogram to achieve better segmentation.
   - **Comparison with Other Methods**:
     - Compared to single-thresholding techniques based on maximum entropy.
     - Evaluates how multi-thresholding enhances the recognition accuracy.

## 4. License Plate Recognition Process
   - **Steps**:
     1. **Image Segmentation**: Separates the license plate region using multi-thresholding.
     2. **Character Segmentation**: Applies the selected thresholds to segment individual characters.
     3. **Recognition**: Recognizes the segmented characters to produce the license plate number.

## 5. Results and Discussion
   - **Performance**:
     - The proposed multi-threshold method outperforms single-thresholding techniques.
     - Shows improved segmentation results for varying lighting and environmental conditions.

## 6. Conclusion
   - **Key Findings**:
     - Multi-thresholding based on entropy enhances the accuracy of license plate recognition.
   - **Implications**:
     - Can be applied in real-world license plate recognition systems with better robustness.