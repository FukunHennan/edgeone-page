---
title: "DVS + RGB multimodal vision workstation: the MATLAB/C++ boundary"
description: Engineering notes on the DVSense + Hikrobot multimodal vision workstation, covering the MATLAB/C++ MEX boundary, camera resource ownership, the Fusion data flow, and how unimplemented controls are handled.
date: 2026-08-26 10:30:00
updated: 2026-08-26 10:30:00
lang: en
translation_key: dvsense-rgb-hikrobot-workstation
published: true
categories:
  - Computer Vision
tags:
  - DVS
  - RGB
  - MATLAB
  - Hikrobot
  - Multimodal Vision
---

Wiring an event camera and an industrial RGB camera into one workstation is not trivial: two SDKs, two data formats, two trigger models, two language ecosystems. This post records the design trade-offs of the DVSense + Hikrobot multimodal vision workstation, with focus on the MATLAB/C++ MEX boundary, camera resource ownership, and the Fusion data flow. Repo: [FukunHennan/DVSenseRealtime_RGB_Hikrobot](https://github.com/FukunHennan/DVSenseRealtime_RGB_Hikrobot).

## Why MATLAB plus C++ MEX

DVSense ships a MATLAB binding; Hikrobot MVS is C++ only, no MATLAB native support. Pure MATLAB prototypes fast but performs poorly; pure C++ performs well but iterates slowly.

The compromise: MATLAB as the top-level GUI and algorithm host; C++ MEX as the hardware access layer. `hikrobot_mex.cpp` wraps the MVS SDK's `MV_CC_*` interface and is compiled to `.mexw64`, called from MATLAB. This keeps MATLAB's iteration speed while using MVS directly for high-throughput acquisition.

The MEX is built once on a Windows machine with the MVS SDK installed: run `tools/dev/setupPath.m` to configure SDK paths, then `buildHikrobotMex`. Output lands at `runtime/bin/hikrobot_mex.mexw64`; after that, run `main`, click "Connect RGB" on the Device page.

## Camera resources belong only to camera modules

The classic failure: every module "opens" the camera — Fusion opens it once, recording opens it once, analysis opens it again — and the camera ends up multiply owned, SDK errors fly.

The project's core rule: camera resources belong only to camera modules. `DVS CameraSource` and `Hikrobot CameraSource` each own their SDK handle and do enumeration, open, acquire, close. Fusion does not call `discover`, `open`, `readDisplayFrame`, or any `MV_CC_*`; it only consumes `latestDvsFrame` and `latestRgbFrame`.

The result: clear lifecycle on the camera side, Fusion decoupled from hardware, and a camera dropout affects only its own module, not Fusion.

## Fusion data flow

Fusion does not re-enumerate, open, or read; it processes already-acquired frames:

```text
DVS SDK -> DVS CameraSource -> latestDvsFrame --\
                                               > FusionRenderer -> Fusion FrameSurface
RGB MVS -> HikrobotCameraSource -> latestRgbFrame /
```

DVS/RGB previews each read once; the same latest display frame feeds both the standalone preview and Fusion. RGB is the base image; DVS ON events overlay in green, OFF in magenta; output is unified to 1280×720.

This "one frame, multiple consumers" avoids a second acquisition pass for Fusion, cuts SDK calls, and guarantees preview and Fusion are visually in sync.

## GUI-first startup and recovery

The workstation starts GUI-first: DVS and RGB can connect independently after launch; either missing does not fake a device or close the GUI. Simple, but vital during research — often only one camera is available, and forcing both makes the workstation unusable most of the time.

For recovery, RGB dropout detection and reconnect live inside `HikrobotCameraSource`: on an SDK connection exception, it calls `MV_CC_StopGrabbing` + `MV_CC_CloseDevice`, re-enumerates, and re-opens, transparent to Fusion.

## Unimplemented controls stay disabled

A common anti-pattern: ship a button now, implement later. Users click, GUI hangs. Here, unimplemented controls (Fusion geometric calibration, undistortion, manual alignment, RGB video recording, Fusion video recording, analysis CSV) are all disabled, with comments stating "not wired, keep disabled".

Conservative, but it makes the workstation's current capability obvious: every enabled control actually works. No "looks powerful, clicks crash" embarrassment.

## Current real capabilities and limits

What works today:

- DVSense / DVSLume: real enumeration, connect, live preview, ROI, raw event recording, existing analysis;
- Hikrobot RGB: real MVS enumeration, connect, live streaming, 1280×720 low-latency preview, live exposure control, dropout detection and recovery;
- DVS + RGB independent and simultaneous: two real independent links, either alone or both;
- RGB/DVS Fusion: basic overlay wired; Fusion owns no hardware handles.

Explicitly out of scope for now: Fusion geometric calibration, undistortion, manual alignment, RGB video recording, Fusion video recording, analysis CSV. These come in as future enhancements.

## Hikrobot first-build notes

The Hikrobot `MV-CU050-90UC` has completed a real MVS smoke test: exposure read/write, continuous acquisition, stop, close, SDK release. MATLAB R2024b compiled `hikrobot_mex.mexw64` via Visual Studio 2022 Build Tools; `camera.HikrobotCameraSource` performs real enumeration, open, exposure read/write, 1280×720 RGB frame read, and close.

Default SDK paths:

- MVS SDK: `C:\Program Files (x86)\MVS`
- MVS Runtime: `C:\Program Files (x86)\Common Files\MVS\Runtime\Win64_x64`

Detailed test logs live in `docs/diagnostics/`; RGB integration notes in `docs/integration/V5_RGB_HIKROBOT.md`.

## Closing notes

Multimodal vision workstation engineering is not about algorithms, it is about boundaries: MATLAB vs C++, camera resources vs Fusion, implemented vs unimplemented. Get the boundaries right and later work — calibration, recording, analysis export — fits without breaking the existing architecture. The repo's code and docs are a useful reference for multimodal vision workstation engineering.
