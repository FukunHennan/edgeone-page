---
title: "STM32F407 underwater robot steering control: hardware to host"
description: Engineering notes on an STM32F407-based underwater robot steering and servo control system, covering Modbus RTU, 9-axis attitude fusion, Kalman filtering, servo compensation, and a browser-direct host dashboard.
date: 2026-05-09 09:00:00
updated: 2026-05-09 09:00:00
lang: en
translation_key: underwater-robot-steering-control
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

The hardest part of an underwater robot is not any single sensor or snippet; it is integrating attitude, servos, Modbus, Kalman filtering, and the host UI into something field-usable. This post records the overall design of an STM32F407-based steering control system. Repo: [FukunHennan/underwater-robot-steering-control-system](https://github.com/FukunHennan/underwater-robot-steering-control-system).

## System overview

Three layers: hardware design, firmware, host software. Hardware is STM32F407VET6 (168 MHz Cortex-M4) talking to the host via Modbus RTU. The firmware reads 9-axis attitude, magnetometer, barometer, ADC, and drives servos. The host is a React Web Dashboard using the Web Serial API, no installer required.

Interfaces: USART1 debug at 115200, USART2 Modbus RTU at 9600, USART3 to the ATK-MS901M 9-axis sensor. Pin assignments, power domains, and isolation are documented in `Wiki/entities/pinout.md` for hardware iteration.

## Modbus RTU and 159 registers

Underwater robots have a lot of parameters: attitude, PWM, ADC, barometer, magnetometer, GPIO, IR, Kalman, servo compensation. One protocol per parameter becomes unmaintainable.

I unified everything under Modbus RTU, firmware as slave (address 0x01), all parameters mapped to 159 registers (0x0000–0x00E8), grouped by function: system (0x0000-0x0005), attitude (0x0010-0x001B), PWM (0x0020-0x0029), ADC (0x0030-0x0039), PWM frequency (0x0040-0x0047), barometer (0x0048-0x004D), magnetometer (0x004E-0x0055), ADC calibration (0x0056-0x006B), GPIO (0x006C-0x0077), IR (0x0078-0x007F), Kalman (0x0086-0x009E), servo compensation (0x00A0-0x00DF), compensation enable (0x00E0-0x00E7).

The register map is the contract for both firmware and host. `Wiki/entities/modbus-register-map.md` documents every address: type, unit, read/write direction. Changes go into the map first, then code, then UI.

## 9-axis fusion and Kalman filtering

ATK-MS901M streams 9-axis data (gyroscope, accelerometer, magnetometer, barometer) over USART3. Raw data is noisy; feeding it straight to servo compensation makes the robot jitter. The firmware runs a six-channel Kalman filter with Q/R tunable from the host, so you can find a balance under different current conditions.

Math, parameter selection, tuning, and the reset command are documented in `Wiki/entities/kalman-filter.md`. Kalman parameters live in RAM, are written via Modbus, and can be persisted to Flash so a reboot keeps the last calibration.

## Servo attitude compensation

Each of 8 servo channels has independent compensation: `output = BASE + kRoll × roll + kPitch × pitch + kYaw × yaw`. BASE and k-values are stored in Flash and adjustable per channel via Modbus. Enable flags at 0x00E0-0x00E7 allow per-channel on/off so you can debug one channel at a time.

Algorithm and usage live in `servo-compensation.md`: how to pick the initial BASE given the robot's center of mass, how to calibrate k in still water, how to verify under current.

## Host: browser-direct React Dashboard

React 18 + Vite + TypeScript + TailwindCSS, Web Serial API to read the serial port directly — no driver, no daemon. Five pages: System, Sensors, Servos, Peripherals, Advanced.

Features:

- **3D attitude visualization + real-time charts**: Three.js for attitude, charts for gyro/accel/mag time series;
- **Servo compensation config**: write BASE and k via Modbus, watch servo output live;
- **ADC calibration panel**: per-channel gain and offset, persist to Flash;
- **Kalman Q/R live tuning**: no firmware reboot required;
- **Auto-reconnect**: up to 10 retries with exponential backoff;
- **Mock mode**: append `?mock` to preview without hardware — useful for teaching.

## Layout and documentation

Project layout mirrors engineering phases: `01-hardware/`, `02-firmware/`, `03-host-software/`, `Wiki/`. Firmware is organized by BSP driver (ATK_MS901M, Modbus, Kalman, PWM, ADC, Calib, GPIO). Host is split into pages, components, stores.

The Wiki is maintained alongside development, not after: `system-architecture.md` for overall architecture and flows, `entities/` for module-level docs. This "docs as you build" approach dramatically lowers maintenance and teaching cost.

## Roadmap

Currently implemented: attitude acquisition, servo compensation, ADC calibration, IR. Still to do:

- PID closed-loop attitude control;
- Depth sensor and depth control;
- ESP32 Wi-Fi to replace the cable;
- Underwater camera integration;
- Autonomous navigation.

These will be added to the Wiki and the register map as the architecture evolves.

## Closing notes

This project is a full embedded engineering exercise: hardware, firmware, protocol, host visualization, field debugging. The Modbus register map is the contract; Kalman filtering is the data integrity layer; browser-direct host lowers the usage barrier. The Wiki and code are a good starting point for similar embedded systems.
