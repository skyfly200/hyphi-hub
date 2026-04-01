# Hyphi Hub — Design Specification

> Derived from the interactive mockup at `public/HyphiHub.html` and the production app source.

---

## 1. Product Overview

**Hyphi Hub** is a mobile-first Progressive Web App (PWA) for controlling Bluetooth Low Energy (BLE) LED lighting devices. It provides real-time color, brightness, effect, and audio-reactive control from a browser — with no native app install required.

### 1.1 Goals

- Provide a fast, tactile interface for controlling one or more LED devices simultaneously.
- Work as an installable PWA on Android Chrome and desktop Chromium browsers.
- Fall back gracefully to a demo mode when Web Bluetooth is unavailable.
- Expose advanced capabilities (audio reactivity, effect sequencing, power monitoring) without cluttering the primary flow.

### 1.2 Target Platforms

| Browser | BLE | NFC | QR |
|---|---|---|---|
| Chrome Android | ✅ | ✅ | ✅ |
| Chrome / Edge Desktop | ✅ | ❌ | ✅ |
| Safari / Firefox | ❌ (demo mode) | ❌ | ✅ |

---

## 2. Visual Design Language

### 2.1 Color Tokens

```
--bg:        #0a0a0f   Dark background (page canvas)
--surface:   #111118   Component background
--panel:     #16161f   Card / drawer / modal fill
--border:    #2a2a3a   Subtle 1px dividers
--muted:     #3a3a50   Disabled / inactive elements
--text:      #e8e8f0   Primary text
--sub:       #7a7a9a   Secondary / label text
--accent:    #ff6b35   Orange — primary CTAs, active states
--accent2:   #7b5cfa   Purple — secondary accent, connection UI
--connected: #3dffc0   Cyan — live/online status, power-on states
```

Derived values:
```
--glow:  rgba(255,107,53,0.18)   Orange ambient glow
--glow2: rgba(123,92,250,0.15)   Purple ambient glow
```

### 2.2 Typography

| Role | Family | Weight | Size | Letter-spacing |
|---|---|---|---|---|
| Display titles | Bebas Neue | 400 | 20–26px | 3–5px |
| Section labels | DM Mono | 400 | 9–11px | 3–4px, uppercase |
| Control values | DM Mono | 500 | 11–15px | 1px |
| Body / labels | DM Sans | 300–500 | 14px | — |

All section labels use `text-transform: uppercase` and `letter-spacing: 3–4px`.

### 2.3 Shape & Depth

- **Border radius:** `8px` default (`--r`); cards 12px; modals/drawers 16px.
- **Noise texture:** Fixed SVG fractalNoise overlay at `opacity: 0.4` covers the entire viewport — adds tactile grunge to the dark background.
- **Elevation:** Floating surfaces use `box-shadow: 0 32px 80px rgba(0,0,0,0.6)`. Cards lift `translateY(-1px)` on hover.
- **Backdrop blur:** Header and modals use `backdrop-filter: blur(20px)` over a semi-transparent background.

### 2.4 Motion

| Element | Transition |
|---|---|
| Page sections fade in | `opacity 0 → 1` + `translateY(12px → 0)`, 0.45s ease |
| Mobile menu slide | `translateY(-110% → 0)`, 0.42s `cubic-bezier(0.4,0,0.2,1)` |
| Side drawers | `translateX(100% → 0)`, 0.48s `cubic-bezier(0.4,0,0.2,1)` |
| Power toggle | `translateX`, 0.45s ease |
| Accordion expand | `grid-template-rows: 0fr → 1fr`, 0.38–0.42s ease |
| SCAN button border | Conic-gradient rotation, 3s linear infinite |
| Status dot pulse | Opacity 1 → 0.5 → 1, 3s infinite |

---

## 3. Layout & Navigation

### 3.1 Page Structure

```
┌──────────────────────────────────────────────────────┐
│  HEADER (sticky, blur)                               │
│  Logo | Status pill | [DEVICES btn] [SCAN btn]       │
│  Mobile: Logo | [Hamburger]                          │
├──────────────────────────────────────────────────────┤
│  MAIN  max-width: 1200px, padding: 32px 24px 80px    │
│                                                      │
│  [CONTROL PANEL — active device]                     │
│    HUD canvas                                        │
│    Scene presets                                     │
│    Controls grid                                     │
│    BLE log (collapsible)                             │
│    Settings (collapsible)                            │
│                                                      │
│  [NO-DEVICE STATE — centered, min-height 55vh]       │
└──────────────────────────────────────────────────────┘

OVERLAYS (z-index order):
  Noise texture          z: 9999 (pointer-events: none)
  Toast notification     z: 9000
  Devices drawer         z: 201 + overlay z: 200
  FX editor drawer       z: 201 + overlay z: 200
  Scan modal             z: 1000
  Mobile menu            z: 500
```

### 3.2 Header

**Desktop:**
- Left: Logo (SVG icon 56×56px + "HYPHI HUB" wordmark + "BLE LIGHT CONTROL" subtext)
- Right: Status pill (dot + text) · DEVICES button (with count badge) · SCAN button

**Mobile (< 520px):**
- Left: Logo (icon 42×42px + wordmark 20px)
- Right: Hamburger button (☰)
- Header padding reduces to `12px 16px`

**Status pill states:**
- Disconnected: muted dot, "NO DEVICE" label
- Connecting: animated dot
- Connected: cyan glowing dot + pulsing animation, device name label

**SCAN button — no device connected:**
Animated conic-gradient border spins 360° every 3s (orange → purple → transparent loop). The button interior stays `--surface` via a stacked `::before`/`::after` pseudo-element trick.

### 3.3 Mobile Menu

Full-width overlay panel slides down from top. Contains:
- Header row: "NAVIGATION" label + close (×) button
- Row: Devices (icon + label + sub-label showing connection count)
- Row: Scan for devices
- Status row: connection dot + status text

### 3.4 No-Device State

Centered in remaining viewport height (`min-height: 55vh`). Shows:
- Faded BLE icon
- "NO DEVICE SELECTED" (Bebas Neue, 20px)
- Helper text in DM Mono
- SCAN button CTA

---

## 4. Devices Drawer

Slides in from the right edge. Width: `320px` (max `90vw`).

**Header:**
- "DEVICES" title (gradient orange → purple)
- Sub-label: device count summary
- EDIT toggle button + close (×)

**Device card (per connected device):**
```
┌──────────────────────────────────────────┐
│ ≡ (drag handle, visible in edit mode)    │
│ [color swatch 28×28] Device Name  [LIVE] │
│                       Device ID          │
│ [RECONNECT btn]               [× delete] │
└──────────────────────────────────────────┘
```

- Active card: `border-color: --accent2` + 2px orange-to-purple gradient top edge
- Disconnected card: `opacity: 0.55`
- RECONNECT button: hover turns cyan
- Delete button: red border, red on hover

**Edit mode:** Drag handles become visible; cards become draggable for reordering.

**Footer:** Full-width "ADD DEVICE" button → opens Scan Modal.

---

## 5. Control Panel

Visible only when a device is active. Fades in (`fadeUp` animation).

### 5.1 Panel Header

- Left: device name (Bebas Neue 22px, 3px spacing) + profile sub-label (DM Mono 11px)
- Below name: battery widget (icon + percentage, color-coded: cyan ≥ 60%, yellow 30–59%, red < 30%)
- Right: power toggle (pill switch)

**Power toggle:**
- Off: `--panel` fill, muted thumb
- On: `rgba(61,255,192,0.15)` fill, cyan border with glow, cyan thumb slides right

### 5.2 HUD Canvas

Height: `180px`. Background: `#07070d`.

- **2D mode (default):** Canvas renders LED fixture layout (Hyphi logo dot pattern). LEDs light up with the current color/effect.
- **3D mode:** Three.js scene rendered in same container, toggled by "2D / 3D" button (top-right of canvas).
- **Device label overlay:** Ghost text (bottom-left, 15% opacity) showing device name.
- **OFF overlay:** "POWER OFF" text fades in when device is off.
- **3D badge:** "3D" label bottom-right when in 3D mode.

**HUD Stats Bar** (5 columns, border-top):
| Column | Value | Label |
|---|---|---|
| 1 | LEDs lit count | LEDS |
| 2 | Current draw in mA | MA |
| 3 | Wattage | WATTS |
| 4 | Battery % or `—` | BATT |
| 5 | Remaining time | TIME |

Stat value color states: normal `--text`, good `--connected` (cyan), warning `#f0c040` (yellow), critical `#ff5577` (red).

**Power Gauge** (below stats bar):
- 3px track, gradient fill: cyan → yellow → red
- Transitions at 0.9s ease

### 5.3 Scene Presets

4-column grid of scene buttons:

| Scene | Icon | Color | Effect |
|---|---|---|---|
| CHILL | 🌊 | Blue | Slow breath |
| FOCUS | 💡 | White | Static |
| PARTY | 🎉 | Pink | Chase |
| WARM | 🔆 | Orange | Slow breath |

Buttons: `--panel` fill, hover turns purple with glow.

### 5.4 Controls Grid

2-column grid (`1fr 1fr`), single-column below 600px. Each block: `--surface` fill, 1px border, 12px radius, 20–22px padding.

#### Color Block (full-width)

- **Slot tabs** (for multi-color effects): pill-shaped tabs, one per active color slot. Active tab has colored border + glow matching slot color.
- **Color picker row:**
  - Native `<input type="color">` styled as 52×52px circle (border-radius 50%), orange glow on hover
  - Color preset swatches: 24×24px circles. Hover: `scale(1.25)` + color glow. Selected: white border + `scale(1.2)`.
  - Custom swatches: dashed border, show red × delete badge on hover.
  - "+" save button at end of row: dashed circle, white on hover.

#### Brightness Block

- Label: "BRIGHTNESS" + current % value (right-aligned)
- Slider: gradient track `#1a1a2e → #ffffff` (dark to white)
- Thumb: 18×18px white circle, `scale(1.2)` on hover

#### Speed Block

- Label: "SPEED" + current % value
- Slider: gradient track `#1a1a2e → --accent2` (dark to purple)

#### Effect Mode Block (full-width)

- Label: "EFFECT MODE" + "EDIT" button (top-right)
- 3-column grid of effect buttons
- **Effect button:**
  - Inactive: `--panel` fill, muted text
  - Active: orange border + `--glow` fill + orange text
  - Layout: emoji icon (18px) above label (10px DM Mono uppercase)

Default effect slots: Static · Breath · Rainbow · Rainbow Cycle · Strobe · Chase · Sparkle · Larson · Fire

#### Auto Cycle Block

- Header row: "AUTO CYCLE" label + small toggle
- Accordion body (expands when enabled):
  - "CYCLE TIME" label + stepper control (−/value/+ buttons, DM Mono)
  - Cycle progress bar: 4px height, orange-to-purple gradient

#### Audio Reactive Block (device capability-gated)

- Header row: "AUDIO REACTIVE" label + capability badge (SUPPORTED / UNSUPPORTED) + toggle
- Body accordion (expands when enabled):
  - Mode pills: "AUTO" / "MANUAL"
  - Sliders (in manual mode):
    - REL THRESHOLD (0.1–5.0×)
    - OFFSET (0.0–2.0)
    - DAMPING (0–255)
  - All labels in `adv-row` layout: `min-width: 80px` label + right-aligned purple value + slider

---

## 6. FX Editor Drawer

Slides in from right. Width: `340px` (max `92vw`).

**Header:** "EFFECTS" + "Customize your effect buttons" sub-label + close ×.

**Effects list (scrollable):**
Each item row:
```
[≡ drag] [icon 28px] [effect name] [mode ID]  [× delete]
```
- Drag-over state: purple border + tinted background
- Dragging state: 35% opacity + dashed border

**Add Effect footer:**
1. Dropdown: select from 50+ WS2812FX effect names
2. ADD button (orange border)
3. Icon search input
4. Icon grid: 34×34px emoji buttons, selected = purple border + tint
5. "Selected: [icon]" preview line

---

## 7. Scan Modal

Centered modal, max-width `440px`, slides up on open. Backdrop: `rgba(0,0,0,0.7)` + `blur(8px)`.

**Header:** "ADD DEVICE" (gradient title) + "Scan for nearby BLE devices" + close ×.

**Method tabs** (3 equal tabs, border-grouped):
- BLE · QR CODE · NFC TAP
- Active tab: purple text + purple glow background

### BLE Tab

- Animated radar: 3 concentric rings (purple border) radiate outward in sequence (0s, 0.6s, 1.2s delay each)
- Center dot: 10px purple circle with glow
- Scan results list (180px scrollable area):
  - Each row: device name (DM Mono 13px bold) + ID/signal meta + CONNECT button (orange border)
- Footer: primary action button

### QR Code Tab

- 180×160px viewfinder box with corner bracket decorations (purple)
- Animated scan line sweeps top→bottom when active
- Placeholder icon + hint text when camera not yet started

### NFC Tap Tab

- 3 concentric pulse rings animate outward from center (purple)
- Phone/NFC icon in center
- "WAITING FOR TAG" label
- Android Chrome only — badge shown otherwise

**Demo mode fallback** (BLE not supported):
- "LOAD DEMO DEVICE" button replaces scanner UI

---

## 8. BLE Log (Collapsible Accordion)

Toggle button: "BLE LOG" label + message count badge + chevron (rotates 180° when open).

Log area: `max-height: 160px`, overflow-y scroll, DM Mono 11px.

Log entry format: `[timestamp]  [message]`

Color coding:
- `.log-ok` — cyan (`--connected`)
- `.log-err` — red (`#ff5577`)
- `.log-info` — purple (`--accent2`)
- Timestamp — muted

---

## 9. Toast Notifications

Fixed, centered horizontally, 32px above bottom edge. Slides up from `translateY(20px)`. Panel background + border. Disappears after ~2–3s.

---

## 10. Interaction States & Behaviors

### Device Connection Flow

1. User presses SCAN → modal opens.
2. Selects BLE tab → animated radar displayed.
3. Presses "SCAN FOR DEVICES" → browser-native BLE picker opens.
4. User selects device → connection established.
5. Modal closes. Device card appears in Devices Drawer.
6. Control panel fades in for the active device.
7. BLE log records each step.

### Known Devices Auto-reconnect

On app load, previously paired device IDs are read from `localStorage` key `hyphi-hub:known-devices`. The app attempts silent reconnection. If successful, the device card shows LIVE badge. If not, card shows disconnected state (55% opacity) with RECONNECT button.

### Multi-device

Multiple devices can be connected simultaneously. The Devices Drawer lists all. Tapping a card sets it as active, updating the control panel. All connected devices persist in memory; each has its own BLE log buffer (last 80 entries).

### Effect Customization

1. User presses EDIT in the Effect Mode block → FX Drawer slides in.
2. Drag to reorder effect slots (changes button order in grid).
3. Pick icon from searchable emoji grid.
4. Add new effect from dropdown.
5. Delete unwanted slots.
6. Close drawer → grid reflects new config.

### Color Presets

- Clicking a preset swatch immediately applies that color to the active slot.
- "+" button saves the current picker color as a new custom swatch (dashed border).
- Custom swatches show a red × on hover to delete.

---

## 11. Responsive Behavior

| Viewport | Changes |
|---|---|
| ≥ 520px | Full header with DEVICES + SCAN buttons and status pill |
| < 520px | Hamburger menu replaces header-right; logo shrinks to 42px |
| < 600px | Controls grid collapses to single column |

---

## 12. PWA & Offline

- Service Worker pre-caches all static assets and Google Fonts via Workbox.
- App is installable (manifest: `site.webmanifest`) with standalone display mode.
- Theme color: `#0a0a0f` (matches `--bg`).
- Icons: 192px and 512px variants.
- All core functionality works offline once installed; BLE pairing requires the browser context.

---

## 13. Accessibility Notes

- All interactive elements use `cursor: pointer`.
- Buttons have visible focus states via border-color transitions.
- Aria labels are not yet present on icon-only buttons — this is a known gap.
- Color is never the sole differentiator for status (text labels accompany all status dots).

---

## 14. Component Inventory

| Component | File | Notes |
|---|---|---|
| App shell | `src/App.vue` | RouterView only |
| Main UI | `src/views/HomeView.vue` | All controls, HUD, drawers |
| Device discovery | `src/components/ScanModal.vue` | BLE / QR / NFC tabs |
| BLE driver | `src/composables/useBLE.ts` | Web Bluetooth wrapper |
| Mock driver | `src/composables/useMock.ts` | Demo mode simulator |
| State | `src/stores/deviceStore.ts` | Pinia, all device state |
| Protocol | `src/ble-protocol.ts` | UUIDs + encode/decode |
| Static mockup | `public/HyphiHub.html` | Self-contained HTML prototype |
| Device profiles | `public/devices/*.json` | Capability declarations |
