---
title: Experience
layout: page
comments: false
---
# Experience

<div class="resume-hero"><div class="avatar">FK</div><div><h2>Chen Fukun · Fukun Hennan</h2><p>Automation · Embedded Systems · Robotics · Host Software</p><p>Fast learner; turn ideas into things that actually run.</p><p><a href="https://github.com/FukunHennan" target="_blank" rel="noopener">GitHub: @FukunHennan</a> · Zhoukou, Henan</p></div></div>

## Education

### Huanghuai University · Automation (B.Eng.)
**2022.09 – 2026.06**

Key coursework: C Programming, Microcomputer Principles, Embedded Development & Applications, MCU Principles & Applications, Digital Electronics, Analog Electronics, PLC Technology, Automatic Control Theory, Circuit Analysis.

## Skills

**Communication protocols**: UART, IIC, SPI, CAN, ModBus, TCP/IP, HTTP, MQTT — both principles and practical application.

**Tools & operating systems**: MDK, VSCode, CubeMX; RT-Thread, FreeRTOS.

**Hardware design**: JLC EDA and SolidWorks for hardware design and 3D modeling; KiCad for component library construction.

**Host software**: C# and Qt for host application development, including joint debugging of PLCs with NI data acquisition cards; also Go, Python, and JavaScript/TypeScript for web and server-side work.

## Projects

### Non-standard Automated Line · Digital Twin
A digital twin system for a non-standard automated production line controlled by a Siemens S7-1500 PLC. UG was used for mechanical design and 3D modeling, Eplan for electrical design, and TIA plus UG for digital control and system integration. The final iteration replaced the PLC with an MCU as the controller.

On the host side, C# and Qt were used to build applications for joint PLC + NI data-acquisition-card debugging, plus custom serial-data hosts.

- Repos: [XinJie Modbus C# Dashboard](https://github.com/FukunHennan/XinJie_modbus_Csharp) · [C# + NI](https://github.com/FukunHennan/CSharp-NI)
- Blog: [Extending XinJie XDH automation without touching the ladder](../posts/xinjie-modbus-csharp-dashboard/)

### Underwater Robot (Control)
Control R&D for an underwater robot. Hardware based on STM32F407; software developed on the HAL library. An IMU module and extended ADC peripherals handle attitude detection and environmental sensing; servos and brushless motors provide propulsion. Modbus RTU is the communication protocol, and a custom data format with a Linux device handles sensor-data upload and propulsion-command dispatch.

- Repos: [STM32 Underwater Robot](https://github.com/FukunHennan/underwater-robot-steering-control-system) · [Fish Robot Platform](https://github.com/FukunHennan/fish)
- Blogs: [STM32F407 underwater robot steering control](../posts/underwater-robot-steering-control/) · [Fish robot central control platform](../posts/fish-robot-platform/)

### ESP32 IoT & Visual Programming
Worked part-time at a youth programming training program from sophomore to junior year, focused on ESP32-based IoT development, visual-programming research, visual function library development, and mobile app development. Also maintains the ESP32 learning and project collection.

- Repos: [ESP32 Collection](https://github.com/FukunHennan/ESP32) · [OpenAI Agents Starter](https://github.com/FukunHennan/openai-agents-starter-python)
- Blog: [ESP32 learning collection](../posts/esp32-development-collection/)

### Event Camera & Multimodal Vision
Event camera (DVS) research and the DVS + RGB multimodal vision workstation, covering DVSense event cameras, Hikrobot RGB, MATLAB + C++ MEX, the Fusion data flow, and 3D verification.

- Repos: [DVS Event Camera](https://github.com/FukunHennan/DVS-Eventcrame) · [DVSense + RGB Hikrobot](https://github.com/FukunHennan/DVSenseRealtime_RGB_Hikrobot)
- Blogs: [DVS event camera research](../posts/dvs-eventcamera-research/) · [DVS + RGB multimodal vision workstation](../posts/dvsense-rgb-hikrobot-workstation/)

### EdgeOne Page · Bilingual Personal Site
This site. Evolved from a plain Hexo theme into a personal engineering portal with bilingual content, local search, RSS, PWA, deterministic builds, and production audits; KiCad library construction was also turned into a reusable Codex Skill.

- Repos: [edgeone-page](https://github.com/FukunHennan/edgeone-page) · [kicadskill](https://github.com/FukunHennan/kicadskill)
- Blogs: [EdgeOne Page engineering](../posts/building-a-professional-bilingual-hexo-site-on-edgeone-pages/) · [KiCad library builder skill](../posts/kicad-library-builder-skill/)

## Honors & Awards

- **Siemens Cup** Process Industry Automation — Provincial Third Prize
- **National Undergraduate Electronics Design Contest** — Provincial Second Prize
- **HNC Digital Twin Competition** — Provincial Second Prize
- **Lanqiao Cup** — Multiple provincial-level or higher awards
- University-level **Merit Student**

## Certificates

- Mandarin Proficiency Test: Level 2
- National Computer Rank Examination Level 2 (C Language)

## Self-evaluation

A strong learner who adapts quickly to new environments and challenges. Rigorous and responsible, with solid execution and accountability. Good communicator who enjoys collaboration and team goals; passionate about the work and actively pursuing self-improvement.

<style>.resume-hero{display:flex;align-items:center;gap:24px;padding:28px;border-radius:22px;background:linear-gradient(135deg,rgba(79,70,229,.13),rgba(139,92,246,.08));border:1px solid rgba(129,140,248,.2);margin:20px 0 32px}.avatar{width:92px;height:92px;flex:0 0 92px;border-radius:50%;display:grid;place-items:center;font-size:1.6rem;font-weight:800;background:linear-gradient(135deg,#4f46e5,#8b5cf6);color:white;box-shadow:0 12px 35px rgba(79,70,229,.3)}@media(max-width:600px){.resume-hero{align-items:flex-start;flex-direction:column}}</style>
