# Markdown Motion Studio

`master_motion.py` generates short, silent MP4 treatments from pages in `farshid/content/`: a 2D concept map, an editorial motion-graphic, and a perspective 3D title card. It uses each page's front-matter title (or first H1) and extracts a few topic words from its text. The source Markdown remains untouched unless `--embed` is given.

## Setup

Requirements: Python 3.10+, FFmpeg with the `libx264` encoder, and the Python packages listed in `requirements.txt`.

```sh
python3 -m pip install -r farshid/projects/md-motion-studio/requirements.txt
```

FFmpeg must be available on `PATH`. If it is installed elsewhere, provide its executable with `--ffmpeg /absolute/path/to/ffmpeg` or set `FFMPEG`.

## Select pages and generate

Run from the website root, or invoke the script by absolute/relative path; it finds the repository root automatically:

```sh
python3 farshid/projects/md-motion-studio/master_motion.py --pages computer-vision.md localAI.md
```

That creates all three video styles for each selected page. Output is organized beneath `farshid/assets/motion/<page-slug>/`:

- `2d.mp4` and `2d.jpg`
- `motion.mp4` and `motion.jpg`
- `3d.mp4` and `3d.jpg`

Each clip is 960×540, six seconds, 24 fps, H.264/yuv420p. The videos are silent and play only when a visitor presses the native player control.

Options:

```sh
# Only one visual treatment
python3 farshid/projects/md-motion-studio/master_motion.py --pages computer-vision --mode 3d

# Add/refresh playable video figures at the end of each selected Markdown page
python3 farshid/projects/md-motion-studio/master_motion.py --pages computer-vision --embed

# Every .md file in farshid/content (renders many videos; use deliberately)
python3 farshid/projects/md-motion-studio/master_motion.py --all --mode motion
```

With no `--pages` or `--all`, the program prompts for comma-separated filenames/slugs or `all`. Filenames can include or omit `.md`. `--mode` accepts `2d`, `motion`, `3d`, or `all` (default). `--embed` inserts or replaces a marked HTML video block in the selected Markdown page; rerunning it is safe. It never changes page text without that flag.

After generation, review the MP4s/posters and Markdown diff. For site publication, commit the selected media files and any embedded Markdown changes, then run the website's normal index/static-page generators and deploy through the existing workflow. Generated media can be large; avoid running `--all` unless that is intended.
