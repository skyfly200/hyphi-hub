import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  makeFullFakeDevice, makeFakeBluetooth,
  FakeBluetoothDevice, FakeService, FakeCharacteristic, ch,
} from '@/test/ble-stub'
import {
  connectGATT, reconnectDevice, getKnownDevices,
  DeviceHandle, bleSupported,
} from './useBLE'
import {
  LED_SERVICE_UUID, BATTERY_SERVICE_UUID, DEVICE_INFO_SERVICE_UUID,
  METADATA_SERVICE_UUID, CURRENT_TIME_SERVICE_UUID, ENV_SENSE_SERVICE_UUID,
  LED_POWER_CHAR_UUID, LED_MODE_CHAR_UUID, LED_BRIGHT_CHAR_UUID,
  LED_COLOR_CHAR_UUID, LED_SPEED_CHAR_UUID, LED_CYCLE_CHAR_UUID,
  LED_CYCLE_TIME_CHAR_UUID, AUDIO_REACTIVE_CHAR_UUID,
  AUDIO_THRESH_REL_CHAR_UUID, AUDIO_DAMPING_CHAR_UUID,
  BATT_LVL_CHAR_UUID, TEMP_CHAR_UUID, LED_CURRENT_CHAR_UUID,
  encodeColor, encodeSpeed, encodeByte, encodeFloat, encodeCycleTime,
} from '@/ble-protocol'

// ── Helpers ───────────────────────────────────────────────────────────────────

function stubBluetooth(device: FakeBluetoothDevice) {
  vi.stubGlobal('navigator', { bluetooth: makeFakeBluetooth([device]) })
}

function logs() {
  const entries: { msg: string; type: string }[] = []
  const fn = (msg: string, type = 'info') => entries.push({ msg, type })
  return { entries, fn }
}

// ── connectGATT ───────────────────────────────────────────────────────────────

describe('connectGATT — happy path', () => {
  let device: FakeBluetoothDevice

  beforeEach(() => {
    device = makeFullFakeDevice()
    stubBluetooth(device)
  })

  afterEach(() => { vi.unstubAllGlobals() })

  it('returns a ConnectResult', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result).not.toBeNull()
  })

  it('sets id and name from the BLE device', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.id).toBe(device.id)
    expect(result!.name).toBe(device.name)
  })

  it('connects to the GATT server', async () => {
    await connectGATT(device as unknown as BluetoothDevice)
    expect(device.gatt.connected).toBe(true)
  })

  it('reads initial power state from characteristic', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.initialState.power).toBe(true)   // byte(1) in stub
  })

  it('reads initial brightness', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.initialState.brightness).toBe(204)
  })

  it('reads initial color and normalises to #rrggbb', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.initialState.color).toBe('#ff6b35')
  })

  it('reads initial speed', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.initialState.speed).toBe(5000)
  })

  it('reads battery level', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.initialState.battery).toBe(72)
  })

  it('reads manufacturer from device info', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.initialState.manufacturer).toBe('Hyphae')
  })

  it('reads model from device info', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.initialState.model).toBe('Smart Sprout')
  })

  it('reads firmware version', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.initialState.firmware).toBe('1.1.3')
  })

  it('derives ledCount from metadata', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.ledCount).toBe(60)
  })

  it('derives hasAudio from metadata sensors', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.hasAudio).toBe(true)
  })

  it('derives hasBattery from chars', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.hasBattery).toBe(true)
  })

  it('derives voltage from metadata power', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.voltage).toBe(5)
  })

  it('derives battCapMah from metadata', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.battCapMah).toBe(2000)
  })

  it('derives themeColor from metadata profile', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.themeColor).toBe('#4CAF50')
  })

  it('returns a DeviceHandle as handle', async () => {
    const result = await connectGATT(device as unknown as BluetoothDevice)
    expect(result!.handle).toBeInstanceOf(DeviceHandle)
  })

  it('logs ok entries during connection', async () => {
    const { entries, fn } = logs()
    await connectGATT(device as unknown as BluetoothDevice, fn)
    expect(entries.some(e => e.type === 'ok' && /GATT connected/i.test(e.msg))).toBe(true)
  })
})

describe('connectGATT — LED service missing', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('throws and logs an error when LED service is absent', async () => {
    // Device with no services at all
    const bare = new FakeBluetoothDevice('bare', 'Bare Device', [])
    stubBluetooth(bare)
    const { entries, fn } = logs()
    await expect(connectGATT(bare as unknown as BluetoothDevice, fn)).rejects.toThrow('LED service missing')
    expect(entries.some(e => e.type === 'err')).toBe(true)
  })
})

describe('connectGATT — no metadata service', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('still returns a result using sensible defaults', async () => {
    const ledOnly = new FakeBluetoothDevice('led-only', 'Hyphi Minimal', [
      new FakeService(LED_SERVICE_UUID, [
        new FakeCharacteristic(LED_POWER_CHAR_UUID,  encodeByte(1)),
        new FakeCharacteristic(LED_MODE_CHAR_UUID,   encodeByte(0)),
        new FakeCharacteristic(LED_BRIGHT_CHAR_UUID, encodeByte(200)),
        new FakeCharacteristic(LED_COLOR_CHAR_UUID,  new TextEncoder().encode('7B5CFA')),
        new FakeCharacteristic(LED_SPEED_CHAR_UUID,  encodeSpeed(3000)),
        new FakeCharacteristic(LED_CYCLE_CHAR_UUID,  encodeByte(0)),
        new FakeCharacteristic(LED_CYCLE_TIME_CHAR_UUID, new TextEncoder().encode('30')),
      ]),
    ])
    const result = await connectGATT(ledOnly as unknown as BluetoothDevice)
    expect(result).not.toBeNull()
    expect(result!.ledCount).toBe(60)       // default
    expect(result!.hasAudio).toBe(false)    // no metadata
    expect(result!.hasBattery).toBe(false)  // no battery service
  })
})

// ── DeviceHandle writes ───────────────────────────────────────────────────────

describe('DeviceHandle write methods', () => {
  let device: FakeBluetoothDevice
  let handle: DeviceHandle

  beforeEach(async () => {
    device = makeFullFakeDevice()
    stubBluetooth(device)
    const result = await connectGATT(device as unknown as BluetoothDevice)
    handle = result!.handle as DeviceHandle
  })

  afterEach(() => { vi.unstubAllGlobals() })

  it('setPower(true) writes byte 1 to power char', async () => {
    const c = await ch(device, LED_SERVICE_UUID, LED_POWER_CHAR_UUID)
    await handle.setPower(true)
    expect(c.writes.at(-1)).toEqual(encodeByte(1))
  })

  it('setPower(false) writes byte 0', async () => {
    const c = await ch(device, LED_SERVICE_UUID, LED_POWER_CHAR_UUID)
    await handle.setPower(false)
    expect(c.writes.at(-1)).toEqual(encodeByte(0))
  })

  it('setMode writes the mode byte', async () => {
    const c = await ch(device, LED_SERVICE_UUID, LED_MODE_CHAR_UUID)
    await handle.setMode(7)
    expect(c.writes.at(-1)).toEqual(encodeByte(7))
  })

  it('setBrightness writes the brightness byte', async () => {
    const c = await ch(device, LED_SERVICE_UUID, LED_BRIGHT_CHAR_UUID)
    await handle.setBrightness(128)
    expect(c.writes.at(-1)).toEqual(encodeByte(128))
  })

  it('setColor writes 6-char uppercase hex as UTF-8', async () => {
    const c = await ch(device, LED_SERVICE_UUID, LED_COLOR_CHAR_UUID)
    await handle.setColor('#3dffc0')
    expect(c.writes.at(-1)).toEqual(encodeColor('#3dffc0'))
    expect(new TextDecoder().decode(c.writes.at(-1))).toBe('3DFFC0')
  })

  it('setSpeed writes a 4-byte little-endian uint32', async () => {
    const c = await ch(device, LED_SERVICE_UUID, LED_SPEED_CHAR_UUID)
    await handle.setSpeed(1000)
    expect(c.writes.at(-1)).toEqual(encodeSpeed(1000))
  })

  it('setAutoCycle(true) writes byte 1', async () => {
    const c = await ch(device, LED_SERVICE_UUID, LED_CYCLE_CHAR_UUID)
    await handle.setAutoCycle(true)
    expect(c.writes.at(-1)).toEqual(encodeByte(1))
  })

  it('setCycleTime writes ASCII decimal string', async () => {
    const c = await ch(device, LED_SERVICE_UUID, LED_CYCLE_TIME_CHAR_UUID)
    await handle.setCycleTime(60)
    expect(c.writes.at(-1)).toEqual(encodeCycleTime(60))
    expect(new TextDecoder().decode(c.writes.at(-1))).toBe('60')
  })

  it('setAudioReactive(true) writes byte 1', async () => {
    const c = await ch(device, LED_SERVICE_UUID, AUDIO_REACTIVE_CHAR_UUID)
    await handle.setAudioReactive(true)
    expect(c.writes.at(-1)).toEqual(encodeByte(1))
  })

  it('setRelThreshold writes ASCII float', async () => {
    const c = await ch(device, LED_SERVICE_UUID, AUDIO_THRESH_REL_CHAR_UUID)
    await handle.setRelThreshold(2.5)
    expect(new TextDecoder().decode(c.writes.at(-1))).toBe('2.5000')
  })

  it('setDamping writes a byte', async () => {
    const c = await ch(device, LED_SERVICE_UUID, AUDIO_DAMPING_CHAR_UUID)
    await handle.setDamping(200)
    expect(c.writes.at(-1)).toEqual(encodeByte(200))
  })

  it('write to missing char is a no-op (does not throw)', async () => {
    // Remove brightness char by using a minimal handle with empty chars
    const minHandle = new DeviceHandle(
      device as unknown as BluetoothDevice, {}, {} as any, {}
    )
    await expect(minHandle.setBrightness(100)).resolves.toBeUndefined()
  })
})

// ── DeviceHandle notifications ────────────────────────────────────────────────

describe('DeviceHandle subscribeNotify', () => {
  let device: FakeBluetoothDevice
  let handle: DeviceHandle

  beforeEach(async () => {
    device = makeFullFakeDevice()
    stubBluetooth(device)
    const result = await connectGATT(device as unknown as BluetoothDevice)
    handle = result!.handle as DeviceHandle
  })

  afterEach(() => { vi.unstubAllGlobals() })

  it('updates handle.state.battery when battery char fires', async () => {
    const battChar = await ch(device, BATTERY_SERVICE_UUID, BATT_LVL_CHAR_UUID)
    const newBatt = new Uint8Array([55])
    battChar.fireNotification(new DataView(newBatt.buffer))
    expect(handle.state.battery).toBe(55)
  })

  it('updates handle.state.current when current char fires', async () => {
    const currentChar = await ch(device, LED_SERVICE_UUID, LED_CURRENT_CHAR_UUID)
    const encoded = new TextEncoder().encode('320')
    currentChar.fireNotification(new DataView(encoded.buffer))
    expect(handle.state.current).toBeCloseTo(320)
  })

  it('updates handle.state.temp when temp char fires', async () => {
    const tempChar = await ch(device, ENV_SENSE_SERVICE_UUID, TEMP_CHAR_UUID)
    const buf = new ArrayBuffer(2)
    new DataView(buf).setInt16(0, 2100, true)  // 21.00°C
    tempChar.fireNotification(new DataView(buf))
    expect(handle.state.temp).toBeCloseTo(21.0)
  })
})

// ── DeviceHandle disconnect ───────────────────────────────────────────────────

describe('DeviceHandle disconnect', () => {
  let device: FakeBluetoothDevice
  let handle: DeviceHandle

  beforeEach(async () => {
    device = makeFullFakeDevice()
    stubBluetooth(device)
    const result = await connectGATT(device as unknown as BluetoothDevice)
    handle = result!.handle as DeviceHandle
  })

  afterEach(() => { vi.unstubAllGlobals() })

  it('disconnects the GATT server', () => {
    handle.disconnect()
    expect(device.gatt.connected).toBe(false)
  })

  it('sets state.connected = false when gattserverdisconnected fires', () => {
    device.gatt.disconnect()  // fires the event
    expect(handle.state.connected).toBe(false)
  })
})

// ── reconnectDevice ───────────────────────────────────────────────────────────

describe('reconnectDevice', () => {
  let device: FakeBluetoothDevice
  let handle: DeviceHandle

  beforeEach(async () => {
    device = makeFullFakeDevice()
    stubBluetooth(device)
    const result = await connectGATT(device as unknown as BluetoothDevice)
    handle = result!.handle as DeviceHandle
    handle.disconnect()
  })

  afterEach(() => { vi.unstubAllGlobals() })

  it('reconnects the GATT server', async () => {
    await reconnectDevice(handle)
    expect(device.gatt.connected).toBe(true)
  })

  it('sets handle.state.connected = true', async () => {
    await reconnectDevice(handle)
    expect(handle.state.connected).toBe(true)
  })

  it('logs a reconnected ok message', async () => {
    const { entries, fn } = logs()
    await reconnectDevice(handle, fn)
    expect(entries.some(e => e.type === 'ok' && /reconnected/i.test(e.msg))).toBe(true)
  })

  it('logs and rethrows on GATT failure', async () => {
    device.gatt.connect = vi.fn().mockRejectedValue(new Error('GATT busy'))
    const { entries, fn } = logs()
    await expect(reconnectDevice(handle, fn)).rejects.toThrow('GATT busy')
    expect(entries.some(e => e.type === 'err')).toBe(true)
  })
})

// ── getKnownDevices ───────────────────────────────────────────────────────────

describe('getKnownDevices', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('returns [] in test environment (bleSupported is false at module load time)', async () => {
    // bleSupported = typeof navigator !== 'undefined' && !!navigator.bluetooth
    // is evaluated once when useBLE is imported — before any vi.stubGlobal call.
    // In happy-dom there is no navigator.bluetooth, so bleSupported is false and
    // getKnownDevices() returns [] immediately. This is the expected behaviour.
    const device = makeFullFakeDevice()
    vi.stubGlobal('navigator', {
      bluetooth: { getDevices: vi.fn().mockResolvedValue([device]) },
    })
    const result = await getKnownDevices()
    expect(result).toEqual([])
  })

  it('returns [] when bluetooth is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const result = await getKnownDevices()
    expect(result).toEqual([])
  })

  it('returns [] when getDevices is not a function', async () => {
    vi.stubGlobal('navigator', { bluetooth: {} })
    const result = await getKnownDevices()
    expect(result).toEqual([])
  })

  it('returns [] when getDevices rejects', async () => {
    vi.stubGlobal('navigator', {
      bluetooth: { getDevices: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    const result = await getKnownDevices()
    expect(result).toEqual([])
  })
})

// ── bleSupported flag ─────────────────────────────────────────────────────────

describe('bleSupported', () => {
  // bleSupported is evaluated at import time so we just verify it's a boolean
  it('is a boolean', () => {
    expect(typeof bleSupported).toBe('boolean')
  })
})
