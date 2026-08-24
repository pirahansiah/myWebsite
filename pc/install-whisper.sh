#!/bin/bash
# Install whisper.cpp (CUDA) + multilingual model + STT wrapper on the WSL PC.
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
export PATH=/usr/local/cuda/bin:$PATH
/opt/whisper.cpp/build/bin/whisper-cli -m /opt/whisper.cpp/models/ggml-small.bin \
  -f "$1" -l "$2" -nt -np 2>/dev/null
WRAP
chmod +x /opt/bin/whisper-stt.sh
echo "=== smoke test (must fail gracefully on non-wav, but binary runs) ==="
echo "dummy" >/tmp/wsys_test.txt
/opt/bin/whisper-stt.sh /tmp/wsys_test.txt fa >/tmp/wsys_smoke.txt 2>&1 || true
head -3 /tmp/wsys_smoke.txt || true
echo "INSTALL_OK"