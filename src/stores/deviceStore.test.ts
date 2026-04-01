import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDeviceStore } from './deviceStore'
import { MockHandle, mockConnectResult, MOCK_DEVICES } from '@/composables/useMock'

const DEF = MOCK_DEVICES[0]  // Desk Strip

function addMockDevice(store: ReturnType<typeof useDeviceStore>, def = DEF) {
  const handle = new MockHandle(def)
  const result = mockConnectResult(def, handle)
  store._addDevicePublic(result)
  return { handle, result }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// ── Initial state ─────────────────────────────────────────────────────────────

describe('initial store state', () => {
  it('starts with no devices', () => {
    const store = useDeviceStore()
    expect(store.devices).toHaveLength(0)
  })

  it('starts with no active device', () => {
    const store = useDeviceStore()
    expect(store.activeId).toBeNull()
    expect(store.activeDevice).toBeNull()
  })

  it('connectedCount is 0', () => {
    const store = useDeviceStore()
    expect(store.connectedCount).toBe(0)
  })

  it('globalLogs has a ready message', () => {
    const store = useDeviceStore()
    expect(store.globalLogs.length).toBeGreaterThan(0)
    expect(store.globalLogs[0].msg).toMatch(/ready/i)
  })
})

// ── connectMock / _addDevice ──────────────────────────────────────────────────

describe('connectMock', () => {
  it('adds a device entry', () => {
    const store = useDeviceStore()
    store.connectMock(DEF)
    expect(store.devices).toHaveLength(1)
  })

  it('sets the new device as active', () => {
    const store = useDeviceStore()
    store.connectMock(DEF)
    expect(store.activeId).toBe(DEF.id)
  })

  it('populates device info from def', () => {
    const store = useDeviceStore()
    store.connectMock(DEF)
    const info = store.devices[0].info
    expect(info.id).toBe(DEF.id)
    expect(info.name).toBe(DEF.name)
    expect(info.ledCount).toBe(DEF.ledCount)
    expect(info.hasAudio).toBe(DEF.hasAudio)
  })

  it('does not add the same device twice', () => {
    const store = useDeviceStore()
    store.connectMock(DEF)
    store.connectMock(DEF)
    expect(store.devices).toHaveLength(1)
  })

  it('increments connectedCount', () => {
    const store = useDeviceStore()
    store.connectMock(DEF)
    expect(store.connectedCount).toBe(1)
  })

  it('logs a connection ok message', () => {
    const store = useDeviceStore()
    store.connectMock(DEF)
    const okLog = store.globalLogs.find(l => l.type === 'ok' && l.msg.includes('Connected'))
    expect(okLog).toBeDefined()
  })
})

// ── connectNextMock ───────────────────────────────────────────────────────────

describe('connectNextMock', () => {
  it('connects the first unused mock device', () => {
    const store = useDeviceStore()
    store.connectNextMock()
    expect(store.devices).toHaveLength(1)
  })

  it('connects a different device on second call', () => {
    const store = useDeviceStore()
    store.connectNextMock()
    store.connectNextMock()
    expect(store.devices).toHaveLength(2)
    expect(store.devices[0].info.id).not.toBe(store.devices[1].info.id)
  })
})

// ── activeDevice computed ─────────────────────────────────────────────────────

describe('activeDevice', () => {
  it('returns the device matching activeId', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    expect(store.activeDevice?.info.id).toBe(DEF.id)
  })

  it('returns null when activeId is unset', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.activeId = null
    expect(store.activeDevice).toBeNull()
  })
})

// ── setActive ─────────────────────────────────────────────────────────────────

describe('setActive', () => {
  it('switches the active device', () => {
    const store = useDeviceStore()
    addMockDevice(store, MOCK_DEVICES[0])
    addMockDevice(store, MOCK_DEVICES[1])
    store.setActive(MOCK_DEVICES[1].id)
    expect(store.activeId).toBe(MOCK_DEVICES[1].id)
  })
})

// ── togglePower ───────────────────────────────────────────────────────────────

describe('togglePower', () => {
  it('flips device power state', async () => {
    const store = useDeviceStore()
    addMockDevice(store)
    const initial = store.devices[0].state.power
    await store.togglePower(DEF.id)
    expect(store.devices[0].state.power).toBe(!initial)
  })

  it('calls handle.setPower', async () => {
    const store = useDeviceStore()
    const { handle } = addMockDevice(store)
    const spy = vi.spyOn(handle, 'setPower')
    await store.togglePower(DEF.id)
    expect(spy).toHaveBeenCalledOnce()
  })

  it('does nothing for unknown id', async () => {
    const store = useDeviceStore()
    await expect(store.togglePower('nonexistent')).resolves.toBeUndefined()
  })
})

// ── setBrightness ─────────────────────────────────────────────────────────────

describe('setBrightness', () => {
  it('updates state immediately', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.setBrightness(DEF.id, 128)
    expect(store.devices[0].state.brightness).toBe(128)
  })

  it('calls handle.setBrightness after debounce', async () => {
    const store = useDeviceStore()
    const { handle } = addMockDevice(store)
    const spy = vi.spyOn(handle, 'setBrightness')
    store.setBrightness(DEF.id, 64)
    expect(spy).not.toHaveBeenCalled()  // debounced
    vi.advanceTimersByTime(100)
    await Promise.resolve()
    expect(spy).toHaveBeenCalledWith(64)
  })
})

// ── setColor ──────────────────────────────────────────────────────────────────

describe('setColor', () => {
  it('updates state.color', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.setColor(DEF.id, '#3dffc0')
    expect(store.devices[0].state.color).toBe('#3dffc0')
  })
})

// ── setColor2 / setColor3 ─────────────────────────────────────────────────────

describe('setColor2 / setColor3', () => {
  it('updates state.color2 (UI-only)', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.setColor2(DEF.id, '#aabbcc')
    expect(store.devices[0].state.color2).toBe('#aabbcc')
  })

  it('updates state.color3 (UI-only)', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.setColor3(DEF.id, '#112233')
    expect(store.devices[0].state.color3).toBe('#112233')
  })
})

// ── setMode ───────────────────────────────────────────────────────────────────

describe('setMode', () => {
  it('updates state.mode and calls handle.setMode', () => {
    const store = useDeviceStore()
    const { handle } = addMockDevice(store)
    const spy = vi.spyOn(handle, 'setMode')
    store.setMode(DEF.id, 5)
    expect(store.devices[0].state.mode).toBe(5)
    expect(spy).toHaveBeenCalledWith(5)
  })
})

// ── setSpeed ──────────────────────────────────────────────────────────────────

describe('setSpeed', () => {
  it('updates state.speed', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.setSpeed(DEF.id, 2000)
    expect(store.devices[0].state.speed).toBe(2000)
  })
})

// ── setAutoCycle ──────────────────────────────────────────────────────────────

describe('setAutoCycle', () => {
  it('enables auto cycle', async () => {
    const store = useDeviceStore()
    addMockDevice(store)
    await store.setAutoCycle(DEF.id, true)
    expect(store.devices[0].state.autoCycle).toBe(true)
  })

  it('calls handle.setAutoCycle', async () => {
    const store = useDeviceStore()
    const { handle } = addMockDevice(store)
    const spy = vi.spyOn(handle, 'setAutoCycle')
    await store.setAutoCycle(DEF.id, true)
    expect(spy).toHaveBeenCalledWith(true)
  })
})

// ── Audio reactive controls ───────────────────────────────────────────────────

describe('audio reactive controls', () => {
  it('setAudioReactive updates state', async () => {
    const store = useDeviceStore()
    addMockDevice(store)
    await store.setAudioReactive(DEF.id, true)
    expect(store.devices[0].state.audioReactive).toBe(true)
  })

  it('setAutoThreshold updates state', async () => {
    const store = useDeviceStore()
    addMockDevice(store)
    await store.setAutoThreshold(DEF.id, false)
    expect(store.devices[0].state.autoThreshold).toBe(false)
  })

  it('setRelThreshold updates state', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.setRelThreshold(DEF.id, 2.0)
    expect(store.devices[0].state.relThreshold).toBe(2.0)
  })

  it('setDamping updates state', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.setDamping(DEF.id, 200)
    expect(store.devices[0].state.damping).toBe(200)
  })
})

// ── disconnect ────────────────────────────────────────────────────────────────

describe('disconnect', () => {
  it('marks device as disconnected', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.disconnect(DEF.id)
    expect(store.devices[0].state.connected).toBe(false)
  })

  it('logs an err entry', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.disconnect(DEF.id)
    const errLog = store.globalLogs.find(l => l.type === 'err' && l.msg.includes('Disconnected'))
    expect(errLog).toBeDefined()
  })

  it('clears activeId when active device is disconnected', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.disconnect(DEF.id)
    expect(store.activeId).toBeNull()
  })

  it('switches activeId to another connected device if available', () => {
    const store = useDeviceStore()
    addMockDevice(store, MOCK_DEVICES[0])
    addMockDevice(store, MOCK_DEVICES[1])
    store.setActive(MOCK_DEVICES[0].id)
    store.disconnect(MOCK_DEVICES[0].id)
    expect(store.activeId).toBe(MOCK_DEVICES[1].id)
  })

  it('is a no-op for unknown id', () => {
    const store = useDeviceStore()
    expect(() => store.disconnect('ghost')).not.toThrow()
  })
})

// ── removeDevice ──────────────────────────────────────────────────────────────

describe('removeDevice', () => {
  it('removes the device from the list', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.removeDevice(DEF.id)
    expect(store.devices).toHaveLength(0)
  })

  it('decrements connectedCount', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.removeDevice(DEF.id)
    expect(store.connectedCount).toBe(0)
  })
})

// ── log ───────────────────────────────────────────────────────────────────────

describe('log', () => {
  it('appends to globalLogs', () => {
    const store = useDeviceStore()
    const before = store.globalLogs.length
    store.log('test message', 'info')
    expect(store.globalLogs.length).toBe(before + 1)
    expect(store.globalLogs.at(-1)?.msg).toBe('test message')
  })

  it('appends to device logs when deviceId provided', () => {
    const store = useDeviceStore()
    addMockDevice(store)
    store.log('device message', 'ok', DEF.id)
    expect(store.devices[0].logs.some(l => l.msg === 'device message')).toBe(true)
  })

  it('caps globalLogs at 200 entries', () => {
    const store = useDeviceStore()
    for (let i = 0; i < 210; i++) store.log(`msg ${i}`, 'info')
    expect(store.globalLogs.length).toBeLessThanOrEqual(200)
  })
})
