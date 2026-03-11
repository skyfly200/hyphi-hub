# Hyphi Hub

PWA BLE controller for Hyphi / Smart Sprout LED devices.  
Built with **Vue 3 + Vite + Pinia + vite-plugin-pwa**.

---

## Quick start

```bash
npm install
npm run dev        # localhost:5173 — hot reload
npm run build      # dist/ — production PWA
npm run preview    # preview production build locally
```

---

## Deploy to Netlify / Vercel / GitHub Pages

### Netlify (recommended — easiest HTTPS)
1. Push repo to GitHub
2. Connect repo in Netlify dashboard
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Done — HTTPS is automatic, PWA installs, Web Bluetooth works

### Vercel
```bash
npx vercel --prod
# Build: npm run build  |  Output: dist
```

### GitHub Pages
```bash
# In vite.config.js, add: base: '/<repo-name>/'
npm run build
# Push dist/ to gh-pages branch, or use gh-pages package
```

> **Important:** Web Bluetooth requires HTTPS (or localhost).  
> GitHub Pages, Netlify, and Vercel all provide free HTTPS automatically.

---

## BLE Protocol

Implemented from `ble.h` + `a_smart_sprout_BLE_methods.ino`.

### Services used

| Service | UUID |
|---|---|
| LED Control | `f82d2279-9f54-4851-8394-377d54fb99bb` |
| Metadata | `ff391b43-ea80-456a-add4-eb9091a69163` |
| Battery (standard) | `0x180F` |
| Device Info (standard) | `0x180A` |
| Current Time (standard) | `0x1805` |
| Env Sensing (standard) | `0x181A` |

### Wire formats

| Characteristic | Type | Format |
|---|---|---|
| LED Power | BLEByte | `0` = off, `1` = on |
| LED Mode | BLEByte | WS2812FX mode index |
| Brightness | BLEByte | `0–255` |
| Color | 8-byte char | 6-char uppercase hex string, e.g. `"FF6B35"` |
| Speed | 8-byte char | uint32 little-endian, milliseconds per segment |
| Cycle | BLEByte | `0` = off, `1` = on |
| Cycle Time | 8-byte char | ASCII decimal string, e.g. `"15"` (seconds) |
| Audio Reactive | BLEByte | `0/1` |
| Auto Threshold | BLEByte | `0/1` |
| Rel/Off/Static Threshold | 8-byte char | ASCII float string, e.g. `"1.5000"` |
| Audio Damping | BLEByte | `0–255` |
| Current Time | 10-byte | `[yearLo, yearHi, month, day, hour, min, sec, weekday, frac256, adjust]` |

### Notifications (device → app)
- **Battery Level** — `BLERead | BLENotify`, uint8, percent
- **Temperature** — `BLERead | BLENotify`, int16, units of 0.01 °C
- **LED Current** — `BLERead | BLENotify`, 8 bytes, ASCII decimal mA

---

## Project structure

```
src/
├── ble-protocol.js          # All UUIDs + wire-format encoders/decoders
├── composables/
│   ├── useBLE.js            # Web Bluetooth connect/reconnect/NFC
│   └── useMock.js           # Demo mode mock handles
├── stores/
│   └── deviceStore.js       # Pinia store: device state + write actions
├── components/
│   └── ScanModal.vue        # BLE/QR/NFC scan modal
├── views/
│   └── HomeView.vue         # Main UI
├── App.vue
└── main.js
```

---

## Browser support

| Browser | BLE | NFC | QR |
|---|---|---|---|
| Chrome Android | ✅ | ✅ (Android) | ✅ (camera) |
| Chrome Desktop | ✅ | ❌ | ✅ |
| Edge Desktop | ✅ | ❌ | ✅ |
| Safari / Firefox | ❌ | ❌ | ✅ |

> Safari does not support Web Bluetooth. Demo mode is shown as fallback.

---

## NFC tag format

Write an NDEF text record to your tag with the content:

```
hyphi://connect?name=Smart%20Sprout
```

Or just the device name: `Smart Sprout`

The app reads the tag, extracts the name hint, then opens the BLE picker pre-filtered to that device name.

---

## QR code format

Generate a QR containing:
```
hyphi://connect?name=Smart%20Sprout
```

Print it on your device or enclosure. The app decodes the URL and opens the BLE picker.
