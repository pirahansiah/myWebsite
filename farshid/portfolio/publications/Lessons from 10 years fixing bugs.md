---
layout: default

title: "My Lessons from 10 years fixing bugs CV Advanced Topics in Computer Vision"
categories: [CV, Resume, image-processing, LLM , computer-vision]
tags: [CV, Resume, AI, deep-learning, image-processing]
description: "CV, Resume, An exploration of advanced algorithms and techniques in computer vision."
excerpt: "CV, Resume, Dive deep into the latest advancements in computer vision, including deep learning methodologies and real-time image processing."
image: 
author: "Dr. Farshid Pirahansiah"
featured: true
seo_title: "CV, Resume, Advanced Computer Vision Techniques | Dr. Farshid Pirahansiah"
seo_description: "CV, Resume, Explore cutting-edge computer vision techniques and their applications in modern technology."

---

As an AI and computer vision expert with over a decade of experience collaborating with esteemed global organizations, my expertise encompasses AI research and development, machine learning, deep learning, Internet of Things (IoT), and model optimization for edge and cloud-based solutions. With a portfolio of 21 publications, three patents, and extensive practical experience in real-time computer vision applications, I have spearheaded groundbreaking projects in generative AI, video analytics, and intelligent systems. Proficient in C++, Python, OpenCV, and advanced GPU optimization, I am recognized for bridging the gap between cutting-edge research and commercially viable products.



lessons learned fixing bug and review codes for my 10 years experince 

you need lessons learned after each project so what do you learn during projects.

# using floating points
using cast
do not compare float/double numbers by ==


# CV
  Background Subtraction (BGS) algorithms
  GrabCut algorithm
  Apply a threshold to the depth map to create a mask that suppresses the distant background.
    Read frames > Rectify the images (cv2.stereoRectify, cv2.initUndistortRectifyMap, and cv2.remap) > Compute the disparity map (cv2.StereoBM or cv2.StereoSGBM) > Create a depth map > Apply a threshold to the depth map
  In OpenCV, temporal constraints are used in video analysis to impose rules on how objects or pixels behave over time across consecutive frames. This helps track objects more accurately and make sense of motion, rather than just analyzing individual images. 
  
# resize 
  Upscaling → cv2.INTER_LANCZOS4 (sharp, high quality) or cv2.INTER_CUBIC.
  Downscaling → cv2.INTER_AREA (built-in antialiasing).
  Exact scale factors → use fx, fy as floats (avoid rounding dsize).
  Avoid cumulative rounding → keep data in float (float32/float64) during processing.
  Gamma-aware resizing (more accurate): linearize to linear RGB, resize, then convert back to sRGB.
  Pre-blur for large downsamples: light Gaussian blur can suppress aliasing before resize.
# VLLM
  if the model does not have generating you can create random noisy image as input
  new models can have multiple input images in the beginning
  first : mask the object inside the image then edit it
  keep test of the image original
# Camera
      
  Core technologies
    UVC (USB Video Class)
    DMA (Direct Memory Access)
    USB data transfer
    Video streaming
    Camera interface
  Performance and efficiency
    Low-latency capture
    High-speed transfer
    Buffer bypass
    Chunk-based transfer
    Real-time processing
    Frame processing
  Technical components
    Method names
    Data transfer unit
    Streaming optimization
    High throughput
    Driver bypass
    Frame capture
  Application context
    Camera application
    Live video feed
    High-performance camera
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  import cv2


# Load pre-calibrated camera matrices
# NOTE: This requires prior calibration with a checkerboard
# and cannot be done in a single line.
# See OpenCV documentation for `stereoCalibrate`.
mtx1, dist1, mtx2, dist2, R, T, E, F = ... # Load matrices from a file


# Initialize stereo correspondence algorithm
stereo = cv2.StereoBM.create(numDisparities=16, blockSize=15)


# Open cameras (adjust indices as needed)
cap1 = cv2.VideoCapture(0)
cap2 = cv2.VideoCapture(1)


while True:
    ret1, frame1 = cap1.read()
    ret2, frame2 = cap2.read()
    
    if not ret1 or not ret2:
        break


    # Rectify and process the images
    undistort1 = cv2.undistort(frame1, mtx1, dist1)
    undistort2 = cv2.undistort(frame2, mtx2, dist2)
    
    # Compute the disparity map
    disparity = stereo.compute(cv2.cvtColor(undistort1, cv2.COLOR_BGR2GRAY),
                              cv2.cvtColor(undistort2, cv2.COLOR_BGR2GRAY))
    
    # Create a mask by thresholding the disparity (adjust the value)
    # A low disparity means the object is far away (background)
    _, mask = cv2.threshold(disparity, 50, 255, cv2.THRESH_BINARY_INV)
    
    # Apply the mask to the original frame
    masked_frame = cv2.bitwise_and(frame1, frame1, mask=mask)
    
    # Display the result
    cv2.imshow('Background Suppressed', masked_frame)


    if cv2.waitKey(1) & 0xFF == ord('q'):
        break


cap1.release()
cap2.release()
cv2.destroyAllWindows()
---

Relational databases store multi-modal, multi-scale information.  The database level has a relational/temporal structure.  Relational Graph Neural Networks (RelGNNs) use composite messages. 

---
Relational Foundation Models (RFMs) are a type of large language model that focus on learning, usability, and systems optimization and inference. They use a unique approach called relational transformer zero-shot prompting, which allows them to make predictions without prior training on specific data. RFMs also offer highly efficient supervised fine-tuning, enabling them to quickly adapt to new tasks and datasets.

Proactive decision intelligence (DI) is another key feature of RFMs. DI involves predicting and forecasting outcomes, which can be particularly useful in fields like biology where scientists need to make informed decisions based on complex data. RFMs can perform DI in real-time, making predictions for any use case on any data in seconds. However, it's important to note that RFMs are not designed for batch prediction over billions of entities.

Artificial intelligence (AI) is being increasingly used in various scientific fields, including biology. AI agents are being developed to assist scientists in their research and experiments, helping them to analyze data more efficiently and make more accurate predictions. 
---
