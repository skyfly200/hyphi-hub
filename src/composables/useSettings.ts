import { ref, watch } from 'vue'

const SETTINGS_KEY = 'hyphi-hub:settings'

function load(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') } catch { return {} }
}

function save(patch: Record<string, unknown>) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...load(), ...patch }))
}

const _saved = load()

export const wledBetaEnabled = ref<boolean>((_saved.wledBetaEnabled as boolean) ?? false)

watch(wledBetaEnabled, val => save({ wledBetaEnabled: val }))
