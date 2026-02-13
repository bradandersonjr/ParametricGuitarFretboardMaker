# Timeline Management — Quick Start Guide

## The Challenge

You want to suppress/unsuppress "Fret Slot Cuts" and other timeline groups in your Fusion 360 designs.

**Before:** No programmatic way to hide/show timeline features from your app
**After:** Full control via Python API + UI integration

## 5-Minute Overview

### 1. **Suppress a Single Item**

```python
import adsk.fusion
from timeline_manager import suppress_item

design = adsk.fusion.Design.cast(app.activeProduct)
suppress_item(design, "Fret Slot Cuts")
```

✅ "Fret Slot Cuts" is now hidden in the timeline

---

### 2. **Suppress a Whole Group + Its Contents**

```python
from timeline_manager import suppress_group_with_contents

suppress_group_with_contents(design, "Fret Slot Cuts")
```

✅ The group AND all 30+ features inside are suppressed

---

### 3. **Unsuppress Everything**

```python
from timeline_manager import unsuppress_items_by_pattern

unsuppress_items_by_pattern(design, r".*")
```

✅ All suppressed items are restored

---

### 4. **Toggle Visibility**

```python
from timeline_manager import toggle_item

new_state = toggle_item(design, "Fret Slot Cuts")
print(f"Now suppressed: {new_state}")
```

✅ Quick flip between hidden/visible

---

### 5. **See What's What**

```python
from timeline_manager import get_timeline_summary, get_all_items

# Quick stats
summary = get_timeline_summary(design)
print(f"Total items: {summary['total_items']}")
print(f"Suppressed: {summary['suppressed_count']}")

# Full list
items = get_all_items(design)
for item in items:
    print(f"  [{item['type']}] {item['name']} — {'suppressed' if item['suppressed'] else 'active'}")
```

Output:
```
Total items: 42
Suppressed: 7
  [Group] Fret Slot Cuts — active
  [Feature] Sketch1 — active
  [Feature] Fret 1 — active
  ...
```

---

## From the UI (React)

Send a message to suppress:

```typescript
// Send from React component
window.fusionBridge?.send?.('SUPPRESS_TIMELINE_ITEM', {
  name: "Fret Slot Cuts"
})

// Listen for result
window.fusionBridge?.on?.('TIMELINE_OPERATION_RESULT', (data) => {
  console.log(data.message)  // "Suppressed \"Fret Slot Cuts\""
  console.log(data.success)  // true
})
```

---

## Common Scenarios

### Scenario 1: Preview the Body Without Frets
```python
suppress_group_with_contents(design, "Fret Slot Cuts")
suppress_group_with_contents(design, "Fret Markers")
```

### Scenario 2: Show Only Frets
```python
unsuppress_items_by_pattern(design, r"^Fret.*")
suppress_items_by_pattern(design, r"^(Body|Headstock|Neck).*")
```

### Scenario 3: Restore Everything
```python
unsuppress_items_by_pattern(design, r".*")
```

### Scenario 4: Count Active vs Suppressed
```python
summary = get_timeline_summary(design)
print(f"Showing {summary['active_count']} of {summary['total_items']} items")
```

---

## File Structure

```
ParametricGuitarFretboardMaker/
├── timeline_manager.py                    ← Core API
├── parameter_bridge.py                    ← Bridge to UI (modified)
├── commands/guitarMaker/entry.py          ← Message handlers (modified)
├── ui/src/types.ts                        ← TypeScript types (modified)
├── TIMELINE_MANAGEMENT.md                 ← Full documentation
└── TIMELINE_QUICK_START.md                ← This file
```

---

## What's Happening Under the Hood

1. **Python `timeline_manager.py`** — Talks to Fusion's API to suppress/unsuppress items
2. **`parameter_bridge.py`** — Wraps timeline_manager functions in a simple interface
3. **Message Handlers** — Convert JSON messages from UI into Python calls
4. **Fusion API** — `design.timeline.itemByName()` → `.suppressed = True/False`

```
User clicks button in React
    ↓
Sends JSON message: {action: 'SUPPRESS_TIMELINE_ITEM', name: 'Fret Slot Cuts'}
    ↓
Python handler in entry.py
    ↓
Calls parameter_bridge.suppress_timeline_item(design, name)
    ↓
Calls timeline_manager.suppress_item(design, name)
    ↓
Sets timeline.itemByName("Fret Slot Cuts").suppressed = True
    ↓
Returns success result JSON to UI
    ↓
UI updates to show the group is now suppressed
```

---

## Troubleshooting

**"Item not found"** → Check exact name in timeline (case-sensitive)

**"Failed to suppress"** → Item might be locked or a reference. Check Fusion logs.

**No response from UI** → Make sure `SUPPRESS_TIMELINE_ITEM` handler is registered in `entry.py` (it is!)

**Want to add a UI?** → See React example in [TIMELINE_MANAGEMENT.md](TIMELINE_MANAGEMENT.md#typescript-examples)

---

## Next: Build UI Controls

Ready to add buttons to your UI? See `TIMELINE_MANAGEMENT.md` for a complete React component example!

