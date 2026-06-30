---
name: platform-porting
description: "Convert platform-specific code between Windows, macOS, and Linux. Use when fixing OS-dependent API calls (mouse/screen control, paths) or porting scripts across platforms."
---
# Skill: Platform-Specific Code Porting

**Use when**: Converting Windows-only code to macOS/Linux, or fixing platform-dependent API calls.

**Quick Pattern**: Replace OS-specific APIs with cross-platform or framework-provided equivalents.

---

## macOS-Specific Patterns (PyObjC)

### Mouse Control (Quartz Framework)

**Problem**: Windows code uses `ctypes.windll.user32`.

**Solution**:
```python
from Quartz import CGEventCreateMouseEvent, CGEventPost, kCGEventMouseMoved, kCGEventLeftMouseDown, kCGEventLeftMouseUp, kCGHIDEventTap

def move_cursor(x: int, y: int) -> None:
    pos = (float(int(x)), float(int(y)))
    event = CGEventCreateMouseEvent(None, kCGEventMouseMoved, pos, 0)
    CGEventPost(kCGHIDEventTap, event)

def click_left() -> None:
    pos = (0.0, 0.0)
    down = CGEventCreateMouseEvent(None, kCGEventLeftMouseDown, pos, 0)
    up = CGEventCreateMouseEvent(None, kCGEventLeftMouseUp, pos, 0)
    CGEventPost(kCGHIDEventTap, down)
    time.sleep(0.05)
    CGEventPost(kCGHIDEventTap, up)
```

**Key Points**:
- Position is a tuple of floats
- Event types: `kCGEventMouseMoved`, `kCGEventLeftMouseDown`, `kCGEventLeftMouseUp`
- Always post to `kCGHIDEventTap` for keyboard/mouse injection
- May require user to grant accessibility permissions (system prompt)

---

### Screen Dimensions (Cocoa Framework)

**Problem**: Windows code uses `ctypes` + `GetSystemMetrics`.

**Solution**:
```python
from Cocoa import NSScreen

def get_screen_size() -> tuple[int, int]:
    screen = NSScreen.mainScreen()
    frame = screen.frame()
    return int(frame.size.width), int(frame.size.height)
```

**Key Points**:
- `NSScreen.mainScreen()` returns the primary display
- `frame()` contains `size` with `width` and `height` properties
- Returns floats; cast to int for pixel coordinates

---

## Dependency Checklist

- **Quartz + Cocoa**: Pre-installed as part of `pyobjc-framework-quartz` and `pyobjc-framework-cocoa` in macOS conda environments
- **Avoid** `pyautogui` on macOS: slow compilation, better to use Quartz directly
- **Guard imports**: Always wrap PyObjC with try/except ImportError for graceful fallback

---

## Testing Checklist

1. ✅ Script compiles: `python -m py_compile script.py`
2. ✅ Imports work: `python -c "from Quartz import CGEventCreateMouseEvent; from Cocoa import NSScreen"`
3. ✅ Core functions callable: Test `get_screen_size()`, `move_cursor(x, y)`, `click_left()` in isolation
4. ✅ Live test: Run with actual display/mouse to verify accessibility permissions and behavior

---
