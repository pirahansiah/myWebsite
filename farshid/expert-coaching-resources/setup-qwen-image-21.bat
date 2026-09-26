@echo off
REM ===========================================================================
REM  setup-qwen-image-21.bat
REM  Full install of Qwen-Image-2.1 text-to-image on an 8 GB NVIDIA GPU.
REM
REM  Tested on Windows 11 with an RTX 4060 Laptop.
REM
REM  What this does, in order:
REM    1. check prerequisites (python, git, curl, nvidia-smi)
REM    2. create the folder tree
REM    3. download the three model files and verify their SHA256
REM    4. fix the GGUF header (adds general.architecture = qwen_image21)
REM    5. clone ComfyUI and build a venv
REM    6. install cu130 PyTorch
REM    7. clone ComfyUI-GGUF
REM    8. write extra_model_paths.yaml, gen.py and the server launcher
REM    9. verify
REM
REM  Usage:
REM    setup-qwen-image-21.bat                 install into D:\ollama
REM    setup-qwen-image-21.bat E:\ai\ollama    install into a given path
REM
REM  Re-running is safe. Downloads resume, existing folders are reused.
REM ===========================================================================

setlocal EnableDelayedExpansion

set "ROOT=%~1"
if "%ROOT%"=="" set "ROOT=D:\ollama"

set "COMFY=%ROOT%\comfyui"
set "MODELS=%ROOT%\qwen-image-2.1"
set "TE_DIR=%MODELS%\text_encoders"
set "VAE_DIR=%MODELS%\vae"
set "DM_DIR=%MODELS%\diffusion_models"
set "VENV_PY=%COMFY%\.venv\Scripts\python.exe"

echo ============================================================
echo  Qwen-Image-2.1 local installer
echo ============================================================
echo  install path : %ROOT%
echo  comfyui      : %COMFY%
echo  models       : %MODELS%
echo ============================================================
echo.

REM ------------------------------------------------------------------ [1/9]
echo --- [1/9] prerequisites ---

where curl >nul 2>&1 || (echo   ERROR: curl not found & goto :fail)
where git  >nul 2>&1 || (echo   ERROR: git not found  & goto :fail)
echo   curl: OK
echo   git : OK

where python >nul 2>&1 || (echo   ERROR: python not found & goto :fail)
for /f "delims=" %%i in ('where python') do (
  set "SYS_PY=%%i"
  goto :got_py
)
:got_py
echo   python: %SYS_PY%

where nvidia-smi >nul 2>&1 && (
  for /f "delims=" %%i in ('nvidia-smi --query-gpu^=name,memory.total --format^=csv,noheader 2^>nul') do echo   GPU: %%i
) || echo   WARN: nvidia-smi not found - this script assumes an NVIDIA GPU
echo.

REM ------------------------------------------------------------------ [2/9]
echo --- [2/9] folder tree ---
if not exist "%DM_DIR%"       mkdir "%DM_DIR%"
if not exist "%TE_DIR%"       mkdir "%TE_DIR%"
if not exist "%VAE_DIR%"      mkdir "%VAE_DIR%"
echo   %DM_DIR%
echo   %TE_DIR%
echo   %VAE_DIR%
echo.

REM ------------------------------------------------------------------ [3/9]
echo --- [3/9] model files ---
echo   source: huggingface.co/abenzerps/Qwen-Image-2.1-Uncensored-GGUF
echo           huggingface.co/Comfy-Org/Qwen3-VL  (text encoder, official)
echo.

set "U_GGUF=https://huggingface.co/abenzerps/Qwen-Image-2.1-Uncensored-GGUF/resolve/main"
set "U_TE=https://huggingface.co/Comfy-Org/Qwen3-VL/resolve/main/text_encoders"
set "U_VAE=https://huggingface.co/abenzerps/Qwen-Image-2.1-Uncensored-GGUF/resolve/main"

call :fetch "%U_GGUF%/qwen-image-2.1-Q4_K_M.gguf" "%DM_DIR%\qwen-image-2.1-Q4_K_M.gguf"
if errorlevel 1 goto :fail

call :fetch "%U_TE%/qwen3vl_8b_int8_convrot.safetensors" "%TE_DIR%\qwen3vl_8b_int8_convrot.safetensors"
if errorlevel 1 goto :fail

call :fetch "%U_VAE%/vae/qwen_image_2.1_vae_bf16.safetensors" "%VAE_DIR%\qwen_image_2.1_vae_bf16.safetensors"
if errorlevel 1 goto :fail
echo.

echo --- verifying downloads ---
set "VERIFY_FAIL=0"
call :verify "%DM_DIR%\qwen-image-2.1-Q4_K_M.gguf" "833439e91bc1152d28f37aa198c7f6f4218b7de95754c2f7a318a2422ab4b2f8"
if errorlevel 1 set "VERIFY_FAIL=1"
call :verify "%TE_DIR%\qwen3vl_8b_int8_convrot.safetensors" "8bfd0f6e12abf2d2d697ecc888e5e90b0d6741d6708f05799f53afa560452e8f"
if errorlevel 1 set "VERIFY_FAIL=1"
call :verify "%VAE_DIR%\qwen_image_2.1_vae_bf16.safetensors" "bb21f7473051e1ac368515dd3f2e15cd44d7a11748ee8823e1ddca3e4876b7c9"
if errorlevel 1 set "VERIFY_FAIL=1"
if "%VERIFY_FAIL%"=="1" (
  echo   ERROR: a file failed verification. Delete the bad file and re-run.
  goto :fail
)
echo.

REM ------------------------------------------------------------------ [4/9]
echo --- [4/9] GGUF header fix ---
set "ARCH_GGUF=%DM_DIR%\qwen-image-2.1-Q4_K_M-arch.gguf"
if exist "%ARCH_GGUF%" (
  echo   already present: qwen-image-2.1-Q4_K_M-arch.gguf
  goto :header_done
)

echo   writing a copy with general.architecture = qwen_image21
set "FIXPY=%TEMP%\qwen_arch_fix.py"
> "%FIXPY%" echo import os
>>"%FIXPY%" echo import struct
>>"%FIXPY%" echo import sys
>>"%FIXPY%" echo.
>>"%FIXPY%" echo src, dst = sys.argv[1], sys.argv[2]
>>"%FIXPY%" echo.
>>"%FIXPY%" echo if not os.path.exists(src):
>>"%FIXPY%" echo     print("  ERROR: source gguf not found: %s" %% src)
>>"%FIXPY%" echo     sys.exit(1)
>>"%FIXPY%" echo.
>>"%FIXPY%" echo f = open(src, "rb")
>>"%FIXPY%" echo if f.read(4) != b"GGUF":
>>"%FIXPY%" echo     print("  ERROR: not a GGUF file")
>>"%FIXPY%" echo     sys.exit(1)
>>"%FIXPY%" echo version = struct.unpack("^<I", f.read(4))[0]
>>"%FIXPY%" echo tensor_count = struct.unpack("^<Q", f.read(8))[0]
>>"%FIXPY%" echo kv_count = struct.unpack("^<Q", f.read(8))[0]
>>"%FIXPY%" echo.
>>"%FIXPY%" echo TYPE_SIZE = {0: 1, 1: 1, 2: 2, 3: 2, 4: 4, 5: 4, 6: 4, 7: 1, 10: 8, 11: 8, 12: 8}
>>"%FIXPY%" echo.
>>"%FIXPY%" echo def read_string():
>>"%FIXPY%" echo     n = struct.unpack("^<Q", f.read(8))[0]
>>"%FIXPY%" echo     return f.read(n).decode("utf-8", "replace")
>>"%FIXPY%" echo.
>>"%FIXPY%" echo def skip_value(t):
>>"%FIXPY%" echo     if t == 8:
>>"%FIXPY%" echo         read_string()
>>"%FIXPY%" echo     elif t == 9:
>>"%FIXPY%" echo         et = struct.unpack("^<I", f.read(4))[0]
>>"%FIXPY%" echo         n = struct.unpack("^<Q", f.read(8))[0]
>>"%FIXPY%" echo         for _ in range(n):
>>"%FIXPY%" echo             skip_value(et)
>>"%FIXPY%" echo     elif t in TYPE_SIZE:
>>"%FIXPY%" echo         f.read(TYPE_SIZE[t])
>>"%FIXPY%" echo     else:
>>"%FIXPY%" echo         print("  ERROR: unknown gguf value type %d" %% t)
>>"%FIXPY%" echo         sys.exit(1)
>>"%FIXPY%" echo.
>>"%FIXPY%" echo kv_ranges = []
>>"%FIXPY%" echo names = []
>>"%FIXPY%" echo for _ in range(kv_count):
>>"%FIXPY%" echo     start = f.tell()
>>"%FIXPY%" echo     names.append(read_string())
>>"%FIXPY%" echo     t = struct.unpack("^<I", f.read(4))[0]
>>"%FIXPY%" echo     skip_value(t)
>>"%FIXPY%" echo     kv_ranges.append((start, f.tell(), t))
>>"%FIXPY%" echo.
>>"%FIXPY%" echo data_from = f.tell()
>>"%FIXPY%" echo f.close()
>>"%FIXPY%" echo.
>>"%FIXPY%" echo have = set(names)
>>"%FIXPY%" echo add = []
>>"%FIXPY%" echo if "general.architecture" not in have:
>>"%FIXPY%" echo     add.append(("general.architecture", "qwen_image21"))
>>"%FIXPY%" echo if "general.name" not in have:
>>"%FIXPY%" echo     add.append(("general.name", "qwen_image21"))
>>"%FIXPY%" echo.
>>"%FIXPY%" echo src_f = open(src, "rb")
>>"%FIXPY%" echo tmp = dst + ".tmp"
>>"%FIXPY%" echo with open(tmp, "wb") as out:
>>"%FIXPY%" echo     out.write(b"GGUF")
>>"%FIXPY%" echo     out.write(struct.pack("^<I", version))
>>"%FIXPY%" echo     out.write(struct.pack("^<Q", tensor_count))
>>"%FIXPY%" echo     out.write(struct.pack("^<Q", kv_count + len(add)))
>>"%FIXPY%" echo     for (start, end, _t) in kv_ranges:
>>"%FIXPY%" echo         src_f.seek(start)
>>"%FIXPY%" echo         out.write(src_f.read(end - start))
>>"%FIXPY%" echo     for key, val in add:
>>"%FIXPY%" echo         kb = key.encode("utf-8")
>>"%FIXPY%" echo         out.write(struct.pack("^<Q", len(kb)))
>>"%FIXPY%" echo         out.write(kb)
>>"%FIXPY%" echo         out.write(struct.pack("^<I", 8))
>>"%FIXPY%" echo         vb = val.encode("utf-8")
>>"%FIXPY%" echo         out.write(struct.pack("^<Q", len(vb)))
>>"%FIXPY%" echo         out.write(vb)
>>"%FIXPY%" echo     src_f.seek(data_from)
>>"%FIXPY%" echo     while True:
>>"%FIXPY%" echo         chunk = src_f.read(8 * 1024 * 1024)
>>"%FIXPY%" echo         if not chunk:
>>"%FIXPY%" echo             break
>>"%FIXPY%" echo         out.write(chunk)
>>"%FIXPY%" echo src_f.close()
>>"%FIXPY%" echo os.replace(tmp, dst)
>>"%FIXPY%" echo.
>>"%FIXPY%" echo ok = False
>>"%FIXPY%" echo try:
>>"%FIXPY%" echo     from gguf import GGUFReader
>>"%FIXPY%" echo     r = GGUFReader(dst)
>>"%FIXPY%" echo     ok = r.fields.get("general.architecture") is not None
>>"%FIXPY%" echo     print("  arch key : %%s" %% ("qwen_image21" if ok else "MISSING"))
>>"%FIXPY%" echo     print("  tensors  : %%d" %% len(r.tensors))
>>"%FIXPY%" echo except Exception as e:
>>"%FIXPY%" echo     print("  (could not re-read: %%s)" %% e)
>>"%FIXPY%" echo print("  wrote %%s (%%d bytes)" %% (os.path.basename(dst), os.path.getsize(dst)))
>>"%FIXPY%" echo sys.exit(0 if ok else 2)

REM gguf lib comes from ComfyUI-GGUF, installed later. Use system python + a
REM temporary install if needed.
"%SYS_PY%" -c "import gguf" >nul 2>&1
if errorlevel 1 (
  echo   installing the gguf python package for the header fix
  "%SYS_PY%" -m pip install --quiet gguf 2>nul
)

"%SYS_PY%" "%FIXPY%" "%DM_DIR%\qwen-image-2.1-Q4_K_M.gguf" "%ARCH_GGUF%"
if errorlevel 1 echo   WARN: header fix did not verify. The model may load in compatibility mode.

:header_done
echo.

REM ------------------------------------------------------------------ [5/9]
echo --- [5/9] ComfyUI ---
if exist "%COMFY%\.git" (
  echo   already cloned
) else (
  echo   cloning ComfyUI
  git clone https://github.com/comfyanonymous/ComfyUI "%COMFY%"
  if errorlevel 1 (echo   ERROR: git clone failed & goto :fail)
)

cd /d "%COMFY%" || (echo   ERROR: cannot enter %COMFY% & goto :fail)

if exist "%VENV_PY%" (
  echo   venv already exists
) else (
  echo   creating venv
  "%SYS_PY%" -m venv .venv
  if errorlevel 1 (echo   ERROR: venv creation failed & goto :fail)
)

REM ------------------------------------------------------------------ [6/9]
echo --- [6/9] PyTorch cu130 ---
"%VENV_PY%" -m pip install --upgrade pip --quiet
"%VENV_PY%" -c "import torch,sys; sys.exit(0 if torch.version.cuda=='13.0' else 1)" >nul 2>&1
if not errorlevel 1 (
  echo   torch cu130 already installed
) else (
  echo   installing torch 2.14.0+cu130, about 2.5 GB
  "%VENV_PY%" -m pip install --no-cache-dir ^
    "torch==2.14.0+cu130" "torchvision==0.29.0+cu130" "torchaudio==2.11.0+cu130" ^
    --index-url https://download.pytorch.org/whl/cu130
  if errorlevel 1 (echo   ERROR: torch install failed & goto :fail)
)
echo   ComfyUI requirements
"%VENV_PY%" -m pip install -r requirements.txt --quiet

REM ------------------------------------------------------------------ [7/9]
echo --- [7/9] ComfyUI-GGUF ---
if exist "custom_nodes\ComfyUI-GGUF\.git" (
  echo   already cloned
) else (
  git clone https://github.com/city96/ComfyUI-GGUF custom_nodes\ComfyUI-GGUF
  if errorlevel 1 (echo   ERROR: git clone ComfyUI-GGUF failed & goto :fail)
)
if exist "custom_nodes\ComfyUI-GGUF\requirements.txt" (
  "%VENV_PY%" -m pip install -r custom_nodes\ComfyUI-GGUF\requirements.txt --quiet
)

REM ------------------------------------------------------------------ [8/9]
echo --- [8/9] configuration and scripts ---

> "%COMFY%\extra_model_paths.yaml" echo # ComfyUI extra model paths
>>"%COMFY%\extra_model_paths.yaml" echo # Keeps the Qwen-Image-2.1 weights in one place.
>>"%COMFY%\extra_model_paths.yaml" echo qwen_image_21:
>>"%COMFY%\extra_model_paths.yaml" echo     base_path: %MODELS:\=/%
>>"%COMFY%\extra_model_paths.yaml" echo     diffusion_models: ^|
>>"%COMFY%\extra_model_paths.yaml" echo         diffusion_models
>>"%COMFY%\extra_model_paths.yaml" echo     unet: ^|
>>"%COMFY%\extra_model_paths.yaml" echo         diffusion_models
>>"%COMFY%\extra_model_paths.yaml" echo     text_encoders: ^|
>>"%COMFY%\extra_model_paths.yaml" echo         text_encoders
>>"%COMFY%\extra_model_paths.yaml" echo     clip: ^|
>>"%COMFY%\extra_model_paths.yaml" echo         text_encoders
>>"%COMFY%\extra_model_paths.yaml" echo     vae: ^|
>>"%COMFY%\extra_model_paths.yaml" echo         vae
echo   wrote extra_model_paths.yaml

if not exist "%ROOT%\im.txt" (
  > "%ROOT%\im.txt" echo a red apple on a wooden table, studio lighting, photorealistic
  echo   wrote im.txt
)

REM gen.py is written by the matching .sh script; if it is absent, copy the
REM known-good logic here.
if exist "%ROOT%\gen.py" (
  echo   gen.py already present
) else (
  echo   NOTE: gen.py not found. Run setup-qwen-image-21.sh to create it,
  echo         or place your own gen.py at %ROOT%\gen.py
)

> "%ROOT%\start-server.bat" echo @echo off
>>"%ROOT%\start-server.bat" echo REM Start the ComfyUI server in its own window.
>>"%ROOT%\start-server.bat" echo REM Output goes to a FILE, never a pipe: the tqdm progress bar
>>"%ROOT%\start-server.bat" echo REM flushes stderr, and a closed pipe makes the sampler fail
>>"%ROOT%\start-server.bat" echo REM with OSError [Errno 22] Invalid argument.
>>"%ROOT%\start-server.bat" echo cd /d "%COMFY%"
>>"%ROOT%\start-server.bat" echo start "ComfyUI server" /min cmd /c ""%VENV_PY%" main.py --listen 127.0.0.1 --port 8188 --preview-method none ^>^> "%COMFY%\server.log" 2^>^&1"
>>"%ROOT%\start-server.bat" echo echo ComfyUI server starting. Wait about 60 seconds.
>>"%ROOT%\start-server.bat" echo timeout /t 5 ^>nul
echo   wrote start-server.bat

if exist "%ROOT%\gen.py" (
  > "%ROOT%\gen.bat" echo @echo off
  >>"%ROOT%\gen.bat" echo "%%VENV_PY%%" "%ROOT%\gen.py" im.txt
  >>"%ROOT%\gen.bat" echo echo.
  >>"%ROOT%\gen.bat" echo pause
  echo   wrote gen.bat
)

REM ------------------------------------------------------------------ [9/9]
echo --- [9/9] verification ---
"%VENV_PY%" -c "import torch; print('  torch :', torch.__version__); print('  cuda  :', torch.version.cuda); print('  avail :', torch.cuda.is_available()); print('  device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"

echo.
echo ============================================================
echo  INSTALL COMPLETE
echo ============================================================
echo.
echo  Next steps:
echo    1. start the server:   %ROOT%\start-server.bat
echo    2. wait about 60 seconds
echo    3. generate an image:  cd /d %ROOT% ^&^& gen.bat
echo.
echo  Your prompt file : %ROOT%\im.txt
echo  Images land in   : %COMFY%\output
echo.
echo  If the image is noise on every prompt, node 2 is using the wrong
echo  loader. It must be CLIPLoader, not CLIPLoaderGGUF.
echo.
goto :eof

REM ===========================================================================
REM  subroutines
REM ===========================================================================

:fetch
REM %1 = url   %2 = output path
setlocal
set "URL=%~1"
set "OUT=%~2"
if exist "%OUT%" (
  echo   already present: %~nx2
  endlocal & exit /b 0
)
echo   downloading: %~nx2
curl -L -C - --retry 5 --retry-delay 5 -f -o "%OUT%" "%URL%"
if errorlevel 1 (
  echo   ERROR: download failed: %~nx2
  endlocal & exit /b 1
)
endlocal & exit /b 0

:verify
REM %1 = file   %2 = expected sha256
setlocal
set "F=%~1"
set "WANT=%~2"
if not exist "%F%" (
  echo   MISSING %~nx1
  endlocal & exit /b 1
)
for /f "skip=1 delims=" %%h in ('certutil -hashfile "%F%" SHA256 ^| findstr /r "^[0-9a-f]"') do (
  set "GOT=%%h"
  goto :verify_got
)
:verify_got
set "GOT=%GOT: =%"
if /i "%GOT%"=="%WANT%" (
  echo   OK  %~nx1
  endlocal & exit /b 0
)
echo   BAD %~nx1
echo       expected %WANT%
echo       got      %GOT%
endlocal & exit /b 1

:fail
echo.
echo ============================================================
echo  INSTALL STOPPED
echo ============================================================
echo  Fix the error above and run this file again. Downloads resume.
echo.
endlocal
exit /b 1