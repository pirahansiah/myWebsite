---
layout: farshid_default
title: "ESP32-C3 OLED Projects: Four Firmwares on One Tiny Board"
permalink: /projects/esp32-c3-oled/
description: "A $3 ESP32-C3 with an onboard 72x40 OLED, four firmwares built on it — an icon slideshow, a status-LED diagnostic, a BLE HID mouse that scrolls for you, and a physical status panel for Hermes and Claude — plus the hardware facts that cost the most time to learn."
tags: [esp32, esp32-c3, arduino, oled, ssd1306, u8g2, ble-hid, firmware, hermes, embedded, diy]
hashtags: "#esp32 #esp32c3 #arduino #oled #u8g2 #ble #firmware #embedded"
---

Four projects on one $3 board: an ESP32-C3 with an onboard 0.42" OLED. Everything is open source, and every hardware fact below was measured on the actual unit, not copied from a product page — because the product pages are wrong about at least three things.

# ESP32-C3 OLED Projects: Four Firmwares on One Tiny Board

*Last updated: 2026-10-18.*

The board is the cheap part. An ESP32-C3 module with a 72x40 OLED bonded to the PCB, a blue LED, a boot button and native USB, sold for a few dollars as an "ESP32-C3 0.42 inch OLED development board". What makes it worth writing about is that it is *almost* well documented: the pinout is discoverable, the display works, and then three specific things are wrong or missing, and each one costs an evening.

This page is the map of the four firmwares I built on it, and the three hardware facts I wish had been on the schematic.

Also on this site: [why one agent harness beats three vendor tools](/farshid/content/why-hermes.md) — the reasoning behind the agent whose state the status panel shows.

## The board

| Item | Value |
|---|---|
| SoC | ESP32-C3 (QFN32) rev v0.4, single-core **RISC-V** (RV32IMC) at 160 MHz — see [RISC-V for AI](/farshid/content/course-risc-v.md) |
| Memory | 4 MB embedded flash (XMC), 400 kB SRAM |
| Radio | Wi-Fi 4 and Bluetooth 5.0 LE |
| USB | native USB Serial/JTAG (VID 303A, PID 1001) — no UART bridge chip |
| Display | 0.42" monochrome OLED, **72x40 visible pixels** |
| Display bus | I2C, SDA GPIO5, SCL GPIO6, address 0x3C, 400 kHz |
| Blue LED | GPIO8, **active LOW** — the only software-controlled LED |
| Red LED | hard-wired VCC → 4.7 kΩ → LED → GND. Not on a GPIO. |
| Boot button | GPIO9, to GND |

The visible area is the important number: 72x40. The controller behind the glass is a 128x64-class SSD1306 or SH1106 that only exposes a 72x40 window, which is why every drawing coordinate in the firmware is relative to a 72x40 canvas and not a 128x64 one.

## The four projects

| Project | What it does | Interesting part |
|---|---|---|
| **oled-icons** | Cycles six 32x32 monochrome system icons on the OLED, one every 5 seconds, flipping the background black/white each change | The artwork is generated from geometry, not bitmaps: a Python script rasterises discs, rings, arcs and rounded rectangles with 3x3 supersampling and emits the `icons.h` byte arrays |
| **led-test** | Identifies what the LED on the board actually is — plain GPIO8 LED or addressable WS2812B | Drives the pin both ways and labels each phase on the OLED and the serial log, so the answer is readable even when half the board is not working |
| **ble-scroll-mouse** | Advertises as a BLE HID mouse called `farshid`, scrolls about one page every 15 seconds | Live-tunable over the serial port while the host is connected: interval, notch count, chunk size, direction, wheel sign |
| **hermes-status** | A physical status light for AI agents: idle / working / needs input, for Hermes and Claude Code sharing one board | A Hermes plugin writes state, a bridge daemon owns the serial port, the firmware blanks itself if the heartbeat stops |

![Six monochrome icons — wifi, battery, clock, heart, smiley, mail — rendered at 6x from the generated bitmap data](/farshid/content/esp32-icon-contact-sheet.png)

That contact sheet is not a mock-up. It is the exact 1-bit data the display receives, upscaled 6x so a wrong shape is visible before flashing instead of after.

### oled-icons: artwork as code

Icons on a 72x40 panel cannot afford anti-aliasing or transparency, so the generator renders each shape as a mathematical predicate, samples it 3x3 per pixel and keeps a pixel on at 50 % coverage or more. The output is a byte array in XBM order for `drawXBMP()`, and the same run writes the contact sheet above.

Two details that matter on a panel this small:

- **A calibration screen on boot.** Hold the boot button while powering up and the firmware draws a white panel with a black frame at the visible window edges, a centre crosshair and the 32x32 box the icons occupy. Centring an icon by guessing offsets is how you spend an hour on a two-pixel problem.
- **The LED counts along.** Each icon change plays a blink burst of one blink for icon one, two for icon two, and so on. It is a non-blocking burst, so the icon timer never stalls waiting for a light to finish blinking.

### ble-scroll-mouse: a mouse that does the scrolling

The firmware uses the BLE HID stack that ships with the ESP32 Arduino core — no extra library. It advertises the HID service, appearance `0x03C2` (mouse), and pairs with Just Works, so there is no PIN and the host reconnects on its own afterwards.

The interesting part is that "scroll one page" is not one HID report. It is a burst of them: 120 wheel notches, sent as 12 reports of 10 notches, 20 ms apart. That is what a real mouse looks like to the host, and it is what makes the gesture land instead of being clamped or ignored. Each event also carries a 1-pixel alternating horizontal nudge, because iPadOS stops routing wheel events to an app once the pointer has been idle for a few seconds.

Everything is tunable live, over the same USB cable, without reflashing:

| Command | Effect |
|---|---|
| `?` | print the current settings |
| `t` | send one scroll event now, instead of waiting 15 seconds |
| `p` | pause / resume (same as the boot button) |
| `i<ms>` | interval between events |
| `n<notches>` | notches per event — the "how far does it jump" knob |
| `s+1` / `s-1` | which wheel sign scrolls the page DOWN — measured per host |

That last one is not a detail. Hosts disagree about the sign of the wheel axis: what scrolls down on Windows scrolls up on iPadOS. The sign is therefore a setting, measured on the actual devices, not a constant in the code.

### hermes-status: the one that is a system, not a sketch

This is the project that got the most use. A 0.42" panel on the desk shows what the agent is doing, so you can tell from across the room whether it is thinking, waiting for you, or done.

| Agent state | Panel | Blue LED |
|---|---|---|
| idle | off | off |
| working | rotating dot ring plus elapsed time | steady |
| needs input | blinking large question mark | blinking |

The architecture is deliberately three pieces, because a display must never be able to slow down or break a turn:

1. **A Hermes plugin** registers observer hooks and writes a one-line JSON state file on every lifecycle boundary. It never touches the serial port, never blocks, never fails a turn.
2. **A bridge daemon** polls those state files, arbitrates between agents and writes one character over USB serial, repeating the current state every two seconds as a heartbeat.
3. **The firmware** turns characters into pixels, and blanks the panel if the heartbeat stops for 12 seconds — so a crashed host, a killed bridge or an unplugged cable can never leave the display stuck on "working".

Several agents share one board: each writes its own state file, the bridge shows whichever is most interesting (`needs input` beats `working` beats `idle`, newest wins), and a corner badge says whose state you are looking at. Staleness is per source: a `working` state older than 180 seconds is treated as idle, but a `needs input` state stands for an hour, because you are allowed to think before answering.

One subtlety worth recording: an agent that ends its turn with a question in prose ("which of these do you want, a or b?") is waiting for you exactly like one blocked in a form — but at hook level that turn looks *finished*. The plugin inspects the assistant's final response for a trailing question mark or prompt words, and keeps the panel blinking instead of going dark.

## Three things that are wrong or missing in the documentation

### 1. The display controller is a lottery

The 72x40 panel behind this board family ships with **two different controllers**, and the firmware cannot detect which one you have. A blank screen with a clean boot log is not a broken board; it is the wrong driver variant.

| Variant | Driver | Origin |
|---|---|---|
| 1 | `SSD1306_72X40_ER` | native 72x40, draw at (0,0) |
| 2 | `SH1106_72X40_WISE` | native 72x40, draw at (0,0) |
| 3 | `SSD1306_128X64` plus window offset | 128x64 framebuffer, window at 28,12 |

The trap is mixing them: variant 3 needs a window origin, and passing that same origin to the native 72x40 drivers pushes the image off the right and bottom edges. Small offsets are a separate knob, so the two settings do not fight.

To make this diagnosable instead of mysterious, the firmware probes several plausible I2C pin pairs at boot and prints what answered:

```
[i2c] device 0x3C on SDA=5 SCL=6
[i2c] using address 0x3C on SDA=5 SCL=6
driver 1, panel 72x40, origin (0,0), offset (0,0), every 5000 ms, background mode 2
```

A clean log with a dead panel means variant. `nothing found` means wiring or power. That distinction alone saved the most time.

### 2. The red LED cannot be controlled

The board has two LEDs and only one belongs to the microcontroller. The schematic block "KEYS & LEDS" says it plainly once you look:

| LED | Path | Controllable |
|---|---|---|
| Red | VCC → R12 4.7 kΩ → LED1 → GND | **No** — power indicator |
| Blue | VCC → R8 4.7 kΩ → LED2 → GPIO8 | Yes, active LOW |

So `digitalWrite(8, LOW)` lights the blue LED, and no code anywhere will change the red one. Two honest options if you want a second controlled LED: cut the red LED's cathode trace and wire that pad to a free GPIO (the existing resistor is the series resistor; the pin sinks well under a milliamp), or hang an external LED on a free pin. The firmware already supports both through `RED_LED_PIN`.

### 3. `CDCOnBoot=cdc` is not optional

The board's USB peripheral *is* the SoC's serial endpoint, so there is no separate UART chip and no second port. If the sketch is built without `CDCOnBoot=cdc`, `Serial` writes into the void and every project looks dead — no boot log, no tuning replies, nothing to debug with. The build flag routes `Serial` to the native USB port. Core 3.x has no `USBMode` menu any more, which is how people lose an hour looking for it.

## How the repository is organised

The four projects live in one repository, because they share one board, one toolchain and one set of hardware notes. Sharing is what keeps the hardware facts in one file instead of four diverging copies.

| Path | Contents |
|---|---|
| `docs/hardware.md` | pinout, both LEDs, controller variants, I2C probing, the red-LED mod |
| `docs/toolchain.md` | `arduino-cli` setup per OS, the build flags, port names |
| `docs/troubleshooting.md` | symptom → cause → fix, plus the blank-screen decision tree |
| `tools/build.sh` | one build/flash entry point for every sketch, with port auto-detection |
| `tools/make_icons.py` | the icon generator (writes the header and the contact sheet) |
| `tools/serial-monitor.py` | port-agnostic log reader that resets the board first |
| `oled-icons/`, `led-test/` | the two self-contained sketches |
| `ble-scroll-mouse/` | firmware plus BLE scanning, pairing and tuning tools |
| `hermes-status/` | firmware, bridge daemon, Hermes plugin, per-OS launchers |

Two decisions that made the maintenance easier:

- **One build script instead of four.** `tools/build.sh <project>` resolves a project name to its sketch folder, sets the right board flags, finds the Espressif USB device by vendor ID (ignoring the Bluetooth and debug pseudo-ports macOS always exposes), compiles to `.build/` and uploads. `--build-only` compiles without touching the port, which is what CI does.
- **Build output never enters git.** The first version of this folder had accumulated 200 MB of `*.bin`, `*.elf` and `*.map` files across five copies of a build directory. They are reproducible in one command, so they are ignored now.

Continuous integration compiles all four sketches on every push. That is a compile check, not a hardware test — it proves the code still builds against the current ESP32 core and library versions, and nothing more.

## What is verified, and what is not

I keep this distinction explicit, because "it compiles" and "it works" are different claims:

- **Verified:** all four sketches compile with `arduino-cli` and the current ESP32 core; the icon header regenerates byte-identically from the generator; the port detection was exercised against real and simulated port lists; the scripts pass syntax checks and every internal documentation link resolves.
- **Verified on hardware:** the icon rotation and calibration screen, the plain-LED identification, the BLE pairing and scrolling behaviour on iPadOS and Windows, and the full idle → working → needs-input → idle loop of the status panel.
- **Not verified:** nothing in CI flashes a board, and no automated test can tell you what the panel looks like. The 72x40 geometry, the controller variant and the LED behaviour are hardware claims measured on one unit of this board family.

## Build it yourself

```bash
arduino-cli core install esp32:esp32
arduino-cli lib install U8g2 "Adafruit NeoPixel"

tools/build.sh oled-icons          # compile and flash
tools/build.sh led-test            # identify the LED on your revision
tools/serial-monitor.py            # read the boot log, port auto-detected
```

For the status panel there is a single-file launcher per operating system that installs only what is missing, because a board that is already flashed needs no compiler at all — the firmware lives in the ESP32's own flash and travels with the hardware.

## Repository

- Code, docs and releases: [github.com/pirahansiah/esp32-c3-oled-projects](https://github.com/pirahansiah/esp32-c3-oled-projects)
- License: MIT
- Hardware: ESP32-C3 0.42" OLED board, 72x40 visible panel, 4 MB flash

If you build any of these on a different revision of the board, the two things worth reporting back are the display controller variant and the LED type — those are the two facts that vary between batches, and the two that cost the most time to rediscover.
