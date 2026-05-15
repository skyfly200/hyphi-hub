/**
 * useWLED — WiFi composable for WLED devices
 *
 * Connects to WLED LED controllers over HTTP using the WLED JSON API.
 * https://kno.wled.ge/interfaces/json-api/
 */

import type { IDeviceHandle, DeviceState, ConnectResult, LogFn } from '@/ble-protocol'

// ── WLED API response shapes ──────────────────────────────────────────────

interface WLEDInfo {
  ver:      string
  name:     string
  mac:      string
  ip:       string
  brand?:   string
  product?: string
  leds: {
    count:  number
    pwr:    number
    maxpwr: number
    rgbw:   boolean
  }
  fxcount:  number
  palcount: number
}

interface WLEDSegment {
  col: [number, number, number][]
  fx:  number
  sx:  number
  ix:  number
  pal: number
  on:  boolean
}

interface WLEDStateJSON {
  on:  boolean
  bri: number
  seg: WLEDSegment[]
}

// ── Colour conversion helpers ─────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').padStart(6, '0')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

// WLED effect speed (sx 0–255) ↔ app speed (ms 500–20 000)
// Higher sx → faster effect → fewer ms
function sxToMs(sx: number): number {
  return Math.round(500 + (255 - Math.max(0, Math.min(255, sx))) / 255 * (20000 - 500))
}

function msToSx(ms: number): number {
  return Math.round(255 - (Math.max(500, Math.min(20000, ms)) - 500) / (20000 - 500) * 255)
}

// ── WLEDHandle ────────────────────────────────────────────────────────────

export class WLEDHandle implements IDeviceHandle {
  readonly isMock = false
  readonly ip: string
  state: Partial<DeviceState>
  private _pollTimer: ReturnType<typeof setInterval> | null = null

  constructor(ip: string, initialState: Partial<DeviceState>) {
    this.ip    = ip
    this.state = { ...initialState }
    this._startPolling()
  }

  private get _base(): string { return `http://${this.ip}` }

  private async _post(body: object): Promise<void> {
    const res = await fetch(`${this._base}/json/state`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`WLED POST failed: HTTP ${res.status}`)
  }

  private _startPolling(): void {
    this._pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`${this._base}/json/state`)
        if (!res.ok) { this.state.connected = false; return }
        const data: WLEDStateJSON = await res.json()
        this.state.connected  = true
        this.state.power      = data.on
        this.state.brightness = data.bri
        const seg = data.seg?.[0]
        if (seg) {
          const col = seg.col?.[0]
          if (col) this.state.color = rgbToHex(col[0], col[1], col[2])
          this.state.mode  = seg.fx
          this.state.speed = sxToMs(seg.sx)
        }
      } catch {
        this.state.connected = false
      }
    }, 5_000)
  }

  // ── IDeviceHandle implementation ─────────────────────────────────────────

  async setPower(on: boolean): Promise<void> {
    this.state.power = on
    await this._post({ on })
  }

  async setBrightness(val: number): Promise<void> {
    this.state.brightness = val
    await this._post({ bri: val })
  }

  async setColor(hex: string): Promise<void> {
    this.state.color = hex
    const [r, g, b] = hexToRgb(hex)
    await this._post({ seg: [{ col: [[r, g, b]] }] })
  }

  async setMode(mode: number): Promise<void> {
    this.state.mode = mode
    await this._post({ seg: [{ fx: mode }] })
  }

  async setSpeed(ms: number): Promise<void> {
    this.state.speed = ms
    await this._post({ seg: [{ sx: msToSx(ms) }] })
  }

  // WLED JSON API has no direct equivalents for the controls below
  async setAutoCycle(_on: boolean):        Promise<void> {}
  async setCycleTime(_secs: number):       Promise<void> {}
  async setAudioReactive(_on: boolean):    Promise<void> {}
  async setAutoThreshold(_on: boolean):    Promise<void> {}
  async setRelThreshold(_val: number):     Promise<void> {}
  async setOffThreshold(_val: number):     Promise<void> {}
  async setStaticThreshold(_val: number):  Promise<void> {}
  async setDamping(_val: number):          Promise<void> {}
  async syncTime():                        Promise<void> {}

  disconnect(): void {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null }
    this.state.connected = false
  }
}

// ── connectWLED ───────────────────────────────────────────────────────────

export async function connectWLED(ip: string, onLog?: LogFn): Promise<ConnectResult | null> {
  const log: LogFn = onLog ?? (() => {})
  const base = `http://${ip.trim()}`

  log(`Connecting to WLED at ${ip}…`, 'info')

  let info:       WLEDInfo
  let wledState:  WLEDStateJSON

  try {
    const [infoRes, stateRes] = await Promise.all([
      fetch(`${base}/json/info`),
      fetch(`${base}/json/state`),
    ])
    if (!infoRes.ok)  throw new Error(`/json/info returned HTTP ${infoRes.status}`)
    if (!stateRes.ok) throw new Error(`/json/state returned HTTP ${stateRes.status}`)
    info      = await infoRes.json()
    wledState = await stateRes.json()
  } catch (err) {
    log(`Cannot reach WLED device: ${(err as Error).message}`, 'err')
    return null
  }

  log(`Found: ${info.name} · WLED ${info.ver}`, 'ok')
  log(`LEDs: ${info.leds.count}× ${info.leds.rgbw ? 'RGBW' : 'RGB'}  ·  ${info.fxcount} effects`, 'ok')

  const seg = wledState.seg?.[0]
  const col = seg?.col?.[0] ?? [255, 107, 53]

  const initialState: Omit<DeviceState, 'color2' | 'color3' | 'gamma'> = {
    connected:       true,
    power:           wledState.on,
    brightness:      wledState.bri,
    color:           rgbToHex(col[0], col[1], col[2]),
    mode:            seg?.fx  ?? 0,
    speed:           sxToMs(seg?.sx ?? 128),
    autoCycle:       false,
    cycleTime:       15,
    battery:         null,
    audioReactive:   false,
    autoThreshold:   true,
    relThreshold:    1.5,
    offThreshold:    0.5,
    staticThreshold: 512,
    damping:         5,
    current:         0,
    temp:            null,
    manufacturer:    info.brand   ?? 'WLED',
    model:           info.product ?? info.ver,
    firmware:        info.ver,
  }

  const handle = new WLEDHandle(ip.trim(), { ...initialState })

  return {
    id:         `wled-${ip.trim()}`,
    name:       info.name,
    type:       'wled',
    hasBattery: false,
    hasAudio:   false,
    ledCount:   info.leds.count,
    ledType:    info.leds.rgbw ? 'RGBW' : 'RGB',
    voltage:    5,
    battCapMah: null,
    themeColor: '#3dffc0',
    handle,
    initialState,
  }
}
