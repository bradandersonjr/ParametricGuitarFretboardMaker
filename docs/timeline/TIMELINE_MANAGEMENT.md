# Timeline Management System

A comprehensive timeline group and feature management system for Fusion 360 that allows you to programmatically control the visibility and suppression of timeline items.

## Overview

The timeline management system consists of three main components:

1. **[timeline_manager.py](timeline_manager.py)** — Core Python API for timeline operations
2. **Parameter Bridge Integration** — HTTP/JSON interface to timeline_manager via the Python-UI bridge
3. **TypeScript Types** — Type definitions for UI/JavaScript integration

## Use Cases

- **Suppress fret slot cuts** when previewing body design
- **Toggle feature visibility** to explore design alternatives
- **Group operations** to manage complex multi-part designs
- **Timeline inspection** to understand design structure
- **Batch operations** on multiple features matching patterns

## Python API

### Core Functions

#### Item Retrieval

```python
from timeline_manager import *

# Get all timeline items
items = get_all_items(design)  # Returns list of dicts

# Find a specific item by exact name
item = find_item_by_name(design, "Fret Slot Cuts")

# Find items matching a regex pattern
frets = find_items_by_pattern(design, r"^Fret \d+")
```

#### Basic Suppress/Unsuppress

```python
# Suppress by name
suppress_item(design, "Fret Slot Cuts")

# Unsuppress by name
unsuppress_item(design, "Fret Slot Cuts")

# Toggle suppress state
toggle_item(design, "Fret Slot Cuts")  # Returns new state (True/False)
```

#### Pattern-Based Operations

```python
# Suppress all items matching a pattern
suppress_items_by_pattern(design, r"^Fret.*")

# Unsuppress all items matching a pattern
unsuppress_items_by_pattern(design, r".*Slot.*")
```

#### Group Operations

```python
# Suppress a group and all its contents (cascading)
suppress_group_with_contents(design, "Fret Slot Cuts")

# Unsuppress a group and all its contents
unsuppress_group_with_contents(design, "Fret Slot Cuts")

# Get all items within a group
items = get_group_items(design, "Fret Slot Cuts")

# Suppress only group contents (not the group itself)
suppress_group_contents(design, "Fret Slot Cuts")

# Check if something is a group
is_group_item = is_group(design, "Fret Slot Cuts")
```

#### State Information

```python
# Get timeline summary
summary = get_timeline_summary(design)
# Returns: {
#   'total_items': 42,
#   'active_count': 35,
#   'suppressed_count': 7,
#   'group_count': 3,
#   'feature_count': 39
# }

# Get detailed item state
state = get_item_state(design, "Fret Slot Cuts")
# Returns: {
#   'name': 'Fret Slot Cuts',
#   'type': 'Group',
#   'suppressed': False,
#   'index': 5,
#   'rollUp': 35,
#   'group_size': 30
# }
```

## HTTP Bridge API

The UI palette can invoke timeline operations via JSON messages:

### Messages Sent to Python

**GET_TIMELINE_ITEMS**
```json
{}
```
Response: `PUSH_TIMELINE_ITEMS` with array of timeline items

**SUPPRESS_TIMELINE_ITEM**
```json
{"name": "Fret Slot Cuts"}
```
Response: `TIMELINE_OPERATION_RESULT`

**UNSUPPRESS_TIMELINE_ITEM**
```json
{"name": "Fret Slot Cuts"}
```
Response: `TIMELINE_OPERATION_RESULT`

**TOGGLE_TIMELINE_ITEM**
```json
{"name": "Fret Slot Cuts"}
```
Response: `TIMELINE_OPERATION_RESULT` with `newState` field

**SUPPRESS_GROUP_WITH_CONTENTS**
```json
{"groupName": "Fret Slot Cuts"}
```
Response: `TIMELINE_OPERATION_RESULT` with `itemsAffected` count

**UNSUPPRESS_GROUP_WITH_CONTENTS**
```json
{"groupName": "Fret Slot Cuts"}
```
Response: `TIMELINE_OPERATION_RESULT` with `itemsAffected` count

**GET_TIMELINE_SUMMARY**
```json
{}
```
Response: `PUSH_TIMELINE_SUMMARY` with timeline statistics

### Messages Received from Python

**PUSH_TIMELINE_ITEMS**
```json
{
  "items": [
    {"name": "Fret Slot Cuts", "type": "Group", "suppressed": false, "index": 5},
    {"name": "Sketch1", "type": "Feature", "suppressed": false, "index": 0}
  ]
}
```

**TIMELINE_OPERATION_RESULT**
```json
{
  "success": true,
  "message": "Suppressed \"Fret Slot Cuts\"",
  "newState": true,
  "itemsAffected": 31
}
```

**PUSH_TIMELINE_SUMMARY**
```json
{
  "total_items": 42,
  "active_count": 35,
  "suppressed_count": 7,
  "group_count": 3,
  "feature_count": 39
}
```

## TypeScript Examples

### React Component Example

```typescript
import { useEffect, useState } from 'react'
import { TimelineItem, TimelineSummary } from '@/types'

export function TimelinePanel() {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [summary, setSummary] = useState<TimelineSummary | null>(null)

  const fetchTimeline = () => {
    window.fusionBridge?.send?.('GET_TIMELINE_ITEMS', {})
    window.fusionBridge?.send?.('GET_TIMELINE_SUMMARY', {})
  }

  const suppressItem = (name: string) => {
    window.fusionBridge?.send?.('SUPPRESS_TIMELINE_ITEM', { name })
  }

  const unsuppressItem = (name: string) => {
    window.fusionBridge?.send?.('UNSUPPRESS_TIMELINE_ITEM', { name })
  }

  const toggleGroup = (name: string) => {
    // First check if it's a group
    const item = items.find(i => i.name === name)
    if (item?.type === 'Group') {
      const action = item.suppressed
        ? 'UNSUPPRESS_GROUP_WITH_CONTENTS'
        : 'SUPPRESS_GROUP_WITH_CONTENTS'
      window.fusionBridge?.send?.(action, { groupName: name })
    }
  }

  useEffect(() => {
    fetchTimeline()

    // Listen for responses
    const handlePush = (action: string, data: any) => {
      if (action === 'PUSH_TIMELINE_ITEMS') {
        setItems(data.items)
      } else if (action === 'PUSH_TIMELINE_SUMMARY') {
        setSummary(data)
      }
    }

    // Register handler (implementation depends on your bridge)
    // This is pseudo-code — adjust to match your actual bridge
    return () => {
      // Cleanup
    }
  }, [])

  return (
    <div>
      <h2>Timeline ({summary?.total_items} items)</h2>
      <p>Active: {summary?.active_count} | Suppressed: {summary?.suppressed_count}</p>

      {items.map(item => (
        <div key={item.name} style={{ marginLeft: `${item.type === 'Group' ? 0 : 20}px` }}>
          <button onClick={() => {
            if (item.type === 'Group') {
              toggleGroup(item.name)
            } else {
              item.suppressed ? unsuppressItem(item.name) : suppressItem(item.name)
            }
          }}>
            {item.suppressed ? '👁' : '🚫'} {item.name} ({item.type})
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Common Patterns

### Suppress All Fret-Related Features
```python
from timeline_manager import suppress_items_by_pattern

suppress_items_by_pattern(design, r"^Fret.*")
```

### Toggle Entire Feature Groups
```python
from timeline_manager import toggle_item

groups = ["Fret Slot Cuts", "Fret Markers", "Scallops"]
for group_name in groups:
    toggle_item(design, group_name)
```

### Get Timeline Statistics
```python
from timeline_manager import get_timeline_summary

summary = get_timeline_summary(design)
print(f"Design has {summary['total_items']} timeline items")
print(f"  - Active: {summary['active_count']}")
print(f"  - Suppressed: {summary['suppressed_count']}")
print(f"  - Groups: {summary['group_count']}")
print(f"  - Features: {summary['feature_count']}")
```

### Restore Design to Baseline
```python
from timeline_manager import unsuppress_items_by_pattern

# Restore all suppressed items
unsuppress_items_by_pattern(design, r".*")
```

## Error Handling

All functions include try-catch blocks and log to Fusion's log system. Check the Fusion 360 console for detailed error messages:

```python
# This will log warnings/errors to the Fusion console
result = timeline_manager.suppress_item(design, "NonExistentItem")
# Logs: "Timeline Manager: Item not found: NonExistentItem"
```

## Performance Considerations

- **List operations are O(n)** where n = timeline item count. On typical designs (50-200 items), operations complete in milliseconds.
- **Pattern matching uses regex** — complex patterns on large timelines may have slight overhead. Pre-compile patterns if reused frequently.
- **Group traversal** walks from group header to rollUp index — efficient for most use cases.

## Limitations

- **Read-only items**: Cannot suppress/unsuppress locked or reference items (Fusion API limitation)
- **No batch undo**: Each operation is atomic. Consider wrapping multiple operations in a transaction if needed
- **Name uniqueness**: Timeline names can be duplicated by Fusion — `find_item_by_name()` returns the first match
- **Group nesting**: Groups can contain groups, but the system flattens them for most operations

## API Reference

See [timeline_manager.py](timeline_manager.py) for complete docstrings and type hints.

