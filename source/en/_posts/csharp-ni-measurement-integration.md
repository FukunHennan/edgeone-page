---
title: First steps integrating C# with NI measurement hardware
description: Notes from driving National Instruments measurement hardware from C#, covering driver interop, threading for acquisition, sample-clock synchronization, and a field-reusable wrapper.
date: 2025-04-28 14:30:00
updated: 2025-04-28 14:30:00
lang: en
translation_key: csharp-ni-measurement-integration
published: true
categories:
  - Measurement & Instrumentation
tags:
  - C#
  - NI
  - Data Acquisition
  - Interop
  - Measurement
---

NI hardware covers a lot of industrial and lab use cases, but the official drivers are C/C++ and LabVIEW first; C# hosts need to deal with interop, threading, and sample-clock sync. This post records how I integrated NI measurement hardware from C# and what wrapper I converged on. Repo: [FukunHennan/CSharp-NI](https://github.com/FukunHennan/CSharp-NI).

## Driver setup

NI ships NI-DAQmx as a unified driver and exposes a .NET API through Measurement Studio. Without a Measurement Studio license you can still reference `NationalInstruments.DAQmx.dll` and call it directly. I chose the second path to avoid licensing on distribution, at the cost of marshaling callbacks to the UI thread yourself.

The hardware is an NI USB-621x. Install NI-DAQmx Runtime, confirm the device name (e.g. `Dev1`) in NI MAX, and the host references that name when creating channels.

## Task and channel model

The core abstraction in NI-DAQmx is a `Task`: "what to acquire" packaged for reuse. When creating channels, you must specify the physical channel (`Dev1/ai0`), signal range (affecting ADC gain and accuracy), terminal configuration (RSE, differential, etc.), and scaling (strain needs bridge scaling). I model the task as config-driven: a `TaskConfig` class drives the runtime `AnalogMultiChannelReader`. The same acquisition layer works across projects with different configs.

## Sample clock and synchronization

NI hardware supports hardware clocks — that is what separates it from generic USB ADCs. In C# you configure `SampleClock` source, rate, and samples-per-channel-per-read:

- Rate is bounded by Nyquist and the sensor bandwidth, plus hardware limits;
- Samples-per-read drives per-call latency and memory;
- Trigger source can be AI channels, PFI pins, or external signals for tight phase sync.

I run 100 kHz, 1000 samples per frame, 10 ms per frame, on a background thread doing continuous `ReadMultiSample` so the UI thread is never blocked.

## Threading and data flow

NI-DAQmx `Read` is blocking; calling it on UI hangs the form. I use a dedicated acquisition thread, calling `BeginReadMultiSample` + `EndReadMultiSample` in a loop and pushing results through a `ConcurrentQueue` to the data layer. UI subscribes to data-layer events and marshals back to UI via `SynchronizationContext`.

NI throws `DaqException` with decent error codes. I split transient timeouts (retry) from hardware state errors (rebuild the task and notify the UI to check wiring).

## Reusable wrapper

After several field deployments I converged on:

- `NiTaskFactory` — create/destroy tasks, own resource release;
- `AcquisitionLoop` — background thread, stop signal, exception retry;
- `SampleBuffer` — ring buffer with sliding-window queries;
- `DataSink` — fan out to log, waveform, or export modules.

New acquisition scenarios become config changes instead of new code.

## Field tips

- Physical channel names come from NI MAX; do not hard-code them;
- Sample-rate over spec throws `DAQmxStatusCode` — catch and notify;
- USB grounding separate from high-voltage to avoid periodic spikes;
- For long runs, periodically check task state to catch silent stops;
- Distribute NI-DAQmx Runtime alongside the host, or you will see "driver not installed".

## Closing notes

NI hardware integration with C# is not hard; the work is in task modeling, threading boundaries, and exception handling. Build this layer well and the same code covers voltage, current, pressure, and strain. The repo has a minimal runnable sample as a starting point.
