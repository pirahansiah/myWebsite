---
layout: farshid_default
title: "Thresholding for Handwritten Segmentation"
permalink: /notes/pubs/papers/handwritten-thresholding/
description: "Comparison of PSNR and Otsu thresholding for handwritten image segmentation."
---

Comparison of PSNR and Otsu thresholding for handwritten image segmentation.

Comparison_single_thresholding_method_for_handwritten_images_segmentation

https://www.pirahansiah.com/notes/pubs/papers/Comparison_single_thresholding_method_for_handwritten_images_segmentation

[spotify](https://podcasters.spotify.com/pod/show/pirahansiah/episodes/My-Conference-Paper-Comparison-single-thresholding-method-for-handwritten-images-segmentation-e2ps22i )

[PDF Download My Conference Paper](https://doi.org/10.1109/ICPAIR.2011.5976918  )

  ![My Conference Paper  Comparison single thresholding method for handwritten images segmentation ](/farshid/content/comparison-thresholding-handwritten.png)

  <img src="/farshid/content/comparison-thresholding-handwritten.png" alt="My Conference Paper: Comparison single thresholding method for handwritten images segmentation "  style="max-width: 100%; height: auto;">

# Comparison Single Thresholding Method for Handwritten Images Segmentation

## 1. Introduction
   - **Objective**: Propose and compare single thresholding methods for handwritten image segmentation.
   - **Key Concepts**:
     - Thresholding separates objects from the background in images.
     - Peak Signal-to-Noise Ratio (PSNR) is used to measure image quality.
   - **Importance**:
     - Handwritten recognition has various applications in mobile devices and OCR systems.

## 2. State of the Art
   - **Otsu’s Method**:
     - An unsupervised, nonparametric method for automatic threshold selection.
     - Uses bounding boxes of fragments and calculates global thresholds by maximizing class variance.
   - **Thresholding Techniques**:
     - **Single Thresholding**: Applies a single threshold value to the entire image.
     - **Multi-Level Thresholding**: Uses multiple threshold values for segmenting complex images.

## 3. Proposed Method
   - **PSNR-Based Thresholding**:
     - Uses PSNR to determine the quality of image segmentation.
     - Measures the effectiveness of separating objects (characters) from the background in handwritten images.
   - **Advantages**:
     - Optimized for average-quality handwritten images.
     - Improves segmentation performance compared to other methods.

## 4. Experimental Results
   - **Method Comparison**:
     - The proposed PSNR-based method is compared with Otsu's method and other techniques.
   - **Performance**:
     - The proposed method shows better PSNR values, indicating superior image segmentation quality.
     - Optimized for real-world handwritten images where object-background separation is crucial.

## 5. Conclusion
   - **Key Findings**:
     - PSNR-based single thresholding outperforms traditional methods like Otsu's in segmenting handwritten images.
   - **Implications**:
     - Suitable for OCR systems and mobile applications involving handwritten text recognition.