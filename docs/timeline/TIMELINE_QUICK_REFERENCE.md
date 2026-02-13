# Timeline Panel — Quick Reference Card

## Where Is It?

**Parameters Page** → Top of the scrollable area (above all parameter groups)

## What Does It Do?

Suppress/unsuppress timeline items (features and groups) with a click.

## How To Use

| Task | Steps |
|------|-------|
| **Hide a feature** | Find it → Click eye icon → Done |
| **Hide a group** | Find the group → Click eye icon → Entire group hides |
| **Expand a group** | Click the arrow (▶️) next to the group name |
| **Collapse a group** | Click the arrow again (▼️) |
| **Show hidden item** | Click the amber eye-off icon (🚫) |
| **See all items** | Scroll in the panel (it's 300px tall) |
| **Refresh** | Click the Refresh (🔄) button |

## Visual Indicators

| Icon | Meaning |
|------|---------|
| 👁️ Green | Feature is visible |
| 🚫 Amber | Feature is suppressed/hidden |
| 📁 | Group (has child features) |
| ⚙️ | Feature (individual item) |
| ▼ | Group is expanded |
| ▶️ | Group is collapsed |

## Common Tasks

### Hide Fret Slots
1. Find "Fret Slot Cuts" in the panel
2. Click the eye icon next to it
3. All 30+ fret slots hide immediately

### Show Frets Again
1. Find "Fret Slot Cuts" (now shows dimmed)
2. Click the amber eye-off icon
3. All frets reappear

### Hide One Specific Fret
1. Expand "Fret Slot Cuts" group
2. Find "Pocket - Fret 12" (or whichever)
3. Click its eye icon
4. Just that fret hides

### See Current State
Look at the stats box:
- **Active**: Visible features
- **Suppressed**: Hidden features
- **Groups**: Number of groups
- **Features**: Total features

## What Happens When You Suppress?

| Item Type | What Happens |
|-----------|--------------|
| Feature | Just that feature hides in Fusion 360 |
| Group | The group AND all features inside hide |
| Parameter | NOT affected (you can still edit parameters) |

## Styling Notes

| Appearance | Meaning |
|-----------|---------|
| `Normal text` | Feature is active |
| `Dimmed text` | Feature is suppressed |
| `Crossed out` | Also indicates suppressed |
| `Hover effect` | Darker background when hovering |

## Tips

- **No expansion needed**: You can suppress a group without expanding it
- **Auto-refresh**: Panel automatically refreshes after each operation
- **Hover buttons**: Eye icons only show on hover (keeps UI clean)
- **Scrollable**: Scroll down if timeline has many items
- **Dark mode**: Works perfectly in dark mode
- **No permanent changes**: You can always undo by clicking the eye icon again

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Panel won't load | Click Refresh button |
| Item still visible after suppressing | Try Refresh button |
| Can't find an item | Scroll down in panel |
| Wrong number of items | Click Refresh to sync with Fusion |
| No eye icon on hover | Try clicking directly on the item row |

## Keyboard Support

- **No keyboard shortcuts yet** — all mouse/touch based
- Request them if you'd like them!

## Performance

- **Fast**: Suppressing/unsuppressing is instant
- **Scrollable**: Works great with 100+ timeline items
- **Auto-refresh**: Updates within 150ms of operation
- **Error cleanup**: Messages disappear after 3 seconds

## Related Documentation

- **User Guide**: [TIMELINE_UI_GUIDE.md](TIMELINE_UI_GUIDE.md)
- **Technical Details**: [TIMELINE_UI_IMPLEMENTATION.md](TIMELINE_UI_IMPLEMENTATION.md)
- **API Reference**: [TIMELINE_MANAGEMENT.md](TIMELINE_MANAGEMENT.md)
- **Code Examples**: [TIMELINE_EXAMPLES.md](TIMELINE_EXAMPLES.md)

## Component Info

| Property | Value |
|----------|-------|
| **Location** | `ui/src/components/TimelinePanel.tsx` |
| **Lines of code** | 280 |
| **Height** | 300px (scrollable) |
| **Refresh rate** | Auto after operations |
| **Error display** | Auto-dismisses after 3s |
| **Dark mode** | ✓ Supported |
| **Responsive** | ✓ Yes |

---

**Quick Start**: Open Parameters Page → See Timeline Panel → Click eye icons to suppress/unsuppress

That's it! 🎸

