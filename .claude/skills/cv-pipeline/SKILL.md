---
name: cv-pipeline
description: "Build computer vision pipelines — detection, tracking, segmentation, annotation, video analysis."
trigger: /cv-pipeline
---

# /cv-pipeline

Computer vision pipeline construction workflow.

## Usage

```
/cv-pipeline detect <video>                          # Object detection
/cv-pipeline track <video>                           # Multi-object tracking
/cv-pipeline segment <image>                         # Image segmentation
/cv-pipeline annotate <video>                        # Auto-annotation
/cv-pipeline analyze <video>                         # Video analysis
/cv-pipeline full <video>                            # Complete pipeline
```

## Pipeline Components

### Detection (YOLOv11)
```python
from src.detector import ObjectDetector

detector = ObjectDetector(model="yolo11n.pt")
results = detector.detect(image)
results = detector.detect_video(video_path)
results = detector.detect_webcam()
```

### Tracking (ByteTrack)
```python
from src.tracker import ObjectTracker

tracker = ObjectTracker()
tracks = tracker.track(video_path)
trajectories = tracker.get_trajectories()
```

### Segmentation (SAM-2)
```python
from src.segmentation import ImageSegmenter

segmenter = ImageSegmenter()
masks = segmenter.segment(image, points=[[x, y]])
polygons = segmenter.segment_interactive(image)
```

### Annotation (COCO/YOLO/VOC)
```python
from src.annotator import AnnotationGenerator

annotator = AnnotationGenerator()
coco_json = annotator.generate_coco(detections)
yolo_txt = annotator.generate_yolo(detections)
voc_xml = annotator.generate_voc(detections)
```

### Auto-Labeling
```python
from src.auto_labeler import AutoLabeler

labeler = AutoLabeler()
labels = labeler.label_video(video_path, confidence_threshold=0.7)
labeler.propagate_labels(video_path, initial_labels)
```

### Video Analysis
```python
from src.video_analyzer import VideoAnalyzer

analyzer = VideoAnalyzer()
motion = analyzer.detect_motion(video_path)
optical_flow = analyzer.compute_optical_flow(video_path)
```

### Quality Assessment
```python
from src.quality import QualityAssessor

assessor = QualityAssessor()
quality = assessor.assess_quality(annotations)
duplicates = assessor.detect_duplicates(annotations)
```

## Full Pipeline
```python
from src.pipeline import AnnotationPipeline

pipeline = AnnotationPipeline()
results = pipeline.process_video(
    video_path="input.mp4",
    output_dir="annotations/",
    formats=["coco", "yolo"],
)
report = pipeline.generate_report()
```

## Output
- Detection results (bounding boxes, classes, confidence)
- Tracking results (trajectories, IDs)
- Segmentation masks and polygons
- Annotations in COCO/YOLO/VOC formats
- Quality assessment report
- Video analysis metrics
