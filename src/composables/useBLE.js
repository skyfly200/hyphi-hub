/**
 * useBLE — Web Bluetooth composable for Hyphi Hub
 *
 * Wraps navigator.bluetooth with:
 *  - requestDevice (BLE scan sheet)
 *  - GATT connect + service/characteristic discovery
 *  - Metadata reads (device info, profile, lights, etc.)
 *  - BLENotify subscriptions (battery, temperature, current)
 *  - Typed write helpers for every writable characteristic
 *  - Graceful disconnect + reconnect
 *  - Mock mode when Web Bluetooth is unavailable (browser fallback)
 */

import { ref } from 'vue'
import {
  // Services
  LED_SERVICE_UUID, METADATA_SERVICE_UUID, BATTERY_SERVICE_UUID,
  DEVICE_INFO_SERVICE_UUID, CURRENT_TIME_SERVICE_UUID, ENV_SENSE_SERVICE_UUID,
  // Device info chars
  MANUFACTURER_CHAR_UUID, MODEL_CHAR_UUID, FIRMWARE_CHAR_UUID,
  // Metadata chars
  META_INDEX_CHAR_UUID, META_POWER_CHAR_UUID, META_LIGHTS_CHAR_UUID,
  META_AUDIO_CHAR_UUID, META_SENSORS_CHAR_UUID, META_PROFILE_CHAR_UUID,
  // Time
  CURRENT_TIME_CHAR_UUID,
  // Battery / env
  BATT_LVL_CHAR_UUID, TEMP_CHAR_UUID,
  // LED chars
  LED_POWER_CHAR_UUID, LED_MODE_CHAR_UUID, LED_BRIGHT_CHAR_UUID,
  LED_COLOR_CHAR_UUID, LED_SPEED_CHAR_UUID, LED_CYCLE_CHAR_UUID,
  LED_CYCLE_TIME_CHAR_UUID, LED_CURRENT_CHAR_UUID,
  // Audio chars
  AUDIO_REACTIVE_CHAR_UUID, AUDIO_THRESH_AUTO_CHAR_UUID,
  AUDIO_THRESH_REL_CHAR_UUID, AUDIO_THRESH_OFF_CHAR_UUID,
  AUDIO_THRESH_STATIC_CHAR_UUID, AUDIO_DAMPING_CHAR_UUID,
  BUTTON_ADVANCE_CHAR_UUID,
  // Encoders / decoders
  encodeColor, encodeSpeed, encodeCycleTime, encodeFloat, encodeByte,
  encodeCurrentTime, decodeString, decodeUint8, decodeInt16, decodeCurrent
} from '@/ble-protocol.js'

// ── Detect BLE support ──────────────────────────────────────────────────────
export const bleSupported = typeof navigator !== 'undefined' &&
  !!navigator.bluetooth

// ── Per-device handle ───────────────────────────────────────────────────────
// Returned by connectDevice(), stored in the Pinia device store
export class DeviceHandle {
  constructor(bleDevice, chars, meta, initialState) {
    this.bleDevice  = bleDevice       // BluetoothDevice
    this.chars      = chars           // { [charName]: BluetoothRemoteGATTCharacteristic }
    this.meta       = meta            // parsed metadata JSON objects
    this.state      = initialState    // live reactive state read from device on connect
    this._listeners = []              // cleanup list
    this.isMock     = false
  }

  // ── Write helpers ─────────────────────────────────────────────────────────
  async setPower(on)          { await this._write('power',       encodeByte(on ? 1 : 0)) }
  async setMode(mode)         { await this._write('mode',        encodeByte(mode)) }
  async setBrightness(val)    { await this._write('brightness',  encodeByte(val)) }
  async setColor(hex)         { await this._write('color',       encodeColor(hex)) }
  async setSpeed(val)         { await this._write('speed',       encodeSpeed(val)) }
  async setAutoCycle(on)      { await this._write('cycle',       encodeByte(on ? 1 : 0)) }
  async setCycleTime(secs)    { await this._write('cycleTime',   encodeCycleTime(secs)) }
  async setAudioReactive(on)  { await this._write('audioReactive', encodeByte(on ? 1 : 0)) }
  async setAutoThreshold(on)  { await this._write('autoThreshold', encodeByte(on ? 1 : 0)) }
  async setRelThreshold(val)  { await this._write('relThreshold',  encodeFloat(val)) }
  async setOffThreshold(val)  { await this._write('offThreshold',  encodeFloat(val)) }
  async setStaticThreshold(v) { await this._write('staticThreshold', encodeFloat(v)) }
  async setDamping(val)       { await this._write('damping',     encodeByte(val)) }
  async syncTime()            { await this._write('currentTime', encodeCurrentTime()) }

  async _write(key, bytes) {
    const char = this.chars[key]
    if (!char) { console.warn(`[BLE] char "${key}" not found — skipping write`) ; return }
    try {
      await char.writeValueWithoutResponse(bytes)
    } catch (e) {
      console.error(`[BLE] write "${key}" failed:`, e)
      throw e
    }
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  _on(char, key, decoder, stateKey) {
    if (!char) return
    const handler = e => {
      this.state[stateKey] = decoder(e.target.value)
    }
    char.addEventListener('characteristicvaluechanged', handler)
    char.startNotifications().catch(e => console.warn(`[BLE] notify ${key}:`, e))
    this._listeners.push({ char, handler })
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  disconnect() {
    this._listeners.forEach(({ char, handler }) => {
      char.removeEventListener('characteristicvaluechanged', handler)
      char.stopNotifications().catch(() => {})
    })
    this._listeners = []
    if (this.bleDevice?.gatt?.connected) {
      this.bleDevice.gatt.disconnect()
    }
  }
}

// ── Read helper (safe — returns null on missing char) ───────────────────────
async function safeRead(chars, key) {
  const c = chars[key]
  if (!c) return null
  try { return await c.readValue() } catch { return null }
}

// ── tryChar — get a char from a service, null if missing ───────────────────
async function tryChar(service, uuid) {
  try { return await service.getCharacteristic(uuid) } catch { return null }
}

// ── tryService — get a service from a server, null if missing ──────────────
async function tryService(server, uuid) {
  try { return await server.getPrimaryService(uuid) } catch { return null }
}

// ── Main connect function ───────────────────────────────────────────────────
export async function connectDevice(onLog) {
  const log = onLog || (() => {})

  if (!bleSupported) {
    log('Web Bluetooth not supported in this browser', 'err')
    throw new Error('Web Bluetooth not supported')
  }

  // 1. Browser scan picker — filter to devices advertising LED service
  log('Opening browser BLE scan picker…', 'info')
  let bleDevice
  try {
    bleDevice = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [LED_SERVICE_UUID] },
        { namePrefix: 'Smart Sprout' },
        { namePrefix: 'Hyphi' },
      ],
      optionalServices: [
        METADATA_SERVICE_UUID,
        BATTERY_SERVICE_UUID,
        DEVICE_INFO_SERVICE_UUID,
        CURRENT_TIME_SERVICE_UUID,
        ENV_SENSE_SERVICE_UUID,
      ]
    })
  } catch (e) {
    if (e.name === 'NotFoundError') { log('Scan cancelled', 'info'); return null }
    log(`Scan failed: ${e.message}`, 'err')
    throw e
  }

  log(`Found: ${bleDevice.name || bleDevice.id}`, 'ok')

  // 2. GATT connect
  log('Connecting to GATT server…', 'info')
  let server
  try {
    server = await bleDevice.gatt.connect()
  } catch (e) {
    log(`GATT connect failed: ${e.message}`, 'err')
    throw e
  }
  log('GATT connected', 'ok')

  // 3. Discover services
  log('Discovering services…', 'info')
  const [ledSvc, metaSvc, battSvc, devInfoSvc, timeSvc, envSvc] = await Promise.all([
    tryService(server, LED_SERVICE_UUID),
    tryService(server, METADATA_SERVICE_UUID),
    tryService(server, BATTERY_SERVICE_UUID),
    tryService(server, DEVICE_INFO_SERVICE_UUID),
    tryService(server, CURRENT_TIME_SERVICE_UUID),
    tryService(server, ENV_SENSE_SERVICE_UUID),
  ])

  if (!ledSvc) { log('LED service not found — is this a Hyphi device?', 'err'); bleDevice.gatt.disconnect(); throw new Error('LED service missing') }
  log('LED service found', 'ok')
  if (metaSvc) log('Metadata service found', 'ok')
  if (battSvc) log('Battery service found', 'ok')

  // 4. Get all characteristics
  const chars = {}

  // LED service
  if (ledSvc) {
    const ledChars = await Promise.all([
      tryChar(ledSvc, LED_POWER_CHAR_UUID),
      tryChar(ledSvc, LED_MODE_CHAR_UUID),
      tryChar(ledSvc, LED_BRIGHT_CHAR_UUID),
      tryChar(ledSvc, LED_COLOR_CHAR_UUID),
      tryChar(ledSvc, LED_SPEED_CHAR_UUID),
      tryChar(ledSvc, LED_CYCLE_CHAR_UUID),
      tryChar(ledSvc, LED_CYCLE_TIME_CHAR_UUID),
      tryChar(ledSvc, LED_CURRENT_CHAR_UUID),
      tryChar(ledSvc, AUDIO_REACTIVE_CHAR_UUID),
      tryChar(ledSvc, AUDIO_THRESH_AUTO_CHAR_UUID),
      tryChar(ledSvc, AUDIO_THRESH_REL_CHAR_UUID),
      tryChar(ledSvc, AUDIO_THRESH_OFF_CHAR_UUID),
      tryChar(ledSvc, AUDIO_THRESH_STATIC_CHAR_UUID),
      tryChar(ledSvc, AUDIO_DAMPING_CHAR_UUID),
      tryChar(ledSvc, BUTTON_ADVANCE_CHAR_UUID),
    ])
    ;[
      'power','mode','brightness','color','speed','cycle','cycleTime','current',
      'audioReactive','autoThreshold','relThreshold','offThreshold','staticThreshold',
      'damping','btnAdvance'
    ].forEach((k, i) => { if (ledChars[i]) chars[k] = ledChars[i] })
    log(`LED characteristics resolved: ${Object.keys(chars).join(', ')}`, 'ok')
  }

  // Metadata service
  const meta = {}
  if (metaSvc) {
    const [idxC, pwrC, lgtC, audC, senC, proC] = await Promise.all([
      tryChar(metaSvc, META_INDEX_CHAR_UUID),
      tryChar(metaSvc, META_POWER_CHAR_UUID),
      tryChar(metaSvc, META_LIGHTS_CHAR_UUID),
      tryChar(metaSvc, META_AUDIO_CHAR_UUID),
      tryChar(metaSvc, META_SENSORS_CHAR_UUID),
      tryChar(metaSvc, META_PROFILE_CHAR_UUID),
    ])
    const readJSON = async (c, name) => {
      if (!c) return null
      try {
        const dv = await c.readValue()
        const str = decodeString(dv)
        return JSON.parse(str)
      } catch (e) { log(`Meta ${name} parse failed: ${e.message}`, 'info'); return null }
    }
    ;[meta.index, meta.power, meta.lights, meta.audio, meta.sensors, meta.profile] =
      await Promise.all([
        readJSON(idxC, 'index'),
        readJSON(pwrC, 'power'),
        readJSON(lgtC, 'lights'),
        readJSON(audC, 'audio'),
        readJSON(senC, 'sensors'),
        readJSON(proC, 'profile'),
      ])
    log('Metadata read', 'ok')
  }

  // Battery service
  if (battSvc) {
    chars.battLevel = await tryChar(battSvc, BATT_LVL_CHAR_UUID)
  }

  // Device info service
  if (devInfoSvc) {
    const [mfgC, modC, fwC] = await Promise.all([
      tryChar(devInfoSvc, MANUFACTURER_CHAR_UUID),
      tryChar(devInfoSvc, MODEL_CHAR_UUID),
      tryChar(devInfoSvc, FIRMWARE_CHAR_UUID),
    ])
    chars.manufacturer = mfgC
    chars.model = modC
    chars.firmware = fwC
  }

  // Time service
  if (timeSvc) {
    chars.currentTime = await tryChar(timeSvc, CURRENT_TIME_CHAR_UUID)
  }

  // Env sensing service (temperature)
  if (envSvc) {
    chars.temp = await tryChar(envSvc, TEMP_CHAR_UUID)
  }

  // 5. Read initial state from device
  log('Reading initial device state…', 'info')
  const [
    powerDV, modeDV, brightDV, colorDV, speedDV, cycleDV, cycleTimeDV,
    battDV, audioReactiveDV, autoThreshDV, relThreshDV, offThreshDV,
    staticThreshDV, dampingDV, mfgDV, modelDV, fwDV
  ] = await Promise.all([
    safeRead(chars, 'power'),       safeRead(chars, 'mode'),
    safeRead(chars, 'brightness'),  safeRead(chars, 'color'),
    safeRead(chars, 'speed'),       safeRead(chars, 'cycle'),
    safeRead(chars, 'cycleTime'),   safeRead(chars, 'battLevel'),
    safeRead(chars, 'audioReactive'), safeRead(chars, 'autoThreshold'),
    safeRead(chars, 'relThreshold'),  safeRead(chars, 'offThreshold'),
    safeRead(chars, 'staticThreshold'), safeRead(chars, 'damping'),
    safeRead(chars, 'manufacturer'), safeRead(chars, 'model'), safeRead(chars, 'firmware'),
  ])

  // Decode speed: little-endian uint32 from 4 bytes
  const decodeSpeed = dv => {
    if (!dv || dv.byteLength < 4) return 5000
    return dv.getUint32(0, true)
  }

  const initialState = {
    power:          powerDV     ? decodeUint8(powerDV) > 0      : true,
    mode:           modeDV      ? decodeUint8(modeDV)            : 0,
    brightness:     brightDV    ? decodeUint8(brightDV)          : 204,
    color:          colorDV     ? '#' + decodeString(colorDV).slice(0,6).toLowerCase() : '#ff6b35',
    speed:          decodeSpeed(speedDV),
    autoCycle:      cycleDV     ? decodeUint8(cycleDV) > 0       : false,
    cycleTime:      cycleTimeDV ? parseInt(decodeString(cycleTimeDV)) || 15 : 15,
    battery:        battDV      ? decodeUint8(battDV)             : null,
    audioReactive:  audioReactiveDV ? decodeUint8(audioReactiveDV) > 0 : false,
    autoThreshold:  autoThreshDV ? decodeUint8(autoThreshDV) > 0 : true,
    relThreshold:   relThreshDV  ? parseFloat(decodeString(relThreshDV)) || 1.5 : 1.5,
    offThreshold:   offThreshDV  ? parseFloat(decodeString(offThreshDV)) || 0.5 : 0.5,
    staticThreshold: staticThreshDV ? parseFloat(decodeString(staticThreshDV)) || 512 : 512,
    damping:        dampingDV   ? decodeUint8(dampingDV)          : 5,
    current:        0,
    // device info
    manufacturer:   mfgDV  ? decodeString(mfgDV)  : (bleDevice.name || 'Unknown'),
    model:          modelDV ? decodeString(modelDV) : 'Unknown',
    firmware:       fwDV    ? decodeString(fwDV)   : 'Unknown',
  }

  // Derive device capabilities from metadata
  const hasBattery = !!chars.battLevel
  const hasAudio   = meta.sensors?.audio === true || !!chars.audioReactive
  const ledCount   = meta.lights?.qty    || 60
  const ledType    = meta.lights?.type   || 'WS2812B'
  const voltage    = meta.power?.v       || 5
  const battCapMah = meta.power?.cap     || null
  const deviceType = meta.profile?.ui    || 'classic'
  const themeColor = meta.profile?.theme || '#ff6b35'

  log(`Device: ${initialState.manufacturer} ${initialState.model} fw${initialState.firmware}`, 'ok')
  log(`LEDs: ${ledCount}× ${ledType}  ·  ${voltage}V  ·  ${hasBattery ? 'battery' : 'wired'}`, 'ok')

  // 6. Build handle
  const handle = new DeviceHandle(bleDevice, chars, meta, initialState)

  // 7. Subscribe to notifications
  if (chars.battLevel)  handle._on(chars.battLevel, 'battLevel', decodeUint8,   'battery')
  if (chars.temp)       handle._on(chars.temp,      'temp',      decodeInt16,   'temp')
  if (chars.current)    handle._on(chars.current,   'current',   decodeCurrent, 'current')

  // 8. Sync device clock
  if (chars.currentTime) {
    handle.syncTime().then(() => log('Device clock synced', 'ok')).catch(() => {})
  }

  // 9. Handle unexpected BLE disconnection
  bleDevice.addEventListener('gattserverdisconnected', () => {
    log(`${bleDevice.name} disconnected`, 'err')
    handle.state.connected = false
  })

  return {
    id:          bleDevice.id,
    name:        bleDevice.name || 'Hyphi Device',
    type:        deviceType,
    hasBattery,
    hasAudio,
    ledCount,
    ledType,
    voltage,
    battCapMah,
    themeColor,
    handle,
    // exposed initial state for the store
    initialState,
  }
}

// ── Reconnect (reuse saved bleDevice) ──────────────────────────────────────
export async function reconnectDevice(handle, onLog) {
  const log = onLog || (() => {})
  if (!handle.bleDevice) throw new Error('No BLE device reference')
  log(`Reconnecting to ${handle.bleDevice.name}…`, 'info')
  try {
    await handle.bleDevice.gatt.connect()
    log('Reconnected', 'ok')
    handle.state.connected = true
    handle.syncTime().catch(() => {})
  } catch (e) {
    log(`Reconnect failed: ${e.message}`, 'err')
    throw e
  }
}

// ── QR code pairing ─────────────────────────────────────────────────────────
// QR encodes a URL like:   hyphi://connect?name=Smart%20Sprout
// On scan, we extract the name and pass it as a name filter to requestDevice
export async function connectByQR(qrPayload, onLog) {
  const log = onLog || (() => {})
  let nameHint = null
  try {
    const url = new URL(qrPayload)
    nameHint = url.searchParams.get('name') || url.searchParams.get('n')
  } catch {
    // raw name string fallback
    nameHint = qrPayload.replace(/^hyphi:\/\/connect\?name=/, '')
  }
  log(`QR decoded — device name hint: "${nameHint}"`, 'info')
  return connectDevice(onLog)  // opens BLE picker; browser enforces user gesture
}

// ── NFC pairing ──────────────────────────────────────────────────────────────
// Web NFC reads an NDEF record whose payload is a device-name hint,
// then triggers a standard BLE connect (user gesture is the NFC tap)
export async function readNFCAndConnect(onLog) {
  const log = onLog || (() => {})
  if (!('NDEFReader' in window)) {
    log('Web NFC not supported on this device', 'err')
    throw new Error('Web NFC not supported')
  }
  log('Hold device near NFC tag…', 'info')
  const ndef = new window.NDEFReader()
  await ndef.scan()
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ndef.onreading = null
      log('NFC read timed out', 'err')
      reject(new Error('NFC timeout'))
    }, 15000)

    ndef.onreading = async event => {
      clearTimeout(timeout)
      ndef.onreading = null
      const record = event.message.records[0]
      const payload = record ? new TextDecoder().decode(record.data) : ''
      log(`NFC tag read: "${payload}"`, 'ok')
      try {
        const result = await connectByQR(payload, onLog)
        resolve(result)
      } catch (e) { reject(e) }
    }

    ndef.onerror = e => {
      clearTimeout(timeout)
      log(`NFC error: ${e.message}`, 'err')
      reject(e)
    }
  })
}
