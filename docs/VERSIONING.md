# Versioning

This project uses **Semantic Versioning** in the form `vX.Y.Z`.

## What each number means

```
v  X  .  Y  .  Z
   |     |     |
   |     |     └─ Patch — bug fixes and polish with no new features
   |     └─────── Minor — new features or meaningful additions
   └───────────── Major — breaking changes or complete redesign
```

### X — Major
Increment when there is a **breaking change or full redesign** that makes the project
incompatible with previous versions (e.g. schema changes that break existing designs,
a complete UI overhaul, or a fundamental architecture change).

During early development (X = 0), the project is considered pre-release. Everything
before v1.0.0 is still evolving and no stability guarantees are made.

### Y — Minor
Increment when **new features are added** in a backwards-compatible way. This is the
most common release type. Examples:
- New page or panel in the UI
- New parameter group or calculation
- New Python-side capability (e.g. timeline management, fingerprint system)

Reset Z to 0 when Y is incremented.

### Z — Patch
Increment for **bug fixes, visual polish, or minor corrections** that don't add new
features. Examples:
- Fixing a unit conversion bug
- Correcting a display label
- Small layout or centering fixes

Patch releases are optional — minor fixes discovered right after a minor release can
be folded into that release rather than creating a separate patch entry.

---

## Files to update on every release

| File | Field |
|---|---|
| `ParametricGuitarFretboardMaker.manifest` | `"version"` |
| `ui/package.json` | `"version"` — this is the single source of truth; the UI reads it at build time |
| `ui/src/pages/ChangelogPage.tsx` | Add new entry at top, mark as `Current` |

---

## History at a glance

| Version | Type | Summary |
|---|---|---|
| v0.5.0 | Minor | Timeline panel, fingerprint system, design reset |
| v0.4.0 | Minor | Responsive sidebar, project rename, Community + Support pages |
| v0.3.0 | Minor | Templates system — save/load/delete user templates and presets |
| v0.2.0 | Minor | Reports page, multi-scale fretboard calculations |
| v0.1.0 | Minor | Initial release — parameters UI, apply to Fusion, undo/redo |
