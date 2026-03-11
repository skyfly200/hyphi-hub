/**
 * useDeviceStore — Pinia store for all connected Hyphi devices
 *
 * Each device entry has:
 *   info      — static metadata (name, type, ledCount, …)
 *   state     — reactive live state (power, color, brightness, …) synced from BLE
 *   handle    — DeviceHandle instance (or MockHandle for demo mode)
 *   logs      — array of { time, msg, type } log entries
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { connectDevice, reconnectDevice as bleReconnect, readNFCAndConnect, bleSupported } from '@/composables/useBLE.js'
import { MockHandle } from '@/composables/useMock.js'

// Debounce helper — batches rapid slider changes into a single BLE write
function debounce(fn, ms = 80) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

export const useDeviceStore = defineStore('devices', () => {
  const devices = ref([])       // array of device entries
  const activeId = ref(null)    // id of currently shown device

  const activeDevice = computed(() =>
    devices.value.find(d => d.info.id === activeId.value) || null
  )

  const connectedCount = computed(() =>
    devices.value.filter(d => d.state.connected).length
  )

  // ── Logging (per-device + global) ──────────────────────────────────────
  const globalLogs = ref([
    { time: _ts(), msg: 'Hyphi Hub ready — click SCAN to connect', type: 'info' }
  ])

  function _ts() {
    const n = new Date()
    return `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`
  }
  function pad(n) { return String(n).padStart(2, '0') }

  function log(msg, type = 'info', deviceId = null) {
    const entry = { time: _ts(), msg, type }
    globalLogs.value.push(entry)
    if (globalLogs.value.length > 200) globalLogs.value.shift()
    if (deviceId) {
      const dev = devices.value.find(d => d.info.id === deviceId)
      if (dev) {
        dev.logs.push(entry)
        if (dev.logs.length > 100) dev.logs.shift()
      }
    }
  }

  // ── Connect via BLE scan picker ─────────────────────────────────────────
  async function connectBLE() {
    try {
      const result = await connectDevice((msg, type) => log(msg, type))
      if (!result) return   // user cancelled
      _addDevice(result)
    } catch (e) {
      log(`Connection failed: ${e.message}`, 'err')
    }
  }

  // ── Connect via NFC ─────────────────────────────────────────────────────
  async function connectNFC() {
    try {
      const result = await readNFCAndConnect((msg, type) => log(msg, type))
      if (!result) return
      _addDevice(result)
    } catch (e) {
      log(`NFC failed: ${e.message}`, 'err')
    }
  }

  // ── Add mock device (demo mode) ─────────────────────────────────────────
  function connectMock(mockDef) {
    const handle = new MockHandle(mockDef, (msg, type) => log(msg, type, mockDef.id))
    const result = { ...mockDef, handle, initialState: handle.state }
    _addDevice(result)
    log(`[DEMO] Connected: ${mockDef.name}`, 'ok')
  }

  // ── Internal: register a connected device ───────────────────────────────
  function _addDevice(result) {
    // Prevent duplicates
    if (devices.value.find(d => d.info.id === result.id)) {
      log(`Already connected: ${result.name}`, 'info')
      return
    }

    const devState = ref({
      connected: true,
      ...result.initialState,
      // UI-only state (not on the device)
      color2: '#7b5cfa',
      color3: '#3dffc0',
      gamma:  2.2,
    })

    // Keep handle.state and devState in sync (handle.state is updated by notifications)
    if (result.handle && result.handle.state) {
      // Mirror notification updates into devState
      const rawState = result.handle.state
      if (typeof rawState === 'object') {
        // Use a Proxy-based bridge for reactive forwarding
        const keys = Object.keys(rawState)
        keys.forEach(k => {
          if (k in devState.value) devState.value[k] = rawState[k]
        })
        // Set up interval poll for notification-driven keys
        const poll = setInterval(() => {
          ;['battery', 'current', 'temp', 'connected'].forEach(k => {
            if (k in rawState) devState.value[k] = rawState[k]
          })
        }, 2000)
        result._pollInterval = poll
      }
    }

    const entry = {
      info: {
        id:         result.id,
        name:       result.name,
        type:       result.type       || 'LED Device',
        hasBattery: result.hasBattery || false,
        hasAudio:   result.hasAudio   || false,
        ledCount:   result.ledCount   || 60,
        ledType:    result.ledType    || 'WS2812B',
        voltage:    result.voltage    || 5,
        battCapMah: result.battCapMah || null,
        themeColor: result.themeColor || '#ff6b35',
        modelUri:   result.modelUri   || null,
      },
      state:  devState,
      handle: result.handle,
      logs:   [],
      _pollInterval: result._pollInterval || null,
    }

    devices.value.push(entry)
    activeId.value = result.id
    log(`Connected: ${result.name}`, 'ok', result.id)
  }

  // ── Disconnect ──────────────────────────────────────────────────────────
  function disconnect(id) {
    const idx = devices.value.findIndex(d => d.info.id === id)
    if (idx < 0) return
    const dev = devices.value[idx]
    dev.handle?.disconnect()
    if (dev._pollInterval) clearInterval(dev._pollInterval)
    dev.state.value.connected = false
    log(`Disconnected: ${dev.info.name}`, 'err', id)
    // Switch active to next connected device
    if (activeId.value === id) {
      const next = devices.value.find((d, i) => i !== idx && d.state.value.connected)
      activeId.value = next?.info.id || null
    }
  }

  // ── Remove device entirely ──────────────────────────────────────────────
  function removeDevice(id) {
    disconnect(id)
    devices.value = devices.value.filter(d => d.info.id !== id)
  }

  // ── Reconnect ────────────────────────────────────────────────────────────
  async function reconnect(id) {
    const dev = devices.value.find(d => d.info.id === id)
    if (!dev) return
    try {
      await bleReconnect(dev.handle, (msg, type) => log(msg, type, id))
      dev.state.value.connected = true
    } catch (e) {
      log(`Reconnect failed: ${e.message}`, 'err', id)
    }
  }

  // ── Write wrappers — all with debounce for sliders ───────────────────────
  const _writeDebounced = {}

  function _debouncedWrite(devId, methodName, ms = 80) {
    const key = `${devId}:${methodName}`
    if (!_writeDebounced[key]) {
      _writeDebounced[key] = debounce(async (val) => {
        const dev = devices.value.find(d => d.info.id === devId)
        if (!dev?.handle) return
        try {
          await dev.handle[methodName](val)
        } catch (e) {
          log(`Write ${methodName} failed: ${e.message}`, 'err', devId)
        }
      }, ms)
    }
    return _writeDebounced[key]
  }

  // ── High-level control actions (called from UI) ──────────────────────────
  function setActive(id) { activeId.value = id }

  async function togglePower(id) {
    const dev = device(id)
    if (!dev) return
    const next = !dev.state.value.power
    dev.state.value.power = next
    await dev.handle?.setPower(next)
  }

  function setBrightness(id, val) {
    const dev = device(id)
    if (!dev) return
    dev.state.value.brightness = val
    _debouncedWrite(id, 'setBrightness')(val)
  }

  function setColor(id, hex) {
    const dev = device(id)
    if (!dev) return
    dev.state.value.color = hex
    _debouncedWrite(id, 'setColor', 60)(hex)
  }

  function setMode(id, mode) {
    const dev = device(id)
    if (!dev) return
    dev.state.value.mode = mode
    dev.handle?.setMode(mode)
  }

  function setSpeed(id, val) {
    const dev = device(id)
    if (!dev) return
    dev.state.value.speed = val
    _debouncedWrite(id, 'setSpeed')(val)
  }

  async function setAutoCycle(id, on) {
    const dev = device(id)
    if (!dev) return
    dev.state.value.autoCycle = on
    await dev.handle?.setAutoCycle(on)
  }

  function setCycleTime(id, secs) {
    const dev = device(id)
    if (!dev) return
    dev.state.value.cycleTime = secs
    _debouncedWrite(id, 'setCycleTime', 200)(secs)
  }

  async function setAudioReactive(id, on) {
    const dev = device(id)
    if (!dev) return
    dev.state.value.audioReactive = on
    await dev.handle?.setAudioReactive(on)
  }

  function setDamping(id, val) {
    const dev = device(id)
    if (!dev) return
    dev.state.value.damping = val
    _debouncedWrite(id, 'setDamping')(val)
  }

  // ── Helper ────────────────────────────────────────────────────────────────
  function device(id) {
    return devices.value.find(d => d.info.id === (id ?? activeId.value))
  }

  return {
    devices, activeId, activeDevice, connectedCount,
    globalLogs,
    log,
    connectBLE, connectNFC, connectMock,
    disconnect, removeDevice, reconnect,
    setActive,
    togglePower, setBrightness, setColor, setMode, setSpeed,
    setAutoCycle, setCycleTime, setAudioReactive, setDamping,
  }
})
