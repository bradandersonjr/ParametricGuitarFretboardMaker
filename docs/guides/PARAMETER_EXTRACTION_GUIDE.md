# Parameter Extraction Guide

## Overview

The Parametric Guitar: Fretboard Maker uses 96 user parameters organized into 12 groups. This guide explains how to extract and validate these parameters from the Fusion template files (metric and imperial).

## Files Created

This guide includes two extraction tools:

1. **extract_parameters.py** — Extract parameters from an OPEN Fusion design
2. **extract_parameters_headless.py** — Analyze the schema without Fusion

## Method 1: Extract from Active Fusion Design (Recommended)

When you open `fretboard template file` in Fusion, you can extract the actual parameters using the Fusion Python API.

### Steps

1. Open `fretboard template file` in Fusion
2. Go to **Tools > Python Console** (bottom of the screen)
3. Copy this code into the console:

```python
exec(open(r"c:\Users\brad\AppData\Roaming\Autodesk\Autodesk Fusion 360\API\AddIns\ParametricGuitarMaker\extract_parameters.py").read())
```

4. Press **Enter** to run the extraction

### What It Shows

The extraction will display:

- **Schema vs. Design Comparison**: Which parameters are defined in the schema but missing from the design
- **Extra Parameters**: Parameters in the design that aren't defined in the schema
- **Detailed Table**: For each group, shows:
  - Parameter name (internal name)
  - Parameter label (display name)
  - Current expression (formula/value)
  - Current value (calculated)
  - Unit
  - Status (FOUND or MISSING)

## Method 2: Headless Schema Analysis (No Fusion Required)

If you don't have Fusion open, you can still analyze what parameters SHOULD exist using the schema.

### Quick Summary

```bash
python extract_parameters_headless.py --validate
```

This validates the schema and shows basic info.

### Full Report

```bash
python extract_parameters_headless.py
```

This prints a detailed report organized by parameter group.

### Export to CSV

```bash
python extract_parameters_headless.py --export-csv parameters.csv
```

Opens the file in Excel for easy viewing and comparison.

### Export to JSON

```bash
python extract_parameters_headless.py --export-json parameters.json
```

Useful for programmatic access or integration with other tools.

## Parameter Groups

The 96 parameters are organized into 12 groups:

| # | Group | Parameters | Key Controls |
|---|-------|------------|--------------|
| 1 | General | 8 | Frets, strings, scale lengths, guitar dimensions |
| 2 | Neck | 4 | Neck thickness and width at 1st and 12th frets |
| 3 | Fretboard | 15 | Fret spacing, length, thickness, margins |
| 4 | Nut | 8 | Nut dimensions, slot spacing, radius |
| 5 | Frets | 9 | Fret crown, tang, zero fret, overhang |
| 6 | Fret Markers | 4 | Diameter and depth of side and top markers |
| 7 | Heel | 6 | Heel extension, radius, transition, fillet |
| 8 | Scallops | 4 | Scallop width, depth (bass/treb), fillet |
| 9 | Fall-away | 3 | Fall-away fret number, length, depth |
| 10 | Headstock | 10 | Headstock dimensions, angles, hyoid points, volute |
| 11 | Body | 15 | Body dimensions, bout angles and widths/lengths |
| 12 | Strings | 10 | String gauges (8 strings max), action, spacing |

## Generated Files

The extraction tools generate the following reference files in `Desktop`:

### PARAMETER_INVENTORY.txt
Complete list of all 96 parameters with:
- Group assignment
- Internal name
- Display label
- Unit kind (length, angle, unitless)
- Default value

### guitar_parameters.csv
Spreadsheet-compatible export containing:
- Group ID and label
- Parameter name
- Parameter label
- Control type (number, select, etc.)
- Default value
- Min/max range
- Unit kind
- Description

Columns: group, group_id, name, label, unitKind, controlType, default, min, max, step, description

### guitar_parameters.json
JSON export with the same data structure as the CSV.

## How to Use These Files

### Validate Template
1. Open `fretboard template file` in Fusion
2. Run the extraction using Method 1
3. Check the output for:
   - MISSING parameters: Parameters defined in the schema but not in fretboard template file
   - EXTRA parameters: Parameters in fretboard template file not defined in the schema

### Compare with Schema
1. Run `extract_parameters_headless.py --export-csv parameters.csv`
2. Open in Excel
3. Compare against the actual design parameters from Method 1

### Debug Parameter Issues
1. If a parameter has the wrong value, use Method 1 to see the current expression
2. Fix the expression in Fusion using Design > Modify > Change Parameter
3. Re-run the extraction to verify

### Integrate with UI
1. Export to JSON: `--export-json parameters.json`
2. The JSON contains all schema info for dynamically building UI controls
3. Use `unitKind` to determine which unit system to show
4. Use `min`, `max`, `step` to validate user input

## Parameter Metadata

Each parameter includes:

- **name**: Internal identifier (PascalCase, no spaces)
- **label**: Display name in UI
- **unitKind**: Type of measurement
  - `length` — inches, mm, cm, etc.
  - `angle` — degrees
  - `unitless` — pure numbers (counts, ratios)
- **controlType**: UI control type (always "number" in current schema)
- **default**: Default expression/value
- **min, max, step**: Constraints for number inputs
- **description**: Help text for users

## Understanding Expressions

Parameters use Fusion expressions. Common formats:

```
24                    # Plain number
25.5 in               # Number with unit
0.125 in              # Decimal with unit
FretCount * 0.5       # Formula referencing other parameters
= ScaleLengthBass     # Reference to another parameter
```

When you see the extracted expression in the output, it shows exactly what's stored in Fusion.

## Troubleshooting

### "Parameter not found" errors
Some parameters may not exist in fretboard template file yet. This is expected in early development.

### Unit conversions
Fusion internally stores all dimensions in cm. The `value` field shows the cm value. The `unit` field shows what unit the user set.

### Expression errors
If a parameter expression references another parameter that doesn't exist, Fusion will show an error. Check the extracted output for parameter names.

## Next Steps

After validating the template:

1. **In Fusion**: Create any missing parameters with correct default values
2. **In Schema**: Add any new parameters discovered that should be in the schema
3. **Re-run extraction**: Verify all parameters match

See the Parameter Bridge documentation in `parameter_bridge.py` for how these parameters are used in the add-in.
