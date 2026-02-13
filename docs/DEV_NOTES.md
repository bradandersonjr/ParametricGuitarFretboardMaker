# Development Notes

## Architecture Overview

### Layers
| Layer | Responsibility |
|---|---|
| **Fusion Templates** (`.f3d`) | Geometric source of truth — all parametric logic lives in Fusion |
| **Parameter Schema** (`parameters.schema.json`) | Contract between templates and UI — drives what controls render |
| **Python Add-in** | Bridge — imports templates, reads/writes parameters, hosts the palette |
| **React UI** (Phase 5+) | Schema-driven controls, presets, version-mismatch warnings |
| **JS ↔ Python Bridge** | `GET_MODEL_STATE`, `APPLY_PARAMS`, `PUSH_MODEL_STATE` messaging |

### Ground Rules
- The Fusion template(s) are the geometric source of truth.
- The UI is driven by the Parameter Schema, not hard-coded UI.
- The add-in must work offline using a bundled UI build.
- Unit conversion only applies to dimensional parameters (never ratios/constants).
- No visible "flash" on import: templates saved with timeline at start.

## Key Design Decisions

### Unit-Aware Template Selection
Rather than converting units at runtime, we maintain separate inch and mm templates.
The add-in checks `design.fusionUnitsManager.defaultLengthUnits` and imports the
matching template. This avoids precision issues and keeps the Fusion model clean.

### Schema-Driven UI
The `parameters.schema.json` file defines groups, control types, constraints, and
defaults. The UI is generated from this schema — adding a new parameter to the
template only requires updating the schema, not the UI code.

### Palette Lifecycle
- The palette opens docked at the left.
- On document switch, the palette hides if the active document isn't the one Parametric Guitar: Fretboard Maker is bound to.
- On close/cancel before applying, the import is rolled back.

## Phase Tracker
- [x] Phase 0 — Repo Skeleton
- [ ] Phase 1 — Template Files & Parameter Contract (using cube.f3d for testing)
- [x] Phase 2 — Minimal Add-in (import + set one param)
- [x] Phase 3 — Parameter Bridge
- [x] Phase 4 — Palette + Messaging
- [ ] Phase 5 — React UI
- [ ] Phase 6 — Online Hosting + Offline Fallback
- [ ] Phase 7 — Document Lifecycle + Multi-Neck
- [ ] Phase 8 — Release/Update Experience
