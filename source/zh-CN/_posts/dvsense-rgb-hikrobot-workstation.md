---
title: DVS + RGB 多模态视觉工作站：MATLAB 与 C++ 的工程边界
description: 记录 DVSense 与 Hikrobot RGB 多模态视觉工作站的设计，重点讲述 MATLAB 与 MEX C++ 的职责边界、相机资源管理、Fusion 数据流与未实现控件的处理方式。
date: 2026-08-26 10:30:00
updated: 2026-08-26 10:30:00
lang: zh-CN
translation_key: dvsense-rgb-hikrobot-workstation
published: true
categories:
  - 计算机视觉
tags:
  - DVS
  - RGB
  - MATLAB
  - Hikrobot
  - 多模态视觉
---

把事件相机和工业 RGB 相机接入同一套工作站不是简单的事：两家 SDK、两种数据格式、两套触发模型、两种编程语言生态。本文记录 DVSense 与 Hikrobot 多模态视觉工作站的设计取舍，重点说明 MATLAB 与 C++ MEX 的职责边界、相机资源管理与 Fusion 数据流。仓库地址：[FukunHennan/DVSenseRealtime_RGB_Hikrobot](https://github.com/FukunHennan/DVSenseRealtime_RGB_Hikrobot)。

## 为什么是 MATLAB 加 C++ MEX

DVSense 官方 SDK 提供 MATLAB 绑定，Hikrobot MVS 提供 C++ SDK 但没有 MATLAB 原生支持。纯 MATLAB 实现可以快速做原型但性能差，纯 C++ 实现性能好但开发迭代慢。

折中方案是：MATLAB 作为顶层 GUI 与算法宿主，C++ MEX 作为硬件接入层。`hikrobot_mex.cpp` 封装 MVS SDK 的 `MV_CC_*` 接口，编译为 `.mexw64`，由 MATLAB 调用。这样既保留了 MATLAB 的快速迭代能力，又能直接调用 MVS SDK 完成高吞吐图像采集。

MEX 文件需要在安装 MVS SDK 的 Windows 电脑上本机编译一次：运行 `tools/dev/setupPath.m` 配置 SDK 路径，再执行 `buildHikrobotMex`。成功后生成 `runtime/bin/hikrobot_mex.mexw64`，后续运行 `main` 即可在"设备"页点击"连接 RGB"。

## 相机资源只归相机模块管理

最容易出问题的设计是让多个模块都"打开"相机：Fusion 模块打开一次、录制模块打开一次、分析模块再打开一次，结果相机被多次独占，SDK 报错。

本项目的核心原则是"相机资源只归相机模块管理"。`DVS CameraSource` 和 `Hikrobot CameraSource` 各自独占 SDK 句柄，完成枚举、打开、采集、关闭。Fusion 模块不调用 `discover`、`open`、`readDisplayFrame` 或任何 `MV_CC_*` 接口，只复用 `latestDvsFrame` 和 `latestRgbFrame` 两个内存变量。

这样设计的好处是：相机模块作为唯一所有者，生命周期清晰；Fusion 只关心已经取得的帧，与硬件解耦；任何相机掉线只影响对应模块，不会污染 Fusion 状态。

## Fusion 数据流

Fusion 不重新枚举、打开或读取相机，只处理已经取得的帧。数据流如下：

```text
DVS SDK -> DVS CameraSource -> latestDvsFrame --\
                                               > FusionRenderer -> Fusion FrameSurface
RGB MVS -> HikrobotCameraSource -> latestRgbFrame /
```

DVS/RGB 预览各自只读取一次，同一张最新显示帧同时供独立预览和 Fusion 使用。RGB 作为底图，DVS 的 ON 事件叠加为绿色、OFF 事件叠加为洋红色，输出统一为 1280×720。

这种"同一帧多消费"设计避免了为 Fusion 单独触发一次采集，减少了 SDK 调用次数，也保证了预览和 Fusion 在视觉上严格同步。

## GUI-first 启动与异常恢复

工作站采用 GUI-first 启动：DVS 和 RGB 都可以在程序启动后独立连接，任何一台相机缺失都不会伪造设备或关闭 GUI。这看似简单，但在研发阶段非常重要——常常只有一台相机可用，强制要求两台都连接会让大部分时间无法工作。

异常恢复上，RGB 掉线识别与异常恢复由 `HikrobotCameraSource` 内部处理：识别到 SDK 抛出连接异常后，先尝试 `MV_CC_StopGrabbing` + `MV_CC_CloseDevice`，再重新枚举和打开，整个过程对 Fusion 透明。

## 未实现控件保持禁用

工程上很容易出现"先打开按钮，功能后续补"，结果用户点了按钮后 GUI 卡死或报错。本项目的做法是：未实现的控件（Fusion 几何标定、去畸变、手动对齐、RGB 视频录制、Fusion 视频录制、分析 CSV）一律禁用，且代码注释清楚标明"尚未接入，继续禁用"。

这种保守策略让工作站当前能力一目了然：用户看到的可用控件都真的能用，避免"看上去很强大但点一下就崩"的尴尬。

## 当前真实能力与边界

工作站当前的真实能力包括：

- DVSense / DVSLume：真实枚举、连接、实时预览、ROI、原始事件录制、现有分析链路；
- Hikrobot RGB：真实 MVS 枚举、连接、实时取流、1280×720 低延迟预览、实时曝光控制、掉线识别与异常恢复；
- DVS + RGB 独立与同时连接：两条独立真实链路，可只连接任意一台，也可同时连接；
- RGB/DVS Fusion：基础叠加已接入，Fusion 不拥有任何硬件句柄。

明确不在当前能力范围：Fusion 几何标定、去畸变、手动对齐、RGB 视频录制、Fusion 视频录制、分析 CSV。这些会作为后续增强逐步接入。

## Hikrobot 首次构建要点

Hikrobot `MV-CU050-90UC` 已完成真实 MVS 冒烟测试，包括曝光读取/写回、连续采集、停止、关闭和 SDK 释放。MATLAB R2024b 通过 Visual Studio 2022 Build Tools 成功编译 `hikrobot_mex.mexw64`，并由 `camera.HikrobotCameraSource` 完成真实枚举、打开、曝光读写、1280×720 RGB 帧读取和关闭。

默认 SDK 路径：

- MVS SDK: `C:\Program Files (x86)\MVS`
- MVS Runtime: `C:\Program Files (x86)\Common Files\MVS\Runtime\Win64_x64`

详细测试记录位于 `docs/diagnostics/`，RGB 接入说明见 `docs/integration/V5_RGB_HIKROBOT.md`。

## 小结

多模态视觉工作站的工程要点不是算法，而是边界：MATLAB 与 C++ 的边界、相机资源与 Fusion 的边界、已实现与未实现的边界。把这些边界做清楚，后续无论是做几何标定、视频录制还是分析导出，都不会破坏现有架构。这个仓库的代码和文档可以作为多模态视觉工作站工程化的参考起点。
