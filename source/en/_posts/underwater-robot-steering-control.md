---
title: "STM32F407 underwater robot steering control: hardware to host"
description: Why 159 parameters were unified under Modbus RTU with the register map as a contract, why raw 9-axis data jitters the servos, and why the host stays browser-direct.
date: 2026-05-09 09:00:00
updated: 2026-10-20 12:00:00
lang: en
translation_key: underwater-robot-steering-control
content_type: article
domain: robotics
published: true
categories:
  - Embedded Systems
tags:
  - STM32
  - Modbus
  - Kalman Filter
  - Underwater Robot
  - Host Software
---

The hardest part of an underwater robot is not any single sensor or snippet of code. It is wiring attitude, servos, Modbus, Kalman filtering, and the host UI into something that actually goes in the water. Every part works on its own; integration is where everything breaks.

This post follows that framing: three decisions that took the most time first, system structure after. Repo: [FukunHennan/underwater-robot-steering-control-system](https://github.com/FukunHennan/underwater-robot-steering-control-system).

## Three decisions

Conclusions first, each expanded below:

1. **Do not invent a protocol layer.** With 159 parameters, hand-rolled protocols drift out of sync between the two ends. Unify under Modbus RTU and treat the register map as a contract: change the map first, then the code, then the UI.
2. **Raw data cannot drive servos directly.** Nine-axis raw values are noisy enough that feeding them into compensation leaves the servos buzzing continuously. Kalman filtering is mandatory, and Q/R must be tunable at runtime — change the water and fixed parameters stop being good enough.
3. **The host should not require an install.** The Web Serial API lets the browser talk to the serial port directly: no driver to carry, no daemon to run on site.

## Hardware and interfaces

The MCU is an STM32F407VET6 (168 MHz Cortex-M4); three UARTs, one job each:

| Interface | Purpose | Baud |
| --- | --- | --- |
| USART1 | Debug console | 115200 |
| USART2 | Modbus RTU, firmware as slave 0x01 | 9600 |
| USART3 | ATK-MS901M 9-axis sensor | — |

Pin assignments, power domains, and isolation live in `pinout.md` in the repo, ready to reuse on the next hardware revision.

## Modbus RTU: the register map is the contract

Parameter counts on an underwater robot get out of hand fast: attitude, PWM, ADC, barometer, magnetometer, GPIO, IR, Kalman parameters, servo compensation — 159 in total.

What I worried about was not the count but **protocol drift**: one bespoke protocol per parameter, a table that keeps growing, and two independent implementations that stop matching. So the protocol layer is not hand-rolled. It is Modbus RTU, firmware as slave.

The 159 registers (0x0000–0x00E8) fall into 13 functional groups:

| Function | Range | Function | Range |
| --- | --- | --- | --- |
| System | 0x0000–0x0005 | ADC calibration | 0x0056–0x006B |
| Attitude | 0x0010–0x001B | GPIO | 0x006C–0x0077 |
| PWM | 0x0020–0x0029 | IR | 0x0078–0x007F |
| ADC | 0x0030–0x0039 | Kalman | 0x0086–0x009E |
| PWM frequency | 0x0040–0x0047 | Servo compensation | 0x00A0–0x00DF |
| Barometer | 0x0048–0x004D | Compensation enable | 0x00E0–0x00E7 |
| Magnetometer | 0x004E–0x0055 | | |

The grouping is not the point. The point is that **the table became the system contract**: both firmware and host parse against it. Any parameter change goes into the map first, then the code, then the UI.

Invert that order and you get a failure that is genuinely hard to chase — a register returns the wrong value while both codebases look correct, so you bounce between host and firmware before realising the contract already moved. Treating the map as a contract pays that debugging cost up front instead.

The full map — function, data type, unit, read/write direction for every address — is in `modbus-register-map.md`.

## Raw data cannot be used directly: where the jitter comes from

The ATK-MS901M streams 9-axis data (gyroscope, accelerometer, magnetometer, barometer) over USART3. The raw values are noisy enough that feeding them straight into servo compensation leaves the servos buzzing continuously at rest — not an occasional jump, a steady buzz, because the compensation treats noise as attitude it should track.

So the firmware runs a six-channel Kalman filter. The filter itself was not where the time went; **tuning was**:

- Water conditions change the noise profile, so one fixed parameter set cannot serve both still water and current;
- Early on, changing a parameter meant rebooting the firmware — one iteration was too slow;
- Kalman parameters therefore live in RAM and are written over Modbus, so a slider in the host shows the waveform change immediately;
- Once it settles, a "save to Flash" keeps the calibration across reboots.

**Runtime-tunable plus persistable** matters more than the filter itself: the filter is a standard component, the tuning path is the engineering.

## Servo compensation: the formula is one line

Each of the 8 servo channels compensates independently:

```
output = BASE + kRoll × roll + kPitch × pitch + kYaw × yaw
```

The formula is easy. Setting the coefficients, and debugging without interference, is not:

1. **BASE follows the centre of mass.** The initial BASE has to account for where the robot's mass sits, or it carries a constant bias at rest.
2. **k is calibrated in two steps.** Calibrate in still water, verify in current — parameters tuned only in still water do not respond the same way once there is flow.
3. **Each channel must be individually switchable.** Enable flags at 0x00E0–0x00E7 are per-channel. With all eight on, you cannot tell which channel's k is wrong; disabling them one at a time is how it gets located.

BASE and k values persist to Flash and are adjustable per channel over Modbus. Calibration steps are in `servo-compensation.md`.

## Host: why it stays browser-direct

The host is React 18 + Vite + TypeScript + TailwindCSS, five pages covering system, sensors, servos, peripherals, and advanced features.

Web Serial API was chosen over "driver plus daemon plus desktop app" for a practical reason: **field debugging should not start by installing things**. The browser opens the port directly, works on any machine, and needs nothing carried to site. It matters more in teaching — you cannot guarantee a lab of machines has the same drivers.

Several details were forced by real problems:

- **Auto-reconnect**: short serial drops are routine, and without reconnect the UI just errors out. Now up to 10 retries with exponential backoff.
- **Mock mode**: append `?mock` to preview with no hardware attached — useful for demos and for UI work without the robot.
- **3D attitude plus live charts**: Three.js for attitude, charts for gyro/accel/mag series, so tuning shows the filtered result immediately.
- **ADC calibration panel**: per-channel gain and offset, written back to Flash.

## Documentation cannot wait until the end

The project layout mirrors engineering phases: `01-hardware/`, `02-firmware/`, `03-host-software/`, `Wiki/`. Firmware is organised by BSP driver (ATK_MS901M, Modbus, Kalman, PWM, ADC, Calib, GPIO); the host splits into pages, components, and stores.

The Wiki is maintained during development, not after: `system-architecture.md` for the overall architecture and flows, `entities/` for module-level docs.

Register tables, pin assignments, and compensation calibration steps are cheap to write while the code is in your head and expensive to reconstruct later. That "docs as you build" habit is what pays off in maintenance and in bringing someone else on.

## Roadmap

Implemented: attitude acquisition, servo compensation, ADC calibration, IR.

Still to do: PID closed-loop attitude control, depth sensing and depth control, ESP32 Wi-Fi to replace the cable, underwater camera, autonomous navigation. These will land in the Wiki and the register map as they are built, so the protocol layer and the docs evolve with the architecture instead of being reverse-engineered from it afterwards.

## Closing notes

The most reusable part of this system is not any single module — it is three conventions: **the register map is the contract**, **filter parameters are tunable at runtime**, and **the host installs nothing**. They carry over to the next embedded project unchanged.

Code and Wiki are in the repo, and work as a starting point for something similar.
