# Timeline Panel UI — User Guide

## What It Is

A collapsible timeline browser panel integrated into your **Parameters Page** that lets you instantly hide/show any timeline item (feature or group) without leaving the UI.

## Where It Is

The Timeline Panel appears at the top of the scrollable parameter section:

```
Parameters Page
├─ Header: "Parameters"
│
├─ Scale Mode Tabs (Single / Multi-scale)
│
├─ Search Bar
│
├─ ━━━ Timeline Panel ━━━  ← HERE
│  │
│  ├─ 📊 Stats: Active/Suppressed counts
│  ├─ 🗂️  Group 1 (expandable)
│  │   ├─ Feature 1 [👁/🚫]
│  │   ├─ Feature 2 [👁/🚫]
│  │   └─ Feature 3 [👁/🚫]
│  ├─ 🗂️  Group 2
│  └─ [Refresh Button]
│
├─ ━━━━━━━━━━━━━━━━━━━━━
│
├─ Parameter Group 1
├─ Parameter Group 2
└─ ... (rest of parameters)
```

## How to Use It

### 1. **View Timeline Overview**

Open the panel to see:
- **Active**: Number of visible features
- **Suppressed**: Number of hidden features
- **Groups**: Number of feature groups
- **Features**: Total individual features

### 2. **Suppress a Single Feature**

Hover over any feature and click the **eye icon** (👁️) to hide it:
- Green eye = feature is visible
- Amber eye-off = feature is hidden
- The feature name becomes dimmed/crossed out

### 3. **Suppress an Entire Group**

Groups have an expand/collapse arrow (▶️/▼). Click on a group name to:
- Expand it and see all features inside
- The whole group AND its contents are suppressed/unsuppressed together

### 4. **Expand a Group**

Click the arrow to expand and see all features in the group:

```
🗂️ Fret Slot Cuts              [eye icon]
  ├─ Sketch - Fret Slots        [eye icon]
  ├─ Pocket - Fret 1            [eye icon]
  ├─ Pocket - Fret 2            [eye icon]
  └─ ... (24 more features)
```

### 5. **Refresh the Timeline**

Click the **Refresh** button to reload the timeline from Fusion 360 if items changed externally.

## Common Workflows

### "Hide Fret Slots to See the Body"

1. Find "Fret Slot Cuts" group
2. Click the eye icon next to the group name
3. The entire group and all 30+ features inside instantly hide
4. Body geometry is now visible without fret detail

### "Show Only Fret Markers"

1. Collapse the Timeline Panel (less clutter)
2. Go to Parameters and adjust marker settings
3. Re-open Timeline Panel
4. Expand "Fret Markers" group
5. Click refresh to see updated state

### "Suppress One Fret Slot"

1. Expand "Fret Slot Cuts" group
2. Find "Pocket - Fret 12" (or whichever)
3. Click its eye icon to hide just that fret
4. Rest of frets remain visible

### "Reset Everything to Visible"

1. Click refresh button
2. All suppressed items turn back on automatically
3. Or manually click eye icons to unsuppress

## Visual Indicators

| Icon | Meaning |
|------|---------|
| 👁️ Green | Feature is active/visible |
| 🚫 Amber | Feature is suppressed/hidden |
| 📁 | Group (has child features) |
| ⚙️ | Feature (individual item) |
| ▼ | Group is expanded |
| ▶️ | Group is collapsed |
| 🔄 | Refresh the timeline |

## State Indicators

| Appearance | Meaning |
|-----------|---------|
| `Feature Name` | Active (full opacity) |
| `Feature Name` (crossed out, dimmed) | Suppressed (lower opacity) |
| `Active: 35 / Suppressed: 7` | Current timeline state |

## Tips & Tricks

**Quick Suppress**: Hover and click the eye icon — no need to expand groups

**Batch Operations**: Suppress a whole group at once rather than individual features

**Less Clutter**: Collapse the Timeline Panel when focusing on parameters

**Auto-Refresh**: Panel automatically refreshes after you suppress/unsuppress something

**Persist State**: Timeline visibility state is saved in Fusion 360 design, not your UI settings

## What Happens When You...

### Click the eye icon on a GROUP
✅ Hides the entire group AND all features inside it
❌ Does NOT prevent you from editing parameters

### Click the eye icon on a FEATURE
✅ Hides just that one feature
✅ Other features in the group stay visible
❌ Does NOT affect parameters

### Change parameters while items are suppressed
✅ Parameters still update Fusion 360
✅ Suppressed items are updated too (they're just hidden)
❌ Does NOT automatically show suppressed items

### Close and reopen the Parameters Page
✅ Timeline state is preserved (Fusion 360 saves it)
✅ Panel shows the current state from the design
❌ Does NOT reset suppression

## Troubleshooting

**Panel shows "Loading..." forever**
- Click Refresh button
- Check if Fusion 360 is responding
- Try closing and reopening the palette

**Can't find a feature**
- Scroll down in the panel
- The timeline can have many items — use the scrollbar
- Check if the item is in a collapsed group

**Suppress didn't work**
- Feature might be locked in Fusion 360
- Check Fusion 360 logs for errors
- Try refreshing the panel

**Panel shows wrong number of items**
- Click Refresh to sync with Fusion 360
- Items may have been added/deleted in the design

## Keyboard Shortcuts

None yet — all operations are mouse-based. Feel free to request keyboard shortcuts!

## Next Steps

**Want more control?** Check [TIMELINE_MANAGEMENT.md](TIMELINE_MANAGEMENT.md) for programmatic API.

**Want to contribute?** Timeline Panel code is in [TimelinePanel.tsx](ui/src/components/TimelinePanel.tsx).

