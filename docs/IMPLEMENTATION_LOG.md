# Implementation Log — Parametric Guitar: Fretboard Maker

**Project:** Fusion Add-in for parametric guitar fretboard design  
**Started:** February 2026  
**Status:** Phase 4 Complete — Palette UI with bidirectional communication

---

## Overview

This add-in imports pre-built guitar fretboard templates (inch or mm) and provides a modern palette UI for manipulating design parameters in real-time. The architecture prioritizes:

- **Schema-driven design** — All parameters defined in JSON schema
- **Online-first with offline fallback** — Presets stored as JSON
- **Clean separation of concerns** — Parameter bridge, UI layer, command logic
- **Document lifecycle management** — Palette tethered to owner document

---

## Completed Phases

### Phase 0: Repository Skeleton ✅

**Goal:** Establish foundational project structure

**Created:**
- `ParametricGuitarFretboardMaker.py` — Main entry point
- `ParametricGuitarFretboardMaker.manifest` — Add-in metadata
- `config.py` — Global configuration
- `commands/__init__.py` — Command registry
- `commands/guitarMaker/` — Main command module
- `lib/fusionAddInUtils/` — Utility functions (logging, event handling)
- `schema/parameters.schema.json` — Parameter definitions
- `templates/` — F3D template storage
- `docs/` — Documentation (QUICKSTART.md, DEV_NOTES.md)
- `ui/` and `ui_dist/` — Placeholder for React UI (future)

**Key Files:**
```
ParametricGuitarFretboardMaker/
├── ParametricGuitarFretboardMaker.py          # Entry point
├── ParametricGuitarFretboardMaker.manifest    # Add-in metadata
├── config.py                         # Global config
├── parameter_bridge.py               # Parameter logic (Phase 3)
├── commands/
│   ├── __init__.py                   # Command registry
│   └── guitarMaker/
│       ├── __init__.py
│       ├── entry.py                  # Command logic
│       └── resources/
│           └── html/
│               └── index.html        # Palette UI (Phase 4)
├── lib/
│   └── fusionAddInUtils/
│       ├── general_utils.py          # Logging, error handling
│       └── event_utils.py            # Event handler management
├── schema/
│   └── parameters.schema.json        # Parameter definitions
├── templates/
│   └── cube.f3d                      # Test template
└── docs/
    ├── QUICKSTART.md
    ├── DEV_NOTES.md
    └── IMPLEMENTATION_LOG.md         # This file
```

---

### Phase 1: Template Integration (Partial) ✅

**Goal:** Import template files into active design

**Status:** Using `cube.f3d` as test template

**Implementation:**
- Copied `cube.f3d` from previous project to `templates/`
- Template has 3 user parameters: `Length`, `Width`, `Height`
- Logic for unit-specific templates (`fretboard_inch.f3d`, `fretboard_mm.f3d`) is in place but commented out

**Next Steps (Future):**
- Create actual fretboard templates in Fusion
- Implement unit detection and template selection
- Update schema to match fretboard parameters

---

### Phase 2: Minimal Add-in — Import & Parameter Setting ✅

**Goal:** Toolbar button that imports template and sets parameters

**Implementation:**

#### 2.1 Bootstrap
- Registered "Parametric Guitar: Fretboard Maker" button in Solid workspace toolbar
- Button appears in "Create" panel

#### 2.2 Import Template
- First click imports `cube.f3d` into active design
- Uses Fusion's `importManager.createFusionArchiveImportOptions()`
- Validates template file exists before import

#### 2.3 Parameter Setting (Proof of Concept)
- Demonstrated setting `Length` parameter to `2 in`
- Verified parameter update via message box

**Key Code (`entry.py`):**
```python
# Import template
import_manager = app.importManager
import_options = import_manager.createFusionArchiveImportOptions(template_path)
import_manager.importToTarget(import_options, root)

# Set parameter (proof of concept)
length_param = design.userParameters.itemByName('Length')
length_param.expression = '2 in'
```

---

### Phase 3: Parameter Bridge ✅

**Goal:** Centralized module for all parameter operations

**Created:** `parameter_bridge.py`

**Functions:**

#### `load_schema() → dict`
Loads and parses `parameters.schema.json`

#### `get_user_parameters(design) → dict`
Reads all user parameters from the active Fusion design
```python
{
    'Length': {'value': '1 in', 'expression': '1 in', 'unit': 'in'},
    'Width': {'value': '1 in', 'expression': '1 in', 'unit': 'in'},
    'Height': {'value': '1 in', 'expression': '1 in', 'unit': 'in'}
}
```

#### `build_ui_payload(design) → dict`
Merges schema with live parameter data, identifies mismatches
```python
{
    'groups': [...],           # Schema groups with live values
    'missing': [],             # In schema but not in design
    'extra': [],               # In design but not in schema
    'version': '1.0.0'
}
```

#### `apply_parameters(design, param_values) → tuple`
Applies parameter changes in batch, validates against schema
```python
apply_parameters(design, {'Length': '3 in', 'Width': '2 in'})
# Returns: (updated_count, errors)
```

**Design Decisions:**
- Only schema-defined parameters can be modified (prevents accidental changes)
- Batch updates for efficiency
- Detailed error reporting
- Version tracking for schema evolution

---

### Phase 4: Palette + Messaging ✅

**Goal:** Modern UI with bidirectional JavaScript ↔ Python communication

**Created:** `commands/guitarMaker/resources/html/index.html`

#### UI Features

**Design:**
- Dark theme matching Fusion's UI (`#1e1e2e` background)
- Docked at left side of Fusion window
- Connection status indicator (green dot when connected)
- Grouped parameters matching schema structure

**Controls:**
- Schema-driven parameter inputs (text fields with units)
- Modification detection (yellow border on changed fields)
- **⟳ Refresh** — Reload parameters from model
- **✓ Apply to Model** — Push changes to Fusion
- **✕ Cancel** — Close palette
- Toast notifications for user feedback

**Styling:**
```css
/* Modern dark theme */
--bg-primary: #1e1e2e;
--bg-secondary: #2a2a3e;
--accent: #7c6ff0;
--text-primary: #e0e0f0;
--border: #404060;
```

#### Communication Bridge

**JavaScript → Python:**
```javascript
// Send message to Python
adsk.fusionSendData('action', JSON.stringify(data));

// Actions:
// - 'ready'           → JS is loaded and ready
// - 'GET_MODEL_STATE' → Request fresh parameters
// - 'APPLY_PARAMS'    → Apply parameter changes
// - 'cancel'          → Close palette
```

**Python → JavaScript:**
```python
# Send message to JavaScript
palette.sendInfoToHTML('action', json.dumps(data))

# Actions:
# - 'PUSH_MODEL_STATE' → Send parameter payload to UI
```

**Handler Structure:**
```javascript
// JavaScript side
window.fusionJavaScriptHandler = {
    handle: function(action, dataJson) {
        switch (action) {
            case 'PUSH_MODEL_STATE':
                handleModelState(dataJson);
                break;
        }
    }
};
```

```python
# Python side
class HTMLEventHandler(adsk.core.HTMLEventHandler):
    def notify(self, args):
        action = args.action
        data = json.loads(args.data) if args.data else {}
        
        if action == 'ready':
            # Send initial payload
        elif action == 'APPLY_PARAMS':
            # Apply changes and refresh
```

#### Palette Lifecycle

**First Click:**
1. Import template (if not already imported)
2. Create palette with HTML UI
3. Dock at left
4. Wait for JS `ready` signal
5. Send parameter payload

**Subsequent Clicks:**
1. Show existing palette
2. Send fresh parameter data
3. No re-import

**Document Switching:**
1. Palette tracks "owner document"
2. Hides when switching to different document
3. Shows when returning to owner document

**Implementation (`entry.py`):**
```python
# Track owner document
_owner_document = None

def _show_palette(payload):
    global _owner_document
    design = adsk.fusion.Design.cast(app.activeProduct)
    if design:
        _owner_document = design.parentDocument
    # ... create/show palette

def on_document_activated(args):
    """Hide/show palette based on active document"""
    active_doc = args.document
    if _owner_document and active_doc != _owner_document:
        palette.isVisible = False  # Hide
    elif _owner_document and active_doc == _owner_document:
        palette.isVisible = True   # Show
```

---

## Technical Challenges & Solutions

### Challenge 1: Bridge Handler Format
**Problem:** `fusionJavaScriptHandler.handle is not a function`  
**Cause:** Fusion expects an object with a `handle()` method, not a plain function  
**Solution:**
```javascript
// ❌ Wrong
window.fusionJavaScriptHandler = function(action, data) { ... }

// ✅ Correct
window.fusionJavaScriptHandler = {
    handle: function(action, data) { ... }
};
```

### Challenge 2: Bridge Timing
**Problem:** `adsk` object not available when `DOMContentLoaded` fires  
**Solution:** Poll until bridge is ready
```javascript
function waitForBridge() {
    if (typeof adsk !== 'undefined' && adsk.fusionSendData) {
        sendToPython('ready', {});
    } else {
        setTimeout(waitForBridge, 100);
    }
}
```

### Challenge 3: Browser Caching
**Problem:** Fusion's embedded browser caches HTML aggressively  
**Solution:** 
- Close Fusion completely to clear cache
- Added timestamp comment for cache busting
- Avoid query parameters (Fusion's palette API rejects them)

### Challenge 4: Import Path Resolution
**Problem:** Relative imports failed in `parameter_bridge.py`  
**Cause:** Module is at package root, not in a subdirectory  
**Solution:**
```python
# ❌ Wrong (tries to go above package root)
from ..lib import fusionAddInUtils

# ✅ Correct
from .lib import fusionAddInUtils
```

---

## Configuration

**File:** `config.py`

```python
DEBUG = True
ADDIN_NAME = 'ParametricGuitarMaker'
COMPANY_NAME = 'brad anderson jr'
PALETTE_ID = 'ParametricGuitarMakerPalette'
PALETTE_NAME = 'Guitar Parameters'
ADDIN_VERSION = '0.1.0'
ADDIN_ROOT = os.path.dirname(os.path.abspath(__file__))
```

---

## Schema Structure

**File:** `schema/parameters.schema.json`

```json
{
  "version": "1.0.0",
  "groups": [
    {
      "id": "dimensions",
      "label": "Dimensions",
      "parameters": [
        {
          "name": "Length",
          "label": "Length",
          "type": "length",
          "default": "1 in",
          "description": "Cube length"
        }
      ]
    }
  ]
}
```

**Future Extensions:**
- Min/max validation
- Dropdown options for discrete values
- Conditional visibility
- Parameter dependencies

---

## Current Limitations

1. **No Real Templates:** Using `cube.f3d` placeholder
2. **No Preset Management:** Save/load not implemented
3. **No Validation:** Min/max ranges not enforced
4. **No Undo/Redo:** Cancel doesn't rollback changes
5. **Single Document:** Palette ownership transfers on new click

---

## Next Steps

### Phase 5: React UI (Planned)
- Replace vanilla JS with React
- Component-based architecture
- Better state management
- TypeScript for type safety

### Phase 6: Real Templates (Planned)
- Create `fretboard_inch.f3d` and `fretboard_mm.f3d`
- Define full parameter schema for guitar fretboards
- Implement unit detection

### Phase 7: Preset Management (Planned)
- Save parameter sets as JSON
- Load presets from library
- Cloud sync (online-first)
- Offline fallback

### Phase 8: Advanced Features (Planned)
- Parameter validation (min/max)
- Multi-neck support
- Export configurations
- Undo/rollback on cancel

---

## Testing Notes

**Test Template:** `cube.f3d`
- 3 parameters: Length, Width, Height
- Default: 1 in × 1 in × 1 in
- Units: inches

**Test Workflow:**
1. Open Fusion
2. Create new design
3. Click "Parametric Guitar: Fretboard Maker" button
4. Palette opens with parameters
5. Edit values (fields turn yellow)
6. Click "Apply to Model"
7. Cube updates in viewport
8. Click "Refresh" to verify values

**Document Switching:**
1. Open palette in Document A
2. Create Document B
3. Palette hides automatically
4. Switch back to Document A
5. Palette reappears

---

## Dependencies

**Python Standard Library:**
- `os` — File path operations
- `json` — Schema and data serialization
- `traceback` — Error reporting
- `sys` — System utilities
- `typing` — Type hints

**Autodesk Fusion API:**
- `adsk.core` — UI, palettes, events
- `adsk.fusion` — Design, parameters, import

**No External Dependencies** — Pure Python + Fusion API

---

## File Sizes & Metrics

- **Total Python Files:** 8
- **Total Lines of Code:** ~1,200
- **HTML/CSS/JS:** ~550 lines
- **Schema:** ~100 lines JSON
- **Documentation:** ~500 lines markdown

---

## Lessons Learned

1. **Fusion's palette API is strict** — File paths must be exact, no query params
2. **Browser caching is aggressive** — Full Fusion restart needed to clear
3. **Event handlers need careful cleanup** — Use `fusionAddInUtils` patterns
4. **Schema-driven UI scales well** — Easy to add new parameters
5. **Document lifecycle matters** — Users work with multiple designs

---

## References

- [Fusion API Documentation](https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-A92A4B10-3781-4925-94C6-47DA85A4F65A)
- [Palette API Reference](https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-9E8B8B8B-8B8B-8B8B-8B8B-8B8B8B8B8B8B)
- [Parameter Management](https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-UserParameters)

---

**Last Updated:** February 10, 2026  
**Author:** brad anderson jr  
**Version:** 0.1.0 (Phase 4 Complete)
