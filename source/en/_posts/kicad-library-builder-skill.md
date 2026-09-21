---
title: Building KiCad component libraries with a Codex Skill
description: How I turned KiCad component library construction into a reusable Codex Skill covering symbols, footprints, 3D models, FreeCAD-assisted reconstruction, KiCad CLI rendering, and parser validation.
date: 2026-09-11 14:00:00
updated: 2026-09-11 14:00:00
lang: en
translation_key: kicad-library-builder-skill
published: true
categories:
  - Hardware Engineering
tags:
  - KiCad
  - Component Library
  - Codex Skill
  - 3D Model
  - Automation
---

The most annoying part of schematic design is not the design itself, it is "I cannot find a complete, trustworthy component". Symbols are wrong, footprints are off, 3D models are missing or mismatched. This post records how I turned KiCad library construction into a reusable Codex Skill. Repo: [FukunHennan/kicadskill](https://github.com/FukunHennan/kicadskill).

## Why a Skill for library building

KiCad ships a wide library, but in industry you often need custom parts: new sensors, odd connectors, domestic MCUs, custom headers. Each new part means symbol, footprint, 3D model, geometric verification — repetitive and error-prone.

As a Codex Skill, every new part follows the same flow: extract parameters from the datasheet, build files, call KiCad CLI for geometric verification, keep versioned evidence. The library stays maintainable long-term.

## Scope

The Skill covers the full library chain:

- KiCad symbols (`.kicad_sym`) and footprints (`.kicad_mod`);
- Datasheet-driven metadata extraction;
- WRL and STEP 3D models;
- FreeCAD-assisted geometric reconstruction and format conversion;
- Primitive-body and staged 3D verification;
- KiCad CLI rendering and parser checks;
- Stable, user-readable verification artifacts.

## Datasheet to symbol

The datasheet is the only source of truth. The Skill extracts: pin definitions (name, position, electrical type), power symbols, reference designator rules, value field, recommended footprint. Output is structured JSON, then converted to a KiCad symbol file.

One detail: datasheet PDFs are not plain text, pin tables are often images or tables. The Skill uses OCR plus table parsing; ambiguous parts get flagged "needs human review" rather than written silently into the symbol.

## Footprint and 3D model

Footprint dimensions must match the datasheet exactly: pad size, pitch, silkscreen, solder mask, courtyard. The Skill generates `.kicad_mod` plus a side-by-side checklist that maps each dimension to the datasheet page and value, for human spot-checking.

3D models come from two sources: official STEP/WRL from the vendor, or reconstruction via FreeCAD. The Skill prefers official; if none, it uses FreeCAD scripts to build a simplified 3D model from footprint dimensions. Simplified models are not mechanically accurate but suffice for PCB assembly renders and interference checks.

## 3D verification artifacts

3D verification is the Skill's most valuable piece. Latest output sits at `~/KiCad/libraries/3d-verification/current/` with top, front, right, and isometric renders plus `model-verification.txt` and `README.txt`. Versioned evidence lives at `~/KiCad/libraries/3d-verification/<component>-<revision>/`.

This per-component evidence makes the library auditable: any build can be revisited and compared against the physical part or datasheet.

## Critical limitation: 3D model is not mechanical accuracy

The Skill calls this out explicitly: WRL-to-STEP only changes file format; it does not make an approximate model mechanically accurate. Production use requires vendor-verified mechanical dimensions or an official STEP/WRL.

Sounds obvious, but it is a common pitfall: treating a simplified model as mechanical truth leads to false interference conclusions during assembly checks. The Skill puts this warning front and center.

## Install and use

Install by copying or symlinking the directory into the Codex skills directory:

```bash
~/.codex/skills/kicad-library-builder/
```

Entry point is `SKILL.md`. Invoke via natural language, e.g. "build symbol, footprint, and 3D model for LM358". The Skill runs the workflow and emits verification artifacts at each stage.

## Coupling with KiCad engineering

KiCad CLI is what makes library engineering real. The Skill calls `kicad-cli` to:

- Render symbols to SVG for visual comparison with the datasheet;
- Render footprints to SVG for pad and dimension review;
- Parse `.kicad_sym` and `.kicad_mod` for structural validity;
- Run DRC to check courtyard-vs-pad relationships.

CLI checks also run in CI/CD, so library changes can go through pull requests with automated verification before merge.

## Closing notes

Component library building looks like drawing; it is really engineering: datasheet parsing, file formats, 3D models, geometric verification, versioning. As a Skill, new parts go from hours to minutes, with auditable evidence at every step. Use this repo as a reference for KiCad library engineering or install it directly as a Codex Skill.
