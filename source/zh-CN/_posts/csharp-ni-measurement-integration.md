---
title: C# 与 NI 测量硬件的第一步集成
description: 记录一次使用 C# 调用 National Instruments 测量硬件驱动的过程，包括驱动互操作、数据采集线程模型、采样同步与现场可复用封装的实践。
date: 2025-04-28 14:30:00
updated: 2025-04-28 14:30:00
lang: zh-CN
translation_key: csharp-ni-measurement-integration
published: true
categories:
  - 测量与仪器
tags:
  - C#
  - NI
  - 数据采集
  - 互操作
  - 测量
---

National Instruments 的测量硬件在工业测试和实验室场景里覆盖很广，但官方驱动以 C/C++ 和 LabVIEW 为主，C# 上位机接入时需要处理互操作、线程模型和采样同步等细节。本文记录一次用 C# 集成 NI 测量硬件的过程，整理为可复用的封装思路。仓库地址：[FukunHennan/CSharp-NI](https://github.com/FukunHennan/CSharp-NI)。

## 选型与驱动准备

NI 提供 NI-DAQmx 作为统一驱动层，并通过 Measurement Studio 暴露 .NET API。如果没有 Measurement Studio 授权，也可以直接引用 `NationalInstruments.DAQmx.dll`，通过 P/Invoke 风格调用。我选择后者，避免在分发时绑定授权问题，但代价是要自己处理事件回调到 UI 线程的封送。

硬件为 NI USB-621x 系列，需要先安装 NI-DAQmx Runtime，安装完成后通过 NI MAX 确认设备名（例如 `Dev1`），上位机使用这个设备名创建通道。

## 通道与任务模型

NI-DAQmx 的核心抽象是 `Task`，它把"要采集什么"封装成一个可重用的对象。创建通道时需要明确：

- 物理通道（如 `Dev1/ai0`）；
- 信号范围（最小值/最大值，影响 ADC 增益和精度）；
- 接线方式（Referenced Single-Ended、Differential 等）；
- 单位换算（如使用应变时需要桥路配置和缩放）。

我把任务建模为配置驱动：所有采集参数放在一个 `TaskConfig` 类里，运行时根据配置构建 `AnalogMultiChannelReader` 并启动定时读取。这样可以保证不同项目复用同一套采集层，只需要改配置。

## 采样时钟与同步

NI 硬件支持硬件时钟，这是它区别于普通 USB 数据采集卡的关键。在 C# 中通过 `SampleClock` 配置触发源、采样率和每次采样点数：

- 采样率：根据奈奎斯特定理和传感器带宽选择，但要注意硬件规格上限；
- 每次采样点数：影响单次 `Read` 调用的延迟和内存占用；
- 触发源：可以从 AI 通道、PFI 引脚或外部信号触发，适合需要严格相位同步的场景。

实际项目里我使用 100kHz 采样率、每帧 1000 个点，单帧延迟 10ms，配合后台线程连续 `ReadMultiSample`，避免 UI 线程被阻塞。

## 线程模型与数据回流

NI-DAQmx 的 `Read` 调用是阻塞的，如果在 UI 线程上直接调用会卡住界面。我使用一个专门的采集线程，循环调用 `BeginReadMultiSample` + `EndReadMultiSample`，并将结果通过 `ConcurrentQueue` 投递到数据处理层。界面层订阅数据层事件，通过 `SynchronizationContext` 切回 UI 线程更新波形。

异常处理上，NI 驱动会抛出 `DaqException`，错误码可读性较好。我根据错误码区分"瞬时超时"和"硬件状态异常"，前者直接重试，后者触发任务重建并通知 UI 提示检查接线。

## 现场可复用封装

经过几次现场使用，我把封装收敛为几个职责清晰的组件：

- `NiTaskFactory`：根据配置创建和销毁 `Task`，负责资源释放；
- `AcquisitionLoop`：管理后台采集线程、停止信号、异常重试；
- `SampleBuffer`：环形缓冲区，提供滑动窗口查询接口；
- `DataSink`：把采集数据投递到日志、波形显示或导出模块。

这套封装的好处是新增采集场景时只需要写配置，不重复处理线程和异常。

## 现场小贴士

- 物理通道名以 NI MAX 为准，不要硬编码到代码；
- 采样率超过规格上限会抛 ` DAQmxStatusCode`，注意捕获并提示；
- USB 设备的接地不要与强电共用，否则会出现周期性尖峰；
- 长时间采集时定期调用 `TaskControl` 检查任务状态，避免静默停止；
- 分发部署时记得附带 NI-DAQmx Runtime，否则会报"驱动未安装"。

## 小结

NI 硬件和 C# 的集成并不复杂，关键在于任务建模、线程边界和异常处理。把这套流程做扎实，后续无论是电压电流采集、压力测量还是应变测量，都能复用同一层采集代码。这个仓库里保留了一个最小可运行样例，可以作为接入 NI 硬件的起点。
