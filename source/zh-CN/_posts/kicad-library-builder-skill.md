---
title: 用 Codex Skill 构建 KiCad 元件库：从数据手册到 3D 验证
description: 记录如何把 KiCad 元件库构建过程沉淀为可复用的 Codex Skill，覆盖符号、封装、3D 模型、FreeCAD 辅助重建、KiCad CLI 渲染与解析校验的完整工程链路。
date: 2026-09-11 14:00:00
updated: 2026-09-11 14:00:00
lang: zh-CN
translation_key: kicad-library-builder-skill
published: true
categories:
  - 硬件工程
tags:
  - KiCad
  - 元件库
  - Codex Skill
  - 3D 模型
  - 自动化
---

绘制电路图时最烦人的不是设计本身，而是"找不到一个完整、可信的元件库"。要么符号画错，要么封装尺寸不对，要么 3D 模型缺失或与实物不符。本文记录把 KiCad 元件库构建沉淀为可复用 Codex Skill 的工程思路。仓库地址：[FukunHennan/kicadskill](https://github.com/FukunHennan/kicadskill)。

## 为什么要把元件库构建做成 Skill

KiCad 自带元件库覆盖很广，但工业现场经常需要自定义元件：新型传感器、特殊连接器、国产 MCU、定制连接器。每个新元件都需要画符号、画封装、找 3D 模型、做几何校验，重复性高且容易出错。

把这些重复性工作沉淀为 Codex Skill 后，可以：用统一流程处理每个新元件，从数据手册提取关键参数，自动调用 KiCad CLI 做几何校验，保留版本化的验证证据，确保元件库长期可维护。

## Skill 覆盖范围

本 Skill 覆盖 KiCad 元件库构建的完整链路：

- KiCad 符号（`.kicad_sym`）和封装（`.kicad_mod`）；
- 基于数据手册的元数据提取；
- WRL 和 STEP 3D 模型；
- FreeCAD 辅助的几何重建与格式转换；
- Primitive-body 与分阶段 3D 验证；
- KiCad CLI 渲染与解析校验；
- 稳定、用户可读的验证工件。

## 数据手册到符号：参数提取

数据手册是元件的唯一可信源。Skill 从数据手册提取以下信息：引脚定义（名称、位置、电气类型）、电源符号、参考命名规则、值字段、封装推荐。提取结果存为结构化 JSON，再由 Skill 转换为 KiCad 符号文件。

这里有一个工程细节：数据手册 PDF 不是纯文本，引脚表通常以图片或表格形式存在。Skill 会优先使用 OCR + 表格解析，对于解析不出来的部分生成"待人工确认"标记，避免把错误参数写入符号库。

## 封装与 3D 模型

封装尺寸必须严格按数据手册，包括焊盘大小、间距、丝印、阻焊层、 courtyard。Skill 生成 `.kicad_mod` 文件时会同时生成对照清单，列出每个尺寸对应的数据手册页码和值，便于人工抽查。

3D 模型有两种来源：从厂商下载官方 STEP/WRL，或通过 FreeCAD 重建。Skill 优先使用官方模型，找不到时通过 FreeCAD 脚本基于封装尺寸生成简化 3D 模型。简化模型不能完全反映机械细节，但足以用于 PCB 装配渲染和干涉检查。

## 3D 验证工件

3D 验证是 Skill 最有价值的部分。最新验证输出位于 `~/KiCad/libraries/3d-verification/current/`，包含顶视图、前视图、右视图、轴测渲染，以及 `model-verification.txt` 和 `README.txt`。版本化证据放在 `~/KiCad/libraries/3d-verification/<component>-<revision>/`。

这种"每个元件一份验证工件"的方式让元件库可审计：任何时候都能回到某次构建的渲染图，对比实物或数据手册，确认没有视觉偏差。

## 重要限制：3D 模型不等于机械精度

Skill 文档中明确标出这条限制：WRL 转 STEP 只改变文件格式，不会让近似模型变成机械精度。生产使用必须以厂商验证的机械尺寸或官方 STEP/WRL 为准。

这条限制听起来朴素，但实际工作中非常重要：把一个简化模型当作机械精度模型使用，会让装配干涉检查给出错误结论。Skill 把限制写在显眼位置，避免后续使用者误用。

## 安装与使用

Skill 安装方式是把目录复制或符号链接到 Codex skills 目录：

```bash
~/.codex/skills/kicad-library-builder/
```

入口文件是 `SKILL.md`，启动后通过自然语言指令调用，例如"为 LM358 构建符号、封装和 3D 模型"。Skill 会按既定流程执行，并在每个阶段输出验证工件。

## 与 KiCad 工程化结合

KiCad CLI 是元件库工程化的关键。Skill 调用 `kicad-cli` 完成以下任务：

- 渲染符号到 SVG，对照数据手册视觉检查；
- 渲染封装到 SVG，对照焊盘和尺寸；
- 解析 `.kicad_sym` 和 `.kicad_mod`，确保文件结构合法；
- 调用 DRC 验证封装 courtyard 与焊盘关系。

CLI 校验在 CI/CD 环境也能跑，意味着元件库变更可以走 Pull Request 流程，自动校验通过后再合并，避免引入格式错误。

## 小结

元件库构建看起来是"画图"工作，本质是工程化：数据手册解析、文件格式、3D 模型、几何校验、版本管理。把这些沉淀为 Skill 后，新元件入库时间从数小时降到分钟级，且每一步都有可审计的证据。这个仓库可以作为 KiCad 元件库工程化的参考起点，也可以直接安装为 Codex Skill 使用。
