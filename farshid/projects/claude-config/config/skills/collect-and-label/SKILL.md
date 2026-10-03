---
name: collect-and-label
description: Capture images and auto-label with SAM2 for YOLO training. Use when creating a dataset, adding a class, or re-labelling.
effort: high
---

# Collect and label

## 1. Capture
- Fixed resolution and exposure; strip EXIF; one class per run where possible.
- Output `dataset/images/raw/` with a capture manifest (source, resolution, date, script).

## 2. Auto-label with SAM2
- Prompt boxes/points per class, export masks, convert to YOLO boxes.
- Confidence threshold: start at 0.75; raise until the mask no longer bleeds past the object.

## 3. Human verification (mandatory)
- Sample 10% (min 30 images) and count false positives/negatives. Report the sample size and error rate.
- Anything above 5% error: fix the prompt, re-run, re-sample.

## 4. Validate and split
- Normalized `class cx cy w h`; no zero-area boxes; class ids inside `names`.
- Split 70/20/10 **by capture session** to avoid frame leakage.
- Freeze 10% as a regression set and never train on it.

## 5. Report
- Class counts, split sizes, verification error rate, and any class under 50 instances.
