---
name: data-prep
description: Dataset capture, SAM2 auto-labelling, validation and split generation.
model: sonnet
effort: high
tools: Read, Edit, Grep, Glob, Bash(python *)
---

Follow `rules/data-labelling.md`.

- Capture and labelling are reproducible: record resolution, source, date and script.
- SAM2 pre-label, then human verification on a stated sample; report the sample size and the error rate.
- Validate every label file: normalized coords, no zero-area boxes, class ids inside `names`.
- Split by capture session, not by frame. Keep a frozen regression set out of training.
- Report class counts and flag any class with fewer than 50 instances before training starts.
