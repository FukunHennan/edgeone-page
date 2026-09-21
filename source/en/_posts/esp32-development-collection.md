---
title: "ESP32 learning collection: from scattered samples to engineered projects"
description: How I refactored ESP32-C6 learning samples into a structured, reusable, batch-buildable ESP-IDF project collection, covering layout, shared components, and documentation.
date: 2026-04-28 16:00:00
updated: 2026-04-28 16:00:00
lang: en
translation_key: esp32-development-collection
published: true
categories:
  - Embedded
tags:
  - ESP32
  - ESP-IDF
  - Embedded
  - Engineering
  - Learning
---

When learning a new chip, the common failure mode is "more examples, none of them look like engineering". This post records how I consolidated scattered ESP32-C6 samples into a structured, reusable ESP-IDF project collection. Repo: [FukunHennan/ESP32](https://github.com/FukunHennan/ESP32).

## Why a collection, not many repos

The beginner habit is one repo per peripheral, which produces duplicated drivers, inconsistent build scripts, chaotic docs, and code that has to be rewritten when migrating to another chip. Fine while learning, painful the moment you try to build a product.

I put all learning and lab projects into one repo, classified by function (Display / Wireless / Sensors / IoT / Audio), each subproject independently compilable, sharing a `Common` directory. The result shows the full learning curve and lets product work reuse pieces directly.

## Layout

The root README is the overview; every subproject has at least `main/`, `components/`, `CMakeLists.txt`, and `README.md`. You can enter any subdirectory and run `idf.py build flash monitor`. The `Common` directory holds shared drivers, utils, and config templates, pulled in via `EXTRA_COMPONENT_DIRS`.

```text
ESP32/
├── Display/                # Display projects
│   └── LCD-1.47-Test/      # ST7789T 1.47" LCD + LVGL
├── Wireless/               # Wi-Fi / BLE / MQTT (planned)
├── Sensors/                 # DHT/BMP/MPU/BH1750 (planned)
├── IoT/                     # Web Server / OTA / NTP (planned)
├── Audio/                   # I2S audio (planned)
├── Common/                  # Shared drivers, utils, templates (planned)
├── docs/                    # Tutorials and notes (planned)
└── tools/                   # Batch build and flash scripts (planned)
```

## First complete project: LCD-1.47-Test

The first finished subproject drives an ST7789T 1.47" LCD on ESP32-C6 using LVGL, with RGB LED and SD card. Lessons baked in:

- **Bus selection**: display on SPI, RGB LED on RMT, SD card on SDMMC, no peripheral grabbing multiple pins;
- **Task split**: LVGL on a dedicated thread, SD card work through a message queue to avoid blocking UI refresh;
- **Error logging**: every peripheral failure prints a detailed error code through ESP_LOG so issues are locatable without a debugger.

Build:

```bash
cd Display/LCD-1.47-Test
idf.py set-target esp32c6
idf.py build flash monitor
```

## Common build flow

All subprojects follow the same steps, lowering switching cost:

1. Enter the subproject;
2. First build: `idf.py set-target esp32c6`;
3. Optional: `idf.py menuconfig`;
4. `idf.py build`;
5. `idf.py -p COM3 flash monitor`.

This uniform flow makes batch-build tooling viable: `tools/build_all.bat` can walk every subproject and verify a change does not break the rest.

## Engineering checklist

- **Classify before naming**: Display/Wireless/Sensors first, project names second;
- **Extract shared components**: identical peripheral drivers move to `Common/components/`;
- **README mandatory**: at minimum the chip, the peripheral, pinout, and build steps;
- **CMake standardization**: dependencies via `REQUIRES`, no implicit includes;
- **Build versioning**: record ESP-IDF version and component commits for reproducibility.

## Roadmap

Planned additions, in the "ship one then extend" rhythm:

- Wireless: Wi-Fi Station/AP, BLE heart-rate, BLE Mesh, MQTT client;
- Sensors: DHT11/22, BMP280, MPU6050, BH1750;
- IoT: HTTP Web Server, MQTT smart-home, OTA, NTP;
- Audio: I2S playback, voice recording, MP3 decoding.

Each finished project updates the root README so the overall shape of the repo stays readable.

## Closing notes

This repo is not a product; it is a sample of "embedded learning and engineering methodology". It converges scattered samples into a classified, uniformly buildable, reusable structure. If you are learning ESP-IDF or preparing a product, using it as a reference starting point beats assembling the directory layout from scratch.
