/**
 * useMock — mock device handles for demo / no-BLE-support fallback.
 * Mirrors IDeviceHandle exactly so the store and UI don't care.
 */

import type { IDeviceHandle, DeviceState, LogFn, LogType, ConnectResult } from '@/ble-protocol'

// ── Mock device definitions ───────────────────────────────────────────────

export interface MockDeviceDef {
  id:          string
  name:        string
  type:        string
  hasBattery:  boolean
  hasAudio:    boolean
  ledCount:    number
  ledType:     string
  voltage:     number
  battCapMah:  number | null
  themeColor:  string
  modelUri:    string | null
}

export const MOCK_DEVICES: MockDeviceDef[] = [
  {
    id: 'mock-desk-strip',
    name: 'Desk Strip',
    type: 'LED Strip',
    hasBattery: true,
    hasAudio: true,
    ledCount: 144,
    ledType: 'WS2812B',
    voltage: 5,
    battCapMah: null,
    themeColor: '#ff6b35',
    modelUri: null,
  },
  {
    id: 'mock-shelf-ring',
    name: 'Shelf Ring',
    type: 'LED Ring',
    hasBattery: true,
    hasAudio: false,
    ledCount: 60,
    ledType: 'WS2812B',
    voltage: 5,
    battCapMah: 2000,
    themeColor: '#7b5cfa',
    modelUri: null,
  },
  {
    id: 'mock-moon-orb',
    name: 'Moon Orb',
    type: 'PHI ORB',
    hasBattery: true,
    hasAudio: false,
    ledCount: 30,
    ledType: 'WS2812B',
    voltage: 5,
    battCapMah: 1500,
    themeColor: '#3dffc0',
    modelUri: 'builtin:phi-orb',
  },
  {
    id: 'mock-smart-sprout',
    name: 'Smart Sprout',
    type: 'Smart Sprout V1.1',
    hasBattery: true,
    hasAudio: true,
    ledCount: 60,
    ledType: 'WS2812B',
    voltage: 5,
    battCapMah: 2000,
    themeColor: '#2E7D32',
    modelUri: null,
  },
]

// ── MockHandle ────────────────────────────────────────────────────────────

export class MockHandle implements IDeviceHandle {
  readonly isMock = true
  state: Partial<DeviceState>

  private readonly _log:   LogFn
  private readonly _def:   MockDeviceDef
  private _battInterval?:  ReturnType<typeof setInterval>
  private _currentInterval: ReturnType<typeof setInterval>

  constructor(def: MockDeviceDef, onLog?: LogFn) {
    this._def = def
    this._log = onLog ?? ((_msg: string, _type?: LogType) => { /* noop */ })

    this.state = {
      connected:       true,
      power:           true,
      mode:            0,
      brightness:      204,
      color:           '#ff6b35',
      speed:           5000,
      autoCycle:       false,
      cycleTime:       15,
      audioReactive:   false,
      autoThreshold:   true,
      relThreshold:    1.5,
      offThreshold:    0.5,
      staticThreshold: 512,
      damping:         5,
      battery:         def.hasBattery ? 72 : null,
      current:         0,
      temp:            null,
      manufacturer:    'Hyphae',
      model:           def.type || 'Demo Device',
      firmware:        '1.1.3',
    }

    if (def.hasBattery) {
      this._battInterval = setInterval(() => {
        if (this.state.battery != null && this.state.battery > 0) {
          this.state.battery = +(this.state.battery - 0.1).toFixed(2)
        }
      }, 60_000)
    }

    this._currentInterval = setInterval(() => {
      if (this.state.power && this.state.brightness != null) {
        const b = this.state.brightness / 255
        this.state.current = Math.round(b * def.ledCount * 20 * (0.9 + Math.random() * 0.2))
      } else {
        this.state.current = 0
      }
    }, 2_000)
  }

  // ── IDeviceHandle implementation ──────────────────────────────────────
  async setPower(on: boolean):        Promise<void> { this.state.power          = on;   this._log(`→ POWER: ${on ? 1 : 0}`, 'ok') }
  async setMode(mode: number):        Promise<void> { this.state.mode           = mode; this._log(`→ MODE: ${mode}`, 'ok') }
  async setBrightness(val: number):   Promise<void> { this.state.brightness     = val;  this._log(`→ BRIGHTNESS: ${val}`, 'ok') }
  async setColor(hex: string):        Promise<void> { this.state.color          = hex;  this._log(`→ COLOR: ${hex.replace('#', '').toUpperCase()}`, 'ok') }
  async setSpeed(val: number):        Promise<void> { this.state.speed          = val;  this._log(`→ SPEED: ${val}`, 'ok') }
  async setAutoCycle(on: boolean):    Promise<void> { this.state.autoCycle      = on;   this._log(`→ CYCLE: ${on ? 1 : 0}`, 'ok') }
  async setCycleTime(secs: number):   Promise<void> { this.state.cycleTime      = secs; this._log(`→ CYCLE_TIME: ${secs}`, 'ok') }
  async setAudioReactive(on: boolean):Promise<void> { this.state.audioReactive  = on;   this._log(`→ AUDIO_REACTIVE: ${on ? 1 : 0}`, 'ok') }
  async setAutoThreshold(on: boolean):Promise<void> { this.state.autoThreshold  = on;   this._log(`→ AUTO_THRESHOLD: ${on ? 1 : 0}`, 'ok') }
  async setRelThreshold(v: number):   Promise<void> { this.state.relThreshold   = v;    this._log(`→ REL_THRESHOLD: ${v}`, 'ok') }
  async setOffThreshold(v: number):   Promise<void> { this.state.offThreshold   = v;    this._log(`→ OFF_THRESHOLD: ${v}`, 'ok') }
  async setStaticThreshold(v: number):Promise<void> { this.state.staticThreshold= v;    this._log(`→ STATIC_THRESHOLD: ${v}`, 'ok') }
  async setDamping(val: number):      Promise<void> { this.state.damping        = val;  this._log(`→ DAMPING: ${val}`, 'ok') }
  async syncTime():                   Promise<void> {                                    this._log('→ CURRENT_TIME: synced', 'ok') }

  disconnect(): void {
    this.state.connected = false
    clearInterval(this._battInterval)
    clearInterval(this._currentInterval)
  }
}

/** Build a ConnectResult from a mock def so the store can call _addDevice() */
export function mockConnectResult(def: MockDeviceDef, handle: MockHandle): ConnectResult {
  return {
    id:           def.id,
    name:         def.name,
    type:         def.type,
    hasBattery:   def.hasBattery,
    hasAudio:     def.hasAudio,
    ledCount:     def.ledCount,
    ledType:      def.ledType,
    voltage:      def.voltage,
    battCapMah:   def.battCapMah,
    themeColor:   def.themeColor,
    modelUri:     def.modelUri,
    handle,
    initialState: { ...handle.state } as ConnectResult['initialState'],
  }
}
