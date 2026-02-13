# Fingerprint System Implementation

## Overview
The fingerprint system allows the app to track whether a fretboard design was originally created with the app. This enables smart handling of legacy designs and template updates.

## What Was Added

### 1. Schema Update (`parameters.schema.json`)
- Added `AppFingerprint` parameter to "Tuning & Intonation" group
  - Type: `text`
  - Non-editable (hidden from editing)
  - Format: `pgfm-{uuid}-{timestamp}` (e.g., `pgfm-a1b2c3d4-2026-02-12`)
  - Visible in Fusion's native Parameter Sheet for easy verification

### 2. Type Updates (`ui/src/types.ts`)
- Extended `ModelPayload` interface with:
  - `fingerprint?: string` - The actual fingerprint value
  - `hasFingerprint?: boolean` - Boolean flag indicating presence

### 3. Command Entry Updates (`commands/guitarMaker/entry.py`)
- After template import, automatically calls:
  - `parameter_bridge.generate_fingerprint()` to create unique ID
  - `parameter_bridge.set_fingerprint(design, fingerprint)` to add parameter
- Happens once per new design created with the app

### 4. Parameter Bridge Updates (`parameter_bridge.py`)

#### New Functions:

**`generate_fingerprint()`**
- Returns unique ID in format: `pgfm-{8-char-uuid}-{YYYY-MM-DD}`
- Call when creating a new design from template

**`get_fingerprint(design)`**
- Checks if `AppFingerprint` parameter exists in design
- Returns the fingerprint value or `None`

**`set_fingerprint(design, fingerprint)`**
- Creates or updates the `AppFingerprint` parameter
- Sets the fingerprint value in the design

**`reset_parameters_to_defaults(design)`**
- Resets all editable parameters to schema defaults
- Preserves existing fingerprint
- Returns `{ "updated": int, "errors": [str] }`

#### Modified Functions:

**`build_ui_payload(design)`**
- Now includes fingerprint detection
- Adds `fingerprint` and `hasFingerprint` to payload
- Logs fingerprint status in debug output

## Usage

### Automatic: When Creating a New Design
The fingerprint is **automatically created** when a user imports a template:
1. User clicks the Parametric Guitar button
2. User applies parameters → template imports
3. `generate_fingerprint()` is called → creates `pgfm-...` ID
4. `set_fingerprint()` adds `AppFingerprint` parameter to design
5. Parameter is now visible in Fusion's Parameter Sheet

### When Loading an Existing Design
```python
fingerprint = parameter_bridge.get_fingerprint(design)
if fingerprint:
    # This design was created with the app
    # Optionally reset to fresh defaults:
    result = parameter_bridge.reset_parameters_to_defaults(design)
    # result = { "updated": N, "errors": [...] }
```

### In the UI
The `ModelPayload` now includes:
- `hasFingerprint: true/false` - React components can check this
- `fingerprint: "pgfm-..."` - The actual ID if needed

## Detection Flow

1. User opens the app (clicks Parametric Guitar button)
2. `build_ui_payload()` checks for `AppFingerprint` parameter
3. If found:
   - `hasFingerprint = true`
   - Fingerprint value is returned
   - UI knows design was created with this app
   - UI can offer to reset to fresh defaults
4. If not found:
   - `hasFingerprint = false`
   - Legacy design or external template
   - User can still edit parameters, just no fingerprint tracking

## How to Verify the Fingerprint

### In Fusion's Parameter Sheet:
1. Open a design created with the app
2. **Modify > Change Parameters**
3. Scroll to the bottom of "Tuning & Intonation" section
4. You'll see `AppFingerprint` with value like `pgfm-a1b2c3d4-2026-02-12`

### From Python Console:
```python
from ParametricGuitarFretboardMaker import parameter_bridge
design = adsk.fusion.Design.cast(app.activeDocument.products.itemByObjectType(adsk.fusion.Design.classType()))
fp = parameter_bridge.get_fingerprint(design)
print(f"Fingerprint: {fp}")
```

### From the UI Payload:
The React app receives `hasFingerprint: true/false` in the payload, so you can display it there.

## Benefits

- **Version Tracking**: Know if a design came from your app
- **Template Updates**: Detect old template versions and offer updates
- **Smart Defaults**: Reset to latest schema defaults when fingerprint detected
- **Easy Verification**: See it directly in Fusion's Parameter Sheet
- **Non-Invasive**: Just another parameter, doesn't require special handling
