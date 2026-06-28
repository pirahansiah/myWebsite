# Data Collection & Labelling Rules

## Webcam Capture
- Auto-capture mode by default (0.3s interval, 100 images)
- Save to `dataset/images/{class_name}/` structure
- JPEG format, quality 95
- Unique filenames: `{class}_{timestamp}_{index:05d}.jpg`

## SAM2 Auto-Labelling
- Use SAM2 + YOLO prompts for best accuracy
- Full-frame fallback box when SAM finds nothing
- Filter masks by relative area: min 1%, max 95%

## Label Format
- YOLO format: `<class_id> <cx> <cy> <w> <h>` (normalised)
- One .txt file per image, same stem name
- Labels directory mirrors images directory structure

## Dataset YAML
- Must contain: `path`, `train`, `val`, `nc`, `names`
- Default val split: 20%
