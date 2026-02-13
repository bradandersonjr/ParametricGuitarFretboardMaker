# Timeline Sheet — Visual Guide

## Layout

### Parameters Page with Timeline Sheet

```
┌─────────────────────────────────────────────────────────────────┬───────────────────┐
│                                                                  │                   │
│  Parameters                                                      │  Timeline Browser │
│  ─────────────────────────────────────────────────────────────  │                   │
│                                                                  │  Suppress or      │
│  [Single Scale] [Multi-scale]                                   │  unsuppress       │
│                                                                  │  features & groups│
│  Search parameters...                                            │                   │
│                                                                  │  ───────────────  │
│  ▼ General (7 parameters)                                        │                   │
│  ├─ Fret Count: [24]                                             │  Active: 35       │
│  ├─ String Count: [6]                                            │  Suppressed: 7    │
│  ├─ Scale Length Bass: [25.5]                                    │  Groups: 3        │
│  └─ ...                                                          │  Features: 39     │
│                                                                  │  ───────────────  │
│  ▼ Neck (4 parameters)                                           │                   │
│  ├─ Neck Thickness 1st: [0.82]                                   │  ▼ 📁 Fret Slot   │
│  ├─ Neck Thickness 12th: [0.94]                                  │    Cuts  [👁]     │
│  └─ ...                                                          │                   │
│                                                                  │    ├─ Sketch      │
│  (scroll for more)                                               │    │  Frets  [👁] │
│                                                                  │    ├─ Pocket -    │
│  ─────────────────────────────────────────────────────────────  │    │  Fret 1 [👁] │
│  [Timeline] [Refresh] [Import & Apply] [Undo] [Redo]            │    ├─ Pocket -    │
│             35/42                                               │    │  Fret 2 [👁] │
│                                                                  │    └─ ... (24)    │
│                                                                  │                   │
│                                                                  │  ▼ 📁 Fret        │
│                                                                  │    Markers [👁]   │
│                                                                  │                   │
│                                                                  │  ▶ 📁 Scallops    │
│                                                                  │      [🚫]         │
│                                                                  │                   │
│                                                                  │  (scroll for more)│
│                                                                  │                   │
│                                                                  │  ───────────────  │
│                                                                  │ [Refresh Timeline]│
│                                                                  │                   │
└─────────────────────────────────────────────────────────────────┴───────────────────┘
```

## Timeline Button

### Location
Bottom action bar of Parameters Page, left side:
```
[Timeline 35/42]  [Refresh]  [Reset]  [Apply Changes]  [Undo]  [Redo]
 ↑
 Timeline button with count badge
```

### Appearance

**Closed (normal state):**
```
[🔶 Timeline]
  35/42
```

**Closed (hover):**
```
[🔶 Timeline]
  35/42
  └─ darker background
```

**Open:**
Sheet slides in from right side, button stays highlighted

## Sheet Anatomy

```
┌──────────────────────────────────┐
│ Timeline Browser                  │  ← Title
│ Suppress or unsuppress            │  ← Description
│                   [×]             │  ← Close button (auto)
├──────────────────────────────────┤
│ Active: 35  Suppressed: 7         │  ← Stats grid
│ Groups: 3   Features: 39          │
├──────────────────────────────────┤
│                                   │
│ ▼ 📁 Fret Slot Cuts   [👁]       │  ← Group (expanded)
│   ├─ Sketch Fret Slots  [👁]     │  ← Feature (child)
│   ├─ Pocket - Fret 1    [👁]     │
│   ├─ Pocket - Fret 2    [👁]     │
│   └─ ... (27 more)                │
│                                   │
│ ▼ 📁 Fret Markers      [👁]       │  ← Group (expanded)
│   ├─ Sketch Markers     [👁]     │
│   └─ ... (23 more)                │
│                                   │  ← Scrollable
│ ▶ 📁 Scallops          [🚫]       │     area
│                                   │     (flex-1)
│ (scroll for more items)            │
│                                   │
├──────────────────────────────────┤
│ [Refresh Timeline] ⟳              │  ← Action button
└──────────────────────────────────┘

Width: 380px
Height: Full (matches Parameters page)
```

## Item States

### Active (Visible)

```
▼ 📁 Fret Slot Cuts        [👁]
  └─ Sketch                 [👁]
     Normal opacity text, green eye icon
```

### Suppressed (Hidden)

```
▼ 📁 Fret Slot Cuts        [🚫]
  └─ ~~Sketch~~ (crossed out, dimmed)
     60% opacity, amber eye-off icon
```

### Group Collapsed

```
▶ 📁 Scallops              [👁]
   (arrow points right, children hidden)
```

### Group Expanded

```
▼ 📁 Scallops              [👁]
  ├─ Child Feature 1        [👁]
  └─ ... (10 more)
  (arrow points down, children visible)
```

## Interaction Flow

### Opening the Sheet

1. User clicks "Timeline" button
   ```
   [Timeline 35/42]
   └─ onClick → setTimelineSheetOpen(true)
   ```

2. Sheet slides in from right
   ```
   ┌──────┐
   │Sheet │
   │slides│
   │in ───→
   └──────┘
   ```

3. Sheet fetches timeline data
   ```
   sendToPython("GET_TIMELINE_ITEMS", {})
   sendToPython("GET_TIMELINE_SUMMARY", {})
   ```

### Suppress an Item

1. Hover over item
   ```
   Fret Slot Cuts           [👁]
                 ↓ hover
   Fret Slot Cuts           [👁]  ← eye icon appears
   ```

2. Click the eye icon
   ```
   [👁] → onClick → setLoading(true)
                   → sendToPython("SUPPRESS_GROUP_WITH_CONTENTS", {...})
   ```

3. Python processes
   ```
   entry.py → parameter_bridge → timeline_manager
           → design.timeline.itemByName(...).suppressed = True
   ```

4. Python responds
   ```
   TIMELINE_OPERATION_RESULT {success: true, itemsAffected: 31}
   ```

5. Sheet auto-refreshes (150ms delay)
   ```
   sendToPython("GET_TIMELINE_ITEMS", {})
   sendToPython("GET_TIMELINE_SUMMARY", {})
   ```

6. Item appears suppressed
   ```
   ~~Fret Slot Cuts~~ [🚫]
   (dimmed, crossed out, amber icon)
   ```

### Closing the Sheet

1. User presses ESC
   ```
   ESC key → Sheet's built-in behavior
          → onOpenChange(false)
          → setTimelineSheetOpen(false)
          → Sheet slides out
   ```

2. Or click outside the sheet
   ```
   Parameters page area
          ↓ click
   onOpenChange(false) → Sheet slides out
   ```

## Icons Guide

| Icon | Meaning | Color | When |
|------|---------|-------|------|
| 👁 | Visible | Green | Feature is active |
| 🚫 | Hidden | Amber | Feature is suppressed |
| 📁 | Group | Gray | Contains child items |
| ⚙️ | Feature | Gray | Individual item |
| 🔶 | Timeline | Blue | Button in action bar |
| ▼ | Expanded | Gray | Group is open |
| ▶ | Collapsed | Gray | Group is closed |
| ⟳ | Refresh | Gray | Click to sync |

## Responsive Behavior

### Desktop (680px+)
- Sheet width: 380px
- Button text visible: "Timeline"
- Full UI shown
- All icons visible

### Tablet (400-679px)
- Sheet width: 380px
- Button text visible: "Timeline"
- Same UI (sheet takes up right side)

### Mobile (< 400px)
- Sheet width: 100% (full screen)
- Button text hidden: Just icon
- Timeline becomes fullscreen
- Close button easily accessible

## Dark Mode

All components support dark mode:

```
Light Mode:
  Green: #16a34a (active)
  Amber: #b45309 (suppressed)
  Gray: #6b7280

Dark Mode:
  Green: #22c55e (active)
  Amber: #fbbf24 (suppressed)
  Gray: #9ca3af
```

## Animation

### Sheet Open
```
Duration: 300ms (default)
Easing: ease-in-out (Radix UI default)
Direction: right to center
```

### Button Hover
```
Duration: 150ms
Effect: background lightens
Smooth transition
```

## Color Scheme

### Active (Visible Items)
- Eye icon: Green (#16a34a / #22c55e dark)
- Text: Normal opacity
- Background: Default

### Suppressed (Hidden Items)
- Eye icon: Amber (#b45309 / #fbbf24 dark)
- Text: 60% opacity, crossed out
- Background: Slightly faded

### Headers & Stats
- Background: Subtle muted color
- Text: Bold, slightly larger
- Dividers: Subtle borders

---

## Quick Start

1. **Open Timeline**: Click "Timeline" button in action bar
2. **Expand Group**: Click the arrow (▼/▶) next to group name
3. **Suppress Item**: Hover and click the eye icon (👁)
4. **Unsuppress Item**: Click the amber eye-off icon (🚫)
5. **Refresh**: Click "Refresh Timeline" button at bottom
6. **Close Sheet**: Press ESC or click outside

That's it! 🎸
