---
layout: farshid_default
title: "Hermes + Cua Spaces on Windows: the complete guide"
permalink: /hermes-cua-spaces-windows/
description: "Run Hermes's terminal, file and code tools inside an isolated Linux VM (a Cua Space) on Windows 11 instead of on the host: the QEMU -cpu host pitfall, the uv-managed venv, the settings that matter, and the write_file surprise that silently lands files in the guest."
tags: "hermes, cua, windows, qemu, virtualization, wsl, ai agents"
hashtags: "#hermes #cua #windows #qemu #virtualization"
---

# Hermes + Cua Spaces on Windows: the complete guide

**What this is:** run Hermes's terminal, file and code tools inside an isolated Linux VM (a Cua Space) instead of on your Windows host.

**Tested on:** Windows 11, Intel Core Ultra 7 155H, 32 GB RAM. All files on `M:\_farshid\WSL`. Drive `D:` was never used.

**Verified result:** `hostname` returns `hermes-qemu-test`; `cat /etc/os-release` returns `Ubuntu 24.04.5 LTS`.

---

## 0. Read this first: the one rule that saves hours

`terminal.backend cua` makes Hermes build a sandbox for **every** tool that needs one: `terminal`, `read_file`, `write_file`, `search_files`, `execute_code`, and the browser. When Space creation fails, **all of them fail together** — and the agent cannot fix its own settings, because `write_file` is blocked too.

**Always test `cua spaces create` OUTSIDE Hermes. Set the backend only after it succeeds.**

To recover, **you** run this in a real terminal, then restart Hermes:

```powershell
hermes config set terminal.backend local
```

Config binds to a **new process**. A live chat keeps the old backend, so restarting the chat is required — not optional.

---

## 1. Install everything

### 1.1 The plugin

From the catalog (id `cua-spaces`) or from source:

```
hermes plugins install https://github.com/trycua/hermes-cua-spaces
```

Say **yes** to the Python dependency prompt and **yes** to enabling the plugin.

### 1.2 The cua CLI

The shell installer refuses on Windows. Use PowerShell:

```powershell
curl -fsSL https://cua.ai/install.ps1 -o install.ps1
powershell -NoProfile -File install.ps1 -Prefix "M:\_farshid\WSL\cua" -Select cli -NoModifyPath -Yes
```

Result: `M:\_farshid\WSL\cua\bin\cua.exe` (0.7.0 at install time).

`-NoModifyPath` is deliberate — PATH is set once, later, on purpose.

### 1.3 The cua Python package

The plugin declares `cua>=0.5.0,<0.8` in its `plugin.yaml`. Install it into **Hermes's own venv**.

Hermes uses a **uv** virtualenv **with no pip**. `pip install` fails with `No module named pip`. Use uv:

```bash
uv pip install --python "C:/Users/<user>/AppData/Local/hermes/installs/<id>/environments/<id>/venv/Scripts/python.exe" \
    "cua>=0.5.0,<0.8"
```

Verify:

```bash
"<hermes-venv>/Scripts/python.exe" -c "import cua, os; print(os.path.dirname(cua.__file__))"
```

If Hermes prints `hermes: repairing the recorded dependency environment...`, it may install this for you. Then skip.

### 1.4 Sign in

```
cua auth login
```

Opens a browser. The plugin stores **no token** — it reads the sign-in this command saved. Nothing about Cua goes into `config.yaml` or `.env`.

```bash
cua auth status
cua spaces ls        # must answer without an auth error
```

---

## 2. QEMU — the step that breaks most installs

### 2.1 Cua does NOT install QEMU for you

`cua runtime setup qemu` on Windows answers exactly this:

> **Windows VMs on a Windows PC need QEMU, which Cua does not install for you. Install QEMU for Windows from https://qemu.weilnetz.de/ and add it to PATH, or create a Linux Space instead.**

So `runtime setup` is a no-op here. Also: **a WSL distro is not a Cua runtime.** Cua needs QEMU or Docker.

### 2.2 Two ways to get QEMU

**Option A — the official installer** (needs **administrator rights**):

```
https://qemu.weilnetz.de/w64/2026/qemu-w64-setup-<date>.exe
```

**Option B — portable, no admin** (use this if you cannot elevate):

```bash
curl -fL -o qemu.zip \
  "https://github.com/jzombie/lab-qemu-portable/releases/download/qemu-v11.1.2/qemu-portable-win-x64-UCRT64-11.1.2.zip"
curl -fsSL -o SHA256SUMS.txt \
  "https://github.com/jzombie/lab-qemu-portable/releases/download/qemu-v11.1.2/SHA256SUMS.txt"
sha256sum qemu.zip                     # must equal the zip's line in SHA256SUMS.txt
"C:/Program Files/7-Zip/7z.exe" x qemu.zip "-oM:\_farshid\WSL\qemu" -y
```

Binaries land in `M:\_farshid\WSL\qemu\qemu-portable\`.

### 2.3 THE PITFALL: a QEMU build with no `host` CPU model

Cua hardcodes this command line:

```
qemu-system-x86_64.exe -machine q35,smm=off -cpu host -accel whpx ...
```

A custom or "dirty" QEMU build can list **200+ CPU models and not one of them is `host`**. Then every Space dies with:

```
unable to find CPU model 'host'
```

**Check before anything else:**

```bash
qemu-system-x86_64.exe -cpu help | grep -E "^  host"
```

No output = broken build; replace it. Proof that QEMU and WHPX are otherwise fine:

```bash
qemu-system-x86_64.exe -accel whpx -cpu host -display none -machine q35 -S   # fails
qemu-system-x86_64.exe -accel whpx -cpu max  -display none -machine q35 -S   # runs
```

### 2.4 Put QEMU on PATH, permanently

Cua finds QEMU **only through PATH**. Add the `qemu-portable` folder itself, not its parent:

```powershell
[Environment]::SetEnvironmentVariable('Path',
  [Environment]::GetEnvironmentVariable('Path','User').TrimEnd(';') + ';M:\_farshid\WSL\qemu\qemu-portable','User')
```

Do the same for `M:\_farshid\WSL\cua\bin`.

### 2.5 Verify

```bash
cua doctor
```

Required lines:

```
[ok] host.runtime.qemu: QEMU emulator version 11.1.2
[ok] host.accel: QEMU would use whpx for amd64 guests
```

`host.accel [ok]` confirms **WHPX hardware acceleration**.

---

## 3. Create a Space, then configure Hermes

### 3.1 Create the Space — OUTSIDE Hermes

```bash
cua config set default.kind vm
cua spaces create linux --on local --runtime qemu --kind vm --name hermes-qemu-test
```

`runtime.linux` accepts only `auto|builtin|system` — **not** `qemu`. With no Docker, `default.kind vm` makes `auto` resolve to QEMU. First creation downloads the image; several minutes.

**Test it here, before touching Hermes.**

### 3.2 Point Hermes at the Space

```powershell
hermes config set terminal.backend cua
hermes config set plugins.entries.cua-spaces.settings.space hermes-qemu-test
hermes config set plugins.entries.cua-spaces.settings.delete_on_exit false
```

### 3.3 Restart Hermes

Config binds to a new process. Close the chat, open a new one.

---

## 4. Settings reference

| Setting | Value | Why |
|---|---|---|
| `terminal.backend` | `cua` | Route tools into the Space |
| `plugins.entries.cua-spaces.settings.space` | a name | Reuse one Space; **a named Space is never deleted** |
| `...settings.delete_on_exit` | `false` | Keep files between sessions |
| `...settings.create_timeout` | `600` | Seconds allowed for a new Space |
| `default.kind` (cua) | `vm` | Picks QEMU when Docker is absent |
| `default.on` (cua) | `local` | Run on this computer, not in the cloud |
| `runtime.linux` (cua) | `auto` | Do **not** set `qemu` — rejected |

How the plugin picks a Space:

- `space: create` + `delete_on_exit: true` → a throwaway Space per run, deleted at exit.
- `space: create` + `delete_on_exit: false` → one Space named `hermes-default`, reused.
- `space: <name>` → uses that Space, never deletes or stops it. **Hermes still asks before risky commands**, because it is your machine and not disposable.

---

## 5. Test it

### Level 1 — the chat test

In a **new** chat:

> run hostname and cat /etc/os-release

**Pass:** `hermes-qemu-test` and `Ubuntu 24.04.5 LTS`. **Fail:** your Windows hostname, or a Space error.

### Level 2 — direct checks

```bash
cua doctor                                        # host.runtime.qemu [ok]
cua spaces ls                                     # Space listed
powershell -c "Get-Process qemu-system-x86_64"     # VM process live
tail "$USERPROFILE/.cua/vmm/qemu/hermes-qemu-test/serial.log"    # Ubuntu booted
```

### Level 3 — file tools land in the Space too

Ask in the chat:

> write /tmp/proof.txt with the text hello, read it back, then run uname -a

Confirm the file is **not** on Windows:

```powershell
Test-Path C:\tmp\proof.txt        # must be False
```

---

## 6. Errors and fixes

| Symptom | Cause | Fix |
|---|---|---|
| `unable to find CPU model 'host'` | QEMU build lacks `host` | Install standard or portable QEMU (2.3) |
| `Socket not found: //./pipe/dockerDesktopLinuxEngine` | Space missing; fell back to Docker | `cua spaces start <name>` |
| `QEMU not found; missing: qemu-system-x86_64 / qemu-img` | QEMU not on PATH | Add `qemu-portable` folder to USER PATH |
| `No module named 'cua'` | Package absent from Hermes venv | `uv pip install --python <venv>/Scripts/python.exe "cua>=0.5.0,<0.8"` |
| `No module named pip` | Hermes venv is uv-managed | Use `uv pip`, never `pip` |
| `cua` not recognized | CLI not on PATH | Add `M:\_farshid\WSL\cua\bin` to USER PATH |
| `Cua did not accept your sign-in` | Not signed in | `cua auth login` |
| `Cua can't find the Space ...` | Wrong name in settings | `cua spaces ls`, then fix `settings.space` |
| `Cua can't start a Space here yet` | No runtime engine | `cua doctor` |
| **Every tool fails at once** | Backend is `cua`, Space cannot start | You run `hermes config set terminal.backend local`, then restart |
| `This Mac is almost out of space` | Cosmetic bug on Windows | Ignore |
| Windows installer cancelled | Needs admin | Use the portable zip |
| `hermes config set` seems ignored | Config binds to a new process | Restart Hermes |

---

## 7. Files: the Space cannot see your host

Host drives (`C:`, `M:`, Dropbox) are **not mounted** in the Space. `/mnt` and `/media` are empty.

**Proven behaviour:** a `write_file` to `C:\Users\...` does **not** fail. It silently creates a **literal folder** in the guest — `/home/cua/C:/Users/...`. The `resolved_path` shows this if you read it. The same happens to `M:\...`, giving `/home/cua/M:/...`.

So the file "succeeds" but lands in the wrong machine. Always read `resolved_path`.

### Four ways to move data

**1. Read it through Hermes.** Ask: *read /tmp/proof.txt and show me the contents*. Best for small text.

**2. scp out of the Space.**

```bash
scp -i "$USERPROFILE/.cua/vmm/qemu/hermes-qemu-test/id_ed25519" \
    -P <port> -o StrictHostKeyChecking=no \
    cua@127.0.0.1:/tmp/proof.txt M:/_farshid/WSL/from-space/
```

**3. scp into the Space** — same command, arguments swapped.

**4. VS Code** — see section 8. Best for whole folders.

**Caution:** the forwarded port changes each boot. Read it on the host:

```powershell
Select-String -Path "$env:USERPROFILE\.cua\vmm\qemu\hermes-qemu-test\cmdline" `
  -Pattern 'hostfwd=tcp:127\.0\.0\.1:(\d+)-:22' | % { $_.Matches.Groups[1].Value }
```

---

## 8. VS Code remote access

### 8.1 It works, and you do not need sshd

VS Code connects through Cua's own channel. Evidence from a working setup inside the guest:

```bash
ls /home/cua/.vscode-server/          # exists, code-<hash> binary present
ps aux | grep vscode                  # two server processes running
head /home/cua/.vscode-server/.cli.*.log     # "Found running server (pid=...)"
```

The guest's `ssh` service is **disabled and inactive** by default, and that does not stop VS Code. **Cua's command channel is `cua-spacesd` on port 3211, not sshd.** Enabling ssh is optional.

If you do want sshd anyway, the user `cua` has **passwordless sudo** (`sudo -n true` succeeds; groups include `sudo`, `video`, `audio`):

> in a chat: run `sudo systemctl enable --now ssh && systemctl is-active ssh`

### 8.2 There is no VM password

Nothing ever asks for one. The credential is a **key pair** Cua generated when it made the Space:

| Half | Location |
|---|---|
| Private | `%USERPROFILE%\.cua\vmm\qemu\hermes-qemu-test\id_ed25519` (host) |
| Public | guest `~/.ssh/authorized_keys`, comment `cua-vmm` |

There is no password to find or reset. The key **is** the credential.

### 8.3 The simplest route

1. Open VS Code → **Remote-SSH: Connect to Host** (or use the remote explorer).
2. Connect to the Space.
3. Open the folder you want inside the guest, e.g. `/home/cua`.
4. Drag files between panes, or use **Download** on a file.

Because the Space cannot see `M:`, a VS Code window over this connection edits the **guest** filesystem, not your host files.

### 8.4 Classic Remote-SSH config (only if you enable sshd)

Add to `%USERPROFILE%\.ssh\config`:

```
Host cua-space
    HostName 127.0.0.1
    Port <forwarded-port>
    User cua
    IdentityFile C:\Users\<user>\.cua\vmm\qemu\hermes-qemu-test\id_ed25519
    StrictHostKeyChecking no
    UserKnownHostsFile NUL
```

The port changes on every reboot. Update this file after a restart.

---

## 9. Daily operation

```bash
cua spaces start hermes-qemu-test      # after every reboot or sleep
cua spaces ls                          # confirm it is up
cua spaces stop hermes-qemu-test        # suspend (memory is kept)
cua spaces delete hermes-qemu-test      # remove (asks first)
```

- **Spaces suspend when the machine sleeps.** Start the Space before Space-backed work.
- `cua spaces` has **no `exec` subcommand** — commands go through the Hermes plugin.
- Keep `M:\_farshid\WSL\qemu\qemu-portable` and `M:\_farshid\WSL\cua\bin` in the USER PATH permanently.

---

## 10. Which backend to use

| Work | Backend |
|---|---|
| Untrusted scripts, test installs, disposable work | `cua` (the Space) |
| Your `M:\_farshid\WSL` files, models, ZeroClaw config | `local` |

Revert with, **outside** Hermes, then restart:

```powershell
hermes config set terminal.backend local
```

---

## Short version

```
install plugin
install cua CLI            (PowerShell, -Prefix M:\_farshid\WSL\cua)
install cua python pkg     (uv pip, NOT pip)
cua auth login
install QEMU               (portable zip if no admin; MUST have -cpu host)
add QEMU + cua bin to USER PATH
cua doctor                 (qemu [ok], accel [ok])
cua spaces create ... --runtime qemu       <-- TEST HERE, OUTSIDE HERMES
hermes config set terminal.backend cua
hermes config set ...settings.space <name>
hermes config set ...settings.delete_on_exit false
RESTART HERMES
new chat: run hostname and cat /etc/os-release
```

**The two things that break most:** a QEMU build without `-cpu host`, and a missing `cua` Python package in Hermes's uv venv.

**The one rule that saves hours:** test `cua spaces create` outside Hermes. A broken backend blocks the agent's own tools, and only you can restore it.

**The one surprise:** a `write_file` to a Windows path does not error — it quietly creates a literal folder like `/home/cua/C:/Users/...` inside the Space. Check `resolved_path`.
