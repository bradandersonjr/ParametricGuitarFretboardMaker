# Quick Start

## Prerequisites
- Autodesk Fusion (latest)
- The add-in folder placed in your Fusion AddIns directory

## Running the Add-In
1. Open Fusion.
2. Go to **Utilities → Add-Ins** (or press **Shift+S**).
3. Under the **Add-Ins** tab, find **ParametricGuitarFretboardMaker** and click **Run**.
4. You'll see a **Parametric Guitar: Fretboard Maker** button in the **Solid** workspace toolbar.

## Using Parametric Guitar: Fretboard Maker
1. Open or create a Fusion design.
2. Click **Parametric Guitar: Fretboard Maker** in the toolbar.
3. The add-in detects your document units (inches or mm) and imports the matching fretboard template.
4. A palette opens where you can adjust parameters and apply them to the model.

## Templates
Place your `.f3d` fretboard templates in the `templates/` folder:
- `fretboard_inch.f3d` — inch-based template
- `fretboard_mm.f3d` — millimeter-based template

Both templates must use the same parameter names.
