---
title: 不动 PLC 梯形图，用 C# 和 EasyModbus 在信捷 XDH 上扩展自动化
description: 在已有的信捷 XDH PLC 程序基础上，通过 C# 上位机直接读写 Modbus 寄存器实现自动化扩展。包含 XDH 默认寄存器映射表、C# EasyModbus 真实调用、通信线程模型与架构取舍分析。
date: 2025-04-22 10:00:00
updated: 2025-04-22 10:00:00
lang: zh-CN
translation_key: xinjie-modbus-csharp-dashboard
published: true
categories:
  - 工业控制
tags:
  - C#
  - Modbus
  - PLC
  - 信捷
  - 上位机
---

接手一条已经跑起来的产线时，最尴尬的局面是：PLC 程序是设备厂用 XDP 写的，逻辑封装在梯形图里，没有源代码、没有注释，甚至设备厂已经联系不上。但产线要加新功能——多加一组传感器判断、加一段联锁、加一条 MES 上报。

如果去反编译或重写 PLC 程序，风险高、周期长、还要停机。我选择了一条更务实的路：**PLC 程序保持原样不动，用 C# 上位机直接通过 Modbus 读写 XDH 的寄存器和线圈，把扩展的自动化逻辑挪到上位机里实现**。

本文记录这次改造的技术架构、真实寄存器地址、C# 调用方式和踩过的坑。仓库地址：[FukunHennan/XinJie_modbus_Csharp](https://github.com/FukunHennan/XinJie_modbus_Csharp)。

## 核心思路：PLC 当执行器，上位机当控制器

传统上位机经常只是"看板"，逻辑都写在 PLC 里。但既然 PLC 程序看不懂又不能动，**把它降级成"IO 采集器 + 执行器"**反而更合理：

- **输入信号**（X、传感器反馈）由 PLC 采集，上位机通过 Modbus 读取；
- **决策逻辑**（联锁、节拍、配方）由 C# 上位机完成；
- **输出动作**（Y、阀门、电机启动）由上位机通过 Modbus 写线圈或写 D 寄存器间接触发。

这种架构的关键收益是：**新增逻辑全部在 C# 代码里**，可调试、可单测、可版本管理、可灰度上线；PLC 程序保持稳定，不动既有逻辑。

它的代价也很明确：实时性受 Modbus 轮询周期限制（通常 50–200ms），不适合 ms 级联锁；通信断开时上位机失去控制权，必须有故障保护。所以这个架构适合**节拍较慢、人工可介入、对 PLC 程序无改写权限**的产线改造场景。

## XDH 默认 Modbus 寄存器映射（无需在 XDP 配置）

最容易踩的第一个坑是以为要在 XDP 里做"Modbus 映射"才能让上位机访问。其实信捷 XDH 系列**默认就把内部软元件映射到 Modbus 地址空间**，开箱即用。下面是 XDH 系列默认映射表（基于信捷官方文档）：

### 线圈区（Coils，功能码 01/05/15）

| PLC 地址 | Modbus 地址（hex / dec） | 数量 | 说明 |
| --- | --- | --- | --- |
| M0–M7999 | 0x0000–0x1F3F / 0–7999 | 8000 | 通用内部继电器（最常用） |
| S0–S1023 | 0x7000–0x73FF / 28672–29695 | 1024 | 系统状态位 |
| SM0–SM2047 | 0x9000–0x97FF / 36864–38911 | 2048 | 系统内部继电器 |
| T0–T575 | 0xA000–0xA23F / 40960–41535 | 576 | 定时器线圈 |
| C0–C575 | 0xB000–0xB23F / 45056–45631 | 576 | 计数器线圈 |
| X0–X77 | 0x5000–0x503F / 20480–20543 | 64 | 本机输入（八进制编号） |
| X10000–X11177 | 0x5100–0x537F / 20736–21375 | 640 | 扩展输入 |
| Y0–Y77 | 0x6000–0x603F / 24576–24639 | 64 | 本机输出（八进制编号） |
| Y10000–Y11177 | 0x6100–0x637F / 24832–25471 | 640 | 扩展输出 |

### 保持寄存器区（Holding Registers，功能码 03/06/16）

| PLC 地址 | Modbus 地址（hex / dec） | 数量 | 说明 |
| --- | --- | --- | --- |
| D0–D7999 | 0x0000–0x1F3F / 0–7999 | 8000 | 通用数据寄存器（最常用） |
| TD0–TD575 | 0x3000–0x326A / 12288–12906 | 576 | 定时器当前值 |
| CD0–CD575 | 0x3800–0x3A7A / 14336–14970 | 576 | 计数器当前值 |
| D8000–D8511 | 0x4000–0x41FF / 16384–16895 | 512 | 系统特殊寄存器（时钟、电池、运行状态） |
| ID0–ID99 | 0x5000–0x5063 / 20480–20579 | 100 | 输入寄存器（模拟量等） |
| QD0–QD99 | 0x6000–0x6063 / 24576–24675 | 100 | 输出寄存器（模拟量等） |
| FD0–FD5000 | 0x4800–0x5B88 / 18432–23432 | 5000 | 文件寄存器（停电保持） |
| ED0–ED36863 | 0x7000–0xFFFF / 28672–65535 | 36864 | 扩展数据寄存器 |

### 两个关键约定

- **X、Y 使用八进制编号**：X0–X77 之后是 X10000–X11177，不是 X100。这点和 M、D（十进制）完全不同，做地址换算时一定要分清。
- **位寻址**：D 寄存器可以按位访问，例如 `D0.5` 表示 D0 的第 5 位，对应 Modbus 线圈地址 `0x0000` 起始 + 0×16 + 5。

## 真实寄存器在项目里怎么用

我接手的那条产线，PLC 程序里已经定义好了一组约定俗成的"接口寄存器"：设备厂把状态、命令、配方都放在固定 D 区里。即使没有文档，用 XDP 在线监控也能逆向出来。下面是我整理出来的真实使用地址（出于隐私，地址偏移过，但结构一致）：

| Modbus 地址 | PLC 地址 | 方向 | 含义 | 数据类型 |
| --- | --- | --- | --- | --- |
| 0x0000 (0) | D0 | R/W | 主站命令字（0=待机 1=自动 2=手动 3=急停） | INT16 |
| 0x0001 (1) | D1 | R/W | 配方编号 | INT16 |
| 0x0010 (16) | D10 | R | 当前节拍计数 | INT16 |
| 0x0011 (17) | D11 | R | 上一次完成节拍用时（10ms 单位） | INT16 |
| 0x0020 (32) | D20 | R/W | 温度设定值 ×10（°C） | INT16 |
| 0x0021 (33) | D21 | R | 温度实测值 ×10（°C） | INT16 |
| 0x0030 (48) | D30 | R | 故障码（0=正常） | INT16 |
| 0x0040 (64) | D40 | R/W | 班次产量计数 | INT32（占 2 寄存器，ABCD 字序） |
| 0x1000 (4096) | M0 | R/W | 自动模式使能 | BIT |
| 0x1001 (4097) | M1 | R | 急停按下（PLC 直采） | BIT |
| 0x1002 (4098) | M2 | R/W | 上位机心跳 | BIT |
| 0x6000 (24576) | Y0 | R | 主轴运行（PLC 输出镜像） | BIT |
| 0x6001 (24577) | Y1 | R/W | 通过写线圈触发的外部指示灯 | BIT |

这张表是上位机和 PLC 之间的"接口契约"——上位机只读写这些地址，不碰其他地方，PLC 程序里已有的逻辑就不会被破坏。

## C# 调用 EasyModbus 的真实写法

### 连接建立

```csharp
using EasyModbus;

public sealed class XinjeClient : IDisposable
{
    private readonly ModbusClient _client;
    public XinjeClient(string ip, int port = 502)
    {
        _client = new ModbusClient(ip, port)
        {
            ConnectTimeout = 1000,
            ReceiveTimeout = 800,
            UnitIdentifier = 1   // 信捷默认从站地址
        };
    }

    public void Connect() => _client.Connect();
    public void Dispose() => _client.Disconnect();
}
```

TCP 默认端口 502；如果用 RS485，把 `ModbusClient` 换成 `ModbusSerialClient`，并指定波特率 9600/8/N/1。

### 读 INT16 寄存器

```csharp
// 读 D21（地址 0x0011 = 17）当前温度实测值
int[] values = _client.ReadHoldingRegisters(17, 1);
double tempC = values[0] / 10.0;   // 缩放系数与表一致
```

### 读 INT32（FLOAT）并处理字序

```csharp
// D40 班次产量，占 2 寄存器，信捷默认 ABCD
int[] raw = _client.ReadHoldingRegisters(40, 2);
int combined = (raw[0] << 16) | (raw[1] & 0xFFFF);   // ABCD
// 如果现场实测是 CDAB，把这两行换位：
// int combined = (raw[1] << 16) | (raw[0] & 0xFFFF);
```

字序在配置文件里做成可切换的字段，避免改代码重启：

```csharp
public enum WordOrder { ABCD, CDAB, BADC, DCBA }
```

### 写线圈触发动作

```csharp
// 写 M0（地址 0x1000 = 4096）置 1，进入自动模式
_client.WriteSingleCoil(4096, true);

// 写 Y1（地址 0x6001 = 24577）点亮指示灯
_client.WriteSingleCoil(24577, true);
```

写线圈是"边沿触发"的常用方式：写 1 让 PLC 内部某个 M 接通，PLC 程序里的梯形图检测到该 M 的上升沿后执行预设动作。这样**上位机不需要直接控制物理输出 Y**，而是通过 M 间接指挥 PLC，安全且可回滚。

## 通信线程模型：串行队列 + 心跳

EasyModbus 的同步 API 在 UI 线程上调用会卡界面，多个线程同时调用会撞 PLC 的通信口。我用一个专用通信线程串行消费请求队列：

```csharp
public sealed class CommLoop : IDisposable
{
    private readonly BlockingCollection<Request> _queue = new();
    private readonly Thread _thread;
    private volatile bool _running = true;

    public CommLoop(XinjeClient client) {
        _thread = new Thread(() => Run(client)) { IsBackground = true };
        _thread.Start();
    }

    public Task<T> Enqueue<T>(Func<XinjeClient, T> work) {
        var req = new Request<T>(work);
        _queue.Add(req);
        return req.Tcs.Task;
    }

    private void Run(XinjeClient c) {
        while (_running) {
            if (!_queue.Take(out var req, 50, default)) continue;
            try { req.Execute(c); }      // 失败由 req 自己重试/抛出
            catch (Exception ex) { req.Fail(ex); }
        }
    }
}
```

上层界面只调用 `Enqueue`，不直接接触 `_client`，请求串行执行，PLC 通信口永远不会被打满。

心跳独立跑：每 500ms 写一次 M2，PLC 程序里若 2 秒没收到心跳就进入安全态。

## 异常恢复：两层兜底

现场最容易出现的故障是偶发超时和短时掉线。EasyModbus 直接抛 `IOException` / `TimeoutException`，如果冒泡到界面，操作员会非常烦躁。我做两层兜底：

- **第一层**：单次请求失败后重试 2 次，间隔 100ms；
- **第二层**：连续失败累计达阈值（默认 5 次）触发重连：先 `Disconnect()`、清理请求队列中所有未完成请求为失败、`Connect()` 重建、恢复心跳。

重连期间新请求进入等待队列，避免在断开瞬间堆积无效请求。重连成功后向 UI 投递"已恢复"事件，让界面把状态灯切回绿色。

## 现场调试清单

每次开机都要过的清单：

- PLC 程序已下载并处于 RUN 状态，XDP 在线监控能看到 D 区在动；
- Modbus 从站已启用（XDH 默认开，但有些设备厂会关掉 LAN1 的 Modbus TCP）；
- 端口 502 在 PLC 网口上可达，`ping` 通；
- 寄存器映射表与上位机配置一致，特别是字序和缩放系数；
- 通信线缆屏蔽层可靠接地，强电与弱电分离走线；
- 现场电源稳定，必要时给 PLC 和上位机分开供电；
- 上位机异常日志已开启，且写入磁盘而非只显示在界面；
- 心跳超时触发的"安全态"已与操作员确认，避免 PLC 进入安全态时设备突然停机造成二次故障。

## 架构取舍分析

这种"PLC 当执行器、上位机当控制器"的架构有明确的边界：

**适合的场景**

- PLC 程序无源码、不能改、不能停机；
- 节拍在百毫秒以上，人工可介入；
- 需要快速接入 MES/SCADA、做配方管理或批次追溯；
- 决策逻辑复杂（数据库查询、报表、远程 API），PLC 写起来非常痛苦。

**不适合的场景**

- ms 级联锁（安全联锁、运动控制同步）必须放在 PLC 里，不能依赖上位机和 Modbus；
- 通信链路不可靠的环境（强电磁干扰、无线）；
- 上位机宕机即整体停机的关键工序，必须有故障保护逻辑放在 PLC 端。

实操上我会把"安全相关"的逻辑留在 PLC 里（急停、限位、互锁），把"管理相关"的逻辑搬到上位机（配方、节拍、报表、追溯）。两层职责分清，既不破坏既有 PLC 程序，又能快速扩展。

## 小结

接手一条已经在跑的产线，不一定要去反编译 PLC 梯形图。利用信捷 XDH 默认开放的 Modbus 寄存器映射，配合 C# 和 EasyModbus，可以在不动 PLC 程序的前提下扩展自动化能力。关键在于：先逆向出"接口寄存器表"作为契约，再用串行通信线程 + 心跳 + 两层兜底保证稳定，最后明确"安全留 PLC、管理搬上位机"的职责边界。

仓库里只保留了一个最小可运行的样例，欢迎同样在做产线改造的人参考。
