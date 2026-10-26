---
title: "Public access for Fish: Cloudflare Tunnel, FRP, or a server"
description: Comparing Cloudflare Tunnel, FRP, and a public server for the Fish robot project's Go controller, ESP32 devices, and local vision service, with the current choice and validation plan.
date: 2026-10-10 10:00:00
updated: 2026-10-23 13:48:00
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

Fish is a robot fish control project. Go serves its browser pages on a host machine, ESP32 devices communicate with the controller, and the Python vision HTTP API listens on a local address. The [Fish project overview](../fish-robot-platform/) describes those components. For remote status and control, the first question is: **how can I publish the Go Web entry while keeping devices and the vision API inside the private network?**

I considered three options: Cloudflare Tunnel, FRP, and a public server. This is a design comparison. Fish currently uses Cloudflare Tunnel; the other two are alternatives, not deployed implementations.

## Define the public boundary first

| Connection | Path |
| --- | --- |
| Remote operation | Browser → public HTTPS / WebSocket entry → Go on the Fish host |
| Device communication | Go ↔ ESP32 robot fish on the private network |
| Vision endpoints | Go ↔ local Python HTTP API |

The table covers pages, APIs, and control traffic. Go provides the production entry on `8081`; the vision HTTP API keeps listening on `127.0.0.1:8091`, and ESP32 devices are not directly exposed to the internet. In every option, entry access rules and Go's user and device permissions are separate concerns. HTTPS alone does not replace application authorization.

Camera video has a separate WebRTC media path, with signaling through Go. Current page code attempts direct connectivity, TURN relay, and then a same-origin WebSocket JPEG stream. The last stage uses the same-origin Web entry. A reachable page does not establish working video: media, relay, and fallback playback each need validation on the actual network.

## Option 1: Cloudflare Tunnel

`cloudflared` runs on the Fish host, initiates an outbound connection to Cloudflare, and forwards requests for a configured hostname to the local Web service. This Web entry does not require a public IP on the home connection or an inbound router port. In the current Windows workflow, `scripts/start.bat` selects public mode. The startup window's `Public URL` and runtime status identify the actual deployment.

It fits the current Web, API, and WebSocket access pattern. The path is fairly short to configure; access rules can be applied at the public entry, while Go still checks user and device permissions. The tradeoff is dependence on Cloudflare connectivity and domain configuration. If Fish later needs arbitrary native TCP or UDP clients, the current Web publishing setup cannot simply be treated as a general port forward; protocol and client requirements need a separate review.

## Option 2: FRP

FRP pairs `frpc` inside the private network with `frps` on a publicly reachable node. `frpc` initiates the connection to `frps`; incoming requests travel back to the Fish host over that connection. It offers more direct control over HTTP, HTTPS, and TCP forwarding.

FRP **still needs a publicly reachable `frps` node**, usually a cloud server. Its cost includes the server plus maintenance of FRP versions, certificates, entry authentication, firewall rules, and monitoring. For a Web-only Fish entry, that control may not justify the extra work. If native TCP mapping becomes a real requirement, FRP deserves a practical test.

## Option 3: Buy a public server

Buying a server is not itself a tunneling protocol. The key decision is **where the application runs**. One approach uses the server as a reverse proxy or relay while the Fish host connects outward, structurally similar to self-hosted FRP. Another moves the Go controller and Web UI to the server and has ESP32 devices connect outward to it.

The second approach is a larger architecture change. Fish's video service currently provides HTTP APIs to the local Go controller over `127.0.0.1:8091`; that local call stops working when Go moves away. Camera and recording API transport, authentication, and disconnection handling would need a new design. A public server also brings ongoing host charges, OS updates, certificate renewal, backups, and security maintenance. It makes more sense when the service must stay online for multiple users and that operational work is justified.

## Comparing the choices

| Dimension | Cloudflare Tunnel | FRP | Public server deployment |
| --- | --- | --- | --- |
| Public IP on Fish host | Not required | Not required, but `frps` needs a public node | Server must be publicly reachable |
| Best fit | Current Web/API/WebSocket entry | Controlled forwarding or native protocols | Fully hosted, always-on service |
| Change to local architecture | Small | Small to moderate | Large if Go moves |
| Main maintenance | Tunnel, domain, access policy | Public node, FRP, certificates, security | Host, network, application, data |

**For now, Cloudflare Tunnel remains the choice for publishing the Web entry.** It preserves the deployment of Go and the Python HTTP API on the same host; WebRTC media needs separate validation. The selection depends on the protocols Fish actually uses, where each component runs, acceptable operational work, and failure recovery requirements.

Before switching to FRP or a hosted architecture, validation should cover remote WebSocket reconnection, command expiration and stopping after the browser control path fails, motion and OTA permissions, isolation of the vision HTTP API and device ports, and WebRTC video on the actual network. Remote access remains separate from timeout and stop conditions handled by the local controller and firmware.

References: [Cloudflare Tunnel documentation](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/) · [FRP documentation](https://gofrp.org/en/docs/overview/).
