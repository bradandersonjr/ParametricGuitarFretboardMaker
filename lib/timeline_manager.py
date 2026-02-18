"""
Timeline Manager — comprehensive timeline group and feature management for Autodesk Fusion.

Provides utilities to:
- List all timeline items (features and groups)
- Find features/groups by name or pattern
- Suppress/unsuppress features and groups
- Manage group operations (show/hide contents)
- Get timeline state information
"""

import re
import adsk.core
import adsk.fusion
from . import fusionAddInUtils as futil

app = adsk.core.Application.get()


# ═══════════════════════════════════════════════════════════════════
# Feature Category Classification
# ═══════════════════════════════════════════════════════════════════

# Maps objectType suffix → UI category label.
# objectType looks like "adsk::fusion::ExtrudeFeature" — we match on the suffix.
_OBJECT_TYPE_MAP = {
    # Sketches
    'Sketch': 'Sketch',
    # Solid / surface features
    'ExtrudeFeature': 'Extrude',
    'RevolveFeature': 'Revolve',
    'SweepFeature': 'Sweep',
    'LoftFeature': 'Loft',
    'HoleFeature': 'Hole',
    'ThreadFeature': 'Thread',
    'FilletFeature': 'Fillet',
    'ChamferFeature': 'Chamfer',
    'ShellFeature': 'Shell',
    'ScaleFeature': 'Scale',
    'MirrorFeature': 'Mirror',
    'RectangularPatternFeature': 'Pattern',
    'CircularPatternFeature': 'Pattern',
    'PathPatternFeature': 'Pattern',
    'CombineFeature': 'Combine',
    'SplitBodyFeature': 'Split',
    'SplitFaceFeature': 'Split',
    'OffsetFacesFeature': 'Offset',
    'MoveFaceFeature': 'Move',
    'MoveFeature': 'Move',
    'TrimFeature': 'Surface',
    'ExtendFeature': 'Surface',
    'PatchFeature': 'Surface',
    'StitchFeature': 'Surface',
    'ThickenFeature': 'Surface',
    'RuledSurfaceFeature': 'Surface',
    # Construction geometry
    'ConstructionPlane': 'Plane',
    'ConstructionAxis': 'Axis',
    'ConstructionPoint': 'Point',
    # Import / bodies
    'BaseFeature': 'Body',
    'FormFeature': 'Form',
    # Other
    'BoundaryFillFeature': 'Fill',
    'DirectEditFeature': 'Edit',
    'DeleteFaceFeature': 'Edit',
    'ReplaceFaceFeature': 'Edit',
    'UnstitchFeature': 'Surface',
    'FromSurfaceFeature': 'Thicken',
    'SculptFeature': 'Sculpt',
}


def _get_feature_category(timeline_obj) -> str:
    """Classify a timeline object into a human-readable category.

    Uses entity.objectType (e.g. 'adsk::fusion::ExtrudeFeature') to avoid
    fragile casting and work across all Fusion API versions.

    Returns a short category string like 'Sketch', 'Extrude', 'Fillet',
    'Plane', 'Pattern', or 'Feature' as the generic fallback.
    """
    try:
        entity = timeline_obj.entity
        if entity is None:
            return 'Feature'
        ot = getattr(entity, 'objectType', '') or ''
        # objectType is like "adsk::fusion::ExtrudeFeature" — grab the suffix
        suffix = ot.split('::')[-1] if '::' in ot else ot
        return _OBJECT_TYPE_MAP.get(suffix, 'Feature')
    except Exception:
        return 'Feature'


# ═══════════════════════════════════════════════════════════════════
# Timeline Item Retrieval
# ═══════════════════════════════════════════════════════════════════

def get_timeline(design: adsk.fusion.Design) -> adsk.fusion.Timeline:
    """Get the design's timeline object.

    Args:
        design: The active Fusion design.

    Returns:
        adsk.fusion.Timeline: The timeline, or None if invalid.
    """
    if not design:
        return None
    try:
        return design.timeline
    except Exception as e:
        futil.log(f'Timeline Manager: Failed to get timeline: {e}',
                  adsk.core.LogLevels.ErrorLogLevel)
        return None


def get_all_items(design: adsk.fusion.Design, include_suppressed: bool = True):
    """Get all timeline items (features and groups).

    Recursively traverses the timeline so that items inside collapsed groups
    are always returned, regardless of the current UI expand/collapse state.

    Uses the pattern from thomasa88's flatten_timeline: when iterating the
    timeline, if we encounter a group (isGroup=True), we iterate the group
    object directly to get its children (TimelineGroup.item(i) works even
    when the group is collapsed in the UI).

    Args:
        design: The active Fusion design.
        include_suppressed: Include suppressed items in results.

    Returns:
        list: Dicts with keys: name, type (Feature/Group), suppressed, index, object.
              Groups also carry a ``children`` list of child dicts.
    """
    timeline = get_timeline(design)
    if not timeline:
        return []

    def _traverse_items(collection, is_group_collection=False):
        """Recursively traverse items (timeline or group).

        Args:
            collection: adsk.fusion.Timeline or TimelineGroup object
            is_group_collection: True if collection is a TimelineGroup (has different iteration semantics)

        Returns:
            list of item dicts
        """
        items_list = []
        count = collection.count
        for i in range(count):
            try:
                item = collection.item(i)
                if item is None:
                    continue

                is_suppressed = item.isSuppressed
                is_group = item.isGroup

                if not include_suppressed and is_suppressed:
                    continue

                # item.index throws InternalValidationError for items inside a
                # TimelineGroup (Fusion returns -1 which the C++ wrapper rejects).
                # Use the loop counter as a safe fallback for group children.
                try:
                    item_index = item.index
                except Exception:
                    item_index = i

                entry = {
                    'name': item.name,
                    'type': 'Group' if is_group else 'Feature',
                    'featureType': None if is_group else _get_feature_category(item),
                    'suppressed': is_suppressed,
                    'index': item_index,
                    'object': item,
                }

                # If this is a group, recursively get its children
                if is_group:
                    tg = adsk.fusion.TimelineGroup.cast(item)
                    if not tg and hasattr(item, 'entity'):
                        tg = adsk.fusion.TimelineGroup.cast(item.entity)
                    entry['children'] = _traverse_items(tg, is_group_collection=True) if tg else []

                items_list.append(entry)
            except Exception as e:
                futil.log(f'Timeline Manager: Error on item {i} in {type(collection).__name__}: {e}',
                          adsk.core.LogLevels.WarningLogLevel)

        return items_list

    try:
        items = _traverse_items(timeline, is_group_collection=False)
        futil.log(f'Timeline Manager: get_all_items returning {len(items)} top-level items')
        return items
    except Exception as e:
        futil.log(f'Timeline Manager: Failed to get all items: {e}',
                  adsk.core.LogLevels.ErrorLogLevel)
        import traceback
        futil.log(f'Timeline Manager: Traceback: {traceback.format_exc()}',
                  adsk.core.LogLevels.ErrorLogLevel)
        return []


def find_item_by_name(design: adsk.fusion.Design, name: str, exact: bool = True):
    """Find a timeline item by name (searches groups' children too).

    Args:
        design: The active Fusion design.
        name: The item name to find.
        exact: If True, match exactly; if False, use regex.

    Returns:
        dict: Item dict (see get_all_items), or None if not found.
    """
    timeline = get_timeline(design)
    if not timeline:
        return None

    # Try itemByName first (may not exist in all Fusion versions)
    if exact:
        try:
            item = timeline.itemByName(name)
            if item:
                _log(f'TM: find_item_by_name("{name}") — found via itemByName')
                return {
                    'name': item.name,
                    'type': 'Group' if item.isGroup else 'Feature',
                    'suppressed': item.isSuppressed,
                    'object': item,
                }
        except Exception:
            pass  # itemByName not available — fall through to scan

    # Scan all items AND their children
    try:
        all_items = get_all_items(design, include_suppressed=True)
        if exact:
            for item_dict in all_items:
                if item_dict['name'] == name:
                    return item_dict
                for child in item_dict.get('children', []):
                    if child['name'] == name:
                        return child
        else:
            pattern = re.compile(name, re.IGNORECASE)
            for item_dict in all_items:
                if pattern.search(item_dict['name']):
                    return item_dict
                for child in item_dict.get('children', []):
                    if pattern.search(child['name']):
                        return child
    except Exception as e:
        _log(f'TM: find_item_by_name("{name}") EXCEPTION: {e}')

    return None


def find_items_by_pattern(design: adsk.fusion.Design, pattern: str):
    """Find all timeline items matching a regex pattern.

    Args:
        design: The active Fusion design.
        pattern: Regex pattern to match (e.g., "^Fret.*", ".*Slot.*").

    Returns:
        list: Matching item dicts.
    """
    items = []
    try:
        regex = re.compile(pattern, re.IGNORECASE)
        for item_dict in get_all_items(design, include_suppressed=True):
            if regex.search(item_dict['name']):
                items.append(item_dict)
            for child in item_dict.get('children', []):
                if regex.search(child['name']):
                    items.append(child)
    except Exception as e:
        futil.log(f'Timeline Manager: Invalid regex pattern "{pattern}": {e}',
                  adsk.core.LogLevels.ErrorLogLevel)

    return items


# ═══════════════════════════════════════════════════════════════════
# Suppress / Unsuppress Operations
# ═══════════════════════════════════════════════════════════════════

def _log(msg, level=adsk.core.LogLevels.InfoLogLevel):
    """Log to Text Commands window (always visible, no DEBUG flag needed)."""
    futil.log(msg, level, force_console=True)


def _set_suppressed(timeline_obj, suppressed: bool) -> bool:
    """Set the suppressed state on a timeline object.

    Uses TimelineObject.isSuppressed directly — it is read-write per the
    Fusion API docs and works for both groups and features.  Falls back to
    Feature.isSuppressed on the entity if the direct approach fails.
    """
    name = getattr(timeline_obj, 'name', '?')

    # Primary path: set directly on the TimelineObject (works for all types)
    try:
        timeline_obj.isSuppressed = suppressed
        return True
    except Exception as e:
        _log(f'TM: TimelineObject.isSuppressed failed for "{name}": {e}')

    # Fallback: try Feature.isSuppressed on the entity
    try:
        entity = timeline_obj.entity
        if entity:
            feature = adsk.fusion.Feature.cast(entity)
            if feature:
                feature.isSuppressed = suppressed
                return True
            if hasattr(entity, 'isSuppressed'):
                entity.isSuppressed = suppressed
                return True
    except Exception as e:
        _log(f'TM: Feature fallback failed for "{name}": {e}')

    _log(f'TM: _set_suppressed("{name}") FAILED — all approaches exhausted')
    return False


def suppress_item(design: adsk.fusion.Design, name: str) -> bool:
    """Suppress a timeline item by name."""
    item_dict = find_item_by_name(design, name, exact=True)
    if not item_dict:
        _log(f'TM: suppress_item — not found: "{name}"')
        return False

    try:
        return _set_suppressed(item_dict['object'], True)
    except Exception as e:
        _log(f'TM: suppress_item("{name}") error: {e}')
        return False


def unsuppress_item(design: adsk.fusion.Design, name: str) -> bool:
    """Unsuppress a timeline item by name."""
    item_dict = find_item_by_name(design, name, exact=True)
    if not item_dict:
        _log(f'TM: unsuppress_item — not found: "{name}"')
        return False

    try:
        return _set_suppressed(item_dict['object'], False)
    except Exception as e:
        _log(f'TM: unsuppress_item("{name}") error: {e}')
        return False


def toggle_item(design: adsk.fusion.Design, name: str) -> bool:
    """Toggle suppress state of a timeline item.

    Args:
        design: The active Fusion design.
        name: The name of the item to toggle.

    Returns:
        bool: New suppress state (True = suppressed, False = active), or None on failure.
    """
    item_dict = find_item_by_name(design, name, exact=True)
    if not item_dict:
        return None

    try:
        new_state = not item_dict['object'].isSuppressed
        _set_suppressed(item_dict['object'], new_state)
        action = 'Suppressed' if new_state else 'Unsuppressed'
        futil.log(f'Timeline Manager: {action} {item_dict["type"].lower()} "{name}"')
        return new_state
    except Exception as e:
        futil.log(f'Timeline Manager: Failed to toggle "{name}": {e}',
                  adsk.core.LogLevels.ErrorLogLevel)
        return None


def suppress_items_by_pattern(design: adsk.fusion.Design, pattern: str) -> int:
    """Suppress all items matching a regex pattern.

    Args:
        design: The active Fusion design.
        pattern: Regex pattern to match.

    Returns:
        int: Number of items successfully suppressed.
    """
    items = find_items_by_pattern(design, pattern)
    count = 0

    for item_dict in items:
        try:
            _set_suppressed(item_dict['object'], True)
            count += 1
        except Exception as e:
            futil.log(f'Timeline Manager: Failed to suppress "{item_dict["name"]}": {e}',
                      adsk.core.LogLevels.WarningLogLevel)

    if count > 0:
        futil.log(f'Timeline Manager: Suppressed {count} item(s) matching "{pattern}"')

    return count


def unsuppress_items_by_pattern(design: adsk.fusion.Design, pattern: str) -> int:
    """Unsuppress all items matching a regex pattern.

    Args:
        design: The active Fusion design.
        pattern: Regex pattern to match.

    Returns:
        int: Number of items successfully unsuppressed.
    """
    items = find_items_by_pattern(design, pattern)
    count = 0

    for item_dict in items:
        try:
            _set_suppressed(item_dict['object'], False)
            count += 1
        except Exception as e:
            futil.log(f'Timeline Manager: Failed to unsuppress "{item_dict["name"]}": {e}',
                      adsk.core.LogLevels.WarningLogLevel)

    if count > 0:
        futil.log(f'Timeline Manager: Unsuppressed {count} item(s) matching "{pattern}"')

    return count


# ═══════════════════════════════════════════════════════════════════
# Group Operations
# ═══════════════════════════════════════════════════════════════════

def is_group(design: adsk.fusion.Design, name: str) -> bool:
    """Check if a timeline item is a group.

    Args:
        design: The active Fusion design.
        name: The item name.

    Returns:
        bool: True if item is a group, False if feature, None if not found.
    """
    item_dict = find_item_by_name(design, name, exact=True)
    if not item_dict:
        return None
    return item_dict['type'] == 'Group'


def get_group_children_from_object(group_obj):
    """Get all items within a group object.

    Args:
        group_obj: The adsk.fusion.TimelineObject or TimelineGroup.

    Returns:
        list: Item dicts for all items in the group.
    """
    items = []
    try:
        if not group_obj:
            return []

        # Gather as much context as possible from either TimelineObject or TimelineGroup.
        timeline = getattr(group_obj, 'timeline', None)
        group_name = getattr(group_obj, 'name', '')
        group_index = getattr(group_obj, 'index', None)
        start_index = getattr(group_obj, 'startIndex', None)
        end_index = getattr(group_obj, 'endIndex', None)

        # Try casting the object directly.
        tg = adsk.fusion.TimelineGroup.cast(group_obj)

        # If that failed, it might be a TimelineObject wrapper -> get the entity.
        if not tg and hasattr(group_obj, 'entity'):
            tg = adsk.fusion.TimelineGroup.cast(group_obj.entity)

        if tg:
            if timeline is None:
                timeline = getattr(tg, 'timeline', None)
            if start_index is None:
                start_index = getattr(tg, 'startIndex', None)
            if end_index is None:
                end_index = getattr(tg, 'endIndex', None)

            # Primary path: iterate via TimelineGroup API.
            try:
                for i in range(tg.count):
                    child = tg.item(i)
                    items.append({
                        'name': child.name,
                        'type': 'Group' if child.isGroup else 'Feature',
                        'suppressed': child.isSuppressed,
                        'index': child.index,
                        'object': child,
                    })
            except Exception:
                # If this path fails/returns nothing, we'll fall back to index scanning below.
                items = []

        if items:
            return items

        # Secondary path: resolve via timeline.timelineGroups by name/index.
        # In some Fusion contexts, timeline item -> TimelineGroup casting can fail
        # while timelineGroups still exposes full group membership.
        if timeline is not None and group_name:
            try:
                groups = getattr(timeline, 'timelineGroups', None)
                if groups is not None:
                    matched_group = None
                    for gi in range(groups.count):
                        candidate = groups.item(gi)
                        if candidate is None:
                            continue
                        if getattr(candidate, 'name', None) != group_name:
                            continue

                        c_start = getattr(candidate, 'startIndex', None)
                        c_end = getattr(candidate, 'endIndex', None)
                        if group_index is not None and c_start is not None and c_end is not None:
                            lo = min(c_start, c_end)
                            hi = max(c_start, c_end)
                            if lo <= group_index <= hi:
                                matched_group = candidate
                                break

                        if matched_group is None:
                            matched_group = candidate

                    if matched_group is not None:
                        start_index = getattr(matched_group, 'startIndex', start_index)
                        end_index = getattr(matched_group, 'endIndex', end_index)
                        try:
                            for i in range(matched_group.count):
                                child = matched_group.item(i)
                                if child is None:
                                    continue
                                items.append({
                                    'name': child.name,
                                    'type': 'Group' if child.isGroup else 'Feature',
                                    'suppressed': child.isSuppressed,
                                    'index': child.index,
                                    'object': child,
                                })
                        except Exception:
                            items = []
            except Exception:
                pass

        if items:
            return items

        # Fallback path: enumerate timeline indices bounded by group start/end.
        if timeline is not None and start_index is not None and end_index is not None:
            lo = min(start_index, end_index)
            hi = max(start_index, end_index)
            for idx in range(lo, hi + 1):
                child = timeline.item(idx)
                if child is None:
                    continue

                # Exclude the group header object itself if present in this range.
                if child.isGroup and group_name and child.name == group_name:
                    if group_index is None or child.index == group_index:
                        continue

                items.append({
                    'name': child.name,
                    'type': 'Group' if child.isGroup else 'Feature',
                    'suppressed': child.isSuppressed,
                    'index': child.index,
                    'object': child,
                })
    except Exception as e:
        futil.log(f'Timeline Manager: Failed to get children from group object: {e}',
                  adsk.core.LogLevels.ErrorLogLevel)
    return items


def get_group_items(design: adsk.fusion.Design, group_name: str):
    """Get all items within a group.

    Args:
        design: The active Fusion design.
        group_name: The name of the group.

    Returns:
        list: Item dicts for all items in the group, or [] if not a group.
    """
    timeline = get_timeline(design)
    if not timeline:
        return []

    try:
        # Prefer timelineGroups collection when available.
        groups = getattr(timeline, 'timelineGroups', None)
        if groups is not None:
            for i in range(groups.count):
                tg = groups.item(i)
                if tg is None:
                    continue
                if getattr(tg, 'name', None) == group_name:
                    children = get_group_children_from_object(tg)
                    if children:
                        return children

        # itemByName may not find groups; scan all items instead
        group = None
        for i in range(timeline.count):
            candidate = timeline.item(i)
            if candidate.isGroup and candidate.name == group_name:
                group = candidate
                break

        if not group:
            return []
            
        return get_group_children_from_object(group)

    except Exception as e:
        futil.log(f'Timeline Manager: Failed to get group items for "{group_name}": {e}',
                  adsk.core.LogLevels.ErrorLogLevel)
        return []


def suppress_group_contents(design: adsk.fusion.Design, group_name: str) -> int:
    """Suppress all items within a group (excluding the group itself).

    Args:
        design: The active Fusion design.
        group_name: The name of the group.

    Returns:
        int: Number of items suppressed, or -1 on failure.
    """
    items = get_group_items(design, group_name)
    if items is None:
        return -1

    count = 0
    for item_dict in items:
        try:
            _set_suppressed(item_dict['object'], True)
            count += 1
        except Exception as e:
            futil.log(f'Timeline Manager: Failed to suppress "{item_dict["name"]}": {e}',
                      adsk.core.LogLevels.WarningLogLevel)

    if count > 0:
        futil.log(f'Timeline Manager: Suppressed {count} item(s) in group "{group_name}"')

    return count


def unsuppress_group_contents(design: adsk.fusion.Design, group_name: str) -> int:
    """Unsuppress all items within a group (excluding the group itself).

    Args:
        design: The active Fusion design.
        group_name: The name of the group.

    Returns:
        int: Number of items unsuppressed, or -1 on failure.
    """
    items = get_group_items(design, group_name)
    if items is None:
        return -1

    count = 0
    for item_dict in items:
        try:
            _set_suppressed(item_dict['object'], False)
            count += 1
        except Exception as e:
            futil.log(f'Timeline Manager: Failed to unsuppress "{item_dict["name"]}": {e}',
                      adsk.core.LogLevels.WarningLogLevel)

    if count > 0:
        futil.log(f'Timeline Manager: Unsuppressed {count} item(s) in group "{group_name}"')

    return count


def suppress_group_with_contents(design: adsk.fusion.Design, group_name: str) -> bool:
    """Suppress a group and all its contents.

    Args:
        design: The active Fusion design.
        group_name: The name of the group.

    Returns:
        bool: True if successful.
    """
    # Suppress the group itself
    if not suppress_item(design, group_name):
        return False

    # Suppress its contents (this will cascade)
    suppress_group_contents(design, group_name)
    return True


def unsuppress_group_with_contents(design: adsk.fusion.Design, group_name: str) -> bool:
    """Unsuppress a group and all its contents.

    Args:
        design: The active Fusion design.
        group_name: The name of the group.

    Returns:
        bool: True if successful.
    """
    # Unsuppress the group first
    if not unsuppress_item(design, group_name):
        return False

    # Unsuppress its contents
    unsuppress_group_contents(design, group_name)
    return True


# ═══════════════════════════════════════════════════════════════════
# Timeline State & Information
# ═══════════════════════════════════════════════════════════════════

def get_timeline_summary(design: adsk.fusion.Design) -> dict:
    """Get a summary of the timeline state.

    Counts include group children (features inside groups).

    Returns:
        dict: Summary with total_items, active_count, suppressed_count, groups, features.
    """
    items = get_all_items(design, include_suppressed=True)

    groups = 0
    features = 0
    active = 0
    suppressed = 0

    for i in items:
        if i['type'] == 'Group':
            groups += 1
            if i['suppressed']:
                suppressed += 1
            else:
                active += 1
            # Count children inside the group
            for c in i.get('children', []):
                features += 1
                if c['suppressed']:
                    suppressed += 1
                else:
                    active += 1
        else:
            features += 1
            if i['suppressed']:
                suppressed += 1
            else:
                active += 1

    total = groups + features

    return {
        'total_items': total,
        'active_count': active,
        'suppressed_count': suppressed,
        'group_count': groups,
        'feature_count': features,
    }


def get_item_state(design: adsk.fusion.Design, name: str) -> dict:
    """Get detailed state of a specific item.

    Returns:
        dict: Item state (name, type, suppressed, index), or None if not found.
    """
    item_dict = find_item_by_name(design, name, exact=True)
    if not item_dict:
        return None

    item = item_dict['object']
    state = {
        'name': item_dict['name'],
        'type': item_dict['type'],
        'suppressed': item_dict['suppressed'],
        'index': item_dict['index'],
    }

    # Add group-specific info
    if item_dict['type'] == 'Group':
        try:
            state['rollUp'] = item.rollUp
            state['group_size'] = len(item_dict.get('children', []))
        except Exception:
            pass

    return state


