---
title: 机器鱼中央控制平台：Go、ESP32 与视觉的协同工程
description: 记录机器鱼中央控制平台的工程架构，重点讲述 Go 中央控制器如何统一管理 ESP32 设备通信、Python 视觉服务、浏览器 GUI 与赛事流程，以及 HMAC 认证、WebSocket、OTA 与故障保护设计。
date: 2026-09-16 15:00:00
updated: 2026-09-16 15:00:00
lang: zh-CN
translation_key: fish-robot-platform
published: true
categories:
  - 机器人
tags:
  - ESP32
  - Go
  - WebSocket
  - 机器人
  - OTA
---

机器鱼项目最容易踩的坑是"各模块直接互联"：浏览器直接调 ESP32、Python 视觉直接发指令到舵机、上位机直接读传感器。结果一旦扩展设备、加权限或改协议，整个系统都要重写。本文记录机器鱼中央控制平台的工程架构。仓库地址：[FukunHennan/fish](https://github.com/FukunHennan/fish)。

## 系统结构：Go 作为唯一中枢

系统采用三层结构：

```text
电脑浏览器 GUI（8098）
        │
        ▼
Go 中央控制器（8081）
   ├── ESP32 机器鱼
   └── Python 视觉服务（127.0.0.1:8091）
```

浏览器不直接连接 ESP32，也不直接连接 Python。Go 是设备、视觉、权限和网络访问的统一入口。这种设计的核心收益：

- **协议收敛**：ESP32、Python、浏览器只需要对接 Go 一方，协议变更不影响多端；
- **权限集中**：所有指令经过 Go 鉴权，便于实现管理员、操作员、观众分级；
- **公网入口唯一**：通过 Cloudflare Tunnel 统一暴露，公网不需要直接暴露设备端口；
- **故障隔离**：设备、视觉、GUI 任一异常都不会互相污染，Go 作为协调者统一处理。

## ESP32 固件：配网与认证

固件默认目标为 Seeed XIAO ESP32-C3，串口速率为 `115200`。固件支持 Wi-Fi 配网、设备发现、HMAC 认证、WebSocket、心跳、运动控制、RGB 和 OTA。

HMAC 认证是设备接入的关键：每台 ESP32 在出厂时烧入唯一密钥，所有指令通过 HMAC-SHA256 签名。Go 收到设备连接时先校验签名，签名失败直接断开。这避免了"伪造设备接入"和"指令重放"两类风险。

WebSocket 用于实时通信，包括心跳、运动指令、RGB 控制。心跳超时会被 Go 主动断开，避免僵尸连接占用资源。

## Go 中央控制器：协议与权限

Go 控制器承担三件事：设备管理、视觉服务对接、对外暴露 GUI。设备管理包括设备列表、连接状态、指令转发、OTA。视觉服务对接是本地 IPC，Go 调用 Python 视觉服务（127.0.0.1:8091）获取识别结果，再把结果用于决策或回传 GUI。

对外暴露 GUI 通过 HTTP（8098）提供 React 前端，前端通过 WebSocket 与 Go 通信，所有指令都经过 Go 鉴权后再下发给设备或视觉服务。

OTA 是关键的高风险操作，只允许管理员发起。OTA 流程：管理员上传固件 → Go 校验签名 → 通过 WebSocket 推送到目标设备 → 设备下载并写入 Flash → 重启 → 重新连接 → Go 校验版本号。任一环节失败都会触发回滚。

## Python 视觉服务：本地 IPC 而非公网

视觉服务运行在 `127.0.0.1:8091`，只与本机 Go 通信，不直接对外暴露。这样做的原因是：视觉服务通常需要 GPU 或大量算力，部署位置相对固定；视觉服务可能调用第三方模型 API，密钥不应进入设备或前端；视觉结果可能包含隐私信息，不应直接暴露到公网。

Go 把视觉服务结果按权限分发给 GUI 或决策模块，避免视觉服务自身处理权限逻辑。

## 故障保护：异常时停止运动

机器鱼是物理设备，异常时继续运动会损坏硬件或环境。系统约定：设备断线、控制器心跳超时、视觉异常和 OTA 开始时都应停止运动。

Go 控制器维护一个"安全状态"标志，任何上述异常触发时立即设置标志为 STOP，所有运动指令在 STOP 状态下被拒绝。设备恢复后需要管理员手动清除标志，避免"自动恢复后突然运动"的风险。

## 公网访问：Cloudflare Tunnel

公网入口统一使用 `fish-cloudflared.service` 管理的 Cloudflare Tunnel，地址为 [https://fish.chenfukun.space](https://fish.chenfukun.space/)。Cloudflare Tunnel 的好处：

- 不需要在路由器开端口；
- 不暴露内部服务真实 IP；
- 流量经过 Cloudflare 安全策略；
- 通过 systemd 服务管理，开机自动启动。

## 配置与密钥管理

`config/deployment.json` 是本机设备部署配置，包含设备 ID、密钥、目标版本号等。密钥和密码不提交到仓库，通过本机配置注入。

工程上明确说明：当前平台面向内部研发和受控环境，暂不以公网或商用部署为目标，也不把相关安全性作为当前开发重点。这种"明确说出边界"的方式避免了后续使用者误用为商用产品。

## 启动与停止

Linux / macOS：

```bash
bash scripts/start.sh
```

Windows：

```text
scripts\start.bat
```

启动脚本负责构建并启动 Go 控制器。要使用当前指定的 `8098` GUI，再单独运行：

```bash
cd controller/frontend
npm run dev -- --host 127.0.0.1
```

打开电脑端 GUI：`http://127.0.0.1:8098/`。停止服务：`bash scripts/stop.sh`。

## 目录结构

```text
firmware/    ESP32 固件
controller/  Go 控制器和 React GUI
vision/      Python、YOLO、OpenCV 和视频服务
protocol/    ESP32 与 Go 的通信协议
config/      本机配置，不提交密钥和密码
scripts/     启动、停止和上传脚本
docs/        技术文档和展示文件
```

所有架构、账号、启动部署、设备控制、视觉、赛事、协议、OTA、测试和维护说明收口到 `docs/机器鱼项目统一手册.md`，避免文档分散导致信息不同步。

## 小结

机器鱼项目是嵌入式、视觉、Web 三类技术栈协同的典型场景。Go 作为唯一中枢的设计让协议、权限、故障保护都有明确边界，Cloudflare Tunnel 让公网入口统一且安全，HMAC 认证让设备接入可信。这个仓库的代码和文档可以作为多模块机器人项目的工程参考。
