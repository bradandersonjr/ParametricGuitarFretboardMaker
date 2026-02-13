# Timeline Sheet — Troubleshooting Guide

## Issue: Timeline Sheet Not Updating / Stuck on Refresh

### Root Causes & Solutions

#### 1. **Message Handler Not Receiving Data**

**Symptom**: Sheet is open but shows "No timeline items" or spinner forever

**Check in Browser Console (F12):**
```javascript
// Check if handler is registered
window.fusionJavaScriptHandler?.handle

// Should return: ƒ (action, dataJson)

// Test sending a message manually
window.adsk?.fusionSendData("GET_TIMELINE_ITEMS", "{}")
```

**Fix**: The global message interceptor may not be set up. Check:
1. TimelinePanel component is imported in ParametersPage
2. TimelinePanel is rendered in the footer (should be visible after import)
3. Browser console has no errors about TimelinePanel

#### 2. **Python Not Sending Timeline Messages**

**Symptom**: Suppress button works (no error), but items don't update

**Check in Fusion 360 Console:**
- Open Fusion 360
- Extensions → Check Python add-in console for errors
- Look for messages like `Timeline Manager: Suppressed feature "..."`

**Fix**: The Python handlers may not be wired up. Verify:
1. `entry.py` has the timeline handlers (search for `_on_suppress_timeline_item`)
2. `palette_incoming()` routes timeline actions (search for `'SUPPRESS_TIMELINE_ITEM'`)
3. No Python exceptions in the console

#### 3. **Message Interception Blocked**

**Symptom**: Other messages work (parameters update) but timeline messages don't

**Check in Browser Console:**
```javascript
// See all messages arriving
const originalHandle = window.fusionJavaScriptHandler.handle
window.fusionJavaScriptHandler.handle = (action, data) => {
  console.log("Incoming:", action)
  return originalHandle(action, data)
}
```

**Fix**: If you don't see `PUSH_TIMELINE_ITEMS` messages:
1. Check that `GET_TIMELINE_ITEMS` is being sent (search console for "sendToPython")
2. Verify Python is receiving it (add log in entry.py)
3. Check that Python is sending back a response

### Debug Steps

#### Step 1: Verify Component Rendering

Open Browser DevTools (F12) and check:
```javascript
// Find the button
document.querySelector('[title*="Timeline"]')
// Should return: <button...>

// Should show button with count like "[Timeline 35/42]"
```

#### Step 2: Trigger GET_TIMELINE_ITEMS

```javascript
// Manually send the request
window.adsk?.fusionSendData("GET_TIMELINE_ITEMS", "{}")

// Wait 500ms, then check for response
setTimeout(() => {
  console.log("Checking for timeline data...")
  // Open DevTools console and look for logs
}, 500)
```

#### Step 3: Check Handler Chain

```javascript
// Verify interceptor is set up
window.__timelineInterceptorSetup
// Should return: true

// Check if handlers are registered
console.log("Timeline handlers:", timelineMessageHandlers?.size)
// Should return: > 0 (at least one handler)
```

#### Step 4: Monitor Messages

Add temporary logging to TimelinePanel (in the handler):

```typescript
const handleMessage = (action: string, data: any) => {
  console.log("[Timeline] Received:", action, data)  // ADD THIS LINE

  if (action === "PUSH_TIMELINE_ITEMS") {
    console.log("Setting items:", data.items?.length)  // ADD THIS
    setItems(data.items || [])
    setLoading(false)
  }
  // ... rest of handler
}
```

## Common Issues & Fixes

### Timeline Button Doesn't Appear

**Problem**: No "Timeline" button in action bar

**Solutions**:
- [ ] Check `isInitial` is false (after import completes)
- [ ] Check TimelinePanel is imported in ParametersPage
- [ ] Check TimelinePanel is rendered: `{!isInitial && <TimelinePanel ... />}`
- [ ] Reload the page (Ctrl+R)

### Sheet Opens But Stays Blank

**Problem**: Sheet opens, but no items or stats show

**Solutions**:
- [ ] Click "Refresh Timeline" button in sheet
- [ ] Check browser console for errors (F12)
- [ ] Check Python console in Fusion 360 for errors
- [ ] Verify timeline.py functions exist and run

### Items Don't Update After Suppress

**Problem**: Click eye icon, sheet refreshes, but nothing changed

**Solutions**:
- [ ] Check if the item was actually suppressed in Fusion (look at timeline in 3D)
- [ ] Check Python error logs
- [ ] Verify `entry.py` handlers are calling `parameter_bridge.suppress_timeline_item()`
- [ ] Check `timeline_manager.suppress_item()` is working

### "Stuck on Refreshing..."

**Problem**: Refresh button spinner never stops

**Solutions**:
- [ ] Python may not be sending `PUSH_TIMELINE_ITEMS` response
- [ ] Check `entry.py` for the `_on_get_timeline_items()` handler
- [ ] Add logging: `futil.log("Sending timeline items...")`
- [ ] Verify Fusion 360 isn't frozen
- [ ] Try closing and reopening the sheet

## Check Python Handlers

Look for these in `commands/guitarMaker/entry.py`:

```python
def _on_get_timeline_items():
    """Send all timeline items to the UI."""
    # Should exist and send PUSH_TIMELINE_ITEMS

def _on_suppress_timeline_item(data_json):
    """Suppress a timeline item."""
    # Should exist and handle suppression
```

And in `palette_incoming()`:

```python
elif action == 'GET_TIMELINE_ITEMS':
    _on_get_timeline_items()

elif action == 'SUPPRESS_TIMELINE_ITEM':
    _on_suppress_timeline_item(args.data)
```

## Check Python Backend

In `parameter_bridge.py`, these should exist:

```python
def get_timeline_items(design):
    return [... list of timeline items ...]

def suppress_timeline_item(design, name):
    return {... result dict ...}
```

And `timeline_manager.py` should have:

```python
def get_all_items(design):
    return items

def suppress_item(design, name):
    return True/False
```

## Enable Debug Logging

**In TimelinePanel.tsx**, uncomment these lines:

```typescript
const handleMessage = (action: string, data: any) => {
  console.log("[Timeline] Message:", action)  // UNCOMMENT

  if (action === "PUSH_TIMELINE_ITEMS") {
    console.log("[Timeline] Items:", data.items?.length)  // UNCOMMENT
    setItems(data.items || [])
    setLoading(false)
  }
  // ...
}
```

**In entry.py**, add logs:

```python
def _on_get_timeline_items():
    futil.log("GET_TIMELINE_ITEMS requested")  # ADD THIS
    design = adsk.fusion.Design.cast(app.activeProduct)
    if not design:
        futil.log("No design active")  # ADD THIS
        return

    items = parameter_bridge.get_timeline_items(design)
    futil.log(f"Found {len(items)} items")  # ADD THIS

    palette = ui.palettes.itemById(PALETTE_ID)
    if palette:
        palette.sendInfoToHTML('PUSH_TIMELINE_ITEMS', json.dumps(payload))
        futil.log("Sent PUSH_TIMELINE_ITEMS")  # ADD THIS
```

## Quick Test Checklist

- [ ] Timeline button visible (after import)
- [ ] Click button → sheet opens
- [ ] Sheet shows stats (Active, Suppressed, Groups, Features)
- [ ] Sheet shows at least one item
- [ ] Hover over item → eye icon appears
- [ ] Click eye icon → setLoading(true) happens
- [ ] Python receives SUPPRESS_TIMELINE_ITEM
- [ ] Python sends TIMELINE_OPERATION_RESULT
- [ ] Sheet auto-refreshes (150ms)
- [ ] Item now shows suppressed (dimmed + amber icon)
- [ ] Close sheet with ESC
- [ ] Parameters page still works normally

## If All Else Fails

**Nuclear option - Full reload:**
1. Close the palette
2. Close Fusion 360
3. Clear browser cache (if using dev server)
4. Restart Fusion 360
5. Re-open the palette

---

Still stuck? Check:
1. Python console in Fusion 360 (logs from entry.py)
2. Browser console in palette (F12 → Console tab)
3. Network tab (F12 → Network) to see if messages are flowing
4. Check that `timeline_manager.py` actually exists in the add-in folder

