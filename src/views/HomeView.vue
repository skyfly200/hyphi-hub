<template>
  <div class="app-shell">

    <!-- ── Status bar ── -->
    <div class="status-bar">
      <div class="status-left">
        <span class="app-logo">
          <svg width="18" height="18" viewBox="-82 -82 164 164">
            <defs>
              <radialGradient id="sg" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stop-color="#c87fff"/>
                <stop offset="100%" stop-color="#4a0080"/>
              </radialGradient>
            </defs>
            <g fill="url(#sg)">
              <circle cx="0" cy="2" r="8.5"/>
              <circle cx="-3" cy="2.2" r="8.7"/>
              <circle cx="-5" cy="-3.4" r="8.8"/>
              <circle cx="2" cy="-7.7" r="9"/>
              <circle cx="10" cy="-1.4" r="9.1"/>
            </g>
          </svg>
        </span>
        <span class="app-name">HYPHI HUB</span>
      </div>
      <div class="status-right">
        <span class="status-indicator" :class="connectedCount > 0 ? 'connected' : 'idle'">
          {{ connectedCount > 0 ? `${connectedCount} CONNECTED` : 'NO DEVICES' }}
        </span>
        <button class="btn-status-scan pulse-glow" v-if="connectedCount === 0" @click="showScan = true">
          SCAN
        </button>
        <button class="btn-status-add" v-else @click="showScan = true">+</button>
      </div>
    </div>

    <!-- ── Main layout ── -->
    <div class="main-layout">

      <!-- ── Devices drawer ── -->
      <div class="devices-drawer" :class="{ open: drawerOpen }">
        <div class="drawer-header">
          <span class="drawer-title">DEVICES</span>
          <span class="drawer-count" v-if="store.devices.length">{{ store.devices.length }}</span>
          <button class="drawer-close" @click="drawerOpen = false">✕</button>
        </div>
        <div class="devices-grid">
          <div
            v-for="dev in store.devices"
            :key="dev.info.id"
            class="device-card"
            :class="{ active: store.activeId === dev.info.id, offline: !dev.state.value.connected }"
            @click="selectDevice(dev.info.id)"
          >
            <div class="device-card-top">
              <div class="device-card-name">{{ dev.info.name }}</div>
              <div class="device-card-type">{{ dev.info.type }}</div>
            </div>
            <div class="device-card-bottom">
              <span class="device-status-dot" :class="dev.state.value.connected ? 'on' : 'off'" />
              <span class="device-card-batt" v-if="dev.info.hasBattery && dev.state.value.battery !== null">
                {{ Math.round(dev.state.value.battery) }}%
              </span>
              <button
                v-if="dev.state.value.connected"
                class="btn-disconnect"
                @click.stop="store.disconnect(dev.info.id)"
              >DC</button>
              <button
                v-else
                class="btn-reconnect"
                @click.stop="store.reconnect(dev.info.id)"
              >RECONNECT</button>
            </div>
          </div>
          <button class="device-card-add" @click="showScan = true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
            ADD DEVICE
          </button>
        </div>
      </div>

      <!-- ── Control panel ── -->
      <div class="control-panel" :class="{ visible: !!activeDev }">

        <!-- No device -->
        <div class="no-device-state" v-if="!activeDev">
          <div class="no-device-icon">⚡</div>
          <div class="no-device-msg">No device selected</div>
          <div class="no-device-sub">Scan for a device to get started</div>
          <button class="btn-scan pulse-glow" @click="showScan = true">SCAN FOR DEVICES</button>
        </div>

        <template v-if="activeDev">
          <!-- Device header -->
          <div class="panel-header">
            <button class="btn-drawer-toggle" @click="drawerOpen = !drawerOpen">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <div>
              <div class="panel-title">{{ activeDev.info.name }}</div>
              <div class="panel-subtitle">{{ activeDev.info.type }} · {{ activeDev.info.ledCount }}px</div>
              <div class="panel-battery" v-if="activeDev.info.hasBattery && ds.battery !== null">
                🔋 {{ Math.round(ds.battery) }}%
              </div>
            </div>
            <div class="panel-power-wrap">
              <span class="power-label">POWER</span>
              <button
                class="power-toggle"
                :class="{ on: ds.power }"
                @click="store.togglePower(activeDev.info.id)"
              />
            </div>
          </div>

          <!-- Controls grid -->
          <div class="controls-grid">

            <!-- Color -->
            <div class="control-block">
              <div class="control-label">
                Color
                <span class="control-value">{{ ds.color?.toUpperCase() }}</span>
              </div>
              <div class="color-picker-row">
                <input type="color" :value="ds.color" @input="onColorChange($event.target.value)" />
              </div>

              <!-- Color presets (quick swatches) -->
              <div class="color-presets">
                <button
                  v-for="preset in colorPresets"
                  :key="preset"
                  class="preset-swatch"
                  :class="{ selected: ds.color === preset }"
                  :style="`--swatch-color:${preset}`"
                  @click="onColorChange(preset)"
                />
              </div>
            </div>

            <!-- Brightness + Speed -->
            <div class="control-block">
              <div class="control-label">
                Brightness
                <span class="control-value">{{ Math.round((ds.brightness/255)*100) }}%</span>
              </div>
              <input type="range" class="slider" min="0" max="255" :value="ds.brightness"
                @input="store.setBrightness(activeDev.info.id, +$event.target.value)" />

              <div class="control-label" style="margin-top:14px">
                Speed
                <span class="control-value">{{ speedLabel }}</span>
              </div>
              <input type="range" class="slider" min="100" max="30000" :value="ds.speed"
                @input="store.setSpeed(activeDev.info.id, +$event.target.value)" />
            </div>

            <!-- Effect mode -->
            <div class="control-block full">
              <div class="control-label">Effect Mode</div>
              <div class="effect-grid">
                <button
                  v-for="fx in effectSlots"
                  :key="fx.mode"
                  class="effect-btn"
                  :class="{ active: ds.mode === fx.mode }"
                  @click="store.setMode(activeDev.info.id, fx.mode)"
                >
                  <span class="fx-icon">{{ fx.icon }}</span>
                  <span class="fx-name">{{ fx.name }}</span>
                </button>
              </div>
            </div>

          </div><!-- /controls-grid -->

          <!-- Auto cycle -->
          <div class="control-block full adv-block">
            <div class="control-label">
              Auto Cycle
              <button
                class="toggle-small"
                :class="{ on: ds.autoCycle }"
                @click="store.setAutoCycle(activeDev.info.id, !ds.autoCycle)"
              />
            </div>
            <div class="adv-sub" :class="{ enabled: ds.autoCycle }">
              <div class="adv-row">
                <span class="adv-row-label">Cycle every</span>
                <div class="stepper">
                  <button @click="adjustCycle(-5)">−</button>
                  <span>{{ ds.cycleTime }}s</span>
                  <button @click="adjustCycle(5)">+</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Audio responsive (only if device supports it) -->
          <div class="control-block full adv-block" v-if="activeDev.info.hasAudio">
            <div class="control-label">
              Audio Responsive
              <button
                class="toggle-small"
                :class="{ on: ds.audioReactive }"
                @click="store.setAudioReactive(activeDev.info.id, !ds.audioReactive)"
              />
            </div>
            <div class="adv-sub" :class="{ enabled: ds.audioReactive }">
              <div class="adv-row">
                <span class="adv-row-label">Damping</span>
                <input type="range" class="slider" style="flex:1" min="0" max="255" :value="ds.damping"
                  @input="store.setDamping(activeDev.info.id, +$event.target.value)" />
                <span class="adv-row-value">{{ ds.damping }}</span>
              </div>
              <div class="adv-row" style="margin-top:10px">
                <span class="adv-row-label">Auto threshold</span>
                <button
                  class="toggle-small"
                  :class="{ on: ds.autoThreshold }"
                  @click="toggleAutoThreshold"
                />
              </div>
            </div>
          </div>

          <!-- Device stats -->
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">CURRENT</span>
              <span class="stat-value">{{ Math.round(ds.current) }} mA</span>
            </div>
            <div class="stat-item" v-if="ds.temp !== null && ds.temp !== undefined">
              <span class="stat-label">TEMP</span>
              <span class="stat-value">{{ ds.temp?.toFixed(1) }}°C</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">FW</span>
              <span class="stat-value">{{ ds.firmware }}</span>
            </div>
          </div>

          <!-- BLE Log -->
          <div class="log-accordion" :class="{ open: logOpen }">
            <button class="log-toggle" @click="logOpen = !logOpen">
              <span class="log-toggle-left">
                BLE LOG
                <span class="log-count">{{ activeDev.logs.length }}</span>
              </span>
              <svg class="log-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <div class="ble-log">
              <div class="ble-log-inner" ref="logInnerRef">
                <div
                  v-for="(entry, i) in store.globalLogs"
                  :key="i"
                  class="log-entry"
                >
                  <span class="log-time">{{ entry.time }}</span>
                  <span :class="`log-${entry.type}`">{{ entry.msg }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Settings -->
          <div class="log-accordion" :class="{ open: settingsOpen }">
            <button class="log-toggle" @click="settingsOpen = !settingsOpen">
              <span class="log-toggle-left">SETTINGS</span>
              <svg class="log-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <div class="ble-log">
              <div class="ble-log-inner" style="padding:16px 0">
                <div class="control-label">
                  Gamma
                  <span class="control-value">{{ ds.gamma?.toFixed(1) }}</span>
                </div>
                <input type="range" class="slider" style="margin-top:8px; width:100%" min="1.0" max="4.0" step="0.1"
                  :value="ds.gamma"
                  @input="ds.gamma = +$event.target.value" />
                <div style="margin-top:16px">
                  <div class="control-label" style="margin-bottom:6px">Device Info</div>
                  <div class="info-row"><span>Model</span><span>{{ ds.model }}</span></div>
                  <div class="info-row"><span>Manufacturer</span><span>{{ ds.manufacturer }}</span></div>
                  <div class="info-row"><span>Firmware</span><span>{{ ds.firmware }}</span></div>
                  <div class="info-row"><span>LEDs</span><span>{{ activeDev.info.ledCount }}× {{ activeDev.info.ledType }}</span></div>
                  <div class="info-row"><span>Voltage</span><span>{{ activeDev.info.voltage }}V</span></div>
                </div>
              </div>
            </div>
          </div>

        </template><!-- /activeDev -->
      </div><!-- /control-panel -->
    </div><!-- /main-layout -->

    <!-- Scan modal -->
    <ScanModal v-model="showScan" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useDeviceStore } from '@/stores/deviceStore'
import ScanModal from '@/components/ScanModal.vue'

const store      = useDeviceStore()
const showScan   = ref(false)
const drawerOpen = ref(false)
const logOpen    = ref(false)
const settingsOpen = ref(false)
const logInnerRef  = ref(null)

const connectedCount = computed(() => store.connectedCount)
const activeDev      = computed(() => store.activeDevice)
const ds             = computed(() => activeDev.value?.state?.value || {})

const speedLabel = computed(() => {
  const s = ds.value?.speed || 5000
  return s < 1000 ? `${s}ms` : `${(s/1000).toFixed(1)}s`
})

function selectDevice(id) {
  store.setActive(id)
  drawerOpen.value = false
}

function onColorChange(hex) {
  store.setColor(activeDev.value?.info.id, hex)
}

function adjustCycle(delta) {
  const id = activeDev.value?.info.id
  if (!id) return
  const next = Math.max(5, Math.min(300, (ds.value.cycleTime || 15) + delta))
  store.setCycleTime(id, next)
}

function toggleAutoThreshold() {
  const dev = activeDev.value
  if (!dev) return
  const next = !ds.value.autoThreshold
  ds.value.autoThreshold = next
  dev.handle?.setAutoThreshold(next)
}

// Auto-scroll log
watch(() => store.globalLogs.length, async () => {
  if (!logOpen.value) return
  await nextTick()
  if (logInnerRef.value) logInnerRef.value.scrollTop = logInnerRef.value.scrollHeight
})

// ── Effect slots (subset of WS2812FX modes) ─────────────────────────────
const effectSlots = [
  { mode: 0,  name: 'Static',    icon: '◼' },
  { mode: 1,  name: 'Blink',     icon: '◈' },
  { mode: 2,  name: 'Breath',    icon: '◉' },
  { mode: 3,  name: 'Color Wipe',icon: '▶' },
  { mode: 9,  name: 'Rainbow',   icon: '◌' },
  { mode: 16, name: 'Sparkle',   icon: '✦' },
  { mode: 58, name: 'Larson',    icon: '◀▶' },
  { mode: 38, name: 'Fire',      icon: '🔥' },
  { mode: 44, name: 'Twinkle',   icon: '✧' },
  { mode: 26, name: 'Theater',   icon: '◎' },
  { mode: 45, name: 'Chase',     icon: '⟳' },
  { mode: 65, name: 'Comet',     icon: '☄' },
]

const colorPresets = [
  '#ff6b35','#ff3355','#ff9500','#ffee00',
  '#39ff14','#00ffcc','#0099ff','#7b5cfa',
  '#ff00ff','#ffffff','#ff8080','#80ffff',
]
</script>

<style>
/* ── Global reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:       #0a0a0f;
  --surface:  #111118;
  --panel:    #16161f;
  --border:   #2a2a3a;
  --muted:    #3a3a50;
  --sub:      #6060a0;
  --text:     #e8e8f0;
  --accent:   #ff6b35;
  --accent2:  #7b5cfa;
  --connected:#3dffc0;
  --font-mono:'DM Mono', monospace;
  --font-disp:'Bebas Neue', sans-serif;
}
body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100dvh; overflow: hidden; }
input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: var(--border); outline: none; cursor: pointer; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--text); border: 2px solid var(--accent2); }
input[type=color] { -webkit-appearance: none; width: 44px; height: 44px; border: none; border-radius: 50%; cursor: pointer; background: none; padding: 0; }
input[type=color]::-webkit-color-swatch-wrapper { padding: 0; }
input[type=color]::-webkit-color-swatch { border-radius: 50%; border: 2px solid var(--border); }
button { cursor: pointer; }
</style>

<style scoped>
.app-shell { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }

/* Status bar */
.status-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; border-bottom: 1px solid var(--border);
  background: var(--surface); flex-shrink: 0;
}
.status-left   { display: flex; align-items: center; gap: 8px; }
.app-logo      { display: flex; align-items: center; }
.app-name      { font-family: var(--font-disp); font-size: 18px; letter-spacing: 3px; color: var(--text); }
.status-right  { display: flex; align-items: center; gap: 8px; }
.status-indicator {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 2px;
  padding: 3px 8px; border-radius: 20px; border: 1px solid var(--muted); color: var(--sub);
}
.status-indicator.connected { border-color: var(--connected); color: var(--connected); }
.btn-status-scan, .btn-status-add {
  padding: 4px 10px; border-radius: 6px; border: 1px solid var(--accent2);
  background: transparent; color: var(--accent2);
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 2px;
}
.pulse-glow { animation: pulse 2s ease-in-out infinite; }
@keyframes pulse {
  0%,100% { box-shadow: 0 0 4px var(--accent2); }
  50%      { box-shadow: 0 0 14px var(--accent2); }
}

/* Main layout */
.main-layout { display: flex; flex: 1; overflow: hidden; position: relative; }

/* Devices drawer */
.devices-drawer {
  position: absolute; left: 0; top: 0; bottom: 0; z-index: 100;
  width: 280px; background: var(--panel);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  transform: translateX(-100%); transition: transform .3s ease;
}
.devices-drawer.open { transform: translateX(0); }
.drawer-header {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.drawer-title { font-family: var(--font-mono); font-size: 10px; letter-spacing: 3px; color: var(--sub); flex: 1; }
.drawer-count { background: var(--muted); color: var(--bg); font-family: var(--font-mono); font-size: 9px; padding: 1px 6px; border-radius: 8px; }
.drawer-close  { background: none; border: none; color: var(--sub); font-size: 14px; }

.devices-grid { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }

.device-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 12px; cursor: pointer;
  transition: all .2s; flex-shrink: 0;
}
.device-card:hover   { border-color: var(--accent2); }
.device-card.active  { border-color: var(--connected); }
.device-card.offline { opacity: .5; }
.device-card-top     { margin-bottom: 8px; }
.device-card-name    { font-family: var(--font-disp); font-size: 15px; letter-spacing: 1px; }
.device-card-type    { font-family: var(--font-mono); font-size: 9px; color: var(--sub); letter-spacing: 1px; margin-top: 2px; }
.device-card-bottom  { display: flex; align-items: center; gap: 6px; }
.device-status-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.device-status-dot.on  { background: var(--connected); box-shadow: 0 0 6px var(--connected); }
.device-status-dot.off { background: var(--muted); }
.device-card-batt    { font-family: var(--font-mono); font-size: 9px; color: var(--sub); margin-left: auto; }
.btn-disconnect, .btn-reconnect {
  margin-left: auto; padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 8px;
  letter-spacing: 1px; border: 1px solid; background: transparent;
}
.btn-disconnect  { border-color: #ff5577; color: #ff5577; }
.btn-reconnect   { border-color: var(--accent2); color: var(--accent2); }
.device-card-add {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 16px; border-radius: 10px; border: 1px dashed var(--border);
  background: transparent; color: var(--sub);
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 2px;
  transition: all .2s;
}
.device-card-add:hover { border-color: var(--accent2); color: var(--accent2); }

/* Control panel */
.control-panel {
  flex: 1; overflow-y: auto;
  padding: 0; display: flex; flex-direction: column;
}

.no-device-state {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 40px;
}
.no-device-icon { font-size: 48px; opacity: .3; }
.no-device-msg  { font-family: var(--font-disp); font-size: 22px; letter-spacing: 2px; color: var(--sub); }
.no-device-sub  { font-family: var(--font-mono); font-size: 11px; color: var(--muted); text-align: center; }
.btn-scan {
  padding: 10px 24px; border-radius: 8px; border: 1px solid var(--accent2);
  background: transparent; color: var(--accent2);
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 2px;
  margin-top: 8px;
}

.panel-header {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 20px; border-bottom: 1px solid var(--border);
  background: var(--surface); flex-shrink: 0; position: sticky; top: 0; z-index: 10;
}
.btn-drawer-toggle { background: none; border: none; color: var(--sub); display: flex; align-items: center; }
.btn-drawer-toggle:hover { color: var(--text); }
.panel-title    { font-family: var(--font-disp); font-size: 20px; letter-spacing: 2px; }
.panel-subtitle { font-family: var(--font-mono); font-size: 9px; color: var(--sub); letter-spacing: 1px; margin-top: 2px; }
.panel-battery  { font-family: var(--font-mono); font-size: 9px; color: var(--connected); margin-top: 2px; }
.panel-power-wrap { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.power-label { font-family: var(--font-mono); font-size: 9px; color: var(--sub); letter-spacing: 2px; }
.power-toggle {
  width: 36px; height: 20px; border-radius: 10px;
  border: 1.5px solid var(--muted); background: transparent;
  position: relative; transition: all .2s; cursor: pointer;
}
.power-toggle::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 13px; height: 13px; border-radius: 50%;
  background: var(--muted); transition: all .3s;
}
.power-toggle.on { border-color: var(--connected); }
.power-toggle.on::after { background: var(--connected); transform: translateX(16px); box-shadow: 0 0 8px var(--connected); }

/* Controls grid */
.controls-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1px; background: var(--border); flex-shrink: 0;
}
.control-block {
  background: var(--panel); padding: 16px 20px;
}
.control-block.full { grid-column: 1 / -1; }
.control-label {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 2px;
  color: var(--sub); display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.control-value { color: var(--text); }
.slider { width: 100%; }

/* Color presets */
.color-picker-row { display: flex; align-items: center; gap: 12px; }
.color-presets    { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.preset-swatch {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--swatch-color, #888);
  border: 2px solid transparent; cursor: pointer;
  transition: all .15s;
}
.preset-swatch.selected, .preset-swatch:hover { border-color: rgba(255,255,255,.6); transform: scale(1.15); }

/* Effect grid */
.effect-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px; }
.effect-btn {
  padding: 8px 6px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--surface);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer; transition: all .18s;
}
.effect-btn.active { border-color: var(--accent); background: rgba(255,107,53,.1); }
.effect-btn:hover  { border-color: var(--accent2); }
.fx-icon { font-size: 14px; }
.fx-name { font-family: var(--font-mono); font-size: 8px; color: var(--sub); letter-spacing: 1px; text-align: center; }

/* Advanced blocks */
.adv-block { border-top: 1px solid var(--border); padding: 14px 20px; }
.adv-sub {
  display: grid; grid-template-rows: 0fr; overflow: hidden;
  transition: grid-template-rows .35s ease;
}
.adv-sub.enabled { grid-template-rows: 1fr; }
.adv-sub > * { overflow: hidden; }
.adv-row { display: flex; align-items: center; gap: 10px; padding-top: 10px; }
.adv-row-label { font-family: var(--font-mono); font-size: 10px; color: var(--sub); letter-spacing: 1px; white-space: nowrap; }
.adv-row-value { font-family: var(--font-mono); font-size: 10px; color: var(--text); min-width: 32px; text-align: right; }
.stepper { display: flex; align-items: center; gap: 6px; }
.stepper button {
  width: 24px; height: 24px; border-radius: 6px;
  border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 14px;
}
.stepper span { font-family: var(--font-mono); font-size: 12px; min-width: 40px; text-align: center; }

/* Toggle small */
.toggle-small {
  width: 28px; height: 16px; border-radius: 8px;
  border: 1.5px solid var(--muted); background: transparent;
  position: relative; cursor: pointer; flex-shrink: 0;
  transition: all .2s;
}
.toggle-small::after {
  content: ''; position: absolute; top: 1px; left: 1px;
  width: 11px; height: 11px; border-radius: 50%;
  background: var(--muted); transition: all .25s;
}
.toggle-small.on { border-color: var(--connected); }
.toggle-small.on::after { background: var(--connected); transform: translateX(12px); }

/* Stats row */
.stats-row {
  display: flex; gap: 1px; background: var(--border);
  border-top: 1px solid var(--border); flex-shrink: 0;
}
.stat-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: 4px; padding: 10px; background: var(--panel);
}
.stat-label { font-family: var(--font-mono); font-size: 8px; color: var(--muted); letter-spacing: 2px; }
.stat-value { font-family: var(--font-mono); font-size: 13px; color: var(--text); }

/* Info rows */
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 0; border-bottom: 1px solid var(--border);
  font-family: var(--font-mono); font-size: 10px;
}
.info-row span:first-child { color: var(--sub); }
.info-row span:last-child  { color: var(--text); }

/* Log accordion */
.log-accordion { border-top: 1px solid var(--border); }
.log-toggle {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 11px 20px; background: var(--surface); border: none;
  color: var(--sub); font-family: var(--font-mono); font-size: 10px; letter-spacing: 3px;
  cursor: pointer; transition: background .2s;
}
.log-toggle:hover { background: var(--panel); }
.log-toggle-left { display: flex; align-items: center; gap: 8px; }
.log-count { background: var(--muted); color: var(--bg); font-size: 9px; padding: 1px 5px; border-radius: 6px; }
.log-chevron { transition: transform .35s ease; color: var(--muted); }
.log-accordion.open .log-chevron { transform: rotate(180deg); }
.ble-log {
  background: var(--surface); border-top: 1px solid var(--border);
  display: grid; grid-template-rows: 0fr; transition: grid-template-rows .4s ease;
}
.log-accordion.open .ble-log { grid-template-rows: 1fr; }
.ble-log-inner { overflow: hidden; padding: 0 20px; max-height: 160px; overflow-y: auto; }
.log-entry { display: flex; gap: 12px; padding: 2px 0; font-family: var(--font-mono); font-size: 11px; line-height: 1.8; }
.log-time    { color: var(--muted); flex-shrink: 0; }
.log-ok      { color: var(--connected); }
.log-err     { color: #ff5577; }
.log-info    { color: var(--accent2); }

/* Scrollbar */
::-webkit-scrollbar       { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
</style>
