#!/bin/bash
# usage: whisper-stt.sh <wav-file> <lang>
#   <lang> = whisper short code (fa/en/de/ar/tr) or empty/"auto" for detection
export PATH=/usr/local/cuda/bin:$PATH
ARGS=(-m /opt/whisper.cpp/models/ggml-small.bin -f "$1" -nt -np)
if [ -n "$2" ] && [ "$2" != "auto" ]; then ARGS+=(-l "$2"); fi
/opt/whisper.cpp/build/bin/whisper-cli "${ARGS[@]}" 2>/dev/null
