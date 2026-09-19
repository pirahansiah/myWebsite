Global feature extraction methods for character and object recognition in computer vision.

CHARACTER_AND_OBJECT_RECOGNITION_BASED_ON_GLOBAL_FEATURE_EXTRACTION

[spotify](https://podcasters.spotify.com/pod/show/pirahansiah/episodes/Character-and-Object-Recognition-Based-on-Global-Feature-Extraction-e2pptrp)

[PDF Download](http://www.jatit.org/volumes/Vol52No2/6Vol52No2.pdf )

  ![CHARACTER_AND_OBJECT_RECOGNITION_BASED_ON_GLOBAL_FEATURE_EXTRACTION](/farshid/content/character-object-recognition.png)

  <img src="/farshid/content/character-object-recognition.png" alt="CHARACTER AND OBJECT RECOGNITION BASED ON GLOBAL FEATURE EXTRACTION" style="max-width: 100%; height: auto;">

# Mind Map: Character and Object Recognition Based on Global Feature Extraction

## 1. Introduction
- **Optical Character Recognition (OCR)**: Recognizes handwritten, irregular, and machine-printed characters.
- **Key Tasks in OCR**:
  - Pre-processing
  - Segmentation
  - Feature Extraction
  - Classification
  - Recognition

## 2. Feature Extraction Methods
### 2.1 Global Feature Extraction
- **Definition**: Uses entire image characteristics to extract features.
- **Methods**:
  - **Gray Level Co-occurrence Matrix (GLCM)**: Uses spatial distribution of gray-level values.
  - **Edge Direction Matrix (EDMS)**: Captures edge directions but produces a limited number of features.
- **Challenges**: 
  - Less discriminative features.
  - Higher dimensionality leads to longer processing times.

### 2.2 Spatial Feature Extraction
- **Definition**: Focuses on local image characteristics.
- **Techniques**:
  - **Robinson Compass Mask**: Uses gradient filters in eight directions.
- **Strengths**: Better for character recognition.
- **Limitations**: Time-consuming due to high-dimensional data.

## 3. Proposed Method
- **Combination of GLCM and EDMS**:
  - Aims to improve recognition rates by combining features.
  - **Feature Selection**: Uses gain ratio to reduce feature set size.
  - **Datasets**: License plates, font styles, and large binary images.

## 4. Experimental Results
- **Performance Metrics**:
  - **Character Recognition Accuracy**:
    - Proposed method: 85.99% with feature selection.
    - EDMS: 80.19%, GLCM: 38.84%, Combination without feature selection: 58.78%.
  - **Object Recognition Accuracy**:
    - Proposed method: 92.5% accuracy with feature selection.
    - Robinson filter (spatial method) outperforms in character recognition (100% accuracy).
- **Conclusion**: Global feature extraction is better for object recognition, while spatial methods are better for character recognition.

## 5. Applications
- **Character Recognition**:
  - License Plate Recognition (LPR).
  - Handwritten text recognition.
- **Object Recognition**:
  - Recognizing binary shapes in images.
  - Differentiating between object categories using extracted features.

## 6. Future Work
- **Improvements**: Modify feature selection to further enhance recognition rates.
- **New Applications**: Adapt method for complex character recognition and extend to other domains.

## 7. Summary
- **Goal**: Improve OCR by combining global and spatial feature extraction techniques.
- **Key Findings**: Proposed method shows promise for object recognition with efficient feature extraction.