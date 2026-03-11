/**
 * useDeviceStore — Pinia store for all connected Hyphi devices
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'

import {
  connectDevice,
  reconnectDevice as bleReconnect,
  readNFCAndConnect,
} from '@/composables/useBLE'
import { MockHandle, mockConnectResult, MOCK_DEVICES } from '@/composables/useMock'
import type { MockDeviceDef } from '@/composables/useMock'
import type { DeviceState, DeviceInfo, IDeviceHandle, ConnectResult, LogType } from '@/ble-protocol'

// ── Types ──────────────────────────────────────────────────────────────────

export interface LogEntry {
  time: string
  msg:  string
  type: LogType
}

export interface DeviceEntry {
  info:          DeviceInfo
  state:         Ref<DeviceState>
  handle:        IDeviceHandle
  logs:          LogEntry[]
  _pollInterval: ReturnType<typeof setInterval> | null
}

// ── Debounce helper ────────────────────────────────────────────────────────
type AnyFn = (...args: never[]) => void

function debounce<T extends AnyFn>(fn: T, ms = 80): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useDeviceStore = defineStore('devices', () => {
  const devices  = ref<DeviceEntry[]>([])
  const activeId = ref<string | null>(null)

  const activeDevice = computed<DeviceEntry | null>(() =>
    devices.value.find(d => d.info.id === activeId.value) ?? null
  )

  const connectedCount = computed<number>(() =>
    devices.value.filter(d => d.state.value.connected).length
  )

  // ── Logging ──────────────────────────────────────────────────────────────
  const globalLogs = ref<LogEntry[]>([
    { time: _ts(), msg: 'Hyphi Hub ready — click SCAN to connect', type: 'info' },
  ])

  function _ts(): string {
    const n = new Date()
    return `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`
  }
  function pad(n: number): string { return String(n).padStart(2, '0') }

  function log(msg: string, type: LogType = 'info', deviceId?: string | null): void {
    const entry: LogEntry = { time: _ts(), msg, type }
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

  // ── Connect via BLE scan picker ──────────────────────────────────────────
  async function connectBLE(): Promise<void> {
    try {
      const result = await connectDevice((msg, type) => log(msg, type))
      if (!result) return
      _addDevice(result)
    } catch (err) {
      log(`Connection failed: ${(err as Error).message}`, 'err')
    }
  }

  // ── Connect via NFC ──────────────────────────────────────────────────────
  async function connectNFC(): Promise<void> {
    try {
      const result = await readNFCAndConnect((msg, type) => log(msg, type))
      if (!result) return
      _addDevice(result)
    } catch (err) {
      log(`NFC failed: ${(err as Error).message}`, 'err')
    }
  }

  // ── Add demo/mock device ──────────────────────────────────────────────────
  function connectMock(mockDef: MockDeviceDef): void {
    const handle = new MockHandle(mockDef, (msg, type) => log(msg, type, mockDef.id))
    _addDevice(mockConnectResult(mockDef, handle))
    log(`[DEMO] Connected: ${mockDef.name}`, 'ok')
  }

  // ── Get first unused mock device ──────────────────────────────────────────
  function connectNextMock(): void {
    const unused = MOCK_DEVICES.find(m => !devices.value.find(d => d.info.id === m.id))
    if (unused) connectMock(unused)
    else log('All demo devices already connected', 'info')
  }

  // ── Internal: register a connected device ────────────────────────────────
  function _addDevice(result: ConnectResult): void {
    if (devices.value.find(d => d.info.id === result.id)) {
      log(`Already connected: ${result.name}`, 'info')
      return
    }

    const fullState: DeviceState = {
      connected:       true,
      power:           result.initialState.power           ?? true,
      mode:            result.initialState.mode            ?? 0,
      brightness:      result.initialState.brightness      ?? 204,
      color:           result.initialState.color           ?? '#ff6b35',
      color2:          '#7b5cfa',   // UI-only
      color3:          '#3dffc0',   // UI-only
      speed:           result.initialState.speed           ?? 5000,
      autoCycle:       result.initialState.autoCycle       ?? false,
      cycleTime:       result.initialState.cycleTime       ?? 15,
      battery:         result.initialState.battery         ?? null,
      audioReactive:   result.initialState.audioReactive   ?? false,
      autoThreshold:   result.initialState.autoThreshold   ?? true,
      relThreshold:    result.initialState.relThreshold    ?? 1.5,
      offThreshold:    result.initialState.offThreshold    ?? 0.5,
      staticThreshold: result.initialState.staticThreshold ?? 512,
      damping:         result.initialState.damping         ?? 5,
      current:         result.initialState.current         ?? 0,
      temp:            result.initialState.temp            ?? null,
      gamma:           2.2,         // UI-only
      manufacturer:    result.initialState.manufacturer    ?? result.name,
      model:           result.initialState.model           ?? 'Unknown',
      firmware:        result.initialState.firmware        ?? 'Unknown',
    }

    const devState = ref<DeviceState>(fullState)

    // Poll notification-driven keys from handle.state every 2 s
    const notifyKeys: (keyof DeviceState)[] = ['battery', 'current', 'temp', 'connected']
    const poll = setInterval(() => {
      const raw = result.handle.state
      notifyKeys.forEach(k => {
        const v = raw[k]
        if (v !== undefined) (devState.value as Record<string, unknown>)[k] = v
      })
    }, 2_000)

    const entry: DeviceEntry = {
      info: {
        id:          result.id,
        name:        result.name,
        type:        result.type        ?? 'LED Device',
        hasBattery:  result.hasBattery  ?? false,
        hasAudio:    result.hasAudio    ?? false,
        ledCount:    result.ledCount    ?? 60,
        ledType:     result.ledType     ?? 'WS2812B',
        voltage:     result.voltage     ?? 5,
        battCapMah:  result.battCapMah  ?? null,
        themeColor:  result.themeColor  ?? '#ff6b35',
        modelUri:    result.modelUri    ?? null,
      },
      state:         devState,
      handle:        result.handle,
      logs:          [],
      _pollInterval: poll,
    }

    devices.value.push(entry)
    activeId.value = result.id
    log(`Connected: ${result.name}`, 'ok', result.id)
  }

  // ── Disconnect ────────────────────────────────────────────────────────────
  function disconnect(id: string): void {
    const idx = devices.value.findIndex(d => d.info.id === id)
    if (idx < 0) return
    const dev = devices.value[idx]
    dev.handle.disconnect()
    if (dev._pollInterval) clearInterval(dev._pollInterval)
    dev.state.value.connected = false
    log(`Disconnected: ${dev.info.name}`, 'err', id)
    if (activeId.value === id) {
      const next = devices.value.find((d, i) => i !== idx && d.state.value.connected)
      activeId.value = next?.info.id ?? null
    }
  }

  // ── Remove device entirely ────────────────────────────────────────────────
  function removeDevice(id: string): void {
    disconnect(id)
    devices.value = devices.value.filter(d => d.info.id !== id)
  }

  // ── Reconnect ──────────────────────────────────────────────────────────────
  async function reconnect(id: string): Promise<void> {
    const dev = devices.value.find(d => d.info.id === id)
    if (!dev) return
    try {
      await bleReconnect(
        dev.handle as import('@/composables/useBLE').DeviceHandle,
        (msg, type) => log(msg, type, id)
      )
      dev.state.value.connected = true
    } catch (err) {
      log(`Reconnect failed: ${(err as Error).message}`, 'err', id)
    }
  }

  // ── Debounced write cache ──────────────────────────────────────────────────
  const _writeCache = new Map<string, ReturnType<typeof debounce>>()

  function _debouncedWrite<T>(devId: string, method: keyof IDeviceHandle, ms = 80) {
    const key = `${devId}:${String(method)}`
    if (!_writeCache.has(key)) {
      _writeCache.set(key, debounce(async (val: T) => {
        const dev = devices.value.find(d => d.info.id === devId)
        if (!dev?.handle) return
        try {
          await (dev.handle[method] as (v: T) => Promise<void>)(val)
        } catch (err) {
          log(`Write ${String(method)} failed: ${(err as Error).message}`, 'err', devId)
        }
      }, ms))
    }
    return _writeCache.get(key)! as (val: T) => void
  }

  // ── Control actions ───────────────────────────────────────────────────────
  function setActive(id: string): void { activeId.value = id }

  async function togglePower(id: string): Promise<void> {
    const dev = _device(id)
    if (!dev) return
    const next = !dev.state.value.power
    dev.state.value.power = next
    await dev.handle.setPower(next)
  }

  function setBrightness(id: string, val: number): void {
    const dev = _device(id)
    if (!dev) return
    dev.state.value.brightness = val
    _debouncedWrite<number>(id, 'setBrightness')(val)
  }

  function setColor(id: string, hex: string): void {
    const dev = _device(id)
    if (!dev) return
    dev.state.value.color = hex
    _debouncedWrite<string>(id, 'setColor', 60)(hex)
  }

  function setMode(id: string, mode: number): void {
    const dev = _device(id)
    if (!dev) return
    dev.state.value.mode = mode
    void dev.handle.setMode(mode)
  }

  function setSpeed(id: string, val: number): void {
    const dev = _device(id)
    if (!dev) return
    dev.state.value.speed = val
    _debouncedWrite<number>(id, 'setSpeed')(val)
  }

  async function setAutoCycle(id: string, on: boolean): Promise<void> {
    const dev = _device(id)
    if (!dev) return
    dev.state.value.autoCycle = on
    await dev.handle.setAutoCycle(on)
  }

  function setCycleTime(id: string, secs: number): void {
    const dev = _device(id)
    if (!dev) return
    dev.state.value.cycleTime = secs
    _debouncedWrite<number>(id, 'setCycleTime', 200)(secs)
  }

  async function setAudioReactive(id: string, on: boolean): Promise<void> {
    const dev = _device(id)
    if (!dev) return
    dev.state.value.audioReactive = on
    await dev.handle.setAudioReactive(on)
  }

  function setDamping(id: string, val: number): void {
    const dev = _device(id)
    if (!dev) return
    dev.state.value.damping = val
    _debouncedWrite<number>(id, 'setDamping')(val)
  }

  function _device(id: string | null | undefined): DeviceEntry | undefined {
    return devices.value.find(d => d.info.id === (id ?? activeId.value))
  }

  return {
    devices,
    activeId,
    activeDevice,
    connectedCount,
    globalLogs,
    log,
    connectBLE,
    connectNFC,
    connectMock,
    connectNextMock,
    disconnect,
    removeDevice,
    reconnect,
    setActive,
    togglePower,
    setBrightness,
    setColor,
    setMode,
    setSpeed,
    setAutoCycle,
    setCycleTime,
    setAudioReactive,
    setDamping,
    _addDevicePublic: _addDevice,
  }
})
