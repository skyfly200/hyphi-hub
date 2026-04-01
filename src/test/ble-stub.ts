/**
 * Fake Web Bluetooth API for Vitest.
 *
 * Mirrors the browser interfaces used by useBLE.ts:
 *   BluetoothRemoteGATTCharacteristic
 *   BluetoothRemoteGATTService
 *   BluetoothRemoteGATTServer
 *   BluetoothDevice
 *   navigator.bluetooth
 *
 * Usage:
 *   const device = makeFullFakeDevice()
 *   vi.stubGlobal('navigator', { bluetooth: makeFakeBluetooth([device]) })
 */

import { vi } from 'vitest'
import {
  LED_SERVICE_UUID, METADATA_SERVICE_UUID,
  BATTERY_SERVICE_UUID, DEVICE_INFO_SERVICE_UUID,
  CURRENT_TIME_SERVICE_UUID, ENV_SENSE_SERVICE_UUID,
  LED_POWER_CHAR_UUID, LED_MODE_CHAR_UUID, LED_BRIGHT_CHAR_UUID,
  LED_COLOR_CHAR_UUID, LED_SPEED_CHAR_UUID, LED_CYCLE_CHAR_UUID,
  LED_CYCLE_TIME_CHAR_UUID, LED_CURRENT_CHAR_UUID,
  AUDIO_REACTIVE_CHAR_UUID, AUDIO_THRESH_AUTO_CHAR_UUID,
  AUDIO_THRESH_REL_CHAR_UUID, AUDIO_THRESH_OFF_CHAR_UUID,
  AUDIO_THRESH_STATIC_CHAR_UUID, AUDIO_DAMPING_CHAR_UUID,
  BUTTON_ADVANCE_CHAR_UUID,
  META_INDEX_CHAR_UUID, META_POWER_CHAR_UUID, META_LIGHTS_CHAR_UUID,
  META_AUDIO_CHAR_UUID, META_SENSORS_CHAR_UUID, META_PROFILE_CHAR_UUID,
  BATT_LVL_CHAR_UUID, MANUFACTURER_CHAR_UUID, MODEL_CHAR_UUID,
  FIRMWARE_CHAR_UUID, CURRENT_TIME_CHAR_UUID, TEMP_CHAR_UUID,
  encodeSpeed,
} from '@/ble-protocol'

// ── FakeCharacteristic ────────────────────────────────────────────────────────

export class FakeCharacteristic {
  readonly uuid: string
  readonly properties: BluetoothCharacteristicProperties
  value: DataView | null

  /** Every writeValue / writeValueWithoutResponse call is recorded here */
  readonly writes: Uint8Array[] = []

  private readonly _listeners = new Map<string, Set<EventListener>>()

  constructor(
    uuid: string,
    initialValue?: Uint8Array,
    opts: Partial<BluetoothCharacteristicProperties> = {},
  ) {
    this.uuid  = uuid
    this.value = initialValue ? new DataView(initialValue.buffer.slice(
      initialValue.byteOffset,
      initialValue.byteOffset + initialValue.byteLength,
    )) : null
    this.properties = {
      authenticatedSignedWrites: false,
      broadcast:                 false,
      indicate:                  false,
      notify:                    false,
      read:                      true,
      reliableWrite:             false,
      writableAuxiliaries:       false,
      write:                     true,
      writeWithoutResponse:      true,
      ...opts,
    }
  }

  async readValue(): Promise<DataView> {
    return this.value ?? new DataView(new ArrayBuffer(0))
  }

  async writeValue(data: BufferSource): Promise<void> {
    this.writes.push(new Uint8Array(data as ArrayBuffer))
  }

  async writeValueWithoutResponse(data: BufferSource): Promise<void> {
    this.writes.push(new Uint8Array(data as ArrayBuffer))
  }

  async startNotifications(): Promise<this> { return this }
  async stopNotifications():  Promise<this> { return this }

  addEventListener(type: string, listener: EventListener): void {
    if (!this._listeners.has(type)) this._listeners.set(type, new Set())
    this._listeners.get(type)!.add(listener)
  }

  removeEventListener(type: string, listener: EventListener): void {
    this._listeners.get(type)?.delete(listener)
  }

  /** Fire a characteristicvaluechanged notification in tests */
  fireNotification(value: DataView): void {
    this.value = value
    const listeners = this._listeners.get('characteristicvaluechanged') ?? new Set()
    listeners.forEach(fn => fn({ target: this } as unknown as Event))
  }

  /** Number of listeners currently attached (for assertion use) */
  listenerCount(type = 'characteristicvaluechanged'): number {
    return this._listeners.get(type)?.size ?? 0
  }
}

// ── FakeService ───────────────────────────────────────────────────────────────

export class FakeService {
  readonly uuid: string
  private readonly _chars = new Map<string, FakeCharacteristic>()

  constructor(uuid: string, chars: FakeCharacteristic[]) {
    this.uuid = uuid
    chars.forEach(c => this._chars.set(c.uuid, c))
  }

  async getCharacteristic(uuid: string): Promise<FakeCharacteristic> {
    const c = this._chars.get(uuid)
    if (!c) throw new DOMException(`Char ${uuid} not found`, 'NotFoundError')
    return c
  }

  /** Direct char access for assertions */
  char(uuid: string): FakeCharacteristic | undefined {
    return this._chars.get(uuid)
  }
}

// ── FakeGATTServer ────────────────────────────────────────────────────────────

export class FakeGATTServer {
  connected = false
  readonly device: FakeBluetoothDevice
  private readonly _services = new Map<string, FakeService>()

  constructor(device: FakeBluetoothDevice, services: FakeService[]) {
    this.device = device
    services.forEach(s => this._services.set(s.uuid, s))
  }

  async connect(): Promise<this> {
    this.connected = true
    return this
  }

  async getPrimaryService(uuid: string): Promise<FakeService> {
    const s = this._services.get(uuid)
    if (!s) throw new DOMException(`Service ${uuid} not found`, 'NotFoundError')
    return s
  }

  disconnect(): void {
    this.connected = false
    this.device.dispatchEvent(new Event('gattserverdisconnected'))
  }
}

// ── FakeBluetoothDevice ───────────────────────────────────────────────────────

export class FakeBluetoothDevice extends EventTarget {
  readonly id:   string
  readonly name: string
  readonly gatt: FakeGATTServer

  constructor(id: string, name: string, services: FakeService[]) {
    super()
    this.id   = id
    this.name = name
    this.gatt = new FakeGATTServer(this, services)
  }
}

// ── makeFakeBluetooth ─────────────────────────────────────────────────────────

export function makeFakeBluetooth(devices: FakeBluetoothDevice[]) {
  return {
    requestDevice: vi.fn().mockResolvedValue(devices[0]),
    getDevices:    vi.fn().mockResolvedValue(devices),
  }
}

// ── Encoding helpers ──────────────────────────────────────────────────────────

function str(s: string): Uint8Array { return new TextEncoder().encode(s) }
function byte(n: number): Uint8Array { return new Uint8Array([n & 0xff]) }

// ── makeFullFakeDevice ────────────────────────────────────────────────────────

/**
 * Builds a FakeBluetoothDevice with all services and characteristics
 * that a real Hyphi Smart Sprout would expose.
 *
 * All characteristics are pre-loaded with realistic initial values so
 * connectGATT() can read initial state exactly as it would from hardware.
 */
export function makeFullFakeDevice(overrides: {
  id?:   string
  name?: string
} = {}): FakeBluetoothDevice {
  const id   = overrides.id   ?? 'AA:BB:CC:DD:EE:FF'
  const name = overrides.name ?? 'Hyphi Smart Sprout'

  // ── LED service ─────────────────────────────────────────────────────────
  const ledService = new FakeService(LED_SERVICE_UUID, [
    new FakeCharacteristic(LED_POWER_CHAR_UUID,            byte(1)),          // on
    new FakeCharacteristic(LED_MODE_CHAR_UUID,             byte(0)),          // static
    new FakeCharacteristic(LED_BRIGHT_CHAR_UUID,           byte(204)),
    new FakeCharacteristic(LED_COLOR_CHAR_UUID,            str('FF6B35')),
    new FakeCharacteristic(LED_SPEED_CHAR_UUID,            encodeSpeed(5000)),
    new FakeCharacteristic(LED_CYCLE_CHAR_UUID,            byte(0)),
    new FakeCharacteristic(LED_CYCLE_TIME_CHAR_UUID,       str('15')),
    new FakeCharacteristic(LED_CURRENT_CHAR_UUID,          str('0'),          { notify: true, writeWithoutResponse: false }),
    new FakeCharacteristic(AUDIO_REACTIVE_CHAR_UUID,       byte(0)),
    new FakeCharacteristic(AUDIO_THRESH_AUTO_CHAR_UUID,    byte(1)),
    new FakeCharacteristic(AUDIO_THRESH_REL_CHAR_UUID,     str('1.5000')),
    new FakeCharacteristic(AUDIO_THRESH_OFF_CHAR_UUID,     str('0.5000')),
    new FakeCharacteristic(AUDIO_THRESH_STATIC_CHAR_UUID,  str('512.0000')),
    new FakeCharacteristic(AUDIO_DAMPING_CHAR_UUID,        byte(5)),
    new FakeCharacteristic(BUTTON_ADVANCE_CHAR_UUID,       byte(0)),
  ])

  // ── Metadata service ────────────────────────────────────────────────────
  const metaService = new FakeService(METADATA_SERVICE_UUID, [
    new FakeCharacteristic(META_INDEX_CHAR_UUID,   str(JSON.stringify(['classic']))),
    new FakeCharacteristic(META_POWER_CHAR_UUID,   str(JSON.stringify({ type: 'LiPo', cap: 2000, io: 'USB-C', v: 5 }))),
    new FakeCharacteristic(META_LIGHTS_CHAR_UUID,  str(JSON.stringify({ qty: 60, type: 'WS2812B', pin: 12 }))),
    new FakeCharacteristic(META_AUDIO_CHAR_UUID,   str(JSON.stringify({ type: 'PDM', fft: 4096 }))),
    new FakeCharacteristic(META_SENSORS_CHAR_UUID, str(JSON.stringify({ audio: true, mic: 'PDM', battery: true }))),
    new FakeCharacteristic(META_PROFILE_CHAR_UUID, str(JSON.stringify({ ui: 'classic', theme: '#4CAF50' }))),
  ])

  // ── Battery service ─────────────────────────────────────────────────────
  const battService = new FakeService(BATTERY_SERVICE_UUID, [
    new FakeCharacteristic(BATT_LVL_CHAR_UUID, byte(72), { notify: true }),
  ])

  // ── Device info service ─────────────────────────────────────────────────
  const devInfoService = new FakeService(DEVICE_INFO_SERVICE_UUID, [
    new FakeCharacteristic(MANUFACTURER_CHAR_UUID, str('Hyphae')),
    new FakeCharacteristic(MODEL_CHAR_UUID,        str('Smart Sprout')),
    new FakeCharacteristic(FIRMWARE_CHAR_UUID,     str('1.1.3')),
  ])

  // ── Current time service ────────────────────────────────────────────────
  const timeService = new FakeService(CURRENT_TIME_SERVICE_UUID, [
    new FakeCharacteristic(CURRENT_TIME_CHAR_UUID, new Uint8Array(10)),
  ])

  // ── Environment sensing service ─────────────────────────────────────────
  const tempBuf = new ArrayBuffer(2)
  new DataView(tempBuf).setInt16(0, 2200, true)   // 22.00°C
  const envService = new FakeService(ENV_SENSE_SERVICE_UUID, [
    new FakeCharacteristic(TEMP_CHAR_UUID, new Uint8Array(tempBuf), { notify: true }),
  ])

  return new FakeBluetoothDevice(id, name, [
    ledService, metaService, battService, devInfoService, timeService, envService,
  ])
}

// ── Convenience accessors ─────────────────────────────────────────────────────

/** Grab a service from a device by UUID (for test assertions) */
export async function svc(device: FakeBluetoothDevice, uuid: string): Promise<FakeService> {
  return device.gatt.getPrimaryService(uuid)
}

/** Grab a char from a device by service + char UUID (for test assertions) */
export async function ch(
  device: FakeBluetoothDevice,
  serviceUuid: string,
  charUuid: string,
): Promise<FakeCharacteristic> {
  const s = await svc(device, serviceUuid)
  return s.getCharacteristic(charUuid)
}
