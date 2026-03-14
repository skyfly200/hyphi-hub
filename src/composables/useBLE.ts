/**
 * useBLE — Web Bluetooth composable for Hyphi Hub
 *
 * Handles: BLE scan picker, GATT connect, service/char discovery,
 * metadata reads, BLENotify subscriptions, typed writes, reconnect,
 * QR pairing, NFC pairing.
 */

import {
  LED_SERVICE_UUID, METADATA_SERVICE_UUID, BATTERY_SERVICE_UUID,
  DEVICE_INFO_SERVICE_UUID, CURRENT_TIME_SERVICE_UUID, ENV_SENSE_SERVICE_UUID,
  MANUFACTURER_CHAR_UUID, MODEL_CHAR_UUID, FIRMWARE_CHAR_UUID,
  META_INDEX_CHAR_UUID, META_POWER_CHAR_UUID, META_LIGHTS_CHAR_UUID,
  META_AUDIO_CHAR_UUID, META_SENSORS_CHAR_UUID, META_PROFILE_CHAR_UUID,
  CURRENT_TIME_CHAR_UUID,
  BATT_LVL_CHAR_UUID, TEMP_CHAR_UUID,
  LED_POWER_CHAR_UUID, LED_MODE_CHAR_UUID, LED_BRIGHT_CHAR_UUID,
  LED_COLOR_CHAR_UUID, LED_SPEED_CHAR_UUID, LED_CYCLE_CHAR_UUID,
  LED_CYCLE_TIME_CHAR_UUID, LED_CURRENT_CHAR_UUID,
  AUDIO_REACTIVE_CHAR_UUID, AUDIO_THRESH_AUTO_CHAR_UUID,
  AUDIO_THRESH_REL_CHAR_UUID, AUDIO_THRESH_OFF_CHAR_UUID,
  AUDIO_THRESH_STATIC_CHAR_UUID, AUDIO_DAMPING_CHAR_UUID,
  BUTTON_ADVANCE_CHAR_UUID,
  encodeColor, encodeSpeed, encodeCycleTime, encodeFloat, encodeByte,
  encodeCurrentTime, decodeString, decodeUint8, decodeInt16, decodeCurrent,
  decodeSpeed,
} from '@/ble-protocol'

import type {
  CharMap, CharKey, DeviceMeta, DeviceState,
  IDeviceHandle, LogFn, LogType, ConnectResult,
} from '@/ble-protocol'

// ── BLE support detection ─────────────────────────────────────────────────
export const bleSupported: boolean =
  typeof navigator !== 'undefined' && !!navigator.bluetooth

// ── Notification listener bookkeeping ────────────────────────────────────
type NotifyHandler = (event: Event & { target: BluetoothRemoteGATTCharacteristic }) => void

interface NotifyEntry {
  char:    BluetoothRemoteGATTCharacteristic
  handler: NotifyHandler
}

// ── DeviceHandle ──────────────────────────────────────────────────────────

export class DeviceHandle implements IDeviceHandle {
  readonly isMock = false
  readonly bleDevice: BluetoothDevice
  readonly chars:     CharMap
  readonly meta:      DeviceMeta
  state:              Partial<DeviceState>
  private _listeners: NotifyEntry[] = []

  constructor(
    bleDevice: BluetoothDevice,
    chars:     CharMap,
    meta:      DeviceMeta,
    state:     Partial<DeviceState>,
  ) {
    this.bleDevice = bleDevice
    this.chars     = chars
    this.meta      = meta
    this.state     = state
  }

  // ── Write helpers ──────────────────────────────────────────────────────
  async setPower(on: boolean):         Promise<void> { await this._write('power',           encodeByte(on ? 1 : 0)) }
  async setMode(mode: number):         Promise<void> { await this._write('mode',            encodeByte(mode)) }
  async setBrightness(val: number):    Promise<void> { await this._write('brightness',      encodeByte(val)) }
  async setColor(hex: string):         Promise<void> { await this._write('color',           encodeColor(hex)) }
  async setSpeed(val: number):         Promise<void> { await this._write('speed',           encodeSpeed(val)) }
  async setAutoCycle(on: boolean):     Promise<void> { await this._write('cycle',           encodeByte(on ? 1 : 0)) }
  async setCycleTime(secs: number):    Promise<void> { await this._write('cycleTime',       encodeCycleTime(secs)) }
  async setAudioReactive(on: boolean): Promise<void> { await this._write('audioReactive',  encodeByte(on ? 1 : 0)) }
  async setAutoThreshold(on: boolean): Promise<void> { await this._write('autoThreshold',  encodeByte(on ? 1 : 0)) }
  async setRelThreshold(val: number):  Promise<void> { await this._write('relThreshold',   encodeFloat(val)) }
  async setOffThreshold(val: number):  Promise<void> { await this._write('offThreshold',   encodeFloat(val)) }
  async setStaticThreshold(v: number): Promise<void> { await this._write('staticThreshold',encodeFloat(v)) }
  async setDamping(val: number):       Promise<void> { await this._write('damping',        encodeByte(val)) }
  async syncTime():                    Promise<void> { await this._write('currentTime',    encodeCurrentTime()) }

  private async _write(key: CharKey, bytes: Uint8Array): Promise<void> {
    const char = this.chars[key]
    if (!char) {
      console.warn(`[BLE] char "${key}" not found — available:`, Object.keys(this.chars).filter(k => !!(this.chars as any)[k]))
      return
    }

    const writeWithoutResponse = !!char.properties.writeWithoutResponse
    const writeWithResponse    = !!char.properties.write

    try {
      console.log(`[BLE] write "${key}" →`, Array.from(bytes))

      if (writeWithoutResponse) {
        await char.writeValueWithoutResponse(bytes)
      } else if (writeWithResponse) {
        await char.writeValue(bytes)
      } else {
        throw new Error('Characteristic does not support write or writeWithoutResponse')
      }

      console.log(`[BLE] write "${key}" ✓`)
    } catch (err) {
      // Try writeValue if writeValueWithoutResponse is not supported or fails
      if (writeWithoutResponse && writeWithResponse) {
        try {
          console.log(`[BLE] write "${key}" retrying with writeValue`)
          await char.writeValue(bytes)
          console.log(`[BLE] write "${key}" ✓ (writeValue)`)
          return
        } catch {
          // fall through to error throw below
        }
      }
      console.error(`[BLE] write "${key}" failed:`, err)
      throw err
    }
  }

  // ── Notification subscriptions ─────────────────────────────────────────
  subscribeNotify(
    char:     BluetoothRemoteGATTCharacteristic,
    key:      string,
    decoder:  (dv: DataView) => number,
    stateKey: keyof DeviceState,
  ): void {
    const handler: NotifyHandler = (e) => {
      const value = (e.target as BluetoothRemoteGATTCharacteristic).value
      if (value) (this.state as Record<string, unknown>)[stateKey] = decoder(value)
    }
    char.addEventListener('characteristicvaluechanged', handler as EventListener)
    char.startNotifications().catch((err: unknown) =>
      console.warn(`[BLE] startNotifications ${key}:`, err)
    )
    this._listeners.push({ char, handler })
  }

  // ── Cleanup ────────────────────────────────────────────────────────────
  disconnect(): void {
    this._listeners.forEach(({ char, handler }) => {
      char.removeEventListener('characteristicvaluechanged', handler as EventListener)
      char.stopNotifications().catch(() => { /* ignore */ })
    })
    this._listeners = []
    if (this.bleDevice.gatt?.connected) {
      this.bleDevice.gatt.disconnect()
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function safeRead(chars: CharMap, key: CharKey): Promise<DataView | null> {
  const c = chars[key]
  if (!c) return null
  try { return await c.readValue() } catch { return null }
}

async function tryChar(
  service: BluetoothRemoteGATTService,
  uuid:    string,
): Promise<BluetoothRemoteGATTCharacteristic | null> {
  try { return await service.getCharacteristic(uuid) } catch { return null }
}

async function tryService(
  server: BluetoothRemoteGATTServer,
  uuid:   string,
): Promise<BluetoothRemoteGATTService | null> {
  try { return await server.getPrimaryService(uuid) } catch { return null }
}

// ── connectDevice ─────────────────────────────────────────────────────────

/**
 * Step 1: Open the browser BLE device picker.
 * MUST be called directly from a click handler with no prior awaits —
 * Chrome requires requestDevice() to run in the same microtask as the user gesture.
 */
export async function requestBLEDevice(onLog?: LogFn): Promise<BluetoothDevice | null> {
  const log: LogFn = onLog ?? (() => { /* noop */ })

  if (!bleSupported || !navigator.bluetooth) {
    log('Web Bluetooth not supported in this browser', 'err')
    throw new Error('Web Bluetooth not supported')
  }

  log('Opening browser BLE scan picker…', 'info')
  try {
    return await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        LED_SERVICE_UUID,
        METADATA_SERVICE_UUID,
        BATTERY_SERVICE_UUID,
        DEVICE_INFO_SERVICE_UUID,
        CURRENT_TIME_SERVICE_UUID,
        ENV_SENSE_SERVICE_UUID,
      ],
    })
  } catch (err) {
    const e = err as DOMException
    if (e.name === 'NotFoundError') { log('Scan cancelled', 'info'); return null }
    log(`Scan failed: ${e.message}`, 'err')
    throw e
  }
}

/**
 * Step 2: Connect GATT + discover services on an already-chosen BluetoothDevice.
 * Call this after requestBLEDevice() resolves.
 */
export async function connectDevice(onLog?: LogFn): Promise<ConnectResult | null> {
  const log: LogFn = onLog ?? (() => { /* noop */ })
  const bleDevice = await requestBLEDevice(log)
  if (!bleDevice) return null
  return connectGATT(bleDevice, log)
}

export async function connectGATT(bleDevice: BluetoothDevice, onLog?: LogFn): Promise<ConnectResult | null> {
  const log: LogFn = onLog ?? (() => { /* noop */ })

  log(`Found: ${bleDevice.name ?? bleDevice.id}`, 'ok')

  // 2. GATT connect
  log('Connecting to GATT server…', 'info')
  let server: BluetoothRemoteGATTServer
  try {
    server = await bleDevice.gatt!.connect()
  } catch (err) {
    const e = err as DOMException
    log(`GATT connect failed: ${e.message}`, 'err')
    throw e
  }
  log('GATT connected', 'ok')

  // 3. Discover services (parallel)
  log('Discovering services…', 'info')
  const [ledSvc, metaSvc, battSvc, devInfoSvc, timeSvc, envSvc] = await Promise.all([
    tryService(server, LED_SERVICE_UUID),
    tryService(server, METADATA_SERVICE_UUID),
    tryService(server, BATTERY_SERVICE_UUID),
    tryService(server, DEVICE_INFO_SERVICE_UUID),
    tryService(server, CURRENT_TIME_SERVICE_UUID),
    tryService(server, ENV_SENSE_SERVICE_UUID),
  ])

  if (!ledSvc) {
    log('LED service not found — is this a Hyphi device?', 'err')
    bleDevice.gatt?.disconnect()
    throw new Error('LED service missing')
  }
  log('LED service found', 'ok')
  if (metaSvc) log('Metadata service found', 'ok')
  if (battSvc) log('Battery service found', 'ok')

  // 4. Discover characteristics
  const chars: CharMap = {}

  // LED service chars
  const ledCharUUIDs: [CharKey, string][] = [
    ['power',           LED_POWER_CHAR_UUID],
    ['mode',            LED_MODE_CHAR_UUID],
    ['brightness',      LED_BRIGHT_CHAR_UUID],
    ['color',           LED_COLOR_CHAR_UUID],
    ['speed',           LED_SPEED_CHAR_UUID],
    ['cycle',           LED_CYCLE_CHAR_UUID],
    ['cycleTime',       LED_CYCLE_TIME_CHAR_UUID],
    ['current',         LED_CURRENT_CHAR_UUID],
    ['audioReactive',   AUDIO_REACTIVE_CHAR_UUID],
    ['autoThreshold',   AUDIO_THRESH_AUTO_CHAR_UUID],
    ['relThreshold',    AUDIO_THRESH_REL_CHAR_UUID],
    ['offThreshold',    AUDIO_THRESH_OFF_CHAR_UUID],
    ['staticThreshold', AUDIO_THRESH_STATIC_CHAR_UUID],
    ['damping',         AUDIO_DAMPING_CHAR_UUID],
    ['btnAdvance',      BUTTON_ADVANCE_CHAR_UUID],
  ]
  const ledResults = await Promise.all(ledCharUUIDs.map(([, uuid]) => tryChar(ledSvc, uuid)))
  ledCharUUIDs.forEach(([key], i) => {
    const c = ledResults[i]
    if (c) chars[key] = c
  })
  log(`LED chars resolved: ${Object.keys(chars).join(', ')}`, 'ok')

  // Metadata
  const meta: DeviceMeta = { index: null, power: null, lights: null, audio: null, sensors: null, profile: null }
  if (metaSvc) {
    const metaCharDefs: [keyof DeviceMeta, string][] = [
      ['index',   META_INDEX_CHAR_UUID],
      ['power',   META_POWER_CHAR_UUID],
      ['lights',  META_LIGHTS_CHAR_UUID],
      ['audio',   META_AUDIO_CHAR_UUID],
      ['sensors', META_SENSORS_CHAR_UUID],
      ['profile', META_PROFILE_CHAR_UUID],
    ]
    const metaChars = await Promise.all(metaCharDefs.map(([, uuid]) => tryChar(metaSvc, uuid)))
    await Promise.all(
      metaCharDefs.map(async ([key], i) => {
        const c = metaChars[i]
        if (!c) return
        try {
          const dv  = await c.readValue()
          meta[key] = JSON.parse(decodeString(dv)) as never
        } catch (err) {
          log(`Meta ${key} parse failed: ${(err as Error).message}`, 'info')
        }
      })
    )
    log('Metadata read', 'ok')
  }

  // Battery / device info / time / env
  if (battSvc)    chars.battLevel    = await tryChar(battSvc,    BATT_LVL_CHAR_UUID)  ?? undefined
  if (devInfoSvc) {
    chars.manufacturer = await tryChar(devInfoSvc, MANUFACTURER_CHAR_UUID) ?? undefined
    chars.model        = await tryChar(devInfoSvc, MODEL_CHAR_UUID)        ?? undefined
    chars.firmware     = await tryChar(devInfoSvc, FIRMWARE_CHAR_UUID)     ?? undefined
  }
  if (timeSvc) chars.currentTime = await tryChar(timeSvc, CURRENT_TIME_CHAR_UUID) ?? undefined
  if (envSvc)  chars.temp        = await tryChar(envSvc,  TEMP_CHAR_UUID)         ?? undefined

  // 5. Read initial state
  log('Reading initial device state…', 'info')
  const keys: CharKey[] = [
    'power', 'mode', 'brightness', 'color', 'speed', 'cycle', 'cycleTime',
    'battLevel', 'audioReactive', 'autoThreshold', 'relThreshold', 'offThreshold',
    'staticThreshold', 'damping', 'manufacturer', 'model', 'firmware',
  ]
  const dvs = await Promise.all(keys.map(k => safeRead(chars, k)))
  const dv = Object.fromEntries(keys.map((k, i) => [k, dvs[i]])) as Record<CharKey, DataView | null>

  const initialState: Omit<DeviceState, 'color2' | 'color3' | 'gamma'> = {
    connected:       true,
    power:           dv.power           ? decodeUint8(dv.power) > 0            : true,
    mode:            dv.mode            ? decodeUint8(dv.mode)                  : 0,
    brightness:      dv.brightness      ? decodeUint8(dv.brightness)            : 204,
    color:           dv.color           ? '#' + decodeString(dv.color).slice(0, 6).toLowerCase() : '#ff6b35',
    speed:           decodeSpeed(dv.speed),
    autoCycle:       dv.cycle           ? decodeUint8(dv.cycle) > 0             : false,
    cycleTime:       dv.cycleTime       ? parseInt(decodeString(dv.cycleTime)) || 15 : 15,
    battery:         dv.battLevel       ? decodeUint8(dv.battLevel)             : null,
    audioReactive:   dv.audioReactive   ? decodeUint8(dv.audioReactive) > 0    : false,
    autoThreshold:   dv.autoThreshold   ? decodeUint8(dv.autoThreshold) > 0    : true,
    relThreshold:    dv.relThreshold    ? parseFloat(decodeString(dv.relThreshold)) || 1.5 : 1.5,
    offThreshold:    dv.offThreshold    ? parseFloat(decodeString(dv.offThreshold)) || 0.5 : 0.5,
    staticThreshold: dv.staticThreshold ? parseFloat(decodeString(dv.staticThreshold)) || 512 : 512,
    damping:         dv.damping         ? decodeUint8(dv.damping)               : 5,
    current:         0,
    temp:            null,
    manufacturer:    dv.manufacturer    ? decodeString(dv.manufacturer)         : bleDevice.name ?? 'Unknown',
    model:           dv.model           ? decodeString(dv.model)                : 'Unknown',
    firmware:        dv.firmware        ? decodeString(dv.firmware)             : 'Unknown',
  }

  // Capabilities from metadata
  const hasBattery = !!chars.battLevel
  const hasAudio   = meta.sensors?.audio === true || !!chars.audioReactive
  const ledCount   = meta.lights?.qty    ?? 60
  const ledType    = meta.lights?.type   ?? 'WS2812B'
  const voltage    = meta.power?.v       ?? 5
  const battCapMah = meta.power?.cap     ?? null
  const deviceType = meta.profile?.ui    ?? 'classic'
  const themeColor = meta.profile?.theme ?? '#ff6b35'

  log(`Device: ${initialState.manufacturer} ${initialState.model} fw${initialState.firmware}`, 'ok')
  log(`LEDs: ${ledCount}× ${ledType}  ·  ${voltage}V  ·  ${hasBattery ? 'battery' : 'wired'}`, 'ok')

  // 6. Build handle
  const handle = new DeviceHandle(bleDevice, chars, meta, { ...initialState })

  // 7. Subscribe to notifications
  if (chars.battLevel) handle.subscribeNotify(chars.battLevel, 'battLevel', dv => decodeUint8(dv),   'battery')
  if (chars.temp)      handle.subscribeNotify(chars.temp,      'temp',      dv => decodeInt16(dv),   'temp')
  if (chars.current)   handle.subscribeNotify(chars.current,   'current',   dv => decodeCurrent(dv), 'current')

  // 8. Sync device clock
  if (chars.currentTime) {
    handle.syncTime()
      .then(() => log('Device clock synced', 'ok'))
      .catch(() => { /* non-fatal */ })
  }

  // 9. Watch for unexpected disconnect
  bleDevice.addEventListener('gattserverdisconnected', () => {
    log(`${bleDevice.name ?? 'Device'} disconnected`, 'err')
    handle.state.connected = false
  })

  return {
    id:          bleDevice.id,
    name:        bleDevice.name ?? 'Hyphi Device',
    type:        deviceType,
    hasBattery,
    hasAudio,
    ledCount,
    ledType,
    voltage,
    battCapMah,
    themeColor,
    handle,
    initialState,
  }
}

// ── Reconnect ─────────────────────────────────────────────────────────────

export async function reconnectDevice(handle: DeviceHandle, onLog?: LogFn): Promise<void> {
  const log: LogFn = onLog ?? (() => { /* noop */ })
  if (!handle.bleDevice) throw new Error('No BLE device reference')
  log(`Reconnecting to ${handle.bleDevice.name ?? 'device'}…`, 'info')
  try {
    await handle.bleDevice.gatt!.connect()
    log('Reconnected', 'ok')
    handle.state.connected = true
    handle.syncTime().catch(() => { /* non-fatal */ })
  } catch (err) {
    const e = err as Error
    log(`Reconnect failed: ${e.message}`, 'err')
    throw e
  }
}

// ── QR code pairing ───────────────────────────────────────────────────────

export async function connectByQR(qrPayload: string, onLog?: LogFn): Promise<ConnectResult | null> {
  const log: LogFn = onLog ?? (() => { /* noop */ })
  let nameHint: string | null = null
  try {
    const url = new URL(qrPayload)
    nameHint = url.searchParams.get('name') ?? url.searchParams.get('n')
  } catch {
    nameHint = qrPayload.replace(/^hyphi:\/\/connect\?name=/, '')
  }
  log(`QR decoded — device name hint: "${nameHint}"`, 'info')
  return connectDevice(onLog)
}

// ── NFC pairing ───────────────────────────────────────────────────────────

export async function readNFCAndConnect(onLog?: LogFn): Promise<ConnectResult | null> {
  const log: LogFn = onLog ?? (() => { /* noop */ })

  if (!window.NDEFReader) {
    log('Web NFC not supported on this device', 'err')
    throw new Error('Web NFC not supported')
  }

  log('Hold device near NFC tag…', 'info')
  const ndef = new window.NDEFReader()
  await ndef.scan()

  return new Promise<ConnectResult | null>((resolve, reject) => {
    const timeout = setTimeout(() => {
      ndef.onreading = null
      log('NFC read timed out', 'err')
      reject(new Error('NFC timeout'))
    }, 15_000)

    ndef.onreading = async (event) => {
      clearTimeout(timeout)
      ndef.onreading = null
      const record  = event.message.records[0]
      const payload = record?.data ? new TextDecoder().decode(record.data) : ''
      log(`NFC tag read: "${payload}"`, 'ok')
      try {
        resolve(await connectByQR(payload, onLog))
      } catch (err) {
        reject(err)
      }
    }

    ndef.onerror = (err: Event) => {
      clearTimeout(timeout)
      log(`NFC error: ${(err as ErrorEvent).message}`, 'err')
      reject(err)
    }
  })
}
