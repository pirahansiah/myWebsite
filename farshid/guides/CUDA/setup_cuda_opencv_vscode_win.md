
## CPP project CUDA 12.9, OpenCV in VSCode on Windows 11

Modern CUDA development on Windows with VS Code can be a little tricky to set up—but once you’ve nailed the right configuration, you’ll enjoy full IntelliSense, one-click builds, and integrated debugging. Below you’ll find a step-by-step rundown plus the complete `.vscode` configs you need.

Struggling with VSCode not hitting breakpoints in your CUDA project? Add -g -G to nvcc args in tasks.json for debug symbols. Set "stopAtEntry": true in launch.json to test. Rebuild & F5—now it stops! #CUDA #VSCodeDebug
---

### 1. The Challenges

* **NVCC not on PATH** in VS Code’s integrated terminal
* Missing **Windows SDK include/lib paths** at compile or link time
* VS Code’s **deprecated shell settings** and lack of auto-formatting
* Inconsistent IntelliSense between **MSVC** and **CUDA** code

---

### 2. The Solution at a Glance

1. **Inject CUDA’s bin folder** into every new terminal
2. Define a **custom CMD profile** that sets up PATH automatically
3. Provide separate IntelliSense configs for **MSVC** vs. **CUDA**
4. Centralize formatting, file-watch exclusions, and Code Runner hooks
5. Use a **single tasks.json** that calls NVCC with all the right includes, libs, and flags

---

### 3. Your Final `.vscode` Folder

#### c\_cpp\_properties.json

```json
{
  "version": 4,
  "configurations": [
    {
      "name": "MSVC x64",
      "includePath": [
        "${workspaceFolder}/**",
        "C:/Program Files/Microsoft Visual Studio/2022/Enterprise/VC/Tools/MSVC/14.42.34433/include",
        "C:/Program Files (x86)/Windows Kits/10/Include/10.0.22621.0/ucrt",
        "C:/Program Files (x86)/Windows Kits/10/Include/10.0.22621.0/shared",
        "C:/Program Files (x86)/Windows Kits/10/Include/10.0.22621.0/um",
        "C:/Program Files (x86)/Windows Kits/10/Include/10.0.22621.0/winrt"
      ],
      "defines": ["_DEBUG","UNICODE","_UNICODE"],
      "compilerPath": "C:/Program Files/Microsoft Visual Studio/2022/Enterprise/VC/Tools/MSVC/14.42.34433/bin/Hostx64/x64/cl.exe",
      "cStandard": "c17",
      "cppStandard": "c++17",
      "intelliSenseMode": "windows-msvc-x64",
      "browse": {
        "path": ["${workspaceFolder}/**"],
        "limitSymbolsToIncludedHeaders": true,
        "databaseFilename": "${workspaceFolder}/.vscode/browse.MSVC.db"
      }
    },
    {
      "name": "CUDA x64",
      "includePath": [
        "${workspaceFolder}/**",
        "C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.6/include",
        "C:/Program Files/Microsoft Visual Studio/2022/Enterprise/VC/Tools/MSVC/14.42.34433/include",
        "C:/Program Files (x86)/Windows Kits/10/Include/10.0.22621.0/ucrt",
        "C:/Program Files (x86)/Windows Kits/10/Include/10.0.22621.0/shared",
        "C:/Program Files (x86)/Windows Kits/10/Include/10.0.22621.0/um",
        "C:/Program Files (x86)/Windows Kits/10/Include/10.0.22621.0/winrt"
      ],
      "defines": ["__CUDACC__"],
      "compilerPath": "C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.6/bin/nvcc.exe",
      "cStandard": "c17",
      "cppStandard": "c++17",
      "intelliSenseMode": "gcc-x64",
      "compilerArgs": ["-arch=sm_50","--expt-relaxed-constexpr"],
      "browse": {
        "path": ["${workspaceFolder}/**"],
        "limitSymbolsToIncludedHeaders": true,
        "databaseFilename": "${workspaceFolder}/.vscode/browse.CUDA.db"
      }
    }
  ]
}
```

---

#### launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Build and Run CUDA",
      "type": "cppvsdbg",
      "request": "launch",
      "program": "${workspaceFolder}/cuda1.exe",
      "args": [],
      "stopAtEntry": false,
      "cwd": "${workspaceFolder}",
      "environment": [],
      "console": "integratedTerminal",
      "preLaunchTask": "Build CUDA Project"
    }
  ]
}
```

---

#### settings.json

```json
{
  "files.associations": {
    "*.cu": "cpp",
    "*.cuh": "cpp",
    "*.yrf": "json",
    "*.rpx": "xml",
    "*.stl": "json",
    "iostream": "cpp",
    "ostream": "cpp"
  },
  "editor.defaultFormatter": "ms-vscode.cpptools",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.tabSize": 4,
  "editor.insertSpaces": true,

  "C_Cpp.default.cppStandard": "c++17",
  "C_Cpp.default.cStandard": "c17",
  "C_Cpp.default.intelliSenseMode": "windows-msvc-x64",
  "C_Cpp.formatting": "clangFormat",
  "C_Cpp.clang_format_fallbackStyle": "Visual Studio",
  "C_Cpp.errorSquiggles": "Enabled",
  "C_Cpp.loggingLevel": "Warning",

  "files.watcherExclude": {
    "**/build/**": true,
    "**/.vscode/**": true
  },

  // Ensure nvcc is always on PATH in VS Code terminals
  "terminal.integrated.env.windows": {
    "PATH": "${env:PATH};C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA\\v12.6\\bin"
  },
  "terminal.integrated.profiles.windows": {
    "CMD with CUDA": {
      "path": "${env:windir}\\Sysnative\\cmd.exe",
      "args": [
        "/k",
        "set \"PATH=C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA\\v12.6\\bin;%PATH%\""
      ]
    },
    "Command Prompt": {
      "path": "${env:windir}\\Sysnative\\cmd.exe",
      "args": []
    }
  },
  "terminal.integrated.defaultProfile.windows": "CMD with CUDA",
  "terminal.integrated.cwd": "${workspaceFolder}",

  "code-runner.runInTerminal": true,
  "code-runner.saveFileBeforeRun": true,
  "code-runner.clearPreviousOutput": true,
  "code-runner.executorMapByFileExtension": {
    ".cu": "nvcc \"$fileName\" -o \"$fileNameWithoutExt\" && \"$fileNameWithoutExt\""
  }
}
```

---

#### tasks.json

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build CUDA Project",
      "type": "shell",
      "command": "C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA\\v12.6\\bin\\nvcc.exe",
      "options": {
        "cwd": "${workspaceFolder}"
      },
      "args": [
        "-I", "${workspaceFolder}",
        "-I", "C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\VC\\Tools\\MSVC\\14.42.34433\\include",
        "-I", "C:\\Program Files (x86)\\Windows Kits\\10\\Include\\10.0.22621.0\\ucrt",
        "-I", "C:\\Program Files (x86)\\Windows Kits\\10\\Include\\10.0.22621.0\\shared",
        "-I", "C:\\Program Files (x86)\\Windows Kits\\10\\Include\\10.0.22621.0\\um",
        "-I", "C:\\Program Files (x86)\\Windows Kits\\10\\Include\\10.0.22621.0\\winrt",
        "-I", "C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA\\v12.6\\include",
        "-arch=sm_50",
        "--expt-relaxed-constexpr",
        "${workspaceFolder}\\cuda1.cu",
        "-o", "${workspaceFolder}\\cuda1.exe",
        "-Xlinker", "/LIBPATH:C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\VC\\Tools\\MSVC\\14.42.34433\\lib\\x64",
        "-Xlinker", "/LIBPATH:C:\\Program Files (x86)\\Windows Kits\\10\\Lib\\10.0.22621.0\\ucrt\\x64",
        "-Xlinker", "/LIBPATH:C:\\Program Files (x86)\\Windows Kits\\10\\Lib\\10.0.22621.0\\um\\x64",
        "-Xlinker", "/LIBPATH:C:\\Program Files (x86)\\Windows Kits\\10\\Lib\\10.0.22621.0\\winrt\\x64",
        "-Xlinker", "/LIBPATH:C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA\\v12.6\\lib\\x64",
        "-Xlinker", "user32.lib"
      ],
      "group": {"kind":"build","isDefault":true},
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": true,
        "panel": "shared",
        "clear": false
      },
      "problemMatcher": ["$msCompile"]
    }
  ]
}
```

---

### 4. Usage

1. **Save** all four files into your project’s `.vscode` directory.
2. **Restart** VS Code completely.
3. Press **Ctrl+Shift+B** to build.
4. Press **F5** to debug—your output appears right in the integrated terminal.

That’s it! You now have a rock-solid CUDA + VS Code setup on Windows 11. Enjoy blazing-fast development!
