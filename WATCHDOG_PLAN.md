# Watchdog & Lockup-Prevention Plan

## Problem Statement

The firmware can reach a state where it stops responding to BLE commands (e.g., stuck in a tight LED loop, stack overflow, heap fragmentation, or an infinite delay inside an effect callback). When this happens the device stays connectable — GATT keeps responding — but LED writes are silently accepted and do nothing. A manual physical reset is the only recovery path today.

---

## Firmware-Side: Hardware Watchdog Timer (WDT)

### Strategy

Enable the ESP32 Task Watchdog Timer (TWDT) on the main loop task. The main loop must call `esp_task_wdt_reset()` at least once per watchdog period, or the WDT fires and reboots the chip.

### Implementation

```cpp
// In setup() — after BLE init
#include "esp_task_wdt.h"
#define WDT_TIMEOUT_SEC 8   // reboot if loop stalls > 8 s

void setup() {
  ...
  esp_task_wdt_init(WDT_TIMEOUT_SEC, true);   // panic=true → hard reset
  esp_task_wdt_add(NULL);                      // watch current (loop) task
}

void loop() {
  esp_task_wdt_reset();   // top of every loop iteration
  handleBLE();
  handleLEDs();
  handleAudio();
  ...
}
```

### Guard Rails

- **Only feed inside the main task.** Do NOT feed from ISR or BLE callbacks — this defeats the purpose.
- **Tune the timeout** to be longer than your longest legitimate blocking call (e.g., a one-shot FFT + LED show is <200 ms, so 8 s is very conservative).
- **Test deliberately**: add a `while(1){}` stub behind a test BLE characteristic, confirm WDT fires within the expected window.

### Effect-Callback Watchdog Feed

If individual LED effect routines are long-running, feed the WDT inside the strip update helper:

```cpp
void tickLEDs() {
  esp_task_wdt_reset();
  strip.service();
}
```

---

## Firmware-Side: Reboot Characteristic

A dedicated BLE write characteristic (`LED_RESET_CHAR_UUID = c97a62b4-5e3d-4f89-b001-6789abcdef01`) already exists in the protocol spec.

```cpp
// In BLE write callback
if (charUUID == LED_RESET_CHAR_UUID) {
  delay(200);              // let BLE ACK the write
  ESP.restart();           // or esp_restart()
}
```

The app's `store.resetDevice(id)` calls `handle.reset()` → BLE write → then auto-reconnects after 3 s.

---

## App-Side: Health Monitor

### Liveness Probe

Even if GATT stays up, a frozen firmware stops updating the `current` characteristic (updated every 2 s). Use this as a liveness heartbeat:

```typescript
// In deviceStore._addDevice(), after push()
if (!result.handle.isMock) {
  let lastCurrent = Date.now()
  const lastSeenCurrent = result.handle.state.current

  const livenessInterval = setInterval(() => {
    const dev = devices.value.find(d => d.info.id === result.id)
    if (!dev?.state.connected) { clearInterval(livenessInterval); return }

    const now = Date.now()
    if (dev.state.current !== lastSeenCurrent) {
      // current value changed — device is alive
      lastCurrent = now
    } else if (now - lastCurrent > 15_000) {
      // No current update in 15 s while connected → likely frozen
      console.warn(`[health] ${result.id} appears frozen — triggering reset`)
      resetDevice(result.id)
      lastCurrent = now   // back off; don't spam resets
    }
  }, 5_000)
}
```

> **Caveat**: current only changes when `power = true`. Suppress the liveness check when `dev.state.power === false`.

### Reconnect Back-off

The auto-reconnect in `_addDevice` uses a flat 2 s delay. For devices that keep failing (e.g., out of range), use exponential back-off to avoid hammering:

```typescript
let reconnectAttempts = 0
bleDevice.addEventListener('gattserverdisconnected', () => {
  const dev = devices.value.find(d => d.info.id === result.id)
  if (!dev || !dev.state.connected) return
  dev.state.connected = false
  const delay = Math.min(30_000, 2_000 * 2 ** reconnectAttempts)
  reconnectAttempts++
  setTimeout(async () => {
    await reconnect(result.id)
    reconnectAttempts = 0   // reset on success (reconnect() throws on failure)
  }, delay)
})
```

### User-Facing "Device Frozen?" Toast

If the liveness check fires, show a non-blocking toast before triggering the reset so the user isn't surprised by a disconnect:

```
"Desk Strip appears frozen — rebooting…"
```

---

## Summary Table

| Layer | Mechanism | Trigger | Recovery |
|---|---|---|---|
| Firmware | HW Task WDT | Loop stall > 8 s | Auto hard reset |
| Firmware | Soft reset char | App `resetDevice()` call | Controlled restart |
| App | `gattserverdisconnected` listener | Unexpected BLE drop | Auto-reconnect w/ back-off |
| App | Current-value liveness probe | No current update > 15 s | `resetDevice()` + toast |
| User | Reset button in panel header | Manual tap | Controlled restart + reconnect |

---

## Implementation Order

1. **Firmware**: Enable TWDT in `setup()`, feed in `loop()` — 15 min change.
2. **Firmware**: Wire `LED_RESET_CHAR_UUID` write to `esp_restart()`.
3. **App (done)**: `store.resetDevice()`, `handle.reset()`, reset button + confirm dialog.
4. **App (future)**: Current-value liveness probe + exponential reconnect back-off.
