---
layout: farshid_default
title: "Mac as LLM inference only"
permalink: /expert-coaching-resources/LocalLLMonMac/
description: "Mac as LLM inference only"
---


# LocalLLMonMac
# Mac as LLM inference only 


The best approach is to turn the Mac into a **headless inference appliance**: macOS remains installed for Metal/MLX, but you avoid running a normal desktop session.

Do not chase the “free RAM” number. Apple notes that unused RAM does not inherently improve performance; **Memory Pressure** and growing swap usage are the useful indicators. ([Apple Support][1])

## 1. Use a dedicated macOS account

Create a standard user named something like `llm`.

For a machine used only for inference:

* Do not connect Mail, Messages, Photos, or other personal applications.
* Ideally, do not sign that account into an Apple Account.
* Otherwise, disable iCloud Drive, Photos, and unnecessary application syncing under **System Settings → Apple Account → iCloud**. ([Apple Support][2])

A completely fresh macOS installation provides the cleanest starting point, but it is not mandatory.

## 2. Remove background applications

Open:

**System Settings → General → Login Items & Extensions**

Under **Open at Login**, remove everything not required.

Under **App Background Activity**, disable nonessential third-party software. Apple confirms these applications can continue checking for updates or synchronizing data even when their main applications are closed. ([Apple Support][3])

Especially remove or uninstall:

* Dropbox, OneDrive and Google Drive
* Adobe Creative Cloud
* Teams, Slack and Discord
* Docker Desktop
* VPN clients you do not require
* Antivirus or endpoint software, where company policy permits
* Menu-bar utilities
* GUI model applications such as LM Studio when using `llama-server` directly

Uninstalling unused software is better than merely closing its window because helper processes may continue running.

## 3. Enable SSH and disable other sharing

Open:

**System Settings → General → Sharing**

Enable only **Remote Login**, and restrict access to the dedicated `llm` user. Remote Login provides SSH access without requiring a normal desktop workflow. ([Apple Support][4])

Disable unnecessary services such as:

* Screen Sharing
* Remote Management
* File Sharing
* Media Sharing
* Content Caching
* AirPlay Receiver

## 4. Run without an active desktop session

After configuring the machine:

1. Restart it.
2. Leave it at the macOS login screen.
3. Connect from another computer through SSH:

```bash
ssh llm@your-mac-hostname.local
```

Running through SSH avoids browsers, Finder windows, GUI model frontends and most user-session applications.

Install `tmux` so the inference server keeps running after the SSH connection closes:

```bash
brew install tmux
tmux new -s llm
```

Then start the server:

```bash
caffeinate -dimsu /opt/homebrew/bin/llama-server \
  --model /Users/llm/Models/model.gguf \
  --n-gpu-layers all \
  --ctx-size 8192 \
  --parallel 1 \
  --host 127.0.0.1 \
  --port 8080
```

Current `llama.cpp` builds enable Metal by default on macOS, and `--n-gpu-layers all` requests that all possible layers be stored for GPU processing. ([GitHub][5])

Detach from `tmux` with:

```text
Ctrl-B, then D
```

Reconnect later with:

```bash
tmux attach -t llm
```

Access the API securely from another computer with an SSH tunnel:

```bash
ssh -L 8080:127.0.0.1:8080 llm@your-mac-hostname.local
```

You can then use `http://127.0.0.1:8080` on the client computer. `llama-server` binds to localhost by default, which is safer than exposing it directly to the network. ([GitHub][6])

## 5. Reduce the model’s memory requirement

This typically saves much more memory than modifying macOS.

Use:

* A 4-bit or 5-bit quantized model
* `--parallel 1` for one simultaneous context
* The smallest context window you actually require
* No vision projection model unless needed
* No additional draft model unless speculative decoding is beneficial

Context length directly controls KV-cache allocation. Do not use a model’s maximum 32K, 128K or larger context merely because it supports it. Set an explicit value such as:

```bash
--ctx-size 4096
```

or:

```bash
--ctx-size 8192
```

`llama.cpp` also supports quantized KV-cache formats:

```bash
--cache-type-k q8_0 \
--cache-type-v q8_0
```

More aggressive values such as `q4_0` use less memory, but should be benchmarked for quality and performance with your specific model. The currently documented supported cache types include `f16`, `q8_0`, `q4_0` and several others. ([GitHub][6])

## 6. Monitor the right values

Open **Activity Monitor → Memory** during the longest realistic inference request.

Aim for:

* **Memory Pressure:** green
* **Swap Used:** ideally zero or not continuously increasing
* No repeated model unloads or allocation failures
* No yellow or red pressure during long-context generation

Apple defines green pressure as efficient RAM use, while yellow and red indicate increasing memory constraints. ([Apple Support][1])

## Do not disable these

Do not disable:

* Swap
* Memory compression
* System Integrity Protection
* FileVault
* Core macOS daemons
* Metal system services

Also avoid `--mlock` when pushing close to the machine’s capacity. That option forces model memory to remain resident rather than allowing compression or swapping, which can make an already tight configuration fail sooner. ([GitHub][6])

The realistic goal is not allocating 99% manually. It is increasing model size or context until the worst-case workload still remains under **green Memory Pressure without growing swap usage**.

[1]: https://support.apple.com/guide/activity-monitor/check-if-your-mac-needs-more-ram-actmntr34865/mac "Check if your Mac needs more RAM in Activity Monitor - Apple Support"
[2]: https://support.apple.com/en-us/102179?utm_source=chatgpt.com "How to turn off iCloud Photos"
[3]: https://support.apple.com/en-my/guide/mac-help/mtusr003/mac "Change Login Items & Extensions settings on Mac – Apple Support (MY)"
[4]: https://support.apple.com/guide/mac-help/allow-a-remote-computer-to-access-your-mac-mchlp1066/mac "Allow a remote computer to access your Mac - Apple Support"
[5]: https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md "llama.cpp/docs/build.md at master · ggml-org/llama.cpp · GitHub"
[6]: https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md "llama.cpp/tools/server/README.md at master · ggml-org/llama.cpp · GitHub"
