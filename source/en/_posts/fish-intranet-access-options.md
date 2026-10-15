---
title: "Public access for Fish: Cloudflare Tunnel, FRP, or a server"
description: Comparing Cloudflare Tunnel, FRP, and a public server for the Fish robot project's Go controller, ESP32 devices, and local vision service, with the current choice and validation plan.
date: 2026-10-10 10:00:00
updated: 2026-10-10 10:00:00
lang: en
translation_key: fish-intranet-access-options
content_type: article
domain: robotics
published: true
categories:
  - Robotics
tags:
  - Fish
  - Remote access
  - Cloudflare Tunnel
  - FRP
  - Deployment
---

Fish is a robot fish control project. Its browser UI and Go controller run on a host machine, ESP32 devices communicate with the controller, and a Python vision service listens only on the same host. The [architecture post](../fish-robot-platform/) describes those components. For remote status and control, the question is: **how can I expose the Go Web entry safely and reliably while keeping devices and vision inside the private network?**

I considered three options: Cloudflare Tunnel, FRP, and a public server. This is a design comparison. Fish currently uses Cloudflare Tunnel; the other two are alternatives, not deployed implementations.

## Define the public boundary first

```text
Remote browser
    │ HTTPS / WebSocket
    ▼
Public entry → Fish Web UI and Go controller on the host
                                   ├── ESP32 robot fish
                                   └── local Python vision service
```

Only the Web service needed for remote access should sit behind the public entry. The vision service keeps listening on `127.0.0.1:8091`, and ESP32 devices are not directly exposed to the internet. In every option, entry access rules and Go's user and device permissions are separate concerns. HTTPS alone does not replace application authorization.

## Option 1: Cloudflare Tunnel

`cloudflared` runs on the Fish host, initiates an outbound connection to Cloudflare, and forwards requests for a configured hostname to the local Web service. It does not require a public IP on the home connection or an inbound router port. The existing Fish post describes `fish-cloudflared.service` and `fish.chenfukun.space` as this setup.

It fits the current Web, API, and WebSocket access pattern. The path is fairly short to configure; access rules can be applied at the public entry, while Go still checks user and device permissions. The tradeoff is dependence on Cloudflare connectivity and domain configuration. If Fish later needs arbitrary native TCP or UDP clients, the current Web publishing setup cannot simply be treated as a general port forward; protocol and client requirements need a separate review.

## Option 2: FRP

FRP pairs `frpc` inside the private network with `frps` on a publicly reachable node. `frpc` initiates the connection to `frps`; incoming requests travel back to the Fish host over that connection. It offers more direct control over HTTP, HTTPS, and TCP forwarding.

FRP **still needs a publicly reachable `frps` node**, usually a cloud server. Its cost includes the server plus maintenance of FRP versions, certificates, entry authentication, firewall rules, and monitoring. For a Web-only Fish entry, that control may not justify the extra work. If native TCP mapping becomes a real requirement, FRP deserves a practical test.

## Option 3: Buy a public server

Buying a server is not itself a tunneling protocol. The key decision is **where the application runs**. One approach uses the server as a reverse proxy or relay while the Fish host connects outward, structurally similar to self-hosted FRP. Another moves the Go controller and Web UI to the server and has ESP32 devices connect outward to it.

The second approach is a larger architecture change. Fish's vision service currently communicates with Go over `127.0.0.1:8091`; that local call stops working when Go moves away. Vision data transport, authentication, and disconnection handling would need a new design. A public server also brings ongoing host charges, OS updates, certificate renewal, backups, and security maintenance. It makes more sense when the service must stay online for multiple users and that operational work is justified.

## Comparing the choices

| Dimension | Cloudflare Tunnel | FRP | Public server deployment |
| --- | --- | --- | --- |
| Public IP on Fish host | Not required | Not required, but `frps` needs a public node | Server must be publicly reachable |
| Best fit | Current Web/API/WebSocket entry | Controlled forwarding or native protocols | Fully hosted, always-on service |
| Change to local architecture | Small | Small to moderate | Large if Go moves |
| Main maintenance | Tunnel, domain, access policy | Public node, FRP, certificates, security | Host, network, application, data |

**For now, I am keeping Cloudflare Tunnel.** It fits the existing boundary: Go is the only public entry and vision stays local. The selection depends on the protocols Fish actually uses, where each component runs, acceptable operational work, and failure recovery requirements.

Before switching to FRP or a hosted architecture, I would verify four things: remote WebSocket reconnection; safe motion stop when the public path fails; authorized access to motion and OTA commands; and continued isolation of vision and device ports. Remote connectivity should not be a prerequisite for local fail-safe behavior.

References: [Cloudflare Tunnel documentation](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) · [FRP documentation](https://gofrp.org/en/docs/overview/).
