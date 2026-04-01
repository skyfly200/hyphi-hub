import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MockHandle, mockConnectResult, MOCK_DEVICES } from './useMock'
import type { MockDeviceDef } from './useMock'

const DEF: MockDeviceDef = MOCK_DEVICES[0] // Desk Strip — has battery + audio

// ── Construction ──────────────────────────────────────────────────────────────

describe('MockHandle construction', () => {
  let handle: MockHandle

  beforeEach(() => {
    vi.useFakeTimers()
    handle = new MockHandle(DEF)
  })

  afterEach(() => {
    handle.disconnect()
    vi.useRealTimers()
  })

  it('sets isMock = true', () => {
    expect(handle.isMock).toBe(true)
  })

  it('initialises state as connected and powered on', () => {
    expect(handle.state.connected).toBe(true)
    expect(handle.state.power).toBe(true)
  })

  it('sets initial battery for devices that have one', () => {
    expect(handle.state.battery).toBe(72)
  })

  it('sets battery to null for devices without one', () => {
    // Moon Orb has hasBattery: false... actually all MOCK_DEVICES have hasBattery:true
    // Use a custom def with hasBattery: false
    const noBattDef: MockDeviceDef = { ...DEF, id: 'no-batt', hasBattery: false, battCapMah: null }
    const h = new MockHandle(noBattDef)
    expect(h.state.battery).toBeNull()
    h.disconnect()
  })

  it('starts with default brightness of 204', () => {
    expect(handle.state.brightness).toBe(204)
  })

  it('starts with default color #ff6b35', () => {
    expect(handle.state.color).toBe('#ff6b35')
  })
})

// ── IDeviceHandle methods ─────────────────────────────────────────────────────

describe('MockHandle state mutations', () => {
  let handle: MockHandle
  const logs: string[] = []

  beforeEach(() => {
    vi.useFakeTimers()
    logs.length = 0
    handle = new MockHandle(DEF, (msg) => logs.push(msg))
  })

  afterEach(() => {
    handle.disconnect()
    vi.useRealTimers()
  })

  it('setPower updates state and logs', async () => {
    await handle.setPower(false)
    expect(handle.state.power).toBe(false)
    expect(logs.some(l => l.includes('POWER: 0'))).toBe(true)
  })

  it('setMode updates state and logs', async () => {
    await handle.setMode(3)
    expect(handle.state.mode).toBe(3)
    expect(logs.some(l => l.includes('MODE: 3'))).toBe(true)
  })

  it('setBrightness updates state', async () => {
    await handle.setBrightness(128)
    expect(handle.state.brightness).toBe(128)
  })

  it('setColor updates state and logs uppercase hex', async () => {
    await handle.setColor('#3dffc0')
    expect(handle.state.color).toBe('#3dffc0')
    expect(logs.some(l => l.includes('3DFFC0'))).toBe(true)
  })

  it('setSpeed updates state', async () => {
    await handle.setSpeed(1000)
    expect(handle.state.speed).toBe(1000)
  })

  it('setAutoCycle updates state', async () => {
    await handle.setAutoCycle(true)
    expect(handle.state.autoCycle).toBe(true)
  })

  it('setCycleTime updates state', async () => {
    await handle.setCycleTime(60)
    expect(handle.state.cycleTime).toBe(60)
  })

  it('setAudioReactive updates state', async () => {
    await handle.setAudioReactive(true)
    expect(handle.state.audioReactive).toBe(true)
  })

  it('setAutoThreshold updates state', async () => {
    await handle.setAutoThreshold(false)
    expect(handle.state.autoThreshold).toBe(false)
  })

  it('setRelThreshold updates state', async () => {
    await handle.setRelThreshold(2.5)
    expect(handle.state.relThreshold).toBe(2.5)
  })

  it('setOffThreshold updates state', async () => {
    await handle.setOffThreshold(1.0)
    expect(handle.state.offThreshold).toBe(1.0)
  })

  it('setStaticThreshold updates state', async () => {
    await handle.setStaticThreshold(256)
    expect(handle.state.staticThreshold).toBe(256)
  })

  it('setDamping updates state', async () => {
    await handle.setDamping(100)
    expect(handle.state.damping).toBe(100)
  })

  it('syncTime logs without throwing', async () => {
    await expect(handle.syncTime()).resolves.toBeUndefined()
    expect(logs.some(l => l.includes('CURRENT_TIME'))).toBe(true)
  })
})

// ── disconnect ────────────────────────────────────────────────────────────────

describe('MockHandle disconnect', () => {
  it('sets state.connected = false', () => {
    vi.useFakeTimers()
    const handle = new MockHandle(DEF)
    handle.disconnect()
    expect(handle.state.connected).toBe(false)
    vi.useRealTimers()
  })

  it('stops battery drain timer', () => {
    vi.useFakeTimers()
    const handle = new MockHandle(DEF)
    const battBefore = handle.state.battery
    handle.disconnect()
    vi.advanceTimersByTime(120_000) // 2 minutes
    expect(handle.state.battery).toBe(battBefore) // unchanged after disconnect
    vi.useRealTimers()
  })
})

// ── Battery drain simulation ──────────────────────────────────────────────────

describe('MockHandle battery drain', () => {
  it('decrements battery every 60 seconds while connected', () => {
    vi.useFakeTimers()
    const handle = new MockHandle(DEF)
    const initial = handle.state.battery!
    vi.advanceTimersByTime(60_000)
    expect(handle.state.battery).toBeCloseTo(initial - 0.1, 1)
    handle.disconnect()
    vi.useRealTimers()
  })
})

// ── Current simulation ────────────────────────────────────────────────────────

describe('MockHandle current simulation', () => {
  it('sets current > 0 when powered on, every 2 seconds', () => {
    vi.useFakeTimers()
    const handle = new MockHandle(DEF)
    vi.advanceTimersByTime(2_000)
    expect(handle.state.current).toBeGreaterThan(0)
    handle.disconnect()
    vi.useRealTimers()
  })

  it('sets current to 0 when powered off', async () => {
    vi.useFakeTimers()
    const handle = new MockHandle(DEF)
    await handle.setPower(false)
    vi.advanceTimersByTime(2_000)
    expect(handle.state.current).toBe(0)
    handle.disconnect()
    vi.useRealTimers()
  })
})

// ── mockConnectResult ─────────────────────────────────────────────────────────

describe('mockConnectResult', () => {
  it('returns a ConnectResult with the correct id and name', () => {
    vi.useFakeTimers()
    const handle = new MockHandle(DEF)
    const result = mockConnectResult(DEF, handle)
    expect(result.id).toBe(DEF.id)
    expect(result.name).toBe(DEF.name)
    handle.disconnect()
    vi.useRealTimers()
  })

  it('includes the handle reference', () => {
    vi.useFakeTimers()
    const handle = new MockHandle(DEF)
    const result = mockConnectResult(DEF, handle)
    expect(result.handle).toBe(handle)
    handle.disconnect()
    vi.useRealTimers()
  })

  it('snapshots initialState from handle.state at call time', () => {
    vi.useFakeTimers()
    const handle = new MockHandle(DEF)
    const result = mockConnectResult(DEF, handle)
    expect(result.initialState.brightness).toBe(handle.state.brightness)
    expect(result.initialState.color).toBe(handle.state.color)
    handle.disconnect()
    vi.useRealTimers()
  })
})

// ── MOCK_DEVICES catalogue ────────────────────────────────────────────────────

describe('MOCK_DEVICES', () => {
  it('has at least 4 entries', () => {
    expect(MOCK_DEVICES.length).toBeGreaterThanOrEqual(4)
  })

  it('all entries have unique ids', () => {
    const ids = MOCK_DEVICES.map(d => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all entries have ledCount > 0', () => {
    MOCK_DEVICES.forEach(d => expect(d.ledCount).toBeGreaterThan(0))
  })

  it('all entries have a themeColor', () => {
    MOCK_DEVICES.forEach(d => expect(d.themeColor).toMatch(/^#[0-9a-fA-F]{6}$/))
  })
})
