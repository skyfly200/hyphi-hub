/**
 * useMock — mock device handles for demo / no-BLE-support fallback
 * Mirrors the DeviceHandle API exactly so the UI doesn't care.
 */

export const MOCK_DEVICES = [
  {
    id: 'mock-desk-strip',
    name: 'Desk Strip',
    type: 'LED Strip',
    hasBattery: false,
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

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

export class MockHandle {
  constructor(def, onLog) {
    this.isMock  = true
    this._log    = onLog || (() => {})
    this._def    = def

    this.state = {
      connected:      true,
      power:          true,
      mode:           0,
      brightness:     204,
      color:          '#ff6b35',
      speed:          5000,
      autoCycle:      false,
      cycleTime:      15,
      audioReactive:  false,
      autoThreshold:  true,
      relThreshold:   1.5,
      offThreshold:   0.5,
      staticThreshold: 512,
      damping:        5,
      battery:        def.hasBattery ? 72 : null,
      current:        0,
      temp:           null,
      manufacturer:   'Hyphae',
      model:          def.type || 'Demo Device',
      firmware:       '1.1.3',
    }

    // Simulate battery drain & current draw for demo realism
    if (def.hasBattery) {
      this._battInterval = setInterval(() => {
        if (this.state.battery > 0) this.state.battery -= 0.1
      }, 60000)
    }
    this._currentInterval = setInterval(() => {
      if (this.state.power) {
        const b = this.state.brightness / 255
        this.state.current = Math.round(b * def.ledCount * 20 * (0.9 + Math.random() * 0.2))
      } else {
        this.state.current = 0
      }
    }, 2000)
  }

  // ── Write stubs (log like real device would) ──────────────────────────
  async setPower(on)           { this.state.power          = on;  this._log(`→ POWER: ${on ? 1 : 0}`, 'ok') }
  async setMode(mode)          { this.state.mode           = mode; this._log(`→ MODE: ${mode}`, 'ok') }
  async setBrightness(val)     { this.state.brightness     = val;  this._log(`→ BRIGHTNESS: ${val}`, 'ok') }
  async setColor(hex)          { this.state.color          = hex;  this._log(`→ COLOR: ${hex.replace('#','').toUpperCase()}`, 'ok') }
  async setSpeed(val)          { this.state.speed          = val;  this._log(`→ SPEED: ${val}`, 'ok') }
  async setAutoCycle(on)       { this.state.autoCycle      = on;   this._log(`→ CYCLE: ${on ? 1 : 0}`, 'ok') }
  async setCycleTime(secs)     { this.state.cycleTime      = secs; this._log(`→ CYCLE_TIME: ${secs}`, 'ok') }
  async setAudioReactive(on)   { this.state.audioReactive  = on;   this._log(`→ AUDIO_REACTIVE: ${on ? 1 : 0}`, 'ok') }
  async setAutoThreshold(on)   { this.state.autoThreshold  = on;   this._log(`→ AUTO_THRESHOLD: ${on ? 1 : 0}`, 'ok') }
  async setRelThreshold(v)     { this.state.relThreshold   = v;    this._log(`→ REL_THRESHOLD: ${v}`, 'ok') }
  async setOffThreshold(v)     { this.state.offThreshold   = v;    this._log(`→ OFF_THRESHOLD: ${v}`, 'ok') }
  async setStaticThreshold(v)  { this.state.staticThreshold= v;    this._log(`→ STATIC_THRESHOLD: ${v}`, 'ok') }
  async setDamping(val)        { this.state.damping        = val;  this._log(`→ DAMPING: ${val}`, 'ok') }
  async syncTime()             { this._log('→ CURRENT_TIME: synced', 'ok') }

  disconnect() {
    this.state.connected = false
    clearInterval(this._battInterval)
    clearInterval(this._currentInterval)
  }
}
