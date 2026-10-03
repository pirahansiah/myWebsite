---
name: cv-pipeline
description: Design a detection, tracking, segmentation or video-analytics pipeline. Use when the task is a vision pipeline rather than one model.
effort: high
---

# CV pipeline design

1. **Define the metric before the model.** What number decides success? (mAP, IoU, F1, P95 latency.)
2. **Frame the problem.** Detection vs segmentation vs tracking vs classification. Say why the simpler
   option is excluded before choosing the complex one.
3. **Data contract.** Input resolution, colour space, frame rate, preprocessing chain. It must be
   identical in training, export and on-device inference - write it down once in `docs/`.
4. **Model.** Smallest backbone that clears the metric. Ultralytics YOLO for detection/tracking,
   SAM2 for masks, OpenCV 5 for classical pre/post-processing.
5. **Tracking.** Only add a tracker if identity matters; ByteTrack-style association first, re-ID later.
6. **Post-processing.** NMS thresholds, class filtering, ROI masking - keep it in one tested function.
7. **Deployment.** Hand off to `quantize` -> `edge-deploy` -> `benchmark-model`.
8. **Report.** Metric table (FP32 vs INT8, per target) plus the exact commands.
