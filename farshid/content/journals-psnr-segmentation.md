---
layout: farshid_default
title: "PSNR Threshold for Image Segmentation"
permalink: /notes/pubs/journals/psnr-segmentation/
description: "PSNR-based thresholding method for image segmentation in automated visual inspection."
---

PSNR-based thresholding method for image segmentation in automated visual inspection.

PEAK_SIGNAL-TO-NOISE_RATIO_BASED_ON_THRESHOLD_METHOD_FOR_IMAGE_SEGMENTATION

https://www.pirahansiah.com/notes/pubs/journals/PEAK_SIGNAL-TO-NOISE_RATIO_BASED_ON_THRESHOLD_METHOD_FOR_IMAGE_SEGMENTATION/

[spotify](https://podcasters.spotify.com/pod/show/pirahansiah/episodes/PEAK-SIGNAL-TO-NOISE-RATIO-BASED-ON-THRESHOLD-METHOD-FOR-IMAGE-SEGMENTATION-e2prep9)

[PDF Download](http://www.jatit.org/volumes/Vol57No2/4Vol57No2.pdf  )

  ![PEAK SIGNAL-TO-NOISE RATIO BASED ON THRESHOLD METHOD FOR IMAGE SEGMENTATION](/farshid/content/psnr-threshold-segmentation.png)

  <img src="/farshid/content/psnr-threshold-segmentation.png" alt="PEAK SIGNAL-TO-NOISE RATIO BASED ON THRESHOLD METHOD FOR IMAGE SEGMENTATION" style="max-width: 100%; height: auto;">

# Mind Map: Peak Signal-to-Noise Ratio Based on Threshold Method for Image Segmentation

## 1. Introduction
- **Importance of Thresholding**: Separates objects from the background, crucial in image processing and pattern recognition.
- **Types of Thresholding**:
  - **Single Thresholding**: Produces binary images (0 and 1).
  - **Multilevel Thresholding**: Produces images with pixel values between 0 and 255.
- **Objective**: Develop a new algorithm using Peak Signal-to-Noise Ratio (PSNR) for image segmentation.

## 2. Thresholding Techniques
### 2.1 Single Thresholding
- **Definition**: Uses a single threshold value to convert the image into binary.
- **Goal**: Maximize segmentation accuracy and reduce storage requirements.
- **Methods**:
  - **Kittler and Illingworth’s MET**.
  - **Potential Difference**.

### 2.2 Multilevel Thresholding
- **Definition**: Uses more than one threshold value to segment images.
- **Goal**: Applied when a single threshold is insufficient for global segmentation.
- **Method**:
  - Arora’s Recursive Algorithm.

### 2.3 Multi-Thresholding
- **Definition**: Applies multiple threshold values, calculates blobs/objects in the image.
- **Goal**: Selects peak threshold values based on object count.
- **Method**: Abdullah’s Multi-Threshold Algorithm.

### 2.4 Otsu’s Method
- **Definition**: Unsupervised, nonparametric method for automatic threshold selection.
- **Goal**: Maximizes the variance between classes to select optimal thresholds.

## 3. PSNR-Based Thresholding
- **Proposed Method**: Utilizes PSNR as a measure to select the optimal threshold.
- **Formula**:PSNR = 10 * log10(MAX^2 / MSE)
where `MSE` is the mean squared error and `MAX` is the maximum possible pixel value.

- **Algorithm**:
1. Calculate PSNR for each threshold value.
2. Select the threshold that maximizes PSNR.

## 4. Results and Evaluation
- **Datasets**:
- DIBCO 2011 (handwritten and printed images).
- **Metrics**:
- **F-Measure**: Evaluates binary classification accuracy.
- **PSNR**: Measures similarity between the original and thresholded images.

### 4.1 Performance
- The proposed method showed better PSNR and acceptable F-measure for printed images.
- Comparison with Kittler and Illingworth, Otsu, and other methods highlighted superior performance of the proposed method in certain conditions.

## 5. Application Areas
- **Automated Visual Inspection**.
- **License Plate Recognition**.
- **Handwritten Image Segmentation**.
- **Image Processing in Mobile Devices** (with resource limitations).

## 6. Conclusion
- **Proposed Method**: Adaptive PSNR-based thresholding is a viable approach for image segmentation.
- **Results**: Competitive performance in standard, printed, and handwritten images.
- **Future Work**: Potential for further improvement, especially in handling complex images with varying contrast.