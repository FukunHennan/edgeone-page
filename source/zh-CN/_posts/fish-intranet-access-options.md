---
title: Fish 项目如何从公网访问：Cloudflare Tunnel、FRP 与自建服务器
description: 结合机器鱼项目的 Go 控制器、ESP32 和本地视觉服务，比较 Cloudflare Tunnel、FRP 与自建公网服务器三种访问方案，并说明当前选择与后续验证重点。
date: 2026-10-10 10:00:00
updated: 2026-10-10 10:00:00
lang: zh-CN
translation_key: fish-intranet-access-options
content_type: article
domain: robotics
published: true
categories:
  - 机器人
tags:
  - Fish
  - 内网穿透
  - Cloudflare Tunnel
  - FRP
  - 网络部署
---

Fish 是一个机器鱼控制项目：浏览器界面和 Go 控制器运行在主机上，ESP32 机器鱼与控制器通信，Python 视觉服务只在本机开放。项目架构见[上一篇文章](../fish-robot-platform/)。当我想从外网查看状态或操作界面时，真正需要解决的是：**如何安全、稳定地访问 Go 提供的 Web 入口，同时保留设备与视觉服务的内网边界？**

我考虑了三种方案：Cloudflare Tunnel、FRP，以及购买公网服务器自行部署。这里记录的是选型思路；目前 Fish 使用的是 Cloudflare Tunnel，另外两种是备选方案，并非都已投入运行。

## 先确定公网入口

```text
远程浏览器
    │ HTTPS / WebSocket
    ▼
公网入口 → Fish 主机上的 Web 界面与 Go 控制器
                         ├── ESP32 机器鱼
                         └── 本地 Python 视觉服务
```

公网入口只应通向需要远程访问的 Web 服务。视觉服务继续监听 `127.0.0.1:8091`；ESP32 不直接暴露给互联网。无论采用哪种方案，浏览器访问入口、Go 的鉴权和设备指令权限都要分开考虑：有了 HTTPS 并不等于可以跳过应用自身的权限校验。

## 方案一：Cloudflare Tunnel

在 Fish 主机运行 `cloudflared`，由它主动连接 Cloudflare，再把指定域名的请求转发到本机 Web 服务。这样不依赖家用宽带的公网 IP，也无需在路由器上配置入站端口。Fish 现有文章记录的 `fish-cloudflared.service` 和 `fish.chenfukun.space` 属于这个方案。

它适合当前以网页、API 和 WebSocket 为主的远程访问。配置链路相对短，可以把访问控制放在公网入口，再由 Go 继续处理用户和设备权限。代价是入口依赖 Cloudflare 网络与域名配置；若未来需要让任意原生 TCP/UDP 客户端直连，不能直接把现有 Web 发布方式当成通用端口映射，需要重新核对协议支持和客户端接入方式。

## 方案二：FRP

FRP 由部署在内网的 `frpc` 和部署在公网节点的 `frps` 组成。`frpc` 主动连接 `frps`，公网请求再经这条连接返回 Fish 主机。它能按需转发 HTTP、HTTPS 或 TCP 等流量，路由和协议控制更灵活。

不过 FRP **仍然需要一个可被外网访问的 `frps` 节点**，通常是云服务器。除了服务器费用，还要维护 FRP 版本、证书、入口鉴权、防火墙和进程监控。若只是给 Fish 的 Web 界面提供访问，FRP 的控制力未必能抵消维护成本；若后续需要更明确的 TCP 端口映射，才值得做实际测试。

## 方案三：购买公网服务器

“买服务器”本身不是一种单独的穿透协议，关键在于**服务运行在哪里**。一种做法是把公网服务器作为反向代理或中转节点，让 Fish 主机主动连接它；这在结构上接近自建 FRP。另一种做法是把 Go 控制器和 Web 界面迁到服务器，让 ESP32 主动连过去。

第二种做法改动更大。Fish 的视觉服务目前只通过 `127.0.0.1:8091` 与本机 Go 通信；Go 迁走后，这个本地调用就不再成立，需要重新设计视觉结果的传输、认证和断线处理。服务器也意味着持续的主机费用、系统更新、证书续期、备份和公网安全维护。它更适合将来需要长期在线、多人访问且愿意承担运维工作的阶段。

## 三种方案怎么选

| 维度 | Cloudflare Tunnel | FRP | 公网服务器部署 |
| --- | --- | --- | --- |
| Fish 主机是否需要公网 IP | 不需要 | 不需要，但 `frps` 需要公网节点 | 服务器需要公网可访问 |
| 适合的入口 | 现阶段的 Web/API/WebSocket | 需要自控转发规则或原生协议时 | 长期在线的完整服务 |
| 对现有本地架构的改动 | 较小 | 较小到中等 | 若迁移 Go，则较大 |
| 主要维护工作 | 隧道、域名、访问策略 | 公网节点、FRP、证书与安全 | 主机、网络、应用与数据 |

**当前选择是继续使用 Cloudflare Tunnel。** 它与 Fish 现有的“Go 作为唯一公网入口、视觉服务留在本机”结构吻合。选型并不是按“哪种最强”排序，而是看项目当前的流量协议、部署位置、可接受的运维量和故障恢复要求。

若后续改为 FRP 或自建服务器，我会先验证四件事：远程 WebSocket 断线重连；公网入口失效时设备是否进入安全停止状态；只有授权用户能发送运动或 OTA 指令；视觉服务与设备端口是否仍未暴露。公网连接只服务于远程访问，不应成为机器鱼本地故障保护的前提。

参考：[Cloudflare Tunnel 官方文档](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) · [FRP 官方文档](https://gofrp.org/en/docs/overview/)。
