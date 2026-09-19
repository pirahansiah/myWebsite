---
layout: farshid_default
title: "Face Image Augmentation WO2021060971A1"
permalink: /notes/pubs/patents/face-augmentation/
description: "GAN-based method for augmenting face images from surveillance with fuzzy logic quality filtering."
---

# Face Image Augmentation WO2021060971A1

GAN-based method for augmenting face images from surveillance with fuzzy logic quality filtering.

[spotify](https://spotifyanchor-web.app.link/e/XZpmcmHCFNb)

<audio controls>
  <source src="/farshid/content/face-image-augmentation.mp3" type="audio/mpeg">
  Your browser does not support the audio element.
</audio>

[PDF Download](https://patentimages.storage.googleapis.com/b8/d9/7f/ea8a5b789e1dad/WO2021060971A1.pdf )

  ![A METHOD FOR AUGMENTING A PLURALITY OF FACE IMAGES WO2021060971A1](/farshid/content/face-image-augmentation.png)

  <img src="/farshid/content/face-image-augmentation.png" alt="A METHOD FOR AUGMENTING A PLURALITY OF FACE IMAGES WO2021060971A1" style="max-width: 100%; height: auto;">

The patent WO2021060971A1 describes a method for augmenting face images, particularly for use in video surveillance systems. The invention addresses the limitations of traditional surveillance, where cameras capture face images from limited angles, leading to incomplete or substandard images. The method involves acquiring face images from both cameras and the internet, applying data augmentation techniques to increase the number of images, and using a Generative Adversarial Network (GAN) to create additional face images. This process helps generate better-quality face images that can improve facial recognition systems.

The system includes several components, such as an image acquisition module connected to a camera, data input and augmentation modules, and a GAN module. The data augmentation modules apply transformations like rotations and flips to increase the variety of face images, while the GAN module generates new images based on trained models. A fuzzy logic module is also employed to evaluate the quality of the generated images, ensuring that only the best images are selected and stored for training a deep learning module. This deep learning module further refines the facial recognition process by extracting higher-level features from the images.

The method also emphasizes the importance of image quality in improving recognition accuracy. By using a combination of data augmentation and GAN-generated images, the system can produce a diverse set of high-quality face images, which are essential for training deep learning models in surveillance and security applications. The invention claims a more effective way to enhance face images from different viewpoints and conditions, ultimately aiding in better identification and recognition in security systems.

Main Topic: A Method for Augmenting a Plurality of Face Images

1. Image Acquisition
   - Acquire at least one face image from an image acquisition module (102)
   - Acquire face images from the internet using a data input module (104)

2. Data Augmentation
   - Increase the number of face images using data augmentation modules (106 and 107)
   - Generate new face images similar to those stored in the first and second databases
   - Light and heavy augmentations are applied

3. Generative Adversarial Network (GAN)
   - Use GAN module (108) to generate augmented face images
   - Train GAN by:
     - Encoding images to a lower dimensional representation
     - Inputting random vectors to a decoder
     - Generating augmented face images
     - Discriminating real or fake images using a discriminator unit

4. Fuzzy Logic for Image Selection
   - Select proper face images based on quality using a fuzzy logic module (111)
   - Quality determined by sharpness and other factors

5. Storage and Learning
   - Store selected images into a fifth database (112)
   - Train a deep learning module (113) using the stored images

6. Deep Learning Training
   - Use deep learning module (113) to evaluate and learn from the augmented images
   - Extract high-level features for improved recognition