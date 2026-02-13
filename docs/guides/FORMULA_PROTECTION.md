# Formula Expression Protection — Implementation Guide

## Problem Solved
When users adjusted parameters in the UI, formula-based parameters were being overwritten with static numeric values, breaking the parametric relationships that depend on them.

Example: `BridgeSpacing = SaddleSpacing * (StringCount - 1)` would get replaced with `2.08`, losing the dynamic calculation.

## Solution: Editable vs. Formula-Based Parameters

### How It Works
1. **Populate Script** (`populate_schema.py`) analyzes the CSV to detect formulas:
   - Simple values: `25.5 in` → **EDITABLE**
   - Formulas: `SaddleSpacing * (StringCount - 1)` → **NON-EDITABLE**

2. **Schema** (`parameters.schema.json`) marks parameters:
   ```json
   {
     "name": "BridgeSpacing",
     "editable": false,
     "deprecated": true,
     "notes": "Expression: SaddleSpacing * (StringCount - 1)"
   }
   ```

3. **Parameter Bridge** (`parameter_bridge.py`) filters:
   - Only **EDITABLE** parameters sent to UI
   - Only **EDITABLE** parameters applied back to design
   - Attempts to modify formula-based params are logged as warnings

## Parameter Breakdown

### Editable (53 parameters)
These can be freely adjusted by users:
- **Dimensions**: `GuitarLength`, `BodyLength`, `HeadstockLength`, etc.
- **Angles**: `HeadstockAngle`, `BoutBottomAngle`, etc.
- **Counts**: `FretCount`, `StringCount`, `NeutralFret`, etc.
- **Direct measurements**: `StringGauge*`, `TangWidth`, `NutRadius`, etc.

### Formula-Based (43 parameters — protected)
These auto-calculate based on other parameters and CANNOT be edited via UI:
- **Derived from scale lengths**: `FretSpacingBass`, `FretSpacingTreb`, `FretboardLengthBass`, etc.
- **Dependent on string count**: `BridgeSpacing`, `NutSpacing`, `StringEquispacing`
- **Proportional to body size**: `BoutLength1`–`BoutLength4`, `BoutWidth1`–`BoutWidth3`
- **Complex calculations**: `FallAwayLength`, `FallAwayDepth`, `HeelTransition`

## Formula Examples

| Parameter | Expression | Why Protected |
|-----------|-----------|---------------|
| `BridgeSpacing` | `SaddleSpacing * (StringCount - 1)` | Depends on StringCount |
| `FretSpacingBass` | `if((ScaleLengthBass == ScaleLengthTreb); sqrt(...); ...)` | Depends on ScaleLengthBass, ScaleLengthTreb, NutSpacing, BridgeSpacing |
| `BoutLength1` | `BodyLength * 0.25` | Proportional to BodyLength |
| `VoluteThickness` | `if((HeadstockAngle == 0 deg); NeckThickness - FretboardThickness; ...)` | Conditional on HeadstockAngle |
| `FretboardLengthBass` | `ScaleLengthBass * (1 - 1 / 2 ^ (FretCount / 12))` | Complex scale formula |

## Changes Made

### 1. populate_schema.py
- Added `has_formula()` function to detect formulas vs. literals
- Updated `update_schema()` to mark params with `editable: false, deprecated: true`
- Logs which parameters are formula-based during processing

### 2. parameters.schema.json
- All 96 parameters updated with CSV values
- 43 formula-based parameters marked `"editable": false`
- 53 user-editable parameters marked `"editable": true`
- All expressions preserved in `notes` field for reference

### 3. parameter_bridge.py
- **build_schema_payload()**: Filters out non-editable parameters
- **build_ui_payload()**: Only includes editable parameters
- **apply_parameters()**: Rejects attempts to modify protected parameters
- Added warning logs when formula-based params are accessed

## Testing Checklist

- [ ] User adjusts an editable parameter (e.g., `FretCount`)
- [ ] Verify formula-based params (e.g., `FretSpacingBass`) recalculate automatically in Fusion
- [ ] User cannot see formula-based parameters in the UI palette
- [ ] Check logs for "Formula detected" messages during schema load
- [ ] Verify expressions are preserved in Fusion after import

## Future Improvements

1. **UI Indicators**: Show read-only formulas in a separate "Calculated" section
2. **Formula Display**: Allow users to view (but not edit) calculation expressions
3. **Dependency Graph**: Visualize which params depend on others
4. **Audit Trail**: Log when users attempt to modify protected parameters
