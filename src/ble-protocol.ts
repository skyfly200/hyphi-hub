// ── Hyphi / Smart Sprout BLE Protocol ─────────────────────────────────────
// Derived from ble.h + a_smart_sprout_BLE_methods.ino
// All UUIDs are lowercase to match Web Bluetooth API expectations.

// ── Service UUIDs ─────────────────────────────────────────────────────────
export const BATTERY_SERVICE_UUID          = '0000180f-0000-1000-8000-00805f9b34fb' as const
export const DEVICE_INFO_SERVICE_UUID      = '0000180a-0000-1000-8000-00805f9b34fb' as const
export const CURRENT_TIME_SERVICE_UUID     = '00001805-0000-1000-8000-00805f9b34fb' as const
export const ENV_SENSE_SERVICE_UUID        = '0000181a-0000-1000-8000-00805f9b34fb' as const
export const LED_SERVICE_UUID              = 'f82d2279-9f54-4851-8394-377d54fb99bb' as const
export const METADATA_SERVICE_UUID         = 'ff391b43-ea80-456a-add4-eb9091a69163' as const

// ── Standard characteristic UUIDs ─────────────────────────────────────────
export const BATT_LVL_CHAR_UUID            = '00002a19-0000-1000-8000-00805f9b34fb' as const
export const TEMP_CHAR_UUID                = '00002a6e-0000-1000-8000-00805f9b34fb' as const
export const MANUFACTURER_CHAR_UUID        = '00002a29-0000-1000-8000-00805f9b34fb' as const
export const MODEL_CHAR_UUID               = '00002a24-0000-1000-8000-00805f9b34fb' as const
export const FIRMWARE_CHAR_UUID            = '00002a26-0000-1000-8000-00805f9b34fb' as const
export const CURRENT_TIME_CHAR_UUID        = '00002a2b-0000-1000-8000-00805f9b34fb' as const

// ── Metadata characteristic UUIDs ─────────────────────────────────────────
export const META_INDEX_CHAR_UUID          = '6b76ea09-a6e5-4163-b68b-334dcee19e78' as const
export const META_POWER_CHAR_UUID          = 'dc54c9a7-2ec7-40d1-bfae-44b0188e72e8' as const
export const META_LIGHTS_CHAR_UUID         = 'e5dff126-6106-4744-94e5-85b577e66f77' as const
export const META_AUDIO_CHAR_UUID          = '1162e818-a062-426f-ac23-a53173b1b6cf' as const
export const META_SENSORS_CHAR_UUID        = '95fdc978-217e-45d2-bc4d-95d8320617f9' as const
export const META_PROFILE_CHAR_UUID        = '0aaa858d-a11b-4de0-bae6-323db9d0ae16' as const

// ── LED control characteristic UUIDs ──────────────────────────────────────
export const LED_RESET_CHAR_UUID           = 'c97a62b4-5e3d-4f89-b001-6789abcdef01' as const
export const LED_POWER_CHAR_UUID           = 'fd5897ee-c402-4260-a6dc-f3d7b109d724' as const
export const LED_MODE_CHAR_UUID            = 'a96427ff-5f18-4a83-be0a-0a9a5ab91f13' as const
export const LED_BRIGHT_CHAR_UUID          = '74c294a1-a211-4ac5-adfa-18b574f26239' as const
export const LED_COLOR_CHAR_UUID           = 'ce634504-106b-4ce3-b29e-de0de1591b8f' as const
export const LED_SPEED_CHAR_UUID           = '4ff03862-869e-4a77-aeb7-cda7eff0ea61' as const
export const LED_CYCLE_CHAR_UUID           = 'd0c28dc7-cede-4b8c-a71c-ade915afa38f' as const
export const LED_CYCLE_TIME_CHAR_UUID      = '56d73e7f-9dcc-408f-bcad-68a763d8f6f0' as const
export const LED_CURRENT_CHAR_UUID         = '44c9c81f-5293-4911-9eb1-d0f2a18a04c6' as const
export const AUDIO_REACTIVE_CHAR_UUID      = '2264ea6f-d67b-45ac-8b95-5ee3f4a9c57e' as const
export const AUDIO_THRESH_AUTO_CHAR_UUID   = 'f752b4c4-8ea8-4461-8935-10df5467ef25' as const
export const AUDIO_THRESH_REL_CHAR_UUID    = 'db034f32-31d8-4c83-b768-a32d0ef04b32' as const
export const AUDIO_THRESH_OFF_CHAR_UUID    = 'd72345e3-e7bb-4e1e-a121-970cd44a6768' as const
export const AUDIO_THRESH_STATIC_CHAR_UUID = 'e0975faf-6888-4a83-b148-a7132b877627' as const
export const AUDIO_DAMPING_CHAR_UUID       = '5aeae22f-bbef-4b06-b54a-7e95eedc12d4' as const
export const BUTTON_ADVANCE_CHAR_UUID      = 'cc07600f-11a3-4e5a-bc42-88f52aeddc68' as const

// ── Domain types ──────────────────────────────────────────────────────────

/** Map of logical char names to their GATT characteristic objects */
export type CharMap = Partial<Record<CharKey, BluetoothRemoteGATTCharacteristic>>

export type CharKey =
  | 'power' | 'mode' | 'brightness' | 'color' | 'speed'
  | 'cycle' | 'cycleTime' | 'current'
  | 'audioReactive' | 'autoThreshold' | 'relThreshold'
  | 'offThreshold' | 'staticThreshold' | 'damping' | 'btnAdvance'
  | 'battLevel' | 'temp' | 'manufacturer' | 'model' | 'firmware' | 'currentTime'
  | 'reset'

export interface DeviceMeta {
  index:   string[] | null
  power:   { type?: string; cap?: number; io?: string; v?: number } | null
  lights:  { qty?: number; type?: string; pin?: number } | null
  audio:   { type?: string; fft?: number } | null
  sensors: { audio?: boolean; mic?: string; motion?: boolean } | null
  profile: { img?: string; ui?: string; theme?: string } | null
}

/** Live state synced from device (BLE reads + notifications) */
export interface DeviceState {
  connected:       boolean
  power:           boolean
  mode:            number
  brightness:      number
  color:           string   // '#rrggbb'
  color2:          string   // UI-only (multi-colour effects)
  color3:          string   // UI-only
  speed:           number   // ms, uint32
  autoCycle:       boolean
  cycleTime:       number   // seconds
  battery:         number | null
  audioReactive:   boolean
  autoThreshold:   boolean
  relThreshold:    number
  offThreshold:    number
  staticThreshold: number
  damping:         number
  current:         number   // mA
  temp:            number | null  // °C
  gamma:           number   // UI-only
  manufacturer:    string
  model:           string
  firmware:        string
}

/** Static device capabilities and identity */
export interface DeviceInfo {
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

/** Result returned from connectDevice() / connectMock() */
export interface ConnectResult {
  id:           string
  name:         string
  type:         string
  hasBattery:   boolean
  hasAudio:     boolean
  ledCount:     number
  ledType:      string
  voltage:      number
  battCapMah:   number | null
  themeColor:   string
  modelUri?:    string | null
  handle:       IDeviceHandle
  initialState: Omit<DeviceState, 'color2' | 'color3' | 'gamma'>
}

/** Common interface that both DeviceHandle and MockHandle must satisfy */
export interface IDeviceHandle {
  isMock:  boolean
  state:   Partial<DeviceState>   // mutable, updated by notifications
  setPower(on: boolean): Promise<void>
  setMode(mode: number): Promise<void>
  setBrightness(val: number): Promise<void>
  setColor(hex: string): Promise<void>
  setSpeed(val: number): Promise<void>
  setAutoCycle(on: boolean): Promise<void>
  setCycleTime(secs: number): Promise<void>
  setAudioReactive(on: boolean): Promise<void>
  setAutoThreshold(on: boolean): Promise<void>
  setRelThreshold(val: number): Promise<void>
  setOffThreshold(val: number): Promise<void>
  setStaticThreshold(val: number): Promise<void>
  setDamping(val: number): Promise<void>
  syncTime(): Promise<void>
  reset(): Promise<void>
  disconnect(): void
}

export type LogType = 'info' | 'ok' | 'err'
export type LogFn   = (msg: string, type?: LogType) => void

// ── Wire-format encoders ──────────────────────────────────────────────────

/** Color: 6-char uppercase hex string as UTF-8 bytes — e.g. "FF6B35" */
export function encodeColor(hex: string): Uint8Array {
  const str = hex.replace('#', '').toUpperCase().padStart(6, '0').slice(0, 6)
  return new TextEncoder().encode(str)
}

/** Speed: uint32 little-endian (ms per segment) */
export function encodeSpeed(value: number): Uint8Array {
  const buf = new ArrayBuffer(4)
  new DataView(buf).setUint32(0, value >>> 0, true)
  return new Uint8Array(buf)
}

/** Cycle time: ASCII decimal string */
export function encodeCycleTime(seconds: number): Uint8Array {
  return new TextEncoder().encode(String(seconds))
}

/** Float thresholds: ASCII decimal string */
export function encodeFloat(val: number): Uint8Array {
  return new TextEncoder().encode(parseFloat(val.toString()).toFixed(4))
}

/** Single uint8 (power, mode, brightness, cycle, audioReactive, etc.) */
export function encodeByte(val: number): Uint8Array {
  return new Uint8Array([val & 0xff])
}

/**
 * Current time: 10-byte packed struct
 * [year_lo, year_hi, month, day, hour, min, sec, weekday, frac256, adjust]
 */
export function encodeCurrentTime(date: Date = new Date()): Uint8Array {
  const buf = new Uint8Array(10)
  const dv  = new DataView(buf.buffer)
  dv.setUint16(0, date.getFullYear(), true)
  buf[2] = date.getMonth() + 1
  buf[3] = date.getDate()
  buf[4] = date.getHours()
  buf[5] = date.getMinutes()
  buf[6] = date.getSeconds()
  buf[7] = date.getDay() === 0 ? 7 : date.getDay()  // ISO weekday Mon=1
  buf[8] = Math.round((date.getMilliseconds() / 1000) * 256)
  buf[9] = 0  // adjust reason
  return buf
}

// ── Wire-format decoders ──────────────────────────────────────────────────

export function decodeString(dv: DataView): string {
  return new TextDecoder().decode(dv)
}

export function decodeUint8(dv: DataView): number {
  return dv.getUint8(0)
}

/** Temperature: int16, unit 0.01 °C */
export function decodeInt16(dv: DataView): number {
  return dv.getInt16(0, true) / 100
}

/** Current: 8-byte ASCII decimal mA string */
export function decodeCurrent(dv: DataView): number {
  try { return parseFloat(new TextDecoder().decode(dv)) } catch { return 0 }
}

/** Speed: little-endian uint32 */
export function decodeSpeed(dv: DataView | null): number {
  if (!dv || dv.byteLength < 4) return 5000
  return dv.getUint32(0, true)
}
