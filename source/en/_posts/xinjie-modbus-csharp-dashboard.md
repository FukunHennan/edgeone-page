---
title: "Extending XinJie XDH automation with C# and EasyModbus — without touching the ladder"
description: Building C# host automation on an existing XinJie XDH PLC by reading and writing Modbus registers directly, without touching the ladder. Includes the real XDH register map, C# EasyModbus code, and architecture trade-offs.
date: 2025-04-22 10:00:00
updated: 2025-04-22 10:00:00
lang: en
translation_key: xinjie-modbus-csharp-dashboard
published: true
categories:
  - Industrial Control
tags:
  - C#
  - Modbus
  - PLC
  - XinJie
  - Host Software
---

Taking over a running line is awkward when the PLC program was written by the machine builder in XDP, the ladder is a black box with no source code, no comments, and the builder is unreachable — but the line needs new features: an extra sensor check, an interlock, a MES report.

Reversing or rewriting the ladder is risky, slow, and means downtime. I took the pragmatic route: **leave the PLC program untouched, drive the XDH directly through its Modbus registers and coils from a C# host, and put the new automation logic in the host**.

This post records the architecture, real register addresses, the C# calls, and the gotchas. Repo: [FukunHennan/XinJie_modbus_Csharp](https://github.com/FukunHennan/XinJie_modbus_Csharp).

## Core idea: PLC as actuator, host as controller

A traditional host is often just a dashboard, with all logic inside the PLC. But when the ladder is opaque and cannot be touched, **demoting the PLC to "IO collector + actuator"** is more reasonable:

- **Inputs** (X, sensor feedback) are acquired by the PLC and read by the host via Modbus;
- **Decision logic** (interlocks, cycle, recipes) runs in the C# host;
- **Outputs** (Y, valves, motor start) are triggered by the host writing coils or D registers.

The payoff: **all new logic lives in C# code** — debuggable, unit-testable, version-controlled, and rollable. The PLC program stays stable; existing logic is not touched.

The cost is also clear: real-time behavior is bounded by the Modbus poll cycle (typically 50–200 ms), so ms-scale interlocks are out; if the link drops, the host loses control, so fail-safe handling is mandatory. This architecture fits **slower cycle, human-intervenable lines where the PLC program is read-only**.

## XDH default Modbus register map (no XDP configuration needed)

The first trap is thinking you must configure "Modbus mapping" in XDP. XinJie XDH **maps its internal soft elements to Modbus address space by default** — it works out of the box. The default map (from XinJie's official docs):

### Coils (function codes 01/05/15)

| PLC address | Modbus address (hex / dec) | Count | Notes |
| --- | --- | --- | --- |
| M0–M7999 | 0x0000–0x1F3F / 0–7999 | 8000 | General internal relays (most used) |
| S0–S1023 | 0x7000–0x73FF / 28672–29695 | 1024 | System status bits |
| SM0–SM2047 | 0x9000–0x97FF / 36864–38911 | 2048 | System internal relays |
| T0–T575 | 0xA000–0xA23F / 40960–41535 | 576 | Timer coils |
| C0–C575 | 0xB000–0xB23F / 45056–45631 | 576 | Counter coils |
| X0–X77 | 0x5000–0x503F / 20480–20543 | 64 | Onboard inputs (octal numbering) |
| X10000–X11177 | 0x5100–0x537F / 20736–21375 | 640 | Expansion inputs |
| Y0–Y77 | 0x6000–0x603F / 24576–24639 | 64 | Onboard outputs (octal numbering) |
| Y10000–Y11177 | 0x6100–0x637F / 24832–25471 | 640 | Expansion outputs |

### Holding registers (function codes 03/06/16)

| PLC address | Modbus address (hex / dec) | Count | Notes |
| --- | --- | --- | --- |
| D0–D7999 | 0x0000–0x1F3F / 0–7999 | 8000 | General data registers (most used) |
| TD0–TD575 | 0x3000–0x326A / 12288–12906 | 576 | Timer current values |
| CD0–CD575 | 0x3800–0x3A7A / 14336–14970 | 576 | Counter current values |
| D8000–D8511 | 0x4000–0x41FF / 16384–16895 | 512 | System special registers (clock, battery, run state) |
| ID0–ID99 | 0x5000–0x5063 / 20480–20579 | 100 | Input registers (analog, etc.) |
| QD0–QD99 | 0x6000–0x6063 / 24576–24675 | 100 | Output registers (analog, etc.) |
| FD0–FD5000 | 0x4800–0x5B88 / 18432–23432 | 5000 | File registers (retentive) |
| ED0–ED36863 | 0x7000–0xFFFF / 28672–65535 | 36864 | Extended data registers |

### Two key conventions

- **X and Y use octal numbering**: after X0–X77 comes X10000–X11177, not X100. Different from M and D (decimal), so pay attention when converting addresses.
- **Bit addressing**: D registers can be addressed by bit, e.g. `D0.5` means bit 5 of D0, mapping to Modbus coil `0x0000` + 0×16 + 5.

## How the project actually uses these registers

The line I took over already had a set of "interface registers" defined by the machine builder — status, commands, and recipes lived at fixed D addresses. Even without docs, you can reverse them by watching XDP online. Here is the real usage table (addresses offset for privacy, structure intact):

| Modbus addr | PLC addr | Dir | Meaning | Type |
| --- | --- | --- | --- | --- |
| 0x0000 (0) | D0 | R/W | Master command word (0=idle 1=auto 2=manual 3=estop) | INT16 |
| 0x0001 (1) | D1 | R/W | Recipe number | INT16 |
| 0x0010 (16) | D10 | R | Current cycle count | INT16 |
| 0x0011 (17) | D11 | R | Last cycle duration (10 ms unit) | INT16 |
| 0x0020 (32) | D20 | R/W | Temperature setpoint ×10 (°C) | INT16 |
| 0x0021 (33) | D21 | R | Temperature measured ×10 (°C) | INT16 |
| 0x0030 (48) | D30 | R | Fault code (0=ok) | INT16 |
| 0x0040 (64) | D40 | R/W | Shift production count | INT32 (2 regs, ABCD word order) |
| 0x1000 (4096) | M0 | R/W | Auto-mode enable | BIT |
| 0x1001 (4097) | M1 | R | Estop pressed (direct PLC input) | BIT |
| 0x1002 (4098) | M2 | R/W | Host heartbeat | BIT |
| 0x6000 (24576) | Y0 | R | Spindle running (PLC output mirror) | BIT |
| 0x6001 (24577) | Y1 | R/W | External indicator driven by writing the coil | BIT |

This table is the "interface contract" between host and PLC. The host only reads and writes these addresses — touching anything else risks breaking existing ladder logic.

## Real C# calls with EasyModbus

### Connecting

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
            UnitIdentifier = 1   // XinJie default slave address
        };
    }

    public void Connect() => _client.Connect();
    public void Dispose() => _client.Disconnect();
}
```

TCP default port is 502. For RS485, swap `ModbusClient` for `ModbusSerialClient` and set 9600/8/N/1.

### Reading an INT16

```csharp
// Read D21 (address 0x0011 = 17), measured temperature
int[] values = _client.ReadHoldingRegisters(17, 1);
double tempC = values[0] / 10.0;   // scaling factor matches the table
```

### Reading INT32 (FLOAT) with word order

```csharp
// D40 shift production, 2 regs, XinJie default ABCD
int[] raw = _client.ReadHoldingRegisters(40, 2);
int combined = (raw[0] << 16) | (raw[1] & 0xFFFF);   // ABCD
// If the field actually uses CDAB, swap the lines:
// int combined = (raw[1] << 16) | (raw[0] & 0xFFFF);
```

Make word order a config field so you do not have to rebuild to switch:

```csharp
public enum WordOrder { ABCD, CDAB, BADC, DCBA }
```

### Writing a coil to trigger an action

```csharp
// Write M0 (address 0x1000 = 4096) to true, enter auto mode
_client.WriteSingleCoil(4096, true);

// Write Y1 (address 0x6001 = 24577) to light the indicator
_client.WriteSingleCoil(24577, true);
```

Writing a coil is a common "edge-triggered" pattern: writing 1 turns on an internal M inside the PLC, and the ladder detects its rising edge to run a predefined action. **The host never drives physical outputs Y directly** — it instructs the PLC through M, which is safe and reversible.

## Threading: serial queue plus heartbeat

EasyModbus sync calls on the UI thread hang the form, and concurrent threads hammer the PLC's comm port. I use a dedicated comm thread to consume a request queue serially:

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
            try { req.Execute(c); }      // retry/throw handled by the request itself
            catch (Exception ex) { req.Fail(ex); }
        }
    }
}
```

Upper layers only call `Enqueue`; they never touch `_client`. Requests are serial, so the PLC's comm port never gets saturated.

Heartbeat runs independently: every 500 ms writes M2. If the ladder does not see it for 2 seconds, the PLC enters a safe state.

## Error recovery: two layers

The common field failures are transient timeouts and short dropouts. EasyModbus throws `IOException` / `TimeoutException`; bubbling those up as popups makes operators angry. Two layers:

- **Layer 1**: retry the failed request twice with 100 ms backoff;
- **Layer 2**: cumulative failures reach a threshold (default 5) and trigger a reconnect: `Disconnect()`, fail all pending requests in the queue, `Connect()` again, resume heartbeat.

New requests queue during reconnect so nothing piles up at the broken link. On success, emit a "recovered" event so the UI flips the status light back to green.

## Field debugging checklist

Every startup:

- PLC program is downloaded and in RUN, and XDP online shows D values moving;
- Modbus slave is enabled (XDH is on by default, but some builders disable Modbus TCP on LAN1);
- Port 502 is reachable on the PLC's network port, `ping` succeeds;
- Register map matches the host config, especially word order and scaling;
- Cable shield is grounded, low-voltage separated from high-voltage;
- Power is stable; consider splitting PLC and host supplies;
- Host exception logging is on and writes to disk, not just the UI;
- The "safe state" triggered by heartbeat timeout has been confirmed with the operator, so the PLC entering it does not cause secondary failures.

## Architecture trade-offs

This "PLC as actuator, host as controller" approach has clear boundaries:

**Fits**

- PLC program has no source, cannot be modified or stopped;
- Cycle is in the hundreds of ms or slower, human-intervenable;
- Need fast MES/SCADA integration, recipe management, batch traceability;
- Decision logic is complex (database, reports, remote APIs) and painful in ladder.

**Does not fit**

- ms-scale interlocks (safety, motion sync) must live in the PLC;
- Unreliable links (strong EMI, wireless);
- Critical processes where host downtime means line stop — fail-safe must be in the PLC.

In practice I keep "safety-related" logic in the PLC (estop, limits, mutual interlocks) and move "management-related" logic to the host (recipes, cycles, reports, traceability). Clear two-tier responsibility: existing ladder is not broken, and new features land fast.

## Closing notes

Taking over a running line does not require reverse-engineering the ladder. With XinJie XDH's default-open Modbus register map plus C# and EasyModbus, you can extend automation without touching the PLC program. The keys are: reverse an "interface register table" as the contract; use a serial comm thread with heartbeat and two-layer recovery; and keep "safety in the PLC, management in the host" as the responsibility boundary.

The repo keeps a minimal runnable sample as a starting point for anyone doing similar line retrofits.
