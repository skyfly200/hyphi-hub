// ── Hyphi / Smart Sprout BLE Protocol ─────────────────────────────────────
// Derived from ble.h + a_smart_sprout_BLE_methods.ino
// All UUIDs are lowercase to match Web Bluetooth API expectations.

// Standard services
export const BATTERY_SERVICE_UUID         = '0000180f-0000-1000-8000-00805f9b34fb'
export const DEVICE_INFO_SERVICE_UUID     = '0000180a-0000-1000-8000-00805f9b34fb'
export const CURRENT_TIME_SERVICE_UUID    = '00001805-0000-1000-8000-00805f9b34fb'
export const ENV_SENSE_SERVICE_UUID       = '0000181a-0000-1000-8000-00805f9b34fb'

// Custom services
export const LED_SERVICE_UUID             = 'f82d2279-9f54-4851-8394-377d54fb99bb'
export const METADATA_SERVICE_UUID        = 'ff391b43-ea80-456a-add4-eb9091a69163'

// Standard characteristics
export const BATT_LVL_CHAR_UUID           = '00002a19-0000-1000-8000-00805f9b34fb'
export const TEMP_CHAR_UUID               = '00002a6e-0000-1000-8000-00805f9b34fb'
export const MANUFACTURER_CHAR_UUID       = '00002a29-0000-1000-8000-00805f9b34fb'
export const MODEL_CHAR_UUID              = '00002a24-0000-1000-8000-00805f9b34fb'
export const FIRMWARE_CHAR_UUID           = '00002a26-0000-1000-8000-00805f9b34fb'
export const CURRENT_TIME_CHAR_UUID       = '00002a2b-0000-1000-8000-00805f9b34fb'

// Metadata characteristics
export const META_INDEX_CHAR_UUID         = '6b76ea09-a6e5-4163-b68b-334dcee19e78'
export const META_POWER_CHAR_UUID         = 'dc54c9a7-2ec7-40d1-bfae-44b0188e72e8'
export const META_LIGHTS_CHAR_UUID        = 'e5dff126-6106-4744-94e5-85b577e66f77'
export const META_AUDIO_CHAR_UUID         = '1162e818-a062-426f-ac23-a53173b1b6cf'
export const META_SENSORS_CHAR_UUID       = '95fdc978-217e-45d2-bc4d-95d8320617f9'
export const META_PROFILE_CHAR_UUID       = '0aaa858d-a11b-4de0-bae6-323db9d0ae16'

// LED control characteristics
export const LED_POWER_CHAR_UUID          = 'fd5897ee-c402-4260-a6dc-f3d7b109d724'
export const LED_MODE_CHAR_UUID           = 'a96427ff-5f18-4a83-be0a-0a9a5ab91f13'
export const LED_BRIGHT_CHAR_UUID         = '74c294a1-a211-4ac5-adfa-18b574f26239'
export const LED_COLOR_CHAR_UUID          = 'ce634504-106b-4ce3-b29e-de0de1591b8f'
export const LED_SPEED_CHAR_UUID          = '4ff03862-869e-4a77-aeb7-cda7eff0ea61'
export const LED_CYCLE_CHAR_UUID          = 'd0c28dc7-cede-4b8c-a71c-ade915afa38f'
export const LED_CYCLE_TIME_CHAR_UUID     = '56d73e7f-9dcc-408f-bcad-68a763d8f6f0'
export const LED_CURRENT_CHAR_UUID        = '44c9c81f-5293-4911-9eb1-d0f2a18a04c6'
export const AUDIO_REACTIVE_CHAR_UUID     = '2264ea6f-d67b-45ac-8b95-5ee3f4a9c57e'
export const AUDIO_THRESH_AUTO_CHAR_UUID  = 'f752b4c4-8ea8-4461-8935-10df5467ef25'
export const AUDIO_THRESH_REL_CHAR_UUID   = 'db034f32-31d8-4c83-b768-a32d0ef04b32'
export const AUDIO_THRESH_OFF_CHAR_UUID   = 'd72345e3-e7bb-4e1e-a121-970cd44a6768'
export const AUDIO_THRESH_STATIC_CHAR_UUID= 'e0975faf-6888-4a83-b148-a7132b877627'
export const AUDIO_DAMPING_CHAR_UUID      = '5aeae22f-bbef-4b06-b54a-7e95eedc12d4'
export const BUTTON_ADVANCE_CHAR_UUID     = 'cc07600f-11a3-4e5a-bc42-88f52aeddc68'

// ── Wire-format encoders ───────────────────────────────────────────────────
// color: 6-char uppercase hex string as UTF-8 bytes  e.g. "FF6B35"
export function encodeColor(hex) {
  const str = hex.replace('#', '').toUpperCase().padStart(6, '0').slice(0, 6)
  return new TextEncoder().encode(str)
}

// speed: uint32 little-endian (firmware maps 0–65535 ms segment time → lower = faster)
export function encodeSpeed(value) {
  const buf = new ArrayBuffer(4)
  new DataView(buf).setUint32(0, value >>> 0, true)
  return new Uint8Array(buf)
}

// cycleTime: ASCII decimal string
export function encodeCycleTime(seconds) {
  return new TextEncoder().encode(String(seconds))
}

// float thresholds: ASCII decimal string
export function encodeFloat(val) {
  return new TextEncoder().encode(String(parseFloat(val).toFixed(4)))
}

// uint8 byte (power, mode, brightness, cycle, audioReactive, autoThreshold, damping)
export function encodeByte(val) {
  return new Uint8Array([val & 0xff])
}

// currentTime: 10-byte packed struct
// [year_lo, year_hi, month, day, hour, min, sec, weekday, frac256, adjust]
export function encodeCurrentTime(date = new Date()) {
  const buf = new Uint8Array(10)
  const dv = new DataView(buf.buffer)
  dv.setUint16(0, date.getFullYear(), true)
  buf[2] = date.getMonth() + 1
  buf[3] = date.getDate()
  buf[4] = date.getHours()
  buf[5] = date.getMinutes()
  buf[6] = date.getSeconds()
  buf[7] = date.getDay() === 0 ? 7 : date.getDay() // ISO weekday (Mon=1)
  buf[8] = Math.round((date.getMilliseconds() / 1000) * 256)
  buf[9] = 0 // adjust reason
  return buf
}

// ── Wire-format decoders ───────────────────────────────────────────────────
export function decodeString(dataView) {
  return new TextDecoder().decode(dataView)
}

export function decodeUint8(dataView) {
  return dataView.getUint8(0)
}

export function decodeInt16(dataView) {
  // Temperature: int16, unit 0.01 °C
  return dataView.getInt16(0, true) / 100
}

export function decodeCurrent(dataView) {
  // 8-byte current notification — treat as ASCII decimal mA string
  try { return parseFloat(new TextDecoder().decode(dataView)) } catch { return 0 }
}
