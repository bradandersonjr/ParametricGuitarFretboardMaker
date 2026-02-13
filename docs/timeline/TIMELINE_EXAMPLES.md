# Timeline Management — Real-World Examples

## Example 1: Suppress Fret Slot Cuts Group

**Problem:** You want to hide the fret slot cutting operations to see the clean body shape.

**Solution:**
```python
from timeline_manager import suppress_group_with_contents

design = adsk.fusion.Design.cast(app.activeProduct)
suppress_group_with_contents(design, "Fret Slot Cuts")
```

**Result:** The "Fret Slot Cuts" group and all ~30 individual fret slots are now suppressed. The design shows just the body without slot patterns.

---

## Example 2: Toggle All Marker Features On/Off

**Problem:** You want to quickly preview the fretboard with and without inlay markers.

**Solution:**
```python
from timeline_manager import find_items_by_pattern, toggle_item

design = adsk.fusion.Design.cast(app.activeProduct)

# Find all items with "Marker" in the name
markers = find_items_by_pattern(design, r".*[Mm]arker.*")

# Toggle each one
for marker in markers:
    new_state = toggle_item(design, marker['name'])
    print(f"{marker['name']}: {'hidden' if new_state else 'visible'}")
```

**Output:**
```
FretMarkerTop: hidden
FretMarkerSide: hidden
OctaveMarkerTop: hidden
OctaveMarkerSide: hidden
```

---

## Example 3: Create a "Bare Fretboard" View

**Problem:** Show only the fretboard geometry, hide body and headstock.

**Solution:**
```python
from timeline_manager import suppress_items_by_pattern, unsuppress_items_by_pattern

design = adsk.fusion.Design.cast(app.activeProduct)

# Suppress body and headstock groups
suppress_items_by_pattern(design, r"^(Body|Headstock).*")

# Make sure fretboard is visible
unsuppress_items_by_pattern(design, r".*[Ff]retboard.*")
```

**Result:** Timeline shows only fretboard-related features (sketch, pad, pockets). Body and headstock groups are greyed out.

---

## Example 4: Programmatic Design Workflow

**Problem:** Automatically adjust timeline visibility based on design parameters.

**Solution:**
```python
from timeline_manager import (
    suppress_group_with_contents,
    unsuppress_group_with_contents,
    get_item_state
)

design = adsk.fusion.Design.cast(app.activeProduct)
user_params = design.userParameters

# Get the fret count parameter
fret_count_param = user_params.itemByName("FretCount")
fret_count = int(fret_count_param.value)

# If fret count < 20, hide fall-away
if fret_count < 20:
    suppress_group_with_contents(design, "Fall-away")
else:
    unsuppress_group_with_contents(design, "Fall-away")

# If multi-scale, show neutral fret marker
scale_bass = float(user_params.itemByName("ScaleLengthBass").value)
scale_treb = float(user_params.itemByName("ScaleLengthTreb").value)

if abs(scale_bass - scale_treb) > 0.01:
    # Multi-scale — show neutral fret
    state = get_item_state(design, "NeutralFretMarker")
    if state and state['suppressed']:
        # unsuppress it
        from timeline_manager import unsuppress_item
        unsuppress_item(design, "NeutralFretMarker")
```

**Use Case:** Auto-configure timeline visibility when user changes design parameters via the UI.

---

## Example 5: Build a Timeline Inspector

**Problem:** Create a summary view showing what's visible vs suppressed.

**Solution:**
```python
from timeline_manager import get_timeline_summary, get_all_items

design = adsk.fusion.Design.cast(app.activeProduct)

summary = get_timeline_summary(design)
print("=" * 50)
print(f"TIMELINE SUMMARY")
print("=" * 50)
print(f"Total items:    {summary['total_items']}")
print(f"Active:         {summary['active_count']}")
print(f"Suppressed:     {summary['suppressed_count']}")
print(f"Groups:         {summary['group_count']}")
print(f"Features:       {summary['feature_count']}")
print("=" * 50)
print("\nDETAILS:")
print("-" * 50)

items = get_all_items(design)
current_group = None

for item in items:
    indent = "  " if item['type'] == 'Feature' else ""
    status = "❌ SUPPRESSED" if item['suppressed'] else "✓ ACTIVE"

    if item['type'] == 'Group':
        current_group = item['name']
        print(f"\n[GROUP] {item['name']} {status}")
    else:
        print(f"{indent}[FEAT] {item['name']} {status}")
```

**Output:**
```
==================================================
TIMELINE SUMMARY
==================================================
Total items:    42
Active:         35
Suppressed:     7
Groups:         3
Features:       39
==================================================

DETAILS:
--------------------------------------------------

[GROUP] Fret Slot Cuts ✓ ACTIVE
  [FEAT] Sketch - Fret Slots ✓ ACTIVE
  [FEAT] Pocket - Fret 1 ✓ ACTIVE
  [FEAT] Pocket - Fret 2 ✓ ACTIVE
  ...
  [FEAT] Pocket - Fret 24 ✓ ACTIVE

[GROUP] Fret Markers ❌ SUPPRESSED
  [FEAT] Sketch - Markers ❌ SUPPRESSED
  [FEAT] Pocket - Top Marker 1 ❌ SUPPRESSED
  ...
```

---

## Example 6: React UI Component

**Problem:** Add a timeline browser to your app UI.

**Solution:**
```typescript
import React, { useState, useEffect } from 'react'
import { TimelineItem, TimelineSummary } from '@/types'

export function TimelineBrowser() {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [summary, setSummary] = useState<TimelineSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    refreshTimeline()
  }, [])

  const refreshTimeline = () => {
    setLoading(true)
    window.fusionBridge?.send?.('GET_TIMELINE_ITEMS', {})
    window.fusionBridge?.send?.('GET_TIMELINE_SUMMARY', {})

    // Listen for responses
    const handlePushItems = (action: string, data: any) => {
      if (action === 'PUSH_TIMELINE_ITEMS') {
        setItems(data.items)
        setLoading(false)
      }
    }

    const handlePushSummary = (action: string, data: any) => {
      if (action === 'PUSH_TIMELINE_SUMMARY') {
        setSummary(data)
      }
    }

    // You'd need to hook this into your bridge's message system
    // This is pseudo-code for illustration
  }

  const handleToggle = (item: TimelineItem) => {
    if (item.type === 'Group') {
      const action = item.suppressed
        ? 'UNSUPPRESS_GROUP_WITH_CONTENTS'
        : 'SUPPRESS_GROUP_WITH_CONTENTS'
      window.fusionBridge?.send?.(action, { groupName: item.name })
    } else {
      const action = item.suppressed
        ? 'UNSUPPRESS_TIMELINE_ITEM'
        : 'SUPPRESS_TIMELINE_ITEM'
      window.fusionBridge?.send?.(action, { name: item.name })
    }
    refreshTimeline()
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Timeline Browser</h2>

      {summary && (
        <div className="bg-gray-100 p-2 rounded mb-4 text-sm">
          <p>Active: {summary.active_count} / {summary.total_items}</p>
          <p>Suppressed: {summary.suppressed_count}</p>
        </div>
      )}

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
            style={{ marginLeft: item.type === 'Feature' ? '16px' : '0' }}
          >
            <button
              onClick={() => handleToggle(item)}
              className={`px-2 py-1 rounded text-sm font-medium ${
                item.suppressed
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {item.suppressed ? '🚫' : '👁'}
            </button>

            <span className={item.suppressed ? 'line-through text-gray-400' : ''}>
              {item.name}
            </span>

            <span className="text-xs text-gray-500 ml-auto">
              {item.type === 'Group' ? '📁' : '⚙️'}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={refreshTimeline}
        className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Refresh'}
      </button>
    </div>
  )
}
```

**Result:** A clickable timeline browser in your sidebar showing all items with toggle buttons.

---

## Example 7: Batch Suppress by Pattern

**Problem:** Hide all sketch items to see only features.

**Solution:**
```python
from timeline_manager import suppress_items_by_pattern

design = adsk.fusion.Design.cast(app.activeProduct)

# Suppress all sketches
count = suppress_items_by_pattern(design, r"^Sketch")
print(f"Suppressed {count} sketch(es)")
```

---

## Example 8: Export Timeline as JSON

**Problem:** Save a snapshot of which features are visible for sharing/documentation.

**Solution:**
```python
import json
from timeline_manager import get_all_items, get_timeline_summary

design = adsk.fusion.Design.cast(app.activeProduct)

snapshot = {
    'timestamp': str(date.today()),
    'summary': get_timeline_summary(design),
    'items': get_all_items(design),
}

# Save to file
with open('/path/to/timeline_snapshot.json', 'w') as f:
    json.dump(snapshot, f, indent=2)

print("Timeline snapshot saved!")
```

**File Output:**
```json
{
  "timestamp": "2026-02-13",
  "summary": {
    "total_items": 42,
    "active_count": 35,
    "suppressed_count": 7,
    "group_count": 3,
    "feature_count": 39
  },
  "items": [
    {
      "name": "Fret Slot Cuts",
      "type": "Group",
      "suppressed": false,
      "index": 5
    },
    ...
  ]
}
```

---

## Quick Reference

| Task | Function | Returns |
|------|----------|---------|
| Hide one item | `suppress_item()` | bool |
| Show one item | `unsuppress_item()` | bool |
| Toggle visibility | `toggle_item()` | bool (new state) |
| Hide a group + contents | `suppress_group_with_contents()` | bool |
| Show a group + contents | `unsuppress_group_with_contents()` | bool |
| Hide matching items | `suppress_items_by_pattern()` | int (count) |
| Show matching items | `unsuppress_items_by_pattern()` | int (count) |
| Get all items | `get_all_items()` | list[dict] |
| Find by exact name | `find_item_by_name()` | dict or None |
| Find by pattern | `find_items_by_pattern()` | list[dict] |
| Timeline stats | `get_timeline_summary()` | dict |
| Item details | `get_item_state()` | dict or None |

