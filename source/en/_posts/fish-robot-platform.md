---
title: "Fish robot central control platform: Go, ESP32, and vision as one system"
description: Engineering notes on the fish robot central control platform — Go as the single hub for ESP32 devices, Python vision, browser GUI, and event workflow, with HMAC auth, WebSocket, OTA, and fail-safe motion stop.
date: 2026-09-16 15:00:00
updated: 2026-09-16 15:00:00
lang: en
translation_key: fish-robot-platform
published: true
categories:
  - Robotics
tags:
  - ESP32
  - Go
  - WebSocket
  - Robotics
  - OTA
---

The common trap in robot projects is "everything connects directly": browser to ESP32, Python vision to servos, host to sensors. The moment you add devices, permissions, or protocol changes, the whole system rewrites itself. This post records the engineering architecture of the fish robot central control platform. Repo: [FukunHennan/fish](https://github.com/FukunHennan/fish).

## System structure: Go as the single hub

Three layers:

```text
Browser GUI (8098)
        │
        ▼
Go central controller (8081)
   ├── ESP32 fish
   └── Python vision service (127.0.0.1:8091)
```

The browser does not talk to ESP32 or Python directly. Go is the single entry for devices, vision, permissions, and network access. Benefits:

- **Protocol convergence**: ESP32, Python, browser each only deal with Go; protocol changes do not ripple across multiple ends;
- **Centralized permissions**: every command is authenticated by Go, enabling admin/operator/viewer tiers;
- **Single public entry**: exposed via Cloudflare Tunnel; no device port is directly public;
- **Failure isolation**: device, vision, GUI failures do not pollute each other; Go coordinates.

## ESP32 firmware: pairing and authentication

Default target: Seeed XIAO ESP32-C3, serial at `115200`. Firmware supports Wi-Fi pairing, device discovery, HMAC authentication, WebSocket, heartbeat, motion control, RGB, and OTA.

HMAC auth is the key: each ESP32 is flashed with a unique key at the factory; every command is signed with HMAC-SHA256. Go verifies the signature on connect and disconnects on failure. This blocks "fake device" and "command replay" attacks.

WebSocket carries real-time traffic: heartbeat, motion commands, RGB control. Heartbeat timeout triggers Go to disconnect, preventing zombie connections.

## Go central controller: protocol and permissions

Go does three things: device management, vision-service plumbing, GUI hosting. Device management: device list, connection state, command forwarding, OTA. Vision-service plumbing is local IPC — Go calls the Python vision service (127.0.0.1:8091), uses results for decisions or forwards them to the GUI.

GUI hosting is HTTP (8098) serving the React frontend; the frontend talks to Go via WebSocket; all commands are authenticated by Go before being forwarded to devices or vision.

OTA is high-risk and admin-only. Flow: admin uploads firmware → Go verifies signature → pushes to target device via WebSocket → device downloads, flashes, reboots, reconnects → Go verifies version. Any step fails, roll back.

## Python vision service: local IPC, not public

The vision service runs on `127.0.0.1:8091`, local to the host, never directly exposed. Reasons: vision needs GPU or heavy compute and lives in a fixed location; it may call third-party model APIs and secrets must not reach devices or the frontend; results may contain privacy-sensitive data.

Go distributes vision results to GUI or decision modules by permission, keeping permission logic out of the vision service.

## Fail-safe: stop motion on any anomaly

A fish is physical — bad motion damages hardware or the environment. The rule: device disconnect, heartbeat timeout, vision anomaly, and OTA start all stop motion.

Go maintains a "safe state" flag; any of the above sets it to STOP; motion commands are rejected while STOP. Recovery requires admin manual clear, so the robot does not "suddenly move after auto-recovery".

## Public access: Cloudflare Tunnel

Public entry is via `fish-cloudflared.service` managing a Cloudflare Tunnel at [https://fish.chenfukun.space](https://fish.chenfukun.space/). Benefits: no router ports, no real IP exposed, traffic through Cloudflare security policies, systemd-managed so it auto-starts on boot.

## Config and key management

`config/deployment.json` is the local deployment config: device IDs, keys, target versions. Keys and passwords are not committed; they are injected via local config.

The project explicitly states: this platform is for internal research and controlled environments, not for public or commercial deployment, and security is not the current focus. Stating the boundary prevents misuse as a commercial product.

## Start and stop

Linux / macOS:

```bash
bash scripts/start.sh
```

Windows:

```text
scripts\start.bat
```

The script builds and starts Go. To use the current `8098` GUI, run separately:

```bash
cd controller/frontend
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:8098/`. Stop with `bash scripts/stop.sh`.

## Layout

```text
firmware/    ESP32 firmware
controller/  Go controller and React GUI
vision/      Python, YOLO, OpenCV, video service
protocol/    ESP32-Go communication protocol
config/      local config; keys and passwords not committed
scripts/     start, stop, upload scripts
docs/        technical docs and demos
```

All architecture, accounts, deployment, device control, vision, event workflow, protocol, OTA, testing, and maintenance are consolidated into `docs/机器鱼项目统一手册.md` to avoid documentation drift.

## Closing notes

The fish robot project is a classic case of embedded, vision, and web stacks working together. Go as the single hub gives clear boundaries for protocol, permissions, and fail-safe; Cloudflare Tunnel gives a unified, safe public entry; HMAC auth makes device onboarding trustworthy. The repo's code and docs are a useful engineering reference for multi-module robotics projects.
