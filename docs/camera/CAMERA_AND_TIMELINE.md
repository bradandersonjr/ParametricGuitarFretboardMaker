# Camera Management

## Overview
When a template is imported, the add-in automatically centers the camera in top view on all visible bodies.

## Implementation Details

### Function
Located in `commands/guitarMaker/entry.py`:

#### `_center_camera_on_bodies(design)`
- Sets the viewport to **Top View** (XY plane)
- Auto-fits the view to show all visible components
- Uses `viewport.fit()` for optimal zoom level

### When This Function Is Called
Called immediately after the template document is opened:
```python
# Re-acquire design from the newly opened document
design = adsk.fusion.Design.cast(app.activeProduct)
if not design:
    ...
    return

# ── Post-import: Center camera on model ──────────────────────
_center_camera_on_bodies(design)
```

### Key Benefits

1. **Better UX**: Users immediately see a properly framed top-view of the imported guitar design, ideal for:
   - Checking overall body shape
   - Reviewing body outline proportions
   - Validating dimensional changes

2. **Automatic Zoom**: The camera zoom is calculated based on the actual model size, so it works with any template dimensions

### Error Handling
- All exceptions are caught and logged without interrupting the workflow

### Timeline Note
The template file is saved with the timeline already at the end position, so no timeline manipulation is needed at runtime.

## Testing
After importing a template:
1. Confirm the camera is in top view
2. Confirm all bodies are visible and centered in the viewport
3. Attempt to modify parameters — no "rolled back features" errors should occur
