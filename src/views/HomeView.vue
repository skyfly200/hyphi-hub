<template>
  <div class="app-shell">

    <!-- ── Header ── -->
    <header :class="{ mobile: isMobile }">
      <div class="logo">
        <svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="-82 -82 164 164">
          <defs>
            <radialGradient id="sphereGrad" cx="38%" cy="35%" r="60%">
              <stop offset="0%"   stop-color="#e080ff"/>
              <stop offset="45%"  stop-color="#800080"/>
              <stop offset="100%" stop-color="#2d003d"/>
            </radialGradient>
            <radialGradient id="glowBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stop-color="#4b0082" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#0a000f" stop-opacity="0"/>
            </radialGradient>
            <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#cc00ff" flood-opacity="0.35"/>
            </filter>
          </defs>
          <circle cx="0" cy="0" r="74" fill="url(#glowBg)"/>
          <g filter="url(#softShadow)">
            <circle cx="0.44"   cy="1.93"   r="8.21"  fill="url(#sphereGrad)"/>
            <circle cx="-3.28"  cy="2.22"   r="8.37"  fill="url(#sphereGrad)"/>
            <circle cx="-4.89"  cy="-3.37"  r="8.52"  fill="url(#sphereGrad)"/>
            <circle cx="1.83"   cy="-7.71"  r="8.68"  fill="url(#sphereGrad)"/>
            <circle cx="9.81"   cy="-1.36"  r="8.83"  fill="url(#sphereGrad)"/>
            <circle cx="5.79"   cy="10.37"  r="8.99"  fill="url(#sphereGrad)"/>
            <circle cx="-8.83"  cy="10.68"  r="9.14"  fill="url(#sphereGrad)"/>
            <circle cx="-15.04" cy="-4.98"  r="9.30"  fill="url(#sphereGrad)"/>
            <circle cx="-0.9"   cy="-17.8"  r="9.46"  fill="url(#sphereGrad)"/>
            <circle cx="18.07"  cy="-8.1"   r="9.61"  fill="url(#sphereGrad)"/>
            <circle cx="15.51"  cy="15.29"  r="9.77"  fill="url(#sphereGrad)"/>
            <circle cx="-9.42"  cy="21.81"  r="9.92"  fill="url(#sphereGrad)"/>
            <circle cx="-25.72" cy="-0.95"  r="10.08" fill="url(#sphereGrad)"/>
            <circle cx="-9.09"  cy="-26.19" r="10.23" fill="url(#sphereGrad)"/>
            <circle cx="22.62"  cy="-19.24" r="10.39" fill="url(#sphereGrad)"/>
            <circle cx="27.88"  cy="15.05"  r="10.55" fill="url(#sphereGrad)"/>
            <circle cx="-4.17"  cy="33.4"   r="10.70" fill="url(#sphereGrad)"/>
            <circle cx="-34.56" cy="8.7"    r="10.86" fill="url(#sphereGrad)"/>
            <circle cx="-21.78" cy="-30.68" r="11.01" fill="url(#sphereGrad)"/>
            <circle cx="21.79"  cy="-33.07" r="11.17" fill="url(#sphereGrad)"/>
            <circle cx="40.65"  cy="8.74"   r="11.32" fill="url(#sphereGrad)"/>
            <circle cx="6.89"   cy="43.01"  r="11.48" fill="url(#sphereGrad)"/>
            <circle cx="-39.3"  cy="23.01"  r="11.64" fill="url(#sphereGrad)"/>
            <circle cx="-37.24" cy="-29.52" r="11.79" fill="url(#sphereGrad)"/>
            <circle cx="14.6"   cy="-47.3"  r="11.95" fill="url(#sphereGrad)"/>
            <circle cx="51.35"  cy="-3.67"  r="12.10" fill="url(#sphereGrad)"/>
            <circle cx="22.88"  cy="48.32"  r="12.26" fill="url(#sphereGrad)"/>
            <circle cx="-38.1"  cy="40.27"  r="12.41" fill="url(#sphereGrad)"/>
            <circle cx="-53.17" cy="-21.67" r="12.57" fill="url(#sphereGrad)"/>
            <circle cx="0.96"   cy="-59.39" r="12.73" fill="url(#sphereGrad)"/>
          </g>
        </svg>
        <div class="logo-text">
          HYPHI HUB
          <span>BLE LIGHT CONTROL</span>
        </div>
      </div>

      <div class="header-right">
        <div class="status-dot" :class="{ connected: connectedCount > 0 }"/>
        <span class="status-text">{{ connectedCount > 0 ? statusName : 'NO DEVICE' }}</span>
        <button class="btn-devices" @click="drawerOpen = !drawerOpen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="4" rx="1"/>
            <rect x="2" y="10" width="20" height="4" rx="1"/>
            <rect x="2" y="17" width="20" height="4" rx="1"/>
          </svg>
          <span class="btn-label">DEVICES</span>
          <span v-if="store.devices.length > 0" class="devices-count">{{ store.devices.length }}</span>
        </button>
      </div>

      <!-- Hamburger (mobile) -->
      <button id="hamburger" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>
    </header>

    <!-- Mobile menu -->
    <div id="mobile-menu" :class="{ open: mobileMenuOpen }">
      <div class="mobile-menu-header">
        <span class="mobile-menu-title">Menu</span>
        <button class="mobile-menu-close" @click="mobileMenuOpen = false">✕</button>
      </div>
      <div class="mobile-status-row">
        <div class="status-dot" :class="{ connected: connectedCount > 0 }"/>
        <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--sub);letter-spacing:1px;">
          {{ connectedCount > 0 ? statusName : 'NO DEVICE' }}
        </span>
      </div>
      <div class="mobile-menu-row" @click="showScan = true; mobileMenuOpen = false">
        <span class="mobile-menu-row-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 2H2v6M16 2h6v6M8 22H2v-6M16 22h6v-6M12 7a5 5 0 100 10 5 5 0 000-10z"/>
          </svg>
        </span>
        <div>
          <div class="mobile-menu-row-label">Scan for Devices</div>
          <div class="mobile-menu-row-sub">Add a new BLE device</div>
        </div>
      </div>
      <div class="mobile-menu-row" @click="drawerOpen = true; mobileMenuOpen = false">
        <span class="mobile-menu-row-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="4" rx="1"/><rect x="2" y="10" width="20" height="4" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/>
          </svg>
        </span>
        <div>
          <div class="mobile-menu-row-label">
            Devices
            <span v-if="store.devices.length > 0" class="devices-count">{{ store.devices.length }}</span>
          </div>
          <div class="mobile-menu-row-sub">Manage connected devices</div>
        </div>
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
          <button class="btn-scan-empty" @click="showScan = true">SCAN FOR DEVICES</button>
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

const store        = useDeviceStore()
const showScan     = ref(false)
const drawerOpen   = ref(false)
const logOpen      = ref(false)
const settingsOpen = ref(false)
const logInnerRef  = ref<HTMLElement | null>(null)
const mobileMenuOpen = ref(false)
const isMobile     = ref(false)

// Track mobile breakpoint
function checkMobile() { isMobile.value = window.innerWidth < 600 }
if (typeof window !== 'undefined') {
  checkMobile()
  window.addEventListener('resize', checkMobile)
}

const connectedCount = computed(() => store.connectedCount)
const activeDev      = computed(() => store.activeDevice)
const ds             = computed(() => activeDev.value?.state?.value || {} as import('@/ble-protocol').DeviceState)
const statusName     = computed(() => activeDev.value?.info.name ?? '')

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
  --glow:     rgba(255,107,53,0.08);
  --glow2:    rgba(123,92,250,0.08);
  --r:        10px;
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

/* ── Header ── */
header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100;
  background: rgba(10,10,15,0.85);
  backdrop-filter: blur(20px);
  gap: 12px;
  flex-shrink: 0;
}
.logo { display: flex; align-items: center; gap: 10px; }
.logo-icon { width: 56px; height: 56px; flex-shrink: 0; }
.logo-text {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 26px; letter-spacing: 5px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; line-height: 1;
}
.logo span {
  font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px;
  color: var(--sub); display: block; margin-top: 2px;
  -webkit-text-fill-color: var(--sub); background: none;
}
.header-right { display: flex; align-items: center; gap: 16px; }

.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--muted); transition: all 0.6s ease; box-shadow: none;
}
.status-dot.connected {
  background: var(--connected);
  box-shadow: 0 0 12px var(--connected);
  animation: statusPulse 3s infinite;
}
@keyframes statusPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.status-text {
  font-family: 'DM Mono', monospace; font-size: 11px;
  color: var(--sub); letter-spacing: 1px; text-transform: uppercase;
}

/* Scan button */
.btn-scan {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 20px;
  background: transparent; border: 1px solid var(--border);
  border-radius: var(--r); color: var(--text);
  font-family: 'DM Mono', monospace; font-size: 12px;
  letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; transition: all 0.3s; position: relative; z-index: 0;
}
.btn-scan:hover { border-color: var(--accent); color: var(--accent); background: var(--glow); }
.btn-scan svg { width: 14px; height: 14px; }

/* Spinning conic-gradient glow border */
@property --glow-angle {
  syntax: '<angle>'; inherits: false; initial-value: 0deg;
}
@keyframes borderSpin { to { --glow-angle: 360deg; } }
.btn-scan.pulse-glow { border-color: transparent; background: var(--surface); }
.btn-scan.pulse-glow::before {
  content: ''; position: absolute; inset: -1px;
  border-radius: calc(var(--r) + 1px);
  background: conic-gradient(
    from var(--glow-angle),
    var(--accent2) 0%, var(--accent) 25%,
    transparent 40%, transparent 60%,
    var(--accent) 75%, var(--accent2) 100%
  );
  animation: borderSpin 3s linear infinite; z-index: -1;
}
.btn-scan.pulse-glow::after {
  content: ''; position: absolute; inset: 1px;
  border-radius: calc(var(--r) - 1px);
  background: var(--surface); z-index: -1;
}

/* Devices button */
.btn-devices {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 16px; background: transparent;
  border: 1px solid var(--border); border-radius: var(--r);
  color: var(--text); font-family: 'DM Mono', monospace;
  font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; transition: all 0.3s;
}
.btn-devices:hover { border-color: var(--accent2); color: var(--accent2); background: var(--glow2); }
.devices-count {
  background: var(--accent2); color: white;
  font-size: 9px; font-family: 'DM Mono', monospace;
  padding: 1px 5px; border-radius: 10px;
  min-width: 18px; text-align: center;
}

/* Hamburger */
#hamburger {
  display: none;
  background: none; border: 1px solid var(--border);
  border-radius: var(--r); color: var(--text);
  padding: 8px 10px; cursor: pointer; transition: all 0.3s; flex-shrink: 0;
}
#hamburger:hover { border-color: var(--accent2); color: var(--accent2); }

/* Mobile header */
header.mobile .header-right { display: none; }
header.mobile #hamburger    { display: flex; align-items: center; justify-content: center; }
header.mobile               { padding: 12px 16px; }
header.mobile .logo-text    { font-size: 20px; letter-spacing: 3px; }
header.mobile .logo-icon    { width: 42px; height: 42px; }

/* Mobile menu */
#mobile-menu {
  position: fixed; top: 0; left: 0; right: 0;
  background: rgba(10,10,15,0.97); backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
  padding: 16px; display: flex; flex-direction: column; gap: 10px;
  z-index: 500;
  transform: translateY(-110%); transition: transform 0.42s cubic-bezier(0.4,0,0.2,1);
  pointer-events: none;
}
#mobile-menu.open { transform: translateY(0); pointer-events: all; }
.mobile-menu-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 12px; border-bottom: 1px solid var(--border); margin-bottom: 4px;
}
.mobile-menu-title { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 3px; color: var(--sub); }
.mobile-menu-close { background: none; border: none; color: var(--sub); font-size: 18px; cursor: pointer; }
.mobile-status-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; }
.mobile-menu-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 10px;
  border-radius: 10px; background: var(--surface); border: 1px solid var(--border);
  cursor: pointer; transition: all 0.22s;
}
.mobile-menu-row:hover { border-color: var(--accent2); }
.mobile-menu-row-icon  { color: var(--accent2); flex-shrink: 0; }
.mobile-menu-row-label { font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 2px; color: var(--text); }
.mobile-menu-row-sub   { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); margin-top: 2px; }
</style>

<style scoped>
.app-shell { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }

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
.btn-scan-empty {
  padding: 12px 32px; border-radius: var(--r);
  border: 1px solid transparent;
  background: var(--surface); color: var(--text);
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 8px; cursor: pointer;
  position: relative; z-index: 0;
  transition: color 0.3s;
}
.btn-scan-empty:hover { color: var(--accent2); }
.btn-scan-empty::before {
  content: ''; position: absolute; inset: -1px;
  border-radius: calc(var(--r) + 1px);
  background: conic-gradient(
    from var(--glow-angle),
    var(--accent2) 0%, var(--accent) 25%,
    transparent 40%, transparent 60%,
    var(--accent) 75%, var(--accent2) 100%
  );
  animation: borderSpin 3s linear infinite; z-index: -1;
}
.btn-scan-empty::after {
  content: ''; position: absolute; inset: 1px;
  border-radius: calc(var(--r) - 1px);
  background: var(--surface); z-index: -1;
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
