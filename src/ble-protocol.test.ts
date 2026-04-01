import { describe, it, expect } from 'vitest'
import {
  encodeColor,
  encodeSpeed,
  encodeCycleTime,
  encodeFloat,
  encodeByte,
  encodeCurrentTime,
  decodeString,
  decodeUint8,
  decodeInt16,
  decodeCurrent,
  decodeSpeed,
} from './ble-protocol'

// ── encodeColor ───────────────────────────────────────────────────────────────

describe('encodeColor', () => {
  it('strips # and uppercases hex', () => {
    const bytes = encodeColor('#ff6b35')
    expect(new TextDecoder().decode(bytes)).toBe('FF6B35')
  })

  it('works without leading #', () => {
    const bytes = encodeColor('7b5cfa')
    expect(new TextDecoder().decode(bytes)).toBe('7B5CFA')
  })

  it('pads short strings to 6 chars', () => {
    const bytes = encodeColor('#fff')
    expect(bytes).toHaveLength(6)
  })

  it('truncates to 6 chars', () => {
    const bytes = encodeColor('#aabbccdd')
    expect(bytes).toHaveLength(6)
    expect(new TextDecoder().decode(bytes)).toBe('AABBCC')
  })

  it('encodes black', () => {
    expect(new TextDecoder().decode(encodeColor('#000000'))).toBe('000000')
  })

  it('encodes white', () => {
    expect(new TextDecoder().decode(encodeColor('#ffffff'))).toBe('FFFFFF')
  })
})

// ── encodeSpeed ───────────────────────────────────────────────────────────────

describe('encodeSpeed', () => {
  it('encodes as 4-byte little-endian uint32', () => {
    const bytes = encodeSpeed(5000)
    expect(bytes).toHaveLength(4)
    const view = new DataView(bytes.buffer)
    expect(view.getUint32(0, true)).toBe(5000)
  })

  it('encodes zero', () => {
    const bytes = encodeSpeed(0)
    expect(new DataView(bytes.buffer).getUint32(0, true)).toBe(0)
  })

  it('encodes max uint32', () => {
    const max = 0xffffffff
    const bytes = encodeSpeed(max)
    expect(new DataView(bytes.buffer).getUint32(0, true)).toBe(max)
  })

  it('encodes 65535 correctly (speed slider max region)', () => {
    const bytes = encodeSpeed(65535)
    expect(new DataView(bytes.buffer).getUint32(0, true)).toBe(65535)
  })
})

// ── encodeCycleTime ───────────────────────────────────────────────────────────

describe('encodeCycleTime', () => {
  it('encodes seconds as ASCII decimal', () => {
    expect(new TextDecoder().decode(encodeCycleTime(15))).toBe('15')
  })

  it('encodes 300 (max)', () => {
    expect(new TextDecoder().decode(encodeCycleTime(300))).toBe('300')
  })

  it('encodes 5 (min)', () => {
    expect(new TextDecoder().decode(encodeCycleTime(5))).toBe('5')
  })
})

// ── encodeFloat ───────────────────────────────────────────────────────────────

describe('encodeFloat', () => {
  it('encodes to 4 decimal places', () => {
    expect(new TextDecoder().decode(encodeFloat(1.5))).toBe('1.5000')
  })

  it('encodes 0.0', () => {
    expect(new TextDecoder().decode(encodeFloat(0))).toBe('0.0000')
  })

  it('encodes negative thresholds', () => {
    const str = new TextDecoder().decode(encodeFloat(-0.5))
    expect(str).toBe('-0.5000')
  })

  it('truncates extra precision', () => {
    const str = new TextDecoder().decode(encodeFloat(1.123456789))
    expect(str).toBe('1.1235')
  })
})

// ── encodeByte ────────────────────────────────────────────────────────────────

describe('encodeByte', () => {
  it('returns a 1-byte Uint8Array', () => {
    expect(encodeByte(255)).toHaveLength(1)
    expect(encodeByte(255)[0]).toBe(255)
  })

  it('encodes 0 (power off)', () => {
    expect(encodeByte(0)[0]).toBe(0)
  })

  it('encodes 1 (power on)', () => {
    expect(encodeByte(1)[0]).toBe(1)
  })

  it('masks to uint8 (wraps at 256)', () => {
    expect(encodeByte(256)[0]).toBe(0)
    expect(encodeByte(257)[0]).toBe(1)
  })
})

// ── encodeCurrentTime ─────────────────────────────────────────────────────────

describe('encodeCurrentTime', () => {
  it('returns a 10-byte buffer', () => {
    expect(encodeCurrentTime()).toHaveLength(10)
  })

  it('encodes year as little-endian uint16 at bytes 0–1', () => {
    const date = new Date(2026, 0, 15, 10, 30, 45, 500)
    const buf = encodeCurrentTime(date)
    const dv = new DataView(buf.buffer)
    expect(dv.getUint16(0, true)).toBe(2026)
  })

  it('encodes month (1-based)', () => {
    const date = new Date(2026, 3, 1) // April → month 4
    expect(encodeCurrentTime(date)[2]).toBe(4)
  })

  it('encodes day', () => {
    const date = new Date(2026, 0, 15)
    expect(encodeCurrentTime(date)[3]).toBe(15)
  })

  it('encodes weekday as ISO (Mon=1, Sun=7)', () => {
    // 2026-03-30 is a Monday
    const monday = new Date(2026, 2, 30)
    expect(encodeCurrentTime(monday)[7]).toBe(1)
    // 2026-03-29 is a Sunday
    const sunday = new Date(2026, 2, 29)
    expect(encodeCurrentTime(sunday)[7]).toBe(7)
  })

  it('encodes milliseconds as frac256 in byte 8', () => {
    const date = new Date(2026, 0, 1, 0, 0, 0, 500)  // 500ms → ~128
    const frac = encodeCurrentTime(date)[8]
    expect(frac).toBeCloseTo(128, 0)
  })

  it('sets adjust byte to 0', () => {
    expect(encodeCurrentTime()[9]).toBe(0)
  })
})

// ── decodeString ──────────────────────────────────────────────────────────────

describe('decodeString', () => {
  it('decodes UTF-8 bytes to string', () => {
    const bytes = new TextEncoder().encode('Hyphae')
    expect(decodeString(new DataView(bytes.buffer))).toBe('Hyphae')
  })
})

// ── decodeUint8 ───────────────────────────────────────────────────────────────

describe('decodeUint8', () => {
  it('reads first byte', () => {
    const bytes = new Uint8Array([204, 0])
    expect(decodeUint8(new DataView(bytes.buffer))).toBe(204)
  })
})

// ── decodeInt16 ───────────────────────────────────────────────────────────────

describe('decodeInt16', () => {
  it('converts raw int16 (unit 0.01°C) to degrees', () => {
    // 2500 raw → 25.00°C
    const buf = new ArrayBuffer(2)
    new DataView(buf).setInt16(0, 2500, true)
    expect(decodeInt16(new DataView(buf))).toBeCloseTo(25.0)
  })

  it('handles negative temperature', () => {
    const buf = new ArrayBuffer(2)
    new DataView(buf).setInt16(0, -500, true) // -5.00°C
    expect(decodeInt16(new DataView(buf))).toBeCloseTo(-5.0)
  })
})

// ── decodeCurrent ─────────────────────────────────────────────────────────────

describe('decodeCurrent', () => {
  it('parses ASCII float from DataView', () => {
    const bytes = new TextEncoder().encode('123.45')
    expect(decodeCurrent(new DataView(bytes.buffer))).toBeCloseTo(123.45)
  })

  it('returns NaN for empty buffer (parseFloat of empty string)', () => {
    const bytes = new TextEncoder().encode('')
    expect(decodeCurrent(new DataView(bytes.buffer))).toBeNaN()
  })
})

// ── decodeSpeed ───────────────────────────────────────────────────────────────

describe('decodeSpeed', () => {
  it('reads little-endian uint32', () => {
    const buf = new ArrayBuffer(4)
    new DataView(buf).setUint32(0, 5000, true)
    expect(decodeSpeed(new DataView(buf))).toBe(5000)
  })

  it('returns 5000 for null input', () => {
    expect(decodeSpeed(null)).toBe(5000)
  })

  it('returns 5000 when buffer is too short', () => {
    const buf = new ArrayBuffer(2)
    expect(decodeSpeed(new DataView(buf))).toBe(5000)
  })
})
