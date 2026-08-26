#!/bin/bash
# Install whisper.cpp (CUDA) + multilingual model + STT wrapper on the WSL PC.
# Self-logging so it can be launched with a bare `bash <file>` (no shell metachar).
exec > /tmp/whisper_install.log 2>&1
set -e
export PATH=/usr/local/cuda/bin:$PATH
echo "=== git clone whisper.cpp ==="
[ -d /opt/whisper.cpp ] || git clone --depth 1 https://github.com/ggml-org/whisper.cpp /opt/whisper.cpp
echo "=== cmake build (CUDA sm_120) ==="
cd /opt/whisper.cpp
cmake -B build -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=120 -DCMAKE_BUILD_TYPE=Release >/tmp/wsys_cmake.log 2>&1 || { echo CMAKE_FAIL; tail -20 /tmp/wsys_cmake.log; exit 1; }
cmake --build build --config Release -j$(nproc) >/tmp/wsys_build.log 2>&1 || { echo BUILD_FAIL; tail -30 /tmp/wsys_build.log; exit 1; }
echo "=== whisper-cli binary ==="
ls -la build/bin/whisper-cli
echo "=== download multilingual model (ggml-small) ==="
[ -f /opt/whisper.cpp/models/ggml-small.bin ] || curl -L --max-time 1200 -o /opt/whisper.cpp/models/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
ls -la /opt/whisper.cpp/models/ggml-small.bin
echo "=== write STT wrapper ==="
cat > /opt/bin/whisper-stt.sh <<'WRAP'
#!/bin/bash
# usage: whisper-stt.sh <wav-file> <lang>
#   <lang> = whisper short code (fa/en/de/ar/tr) or empty/"auto" for detection
export PATH=/usr/local/cuda/bin:$PATH
ARGS=(-m /opt/whisper.cpp/models/ggml-small.bin -f "$1" -nt -np)
if [ -n "$2" ] && [ "$2" != "auto" ]; then ARGS+=(-l "$2"); fi
/opt/whisper.cpp/build/bin/whisper-cli "${ARGS[@]}" 2>/dev/null
WRAP
chmod +x /opt/bin/whisper-stt.sh
echo "=== smoke test (differs from how deploy-agent.sh handles it) ==="
echo "dummy" >/tmp/wsys_test.txt
/opt/bin/whisper-stt.sh /tmp/wsys_test.txt "" >/tmp/wsys_smoke.txt 2>&1 || true
head -3 /tmp/wsys_smoke.txt || true
echo "INSTALL_OK"