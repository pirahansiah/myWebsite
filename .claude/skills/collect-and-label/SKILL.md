---
name: collect-and-label
description: "Capture webcam images and auto-label with SAM2 for YOLO training. Use when creating a new dataset, adding a class, or relabelling images."
---
# Collect & Label Dataset

Capture webcam images, auto-label with SAM2, and verify before training.

## Step 1: Capture images
```bash
python generateDataset4trainingWebcam.py --output dataset/ --class-name {CLASS}
```
- Images → `dataset/images/{class}/`, JPEG quality 95, unique `{class}_{timestamp}_{index}` names

## Step 2: Auto-label with SAM2
```bash
python autoLabelSAM2.py --data dataset/ --classes axelera hailo pcie
```
- YOLO format `<class_id> <cx> <cy> <w> <h>` (normalised), labels mirror image dir
- Filter masks by relative area (min 1%, max 95%); full-frame fallback box if SAM finds nothing

## Step 3: Verify labels
```bash
python viewLabels.py --data dataset/ --stats
```
- Confirm `dataset.yaml` has `path`, `train`, `val`, `nc`, `names` (default val split 20%)
