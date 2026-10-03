# Data capture and labelling

- Capture: fixed resolution, fixed exposure, one class per run where possible, EXIF stripped.
- Webcam/stream capture writes `dataset/images/<split>/*.jpg` and `dataset/labels/<split>/*.txt`.
- Auto-label with SAM2, then **human-verify** a sample before training; report the sample size.
- YOLO label format: `class cx cy w h`, all normalized 0-1, one file per image, same basename.
- Every dataset carries `dataset.yaml` with `path`, `train`, `val`, `names`.
- Splits: 70/20/10 by capture session, never by frame (adjacent frames leak across splits).
- Keep 10% of frames as a frozen regression set; never train on it.
- Record class balance; a class under 50 instances is flagged before training starts.
