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
            <circle cx="0.44" cy="1.93" r="8.21" fill="url(#sphereGrad)"/>
            <circle cx="-3.28" cy="2.22" r="8.37" fill="url(#sphereGrad)"/>
            <circle cx="-4.89" cy="-3.37" r="8.52" fill="url(#sphereGrad)"/>
            <circle cx="1.83" cy="-7.71" r="8.68" fill="url(#sphereGrad)"/>
            <circle cx="9.81" cy="-1.36" r="8.83" fill="url(#sphereGrad)"/>
            <circle cx="5.79" cy="10.37" r="8.99" fill="url(#sphereGrad)"/>
            <circle cx="-8.83" cy="10.68" r="9.14" fill="url(#sphereGrad)"/>
            <circle cx="-15.04" cy="-4.98" r="9.30" fill="url(#sphereGrad)"/>
            <circle cx="-0.9" cy="-17.8" r="9.46" fill="url(#sphereGrad)"/>
            <circle cx="18.07" cy="-8.1" r="9.61" fill="url(#sphereGrad)"/>
            <circle cx="15.51" cy="15.29" r="9.77" fill="url(#sphereGrad)"/>
            <circle cx="-9.42" cy="21.81" r="9.92" fill="url(#sphereGrad)"/>
            <circle cx="-25.72" cy="-0.95" r="10.08" fill="url(#sphereGrad)"/>
            <circle cx="-9.09" cy="-26.19" r="10.23" fill="url(#sphereGrad)"/>
            <circle cx="22.62" cy="-19.24" r="10.39" fill="url(#sphereGrad)"/>
            <circle cx="27.88" cy="15.05" r="10.55" fill="url(#sphereGrad)"/>
            <circle cx="-4.17" cy="33.4" r="10.70" fill="url(#sphereGrad)"/>
            <circle cx="-34.56" cy="8.7" r="10.86" fill="url(#sphereGrad)"/>
            <circle cx="-21.78" cy="-30.68" r="11.01" fill="url(#sphereGrad)"/>
            <circle cx="21.79" cy="-33.07" r="11.17" fill="url(#sphereGrad)"/>
            <circle cx="40.65" cy="8.74" r="11.32" fill="url(#sphereGrad)"/>
            <circle cx="6.89" cy="43.01" r="11.48" fill="url(#sphereGrad)"/>
            <circle cx="-39.3" cy="23.01" r="11.64" fill="url(#sphereGrad)"/>
            <circle cx="-37.24" cy="-29.52" r="11.79" fill="url(#sphereGrad)"/>
            <circle cx="14.6" cy="-47.3" r="11.95" fill="url(#sphereGrad)"/>
            <circle cx="51.35" cy="-3.67" r="12.10" fill="url(#sphereGrad)"/>
            <circle cx="22.88" cy="48.32" r="12.26" fill="url(#sphereGrad)"/>
            <circle cx="-38.1" cy="40.27" r="12.41" fill="url(#sphereGrad)"/>
            <circle cx="-53.17" cy="-21.67" r="12.57" fill="url(#sphereGrad)"/>
            <circle cx="0.96" cy="-59.39" r="12.73" fill="url(#sphereGrad)"/>
          </g>
        </svg>
        <div class="logo-text">
          HYPHI HUB
          <span>BLE LIGHT CONTROL</span>
        </div>
      </div>
      <div class="header-right">
        <div class="status-pill">
          <span class="status-dot" :class="{ connected: store.connectedCount > 0 }"></span>
          <span class="status-text">{{ store.connectedCount > 0 ? (activeDev?.info.name.toUpperCase() ?? 'CONNECTED') : 'NO DEVICE' }}</span>
        </div>
        <!-- devices drawer trigger -->
        <button class="btn-devices" :class="{ 'pulse-glow': store.connectedCount === 0 }" @click="drawerOpen = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="4" rx="1"/><rect x="2" y="10" width="20" height="4" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/></svg>
          <span class="btn-label">DEVICES</span>
          <span class="devices-count" v-if="store.devices.length > 0">{{ store.devices.length }}</span>
        </button>
      </div>
      <button class="hamburger" @click="mobileMenuOpen = !mobileMenuOpen">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </header>

    <!-- Mobile menu -->
    <div class="mobile-menu" :class="{ open: mobileMenuOpen }">
      <div class="mobile-menu-header">
        <span class="mobile-menu-title">MENU</span>
        <button class="mobile-menu-close" @click="mobileMenuOpen = false">✕</button>
      </div>
      <div class="mobile-menu-row" @click="openScan(); mobileMenuOpen = false">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="2"><path d="M8 2H2v6M16 2h6v6M8 22H2v-6M16 22h6v-6M12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>
        <div>
          <div class="mobile-menu-row-label">SCAN DEVICES</div>
          <div class="mobile-menu-row-sub">Find nearby BLE lights</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;">
        <span class="status-dot" :class="{ connected: store.connectedCount > 0 }"></span>
        <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--sub);letter-spacing:1px;text-transform:uppercase;">{{ store.connectedCount > 0 ? activeDev?.info.name.toUpperCase() : 'NO DEVICE' }}</span>
      </div>
    </div>

    <!-- devices drawer and overlay -->
    <div class="drawer-overlay" :class="{ open: drawerOpen }" @click="drawerOpen = false"></div>
    <div class="devices-drawer" :class="{ open: drawerOpen }">
      <div class="drawer-header">
        <div>
          <div class="drawer-title">DEVICES</div>
          <div class="drawer-sub" v-if="store.devices.length === 0">No devices connected</div>
        </div>
        <button class="drawer-close" @click="drawerOpen = false">✕</button>
      </div>
      <div id="devices-grid">
        <template v-if="store.devices.length > 0">
          <template v-for="dev in store.devices" :key="dev.info.id">
            <div class="device-card" :class="{ active: dev.info.id === store.activeId }" @click="store.setActive(dev.info.id)">
              <div class="device-name">
                {{ dev.info.name }}
                <span class="device-badge">{{ dev.info.type }}</span>
                <div class="device-color-preview" :style="{ background: dev.state?.color ?? '#ff6b35' }"></div>
              </div>
              <div class="device-id">{{ dev.info.id.slice(0, 22) }}</div>
              <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <span class="status-dot" :class="{ connected: dev.state?.connected }"></span>
                <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--sub);">{{ dev.state?.connected ? 'CONNECTED' : 'DISCONNECTED' }}</span>
                <button v-if="!dev.state?.connected" class="btn-reconnect" @click.stop="store.reconnect(dev.info.id)">RECONNECT</button>
                <button class="btn-remove" @click.stop="store.removeDevice(dev.info.id)">✕</button>
              </div>
            </div>
          </template>
        </template>
        <div v-else class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2L8 6l4 4-4 4 4 4M12 2l4 4-4 4 4 4-4 4"/></svg>
          <p>SCAN TO DISCOVER DEVICES</p>
        </div>
      </div>
      <div class="drawer-footer">
        <button class="btn-scan-drawer" :class="{ 'pulse-glow': store.connectedCount === 0 }" @click="openScan">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M8 2H2v6M16 2h6v6M8 22H2v-6M16 22h6v-6M12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>
          ADD DEVICE
        </button>
      </div>
    </div>

    <main>
      <!-- ── Control panel ── -->
      <div v-if="activeDev" class="control-panel-wrap">

        <!-- HUD -->
        <div class="device-hud">
          <div class="hud-canvas-wrap" ref="hudWrap">
            <canvas ref="hudCanvas" class="hud-canvas"></canvas>
            <div ref="hud3dContainer" class="hud-3d"></div>
            <div class="hud-device-label">{{ activeDev.info.name.toUpperCase() }}</div>
            <div class="hud-off-label" :class="{ visible: !ds.power }">POWER OFF</div>
            <button class="hud-view-toggle" @click="toggleHudView">{{ hudIs3d ? '2D' : '3D' }}</button>
          </div>
          <div class="hud-stats">
            <div class="hud-stat">
              <div class="hud-stat-val" :class="powerClass">{{ hudLitCount }} / {{ activeDev.info.ledCount }}</div>
              <div class="hud-stat-lbl">LEDs lit</div>
            </div>
            <div class="hud-stat">
              <div class="hud-stat-val" :class="powerClass">{{ hudMa }}</div>
              <div class="hud-stat-lbl">mA</div>
            </div>
            <div class="hud-stat">
              <div class="hud-stat-val" :class="powerClass">{{ hudWatts }}W</div>
              <div class="hud-stat-lbl">Watts</div>
            </div>
            <div class="hud-stat" v-if="activeDev.info.hasBattery && hudBattTime">
              <div class="hud-stat-val" :class="battClass">{{ hudBattTime }}</div>
              <div class="hud-stat-lbl">Remaining</div>
            </div>
            <div class="hud-stat" style="padding:10px 14px;">
              <div class="hud-gauge-track" style="margin-top:6px;">
                <div class="hud-gauge-fill" :style="{ width: hudPowerPct + '%', background: powerGaugeColor }"></div>
              </div>
              <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);margin-top:4px;letter-spacing:1px;">{{ hudMaxWatts }}W max</div>
            </div>
          </div>
        </div>

        <!-- Panel header + power toggle -->
        <div class="panel-header">
          <div>
            <div class="panel-title">{{ activeDev.info.name.toUpperCase() }}</div>
            <div class="panel-subtitle">{{ activeDev.info.type }} · {{ activeDev.info.ledCount }} LEDs · {{ activeDev.info.voltage }}V</div>
            <div class="panel-battery" v-if="ds.battery !== null && ds.battery !== undefined">
              <div class="battery-wrap">
                <div class="battery-icon">
                  <div class="batt-body">
                    <div class="batt-tip"></div>
                    <div class="batt-fill" :style="{ width: (ds.battery ?? 0) + '%' }"></div>
                  </div>
                </div>
                <span>{{ ds.battery ?? 0 }}%</span>
              </div>
            </div>
          </div>
          <div class="power-toggle" :class="{ on: ds.power }" @click="store.togglePower(activeDev.info.id)"></div>
        </div>

        <!-- Scenes -->
        <div class="section-label" style="margin-bottom:12px;">SCENES</div>
        <div class="scene-grid" style="margin-bottom:24px;">
          <button class="scene-btn" @click="applyScene('chill')"><span class="scene-icon">🌊</span>CHILL</button>
          <button class="scene-btn" @click="applyScene('focus')"><span class="scene-icon">💡</span>FOCUS</button>
          <button class="scene-btn" @click="applyScene('party')"><span class="scene-icon">🎉</span>PARTY</button>
          <button class="scene-btn" @click="applyScene('warm')"><span class="scene-icon">🔆</span>WARM</button>
        </div>

        <div class="controls-grid">

          <!-- Color -->
          <div class="control-block">
            <div class="control-label">
              COLOR
              <span class="control-value">{{ activeSlotColor?.toUpperCase() }}</span>
            </div>
            <div v-if="hasDualColor" style="display:flex;gap:6px;margin-bottom:10px;">
              <button v-for="s in colorSlotCount" :key="s"
                class="color-slot-tab" :class="{ active: activeColorSlot === s }"
                @click="activeColorSlot = s">
                <span class="slot-dot" :style="{ background: slotColor(s) }"></span>
                <span>Color {{ s }}</span>
              </button>
            </div>
            <div class="color-picker-row">
              <input type="color" :value="activeSlotColor" @input="onColorInput(($event.target as HTMLInputElement).value)">
              <div class="color-presets">
                <div v-for="c in colorPresets" :key="c"
                     class="preset-swatch"
                     :class="{ selected: c.toLowerCase() === activeSlotColor?.toLowerCase() }"
                     :style="{ background: c, '--swatch-color': c }"
                     @click="onColorInput(c)">
                </div>
              </div>
            </div>
          </div>

          <!-- Brightness + Speed -->
          <div class="control-block">
            <div class="control-label">
              BRIGHTNESS
              <span class="control-value">{{ Math.round((ds.brightness ?? 204) / 255 * 100) }}%</span>
            </div>
            <input type="range" class="brightness-slider" min="0" max="255"
                   :value="ds.brightness ?? 204"
                   @input="store.setBrightness(activeDev.info.id, +($event.target as HTMLInputElement).value)">
            <div class="control-label" style="margin-top:16px;">
              SPEED
              <span class="control-value">{{ Math.round((ds.speed ?? 5000) / 65535 * 100) }}%</span>
            </div>
            <input type="range" class="speed-slider" min="10" max="65535"
                   :value="ds.speed ?? 5000"
                   @input="store.setSpeed(activeDev.info.id, +($event.target as HTMLInputElement).value)">
          </div>

          <!-- Effects -->
          <div class="control-block full">
            <div class="control-label">EFFECTS</div>
            <div class="effect-grid">
              <button v-for="fx in fxSlots" :key="fx.mode"
                      class="effect-btn" :class="{ active: ds.mode === fx.mode }"
                      @click="store.setMode(activeDev.info.id, fx.mode)">
                <span class="effect-icon">{{ fx.icon }}</span>
                <span>{{ fx.name }}</span>
              </button>
            </div>
          </div>

          <!-- Auto Cycle -->
          <div class="control-block full adv-block">
            <div class="control-label">
              AUTO CYCLE
              <div class="toggle-small" :class="{ on: ds.autoCycle }"
                   @click="store.setAutoCycle(activeDev.info.id, !ds.autoCycle)"></div>
            </div>
            <div v-if="ds.autoCycle" style="margin-top:10px;">
              <div class="adv-row">
                <span class="adv-row-label">Interval</span>
                <div class="stepper">
                  <button @click="store.setCycleTime(activeDev.info.id, Math.max(0.5,(ds.cycleTime??15)-0.5))">−</button>
                  <span>{{ ds.cycleTime ?? 15 }}s</span>
                  <button @click="store.setCycleTime(activeDev.info.id, Math.min(300,(ds.cycleTime??15)+0.5))">+</button>
                </div>
              </div>
              <div class="cycle-bar-wrap"><div class="cycle-bar" :style="{ width: cycleProgress + '%' }"></div></div>
            </div>
          </div>

          <!-- Audio reactive -->
          <div class="control-block full adv-block" v-if="activeDev.info.hasAudio">
            <div class="control-label">
              AUDIO REACTIVE
              <div class="toggle-small" :class="{ on: ds.audioReactive }"
                   @click="store.setAudioReactive(activeDev.info.id, !ds.audioReactive)"></div>
            </div>
          </div>

        </div><!-- /controls-grid -->

        <!-- BLE Log -->
        <div class="log-accordion" :class="{ open: logOpen }">
          <button class="log-toggle" @click="logOpen = !logOpen">
            <span style="display:flex;align-items:center;gap:10px;">
              BLE LOG <span class="log-count">{{ store.globalLogs.length }}</span>
            </span>
            <svg class="log-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div v-show="logOpen" class="ble-log">
            <div v-for="(entry, i) in store.globalLogs.slice(-80)" :key="i" class="log-entry">
              <span class="log-time">{{ entry.time }}</span>
              <span :class="'log-' + entry.type">{{ entry.msg }}</span>
            </div>
          </div>
        </div>

      </div><!-- /control-panel-wrap -->

      <!-- No device -->
      <div v-else class="no-device-state">
        <div class="no-device-inner">
          <div class="no-device-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2L8 6l4 4-4 4 4 4M12 2l4 4-4 4 4 4-4 4"/></svg></div>
          <div class="no-device-msg">No device selected</div>
          <div class="no-device-sub">Scan for a device to get started</div>
          <button class="btn-scan pulse-glow" style="margin-top:8px;" @click="openScan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M8 2H2v6M16 2h6v6M8 22H2v-6M16 22h6v-6M12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>
            SCAN FOR DEVICES
          </button>
        </div>
      </div>

    </main>

    <ScanModal v-model="scanOpen" @connected="scanOpen = false" />
    <div class="toast" :class="{ show: toastVisible }">{{ toastMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDeviceStore } from '@/stores/deviceStore'
import ScanModal from '@/components/ScanModal.vue'
import type { DeviceState } from '@/ble-protocol'

const store = useDeviceStore()
const isMobile        = ref(window.innerWidth < 520)
const scanOpen        = ref(false)
const drawerOpen      = ref(false)
const mobileMenuOpen  = ref(false)
const logOpen         = ref(false)
const toastVisible    = ref(false)
const toastMsg        = ref('')

window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 520 })

function openScan() { scanOpen.value = true }
function toast(msg: string) { toastMsg.value = msg; toastVisible.value = true; setTimeout(() => { toastVisible.value = false }, 2800) }

// when the scan modal is shown hide the drawer so it isn't layered
watch(scanOpen, open => { if (open) drawerOpen.value = false })

// close drawer automatically when first device appears
watch(() => store.connectedCount, cnt => { if (cnt > 0) drawerOpen.value = false })

// ── Active device ──────────────────────────────────────────────────────────
const activeDev = computed(() => store.activeDevice)
const ds = computed((): Partial<DeviceState> => activeDev.value?.state ?? ({} as Partial<DeviceState>))

// ── Color slots ────────────────────────────────────────────────────────────
const activeColorSlot = ref(1)
const DUAL_COLOR_EFFECTS   = new Set([1,2,15,16,18,26,43,44,19,23,60,70])
const TRIPLE_COLOR_EFFECTS = new Set([16,18,43,44])
const hasDualColor    = computed(() => DUAL_COLOR_EFFECTS.has(ds.value.mode ?? 0))
const colorSlotCount  = computed(() => TRIPLE_COLOR_EFFECTS.has(ds.value.mode??0) ? 3 : DUAL_COLOR_EFFECTS.has(ds.value.mode??0) ? 2 : 1)
function slotColor(s: number) { return s===1 ? (ds.value.color??'#ff6b35') : s===2 ? (ds.value.color2??'#7b5cfa') : (ds.value.color3??'#3dffc0') }
const activeSlotColor = computed(() => slotColor(activeColorSlot.value))

const colorPresets = ['#ff0000','#ff2244','#ff4500','#ff6b35','#ff8c00','#ffcc00','#aaff00','#00ff88','#3dffc0','#00ffff','#00aaff','#0055ff','#4422ff','#7b5cfa','#aa00ff','#ff00cc','#ff44cc','#ff0077','#ffffff','#aabbcc']

function onColorInput(hex: string) {
  if (!activeDev.value) return
  const id = activeDev.value.info.id
  if (activeColorSlot.value === 1)      store.setColor(id, hex)
  else if (activeColorSlot.value === 2) store.setColor2?.(id, hex)
  else                                  store.setColor3?.(id, hex)
}

// ── Effects ────────────────────────────────────────────────────────────────
const fxSlots = [
  { mode:0,  name:'Static',    icon:'◼' },
  { mode:2,  name:'Breath',    icon:'〰' },
  { mode:11, name:'Rainbow',   icon:'🌈' },
  { mode:12, name:'Rbow Cycle',icon:'🌀' },
  { mode:26, name:'Strobe',    icon:'⚡' },
  { mode:16, name:'Chase',     icon:'🌊' },
  { mode:23, name:'Sparkle',   icon:'✦' },
  { mode:43, name:'Larson',    icon:'🔴' },
  { mode:49, name:'Fire',      icon:'🔥' },
]

// ── Scenes ─────────────────────────────────────────────────────────────────
function applyScene(name: string) {
  if (!activeDev.value) return
  const id = activeDev.value.info.id
  const scenes: Record<string,{color:string;brightness:number;speed:number;mode:number}> = {
    chill: { color:'#3344ff', brightness:60,  speed:3000, mode:2  },
    focus: { color:'#ffffff', brightness:230, speed:0,    mode:0  },
    party: { color:'#ff44cc', brightness:255, speed:8000, mode:16 },
    warm:  { color:'#ff8800', brightness:120, speed:2000, mode:2  },
  }
  const s = scenes[name]; if (!s) return
  store.setColor(id, s.color); store.setBrightness(id, s.brightness)
  store.setSpeed(id, s.speed); store.setMode(id, s.mode)
  toast(`Scene: ${name.toUpperCase()}`)
}

// ── Cycle progress ─────────────────────────────────────────────────────────
const cycleProgress = ref(0)
let cycleTimer: ReturnType<typeof setInterval> | null = null
watch(() => ds.value.autoCycle, (on) => {
  if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; cycleProgress.value = 0 }
  if (on) {
    const total = (ds.value.cycleTime ?? 15) * 1000
    cycleTimer = setInterval(() => {
      cycleProgress.value = Math.min(100, cycleProgress.value + 200 / total * 100)
      if (cycleProgress.value >= 100) cycleProgress.value = 0
    }, 200)
  }
})

// ── Power estimates ─────────────────────────────────────────────────────────
const MA_PER_LED_MAX  = 60
const PARTIAL_EFFECTS = new Set([13,14,16,17,30,31,32,33,34,35,36,37,38,43,44,63,72])

const hudPowerCalc = computed(() => {
  const dev = activeDev.value; if (!dev) return null
  const d = ds.value
  const bPct = (d.power ? (d.brightness??204) : 0) / 255
  const frac = PARTIAL_EFFECTS.has(d.mode??0) ? 0.35 : (d.mode??0)===0 ? 1.0 : 0.65
  const hex = d.color ?? '#ff6b35'
  const r=parseInt(hex.slice(1,3),16)||0, g=parseInt(hex.slice(3,5),16)||0, b=parseInt(hex.slice(5,7),16)||0
  const colorFrac = (r+g+b)/(255*3)
  const maDraw = Math.round(dev.info.ledCount + dev.info.ledCount*frac*colorFrac*bPct*MA_PER_LED_MAX)
  const maxMa  = dev.info.ledCount * MA_PER_LED_MAX
  return {
    maDraw,
    watts:    ((maDraw * dev.info.voltage) / 1000).toFixed(2),
    pct:      Math.round(maDraw / maxMa * 100),
    litLeds:  Math.round(dev.info.ledCount * frac * bPct),
    maxWatts: ((maxMa * dev.info.voltage) / 1000).toFixed(1),
  }
})
const hudMa       = computed(() => hudPowerCalc.value?.maDraw ?? '—')
const hudWatts    = computed(() => hudPowerCalc.value?.watts  ?? '—')
const hudPowerPct = computed(() => hudPowerCalc.value?.pct    ?? 0)
const hudLitCount = computed(() => hudPowerCalc.value?.litLeds ?? 0)
const hudMaxWatts = computed(() => hudPowerCalc.value?.maxWatts ?? '—')
const powerClass  = computed(() => { const p=hudPowerPct.value; return p>80?'crit':p>50?'warn':'hi' })
const powerGaugeColor = computed(() => { const p=hudPowerPct.value; return p>80?'#ff5577':p>50?'#f0c040':'var(--connected)' })
const hudBattTime = computed(() => {
  const dev=activeDev.value; if(!dev?.info.hasBattery||!dev.info.battCapMah) return null
  const maDraw=hudPowerCalc.value?.maDraw; if(!maDraw) return null
  const h = (dev.info.battCapMah*(ds.value.battery??100)/100)/maDraw
  return h>=1 ? h.toFixed(1)+'h' : Math.round(h*60)+'m'
})
const battClass = computed(() => { const t=parseFloat(hudBattTime.value??'99'); return t<0.5?'crit':t<1.5?'warn':'hi' })

// ── HUD Canvas Engine ──────────────────────────────────────────────────────
const hudCanvas      = ref<HTMLCanvasElement|null>(null)
const hudWrap        = ref<HTMLDivElement|null>(null)
const hud3dContainer = ref<HTMLDivElement|null>(null)
const hudIs3d        = ref(false)
let hudAnimFrame: number|null = null
let hudTick = 0
let hudFixture = 'strip'

const LOGO_LEDS = (() => {
  const raw=[
    {x:0.0074,z:0.0325,r:0.1382},{x:-0.0552,z:0.0374,r:0.1409},{x:-0.0823,z:-0.0567,r:0.1434},
    {x:0.0308,z:-0.1298,r:0.1461},{x:0.1652,z:-0.0229,r:0.1487},{x:0.0975,z:0.1746,r:0.1514},
    {x:-0.1487,z:0.1798,r:0.1539},{x:-0.2532,z:-0.0838,r:0.1566},{x:-0.0152,z:-0.2997,r:0.1593},
    {x:0.3042,z:-0.1364,r:0.1618},{x:0.2611,z:0.2574,r:0.1645},{x:-0.1586,z:0.3672,r:0.1670},
    {x:-0.4330,z:-0.0160,r:0.1697},{x:-0.1530,z:-0.4409,r:0.1722},{x:0.3808,z:-0.3239,r:0.1749},
    {x:0.4694,z:0.2534,r:0.1776},{x:-0.0702,z:0.5623,r:0.1801},{x:-0.5818,z:0.1465,r:0.1828},
    {x:-0.3667,z:-0.5165,r:0.1854},{x:0.3668,z:-0.5568,r:0.1881},{x:0.6844,z:0.1471,r:0.1906},
    {x:0.1160,z:0.7241,r:0.1933},{x:-0.6616,z:0.3874,r:0.1960},{x:-0.6270,z:-0.4970,r:0.1985},
    {x:0.2458,z:-0.7963,r:0.2012},{x:0.8645,z:-0.0618,r:0.2037},{x:0.3852,z:0.8135,r:0.2064},
    {x:-0.6414,z:0.6780,r:0.2089},{x:-0.8952,z:-0.3648,r:0.2116},{x:0.0162,z:-0.9999,r:0.2143},
  ]
  return raw.map(p=>{
    const d=Math.sqrt(p.x*p.x+p.z*p.z), push=0.09*Math.max(0,1-d/0.45)
    if(d<0.001) return p
    const sc=(d+push)/d
    return {x:p.x*sc,z:p.z*sc,r:p.r}
  })
})()

type RGB = {r:number,g:number,b:number}
function hexToRgb(hex:string):RGB {
  const r=parseInt(hex.slice(1,3),16)||0,g=parseInt(hex.slice(3,5),16)||0,b=parseInt(hex.slice(5,7),16)||0
  return {r,g,b}
}

function buildLedColors(count:number, d:Partial<DeviceState>, tick:number): RGB[] {
  const base=hexToRgb(d.color??'#ff6b35'), base2=hexToRgb(d.color2??'#7b5cfa')
  const rawB = d.brightness ?? 204
  const bMax = rawB > 100 ? 255 : 100
  const bPct = Math.pow(Math.min(1, Math.max(0, rawB / bMax)), 0.55)
  const sPct = (d.speed??5000)/65535
  const t=tick/60*(0.167+sPct*4), mode=d.mode??0
  const dim=(c:RGB,f:number):RGB=>({r:Math.round(c.r*f),g:Math.round(c.g*f),b:Math.round(c.b*f)})
  const lerp=(a:RGB,b2:RGB,f:number):RGB=>({r:Math.round(a.r+(b2.r-a.r)*f),g:Math.round(a.g+(b2.g-a.g)*f),b:Math.round(a.b+(b2.b-a.b)*f)})
  const wheel=(pos:number):RGB=>{pos=((pos%256)+256)%256;if(pos<85)return{r:pos*3,g:255-pos*3,b:0};if(pos<170)return{r:255-(pos-85)*3,g:0,b:(pos-85)*3};return{r:0,g:(pos-170)*3,b:255-(pos-170)*3}}
  const leds=new Array<RGB>(count)
  for(let i=0;i<count;i++){
    const n=i/count; let c:RGB
    if     (mode===0)  c=dim(base,bPct)
    else if(mode===2)  {const f=0.5+0.5*Math.sin(t*Math.PI*2);c=dim(lerp(base2,base,f),bPct)}
    else if(mode===11) c=dim(wheel(Math.floor(n*255)),bPct)
    else if(mode===12) c=dim(wheel(Math.floor((n+t*0.3)*255)),bPct)
    else if(mode===26) {const on=Math.sin(t*Math.PI*8)>0.7;c=on?dim(Math.floor(t*8)%2===0?base:base2,bPct):{r:0,g:0,b:0}}
    else if(mode===1)  {const on=Math.floor(t*2)%2===0;c=on?dim(base,bPct):dim(base2,bPct)}
    else if(mode===15) {const f=0.5+0.5*Math.sin(t*Math.PI);c=dim(lerp(base,base2,f),bPct)}
    else if(mode===23) {c=Math.random()<0.04?dim(base2,bPct):dim(base,bPct*0.15)}
    else if(mode===43) {const h=(t*0.5)%2,pos=h<1?h:2-h,dist=Math.abs(n-pos),glow=Math.max(0,1-dist*count*0.3);c=glow>0.05?dim(lerp(base,base2,glow),bPct*glow*glow):dim(base,bPct*0.05)}
    else if(mode===44) {const h=(t*0.4)%1,behind=(n-h+1)%1,tail=behind<0.25?(1-behind/0.25):0;c=dim(lerp(base,base2,tail),bPct*tail)}
    else if(mode===49||mode===50||mode===51){const fl=0.4+Math.random()*0.6;c={r:Math.round(base.r*bPct*fl),g:Math.round(base.g*bPct*fl*0.4),b:0}}
    else if(mode===16||mode===17){const ph=Math.floor(t*3)%3,lit=(i-ph)%3===0,col=mode===17?wheel(Math.floor((n+t*0.1)*255)):base;c=lit?dim(col,bPct):dim(base2,bPct*0.15)}
    else if(mode===18) {const wave=0.5+0.5*Math.sin((n+t*0.3)*Math.PI*8);c=dim(lerp(base,base2,wave),bPct)}
    else if(mode===19||mode===20){const tw=Math.random()<0.06;c=tw?dim(mode===20?wheel(Math.floor(Math.random()*255)):base2,bPct):dim(base,bPct*0.1)}
    else if(mode===70){const hb=Math.max(0,Math.sin(t*Math.PI*1.5)*Math.sin(t*Math.PI*6));c=hb>0.05?dim(lerp(base,base2,hb),bPct*hb):dim(base,bPct*0.05)}
    else if(mode===60){c=Math.random()<0.03?dim(base2,bPct):dim(base,bPct*0.15)}
    else {const w=0.5+0.5*Math.sin((n+t*0.2)*Math.PI*4);c=dim(base,bPct*w)}
    leds[i]=c
  }
  return leds
}

function rrect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()
}

function drawStrip(ctx:CanvasRenderingContext2D,W:number,H:number,leds:RGB[],count:number){
  const mg=40,sh=14,y=H/2,uw=W-mg*2,lw=uw/count
  for(let i=0;i<count;i++){const c=leds[i];if(c.r+c.g+c.b<4)continue;const x=mg+i*lw+lw/2,rad=Math.max(lw*3,18);const g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,`rgba(${c.r},${c.g},${c.b},0.22)`);g.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2)}
  ctx.fillStyle='#1a1a28';ctx.strokeStyle='#2a2a3a';ctx.lineWidth=1;rrect(ctx,mg-4,y-sh/2-2,uw+8,sh+4,4);ctx.fill();ctx.stroke()
  for(let i=0;i<count;i++){const c=leds[i],x=mg+i*lw+lw/2,r2=Math.max(lw*0.38,1.5);ctx.beginPath();ctx.arc(x,y,r2,0,Math.PI*2);ctx.fillStyle=`rgb(${c.r},${c.g},${c.b})`;ctx.fill();if(c.r+c.g+c.b>30){ctx.beginPath();ctx.arc(x-r2*0.25,y-r2*0.3,r2*0.35,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.45)';ctx.fill()}}
  ctx.fillStyle='#2a2a3a';rrect(ctx,mg-8,y-8,6,16,2);ctx.fill();rrect(ctx,W-mg+2,y-8,6,16,2);ctx.fill()
}

function drawRing(ctx:CanvasRenderingContext2D,W:number,H:number,leds:RGB[],count:number){
  const cx=W/2,cy=H/2,R=Math.min(W,H)*0.36,lr=Math.max((2*Math.PI*R/count)*0.35,2.5)
  const ac=leds.reduce((a,c)=>({r:a.r+c.r,g:a.g+c.g,b:a.b+c.b}),{r:0,g:0,b:0}),avg={r:ac.r/count|0,g:ac.g/count|0,b:ac.b/count|0}
  if(avg.r+avg.g+avg.b>10){const h=ctx.createRadialGradient(cx,cy,R*0.5,cx,cy,R*1.7);h.addColorStop(0,`rgba(${avg.r},${avg.g},${avg.b},0)`);h.addColorStop(0.6,`rgba(${avg.r},${avg.g},${avg.b},0.13)`);h.addColorStop(1,`rgba(${avg.r},${avg.g},${avg.b},0)`);ctx.fillStyle=h;ctx.fillRect(0,0,W,H)}
  ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.strokeStyle='#1e1e2e';ctx.lineWidth=lr*2.5;ctx.stroke();ctx.strokeStyle='#2a2a3a';ctx.lineWidth=1;ctx.stroke()
  for(let i=0;i<count;i++){const a=(i/count)*Math.PI*2-Math.PI/2,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R,c=leds[i];if(c.r+c.g+c.b>10){const g=ctx.createRadialGradient(x,y,0,x,y,lr*3.5);g.addColorStop(0,`rgba(${c.r},${c.g},${c.b},0.35)`);g.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,lr*3.5,0,Math.PI*2);ctx.fill()};ctx.beginPath();ctx.arc(x,y,lr,0,Math.PI*2);ctx.fillStyle=`rgb(${c.r},${c.g},${c.b})`;ctx.fill();if(c.r+c.g+c.b>30){ctx.beginPath();ctx.arc(x-lr*0.25,y-lr*0.3,lr*0.35,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fill()}}
}

function drawBulb(ctx:CanvasRenderingContext2D,W:number,H:number,leds:RGB[],count:number){
  const cx=W/2,cy=H/2,mr=LOGO_LEDS.reduce((m,p)=>Math.max(m,Math.sqrt(p.x*p.x+p.z*p.z)+p.r*0.22),0)
  const Rp=Math.min(W,H)*0.46,cs=(Rp-4)/mr,R=Rp
  const n=leds.length,ac=leds.reduce((a,c)=>({r:a.r+c.r,g:a.g+c.g,b:a.b+c.b}),{r:0,g:0,b:0}),avg={r:ac.r/n|0,g:ac.g/n|0,b:ac.b/n|0},lit=avg.r+avg.g+avg.b>10
  if(lit){const h=ctx.createRadialGradient(cx,cy,R*0.3,cx,cy,R*2);h.addColorStop(0,`rgba(${avg.r},${avg.g},${avg.b},0.18)`);h.addColorStop(0.5,`rgba(${avg.r},${avg.g},${avg.b},0.06)`);h.addColorStop(1,`rgba(${avg.r},${avg.g},${avg.b},0)`);ctx.fillStyle=h;ctx.fillRect(0,0,W,H)}
  ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fillStyle='#0d1a0d';ctx.fill();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.strokeStyle='rgba(60,100,60,0.4)';ctx.lineWidth=1.5;ctx.stroke()
  const ld=LOGO_LEDS.slice(0,Math.min(LOGO_LEDS.length,count))
  for(let i=0;i<ld.length;i++){const p=ld[i],lx=cx+p.x*cs,ly=cy+p.z*cs,lr2=p.r*0.22*cs,c=leds[i]||{r:0,g:0,b:0};if(c.r+c.g+c.b<2){ctx.beginPath();ctx.arc(lx,ly,lr2*0.65,0,Math.PI*2);ctx.fillStyle='rgba(40,60,40,0.6)';ctx.fill();continue};const bR=lr2*5;const g=ctx.createRadialGradient(lx,ly,0,lx,ly,bR);g.addColorStop(0,`rgba(${c.r},${c.g},${c.b},0.95)`);g.addColorStop(0.25,`rgba(${c.r},${c.g},${c.b},0.45)`);g.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);ctx.fillStyle=g;ctx.fillRect(lx-bR,ly-bR,bR*2,bR*2);ctx.beginPath();ctx.arc(lx,ly,lr2,0,Math.PI*2);ctx.fillStyle=`rgb(${Math.min(255,c.r+150)},${Math.min(255,c.g+150)},${Math.min(255,c.b+150)})`;ctx.fill();ctx.beginPath();ctx.arc(lx-lr2*0.3,ly-lr2*0.3,lr2*0.35,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.7)';ctx.fill()}
  const dg=ctx.createRadialGradient(cx-R*0.2,cy-R*0.25,0,cx,cy,R);if(lit){dg.addColorStop(0,`rgba(${Math.min(255,avg.r+120)},${Math.min(255,avg.g+120)},${Math.min(255,avg.b+120)},0.12)`);dg.addColorStop(0.5,`rgba(${avg.r},${avg.g},${avg.b},0.07)`);dg.addColorStop(1,'rgba(180,200,220,0.08)')}else{dg.addColorStop(0,'rgba(180,200,230,0.10)');dg.addColorStop(1,'rgba(60,80,100,0.04)')}
  ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fillStyle=dg;ctx.fill();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.strokeStyle='rgba(150,180,200,0.18)';ctx.lineWidth=1.5;ctx.stroke()
  ctx.beginPath();ctx.arc(cx-R*0.28,cy-R*0.28,R*0.18,0,Math.PI*2);const sg=ctx.createRadialGradient(cx-R*0.28,cy-R*0.28,0,cx-R*0.28,cy-R*0.28,R*0.18);sg.addColorStop(0,'rgba(255,255,255,0.22)');sg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sg;ctx.fill()
}

function drawHud() {
  const canvas=hudCanvas.value, wrap=hudWrap.value
  if(!canvas||!wrap){hudAnimFrame=requestAnimationFrame(drawHud);return}
  const W=wrap.clientWidth,H=wrap.clientHeight
  if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
  const ctx=canvas.getContext('2d')
  if(!ctx){hudAnimFrame=requestAnimationFrame(drawHud);return}
  ctx.clearRect(0,0,W,H)
  const dev=activeDev.value
  if(!dev){hudAnimFrame=requestAnimationFrame(drawHud);return}
  if(hudFixture==='3d'){update3DHud(dev);hudTick++;hudAnimFrame=requestAnimationFrame(drawHud);return}
  const d=dev.state; if(!d){hudAnimFrame=requestAnimationFrame(drawHud);return}
  const count=dev.info.ledCount||60
  const leds=d.power?buildLedColors(count,d,hudTick):new Array<RGB>(count).fill({r:0,g:0,b:0})
  ctx.fillStyle='#07070d';ctx.fillRect(0,0,W,H)
  const t=dev.info.type?.toLowerCase()??''
  if(hudFixture==='ring'||t.includes('ring'))         drawRing(ctx,W,H,leds,count)
  else if(hudFixture==='bulb'||t.includes('orb')||t.includes('bulb')||t.includes('diffuser')) drawBulb(ctx,W,H,leds,count)
  else                                                 drawStrip(ctx,W,H,leds,count)
  hudTick++
  hudAnimFrame=requestAnimationFrame(drawHud)
}

// ── Three.js 3D HUD ─────────────────────────────────────────────────────────
let hud3d:any=null

async function init3DHud(dev:any){
  teardown3DHud()
  const THREE=(window as any).THREE; if(!THREE){console.warn('[HUD] Three.js not loaded');return}
  const wrap=hudWrap.value,container=hud3dContainer.value; if(!wrap||!container)return
  container.classList.add('active')
  if(hudCanvas.value) hudCanvas.value.style.opacity='0'
  const W=wrap.clientWidth,H=wrap.clientHeight
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false})
  renderer.setSize(W,H);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0x07070d,1);container.appendChild(renderer.domElement)
  const badge=document.createElement('div');badge.style.cssText='position:absolute;bottom:8px;right:10px;font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;color:#7b5cfa;opacity:0.6;pointer-events:none;text-transform:uppercase;';badge.textContent='3D · DRAG TO ROTATE';container.appendChild(badge)
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,W/H,0.1,100)
  camera.position.set(0,2.2,2.2);camera.lookAt(0,0,0)
  scene.add(new THREE.AmbientLight(0x0d0d1a,3));const fill=new THREE.DirectionalLight(0x8899bb,0.6);fill.position.set(1,4,2);scene.add(fill)
  const pivot=new THREE.Group();scene.add(pivot)
  const lmSize=256,lmCanvas=document.createElement('canvas');lmCanvas.width=lmSize;lmCanvas.height=lmSize
  const lmCtx=lmCanvas.getContext('2d')!,lmTexture=new THREE.CanvasTexture(lmCanvas)
  const domeMat=new THREE.MeshPhysicalMaterial({color:0xaabbcc,transparent:true,opacity:0.18,roughness:0.08,metalness:0,side:THREE.DoubleSide,depthWrite:false,emissive:0xffffff,emissiveMap:lmTexture,emissiveIntensity:1.0})
  pivot.add(new THREE.Mesh(new THREE.SphereGeometry(1,64,32,0,Math.PI*2,0,Math.PI/2),domeMat))
  const rim=new THREE.Mesh(new THREE.TorusGeometry(1,0.012,12,80),new THREE.MeshStandardMaterial({color:0x445566,roughness:0.4,metalness:0.8}));rim.rotation.x=Math.PI/2;pivot.add(rim)
  const pcb=new THREE.Mesh(new THREE.CylinderGeometry(0.96,0.96,0.03,60),new THREE.MeshStandardMaterial({color:0x0d1a0d,roughness:0.8,metalness:0.1}));pcb.position.y=-0.015;pivot.add(pcb)
  const tm=new THREE.MeshBasicMaterial({color:0x1a3320,transparent:true,opacity:0.7})
  ;[0.25,0.5,0.72,0.88].forEach(r=>{const t=new THREE.Mesh(new THREE.TorusGeometry(r,0.004,6,48),tm);t.rotation.x=Math.PI/2;t.position.y=0.016;pivot.add(t)})
  const lc=Math.min(dev.info.ledCount||30,LOGO_LEDS.length),ledMeshes:any[]=[],ledUVs:{u:number,v:number}[]=[],ledGlows:any[]=[]
  const gc=document.createElement('canvas');gc.width=64;gc.height=64;const gx=gc.getContext('2d')!
  const gg=gx.createRadialGradient(32,32,0,32,32,32);gg.addColorStop(0,'rgba(255,255,255,1)');gg.addColorStop(0.15,'rgba(255,255,255,0.8)');gg.addColorStop(0.5,'rgba(255,255,255,0.25)');gg.addColorStop(1,'rgba(255,255,255,0)');gx.fillStyle=gg;gx.fillRect(0,0,64,64)
  const gt=new THREE.CanvasTexture(gc)
  for(let i=0;i<lc;i++){const pos=LOGO_LEDS[i],x=pos.x*0.88,z=pos.z*0.88;const pm=new THREE.MeshStandardMaterial({color:0xffffff,emissive:new THREE.Color(1,0.42,0.21),emissiveIntensity:9,roughness:0.1,metalness:0});const led=new THREE.Mesh(new THREE.SphereGeometry(0.022,12,8),pm);led.position.set(x,0.022,z);pivot.add(led);ledMeshes.push(led);const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));glow.position.set(x,0.04,z);glow.scale.set(0.22,0.22,1);pivot.add(glow);ledGlows.push(glow);const rr2=Math.sqrt(pos.x*pos.x+pos.z*pos.z),ph=Math.atan2(pos.z,pos.x),po=Math.atan2(rr2,1.0);ledUVs.push({u:((ph/(Math.PI*2))+0.5+1.0)%1.0,v:po/(Math.PI/2)})}
  pivot.rotation.x=-0.1
  let isDragging=false,prevX=0,prevY=0
  const gXY=(e:any)=>e.touches?[e.touches[0].clientX,e.touches[0].clientY]:[e.clientX,e.clientY]
  const onDown=(e:any)=>{isDragging=true;[prevX,prevY]=gXY(e);hud3d.velY=0}
  const onMove=(e:any)=>{if(!isDragging)return;const[cx2,cy2]=gXY(e);hud3d.velY=(cx2-prevX)*0.013;const vx=(cy2-prevY)*0.013;prevX=cx2;prevY=cy2;pivot.rotation.y+=hud3d.velY;pivot.rotation.x=Math.max(-1.2,Math.min(0.3,pivot.rotation.x+vx))}
  const onUp=()=>{isDragging=false}
  const onWheel=(e:any)=>{e.preventDefault();const d2=camera.position.length(),nd=Math.max(1.8,Math.min(6,d2+e.deltaY*0.002*d2));camera.position.normalize().multiplyScalar(nd)}
  renderer.domElement.addEventListener('mousedown',onDown);window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp)
  renderer.domElement.addEventListener('wheel',onWheel,{passive:false});renderer.domElement.addEventListener('touchstart',onDown,{passive:true})
  window.addEventListener('touchmove',onMove,{passive:true});window.addEventListener('touchend',onUp)
  const ro=new ResizeObserver(()=>{if(!hud3d)return;const W2=wrap.clientWidth,H2=wrap.clientHeight;hud3d.camera.aspect=W2/H2;hud3d.camera.updateProjectionMatrix();hud3d.renderer.setSize(W2,H2)});ro.observe(wrap)
  hud3d={renderer,scene,camera,pivot,ledMeshes,ledGlows,ledUVs,lmCanvas,lmCtx,lmTexture,lmSize,velY:0.004,ro,container,_onMove:onMove,_onUp:onUp,_onWheel:onWheel}
}

function update3DHud(dev:any){
  if(!hud3d)return;const THREE=(window as any).THREE;if(!THREE)return
  const{renderer,scene,camera,pivot,ledMeshes,ledGlows,ledUVs,lmCanvas,lmCtx,lmTexture,lmSize}=hud3d
  pivot.rotation.y+=hud3d.velY
  const d=dev.state,count=ledMeshes.length
  const leds=d?.power?buildLedColors(count,d,hudTick):new Array<RGB>(count).fill({r:0,g:0,b:0})
  lmCtx.fillStyle='#030308';lmCtx.fillRect(0,0,lmSize,lmSize)
  for(let i=0;i<count;i++){const c=leds[i];if(c.r+c.g+c.b<3)continue;const uv=ledUVs[i],cx3=uv.u*lmSize,cy3=uv.v*lmSize,bR=18+uv.v*28,al=Math.min(1,(c.r+c.g+c.b)/(255*1.5));const g=lmCtx.createRadialGradient(cx3,cy3,0,cx3,cy3,bR);g.addColorStop(0,`rgba(${c.r},${c.g},${c.b},${al.toFixed(2)})`);g.addColorStop(0.35,`rgba(${c.r},${c.g},${c.b},${(al*0.6).toFixed(2)})`);g.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);lmCtx.fillStyle=g;lmCtx.fillRect(cx3-bR,cy3-bR,bR*2,bR*2);for(const off of[-lmSize,lmSize]){const g2=lmCtx.createRadialGradient(cx3+off,cy3,0,cx3+off,cy3,bR);g2.addColorStop(0,`rgba(${c.r},${c.g},${c.b},${al.toFixed(2)})`);g2.addColorStop(0.35,`rgba(${c.r},${c.g},${c.b},${(al*0.6).toFixed(2)})`);g2.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);lmCtx.fillStyle=g2;lmCtx.fillRect(cx3+off-bR,cy3-bR,bR*2,bR*2)}}
  lmTexture.needsUpdate=true
  for(let i=0;i<count;i++){const c=leds[i],col=new THREE.Color(c.r/255,c.g/255,c.b/255),br=(c.r+c.g+c.b)/(255*3);ledMeshes[i].material.emissive.copy(col);ledMeshes[i].material.emissiveIntensity=br*8;ledMeshes[i].material.color.copy(col);if(ledGlows[i]){ledGlows[i].material.color.copy(col);ledGlows[i].material.opacity=br*0.9;const s=0.12+br*0.28;ledGlows[i].scale.set(s,s,1)}}
  renderer.render(scene,camera)
}

function teardown3DHud(){
  if(!hud3d)return
  hud3d.ro?.disconnect()
  window.removeEventListener('mousemove',hud3d._onMove);window.removeEventListener('mouseup',hud3d._onUp);window.removeEventListener('touchend',hud3d._onUp);window.removeEventListener('touchmove',hud3d._onMove)
  if(hud3d._onWheel&&hud3d.renderer?.domElement)hud3d.renderer.domElement.removeEventListener('wheel',hud3d._onWheel)
  hud3d.lmTexture?.dispose();hud3d.renderer?.dispose()
  if(hud3dContainer.value){hud3dContainer.value.classList.remove('active');hud3dContainer.value.innerHTML=''}
  if(hudCanvas.value)hudCanvas.value.style.opacity='1'
  hud3d=null
}

function toggleHudView(){
  const dev=activeDev.value;if(!dev)return
  if(hudIs3d.value){
    teardown3DHud();const t=dev.info.type?.toLowerCase()??''
    hudFixture=t.includes('ring')?'ring':(t.includes('orb')||t.includes('bulb'))?'bulb':'strip'
    hudIs3d.value=false
  }else{
    hudFixture='3d';hudIs3d.value=true;nextTick(()=>init3DHud(dev))
  }
}

function startHud(){
  if(hudAnimFrame)cancelAnimationFrame(hudAnimFrame)
  hudTick=0;drawHud()
}

// ── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(()=>{
  if(!(window as any).THREE){
    const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';document.head.appendChild(s)
  }
  nextTick(()=>startHud())
})

watch(activeDev,()=>{
  teardown3DHud();hudIs3d.value=false;hudFixture='strip'
  nextTick(()=>{if(hudAnimFrame)cancelAnimationFrame(hudAnimFrame);hudTick=0;drawHud()})
})

onUnmounted(()=>{
  if(hudAnimFrame)cancelAnimationFrame(hudAnimFrame)
  teardown3DHud()
  if(cycleTimer)clearInterval(cycleTimer)
})
</script>

<style>
/* global reset applies to document root so white body margin/background won't peek through */
:root {
  --bg:        #0a0a0f;
  --surface:   #111118;
  --panel:     #16161f;
  --border:    #2a2a3a;
  --muted:     #3a3a50;
  --text:      #e8e8f0;
  --sub:       #7a7a9a;
  --accent:    #ff6b35;
  --accent2:   #7b5cfa;
  --glow:      rgba(255,107,53,0.18);
  --glow2:     rgba(123,92,250,0.15);
  --connected: #3dffc0;
  --r: 8px;
}

html {
  scroll-behavior: smooth;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
}

body {
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0%200%20256%20256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  opacity: 0.4;
}

@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');

.app-shell{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;min-height:100vh;}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

/* ── HEADER ── */
header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;background:rgba(10,10,15,0.85);backdrop-filter:blur(20px);gap:12px;}
header.mobile .header-right{display:none;}
header.mobile .hamburger{display:flex !important;}
header.mobile{padding:12px 16px;}

.logo{display:flex;align-items:center;gap:10px;}
.logo-icon{width:48px;height:48px;flex-shrink:0;}
.logo-text{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:5px;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;}
.logo-text span{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--sub);display:block;margin-top:2px;-webkit-text-fill-color:var(--sub);background:none;}

.header-right{display:flex;align-items:center;gap:16px;}
.status-pill{display:flex;align-items:center;gap:7px;}
.status-text{font-family:'DM Mono',monospace;font-size:11px;color:var(--sub);letter-spacing:1px;text-transform:uppercase;}
.status-dot{width:8px;height:8px;border-radius:50%;background:var(--muted);transition:all 0.6s;flex-shrink:0;}
.status-dot.connected{background:var(--connected);box-shadow:0 0 12px var(--connected);animation:pulse 3s infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}

.hamburger{display:none;background:none;border:1px solid var(--border);border-radius:var(--r);color:var(--text);padding:8px 10px;cursor:pointer;transition:all .3s;align-items:center;justify-content:center;}
.hamburger:hover{border-color:var(--accent2);color:var(--accent2);}

/* ── SCAN BUTTON ── */
@property --glow-angle{syntax:'<angle>';inherits:false;initial-value:0deg;}
@keyframes borderSpin{to{--glow-angle:360deg;}}

.btn-scan{display:flex;align-items:center;gap:8px;padding:9px 20px;background:transparent;border:1px solid var(--border);border-radius:var(--r);color:var(--text);font-family:'DM Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .3s;position:relative;}
.btn-scan:hover{border-color:var(--accent);color:var(--accent);background:var(--glow);}
.btn-scan svg{width:14px;height:14px;flex-shrink:0;}
.btn-scan.pulse-glow{border-color:transparent;background:var(--surface);position:relative;box-shadow:0 0 18px rgba(255,107,53,0.28),0 0 28px rgba(123,92,250,0.18);}
.btn-scan.pulse-glow::before{content:'';position:absolute;inset:-1px;border-radius:calc(var(--r) + 1px);background:conic-gradient(from var(--glow-angle, 0deg),var(--accent2) 0%,var(--accent) 25%,transparent 40%,transparent 60%,var(--accent) 75%,var(--accent2) 100%);animation:borderSpin 3s linear infinite;z-index:-1;}
.btn-scan.pulse-glow::after{content:'';position:absolute;inset:1px;border-radius:calc(var(--r) - 1px);background:var(--surface);z-index:-1;}


/* devices drawer and header button styles */
.drawer-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0);
  transition: background 0.3s;
  pointer-events: none;
  z-index: 200;
}
.drawer-overlay.open {
  background: rgba(0,0,0,0.55);
  pointer-events: all;
  backdrop-filter: blur(4px);
}

.devices-drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 320px; max-width: 90vw;
  background: var(--panel);
  border-left: 1px solid var(--border);
  z-index: 201;
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.48s cubic-bezier(0.4,0,0.2,1);
  box-shadow: -24px 0 60px rgba(0,0,0,0.5);
}
.devices-drawer.open { transform: translateX(0); }

.drawer-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 28px 24px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.drawer-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 22px; letter-spacing: 4px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.drawer-sub {
  font-family: 'DM Mono', monospace; font-size: 10px;
  color: var(--sub); letter-spacing: 1px; margin-top: 4px;
}
.drawer-close {
  background: none; border: none; color: var(--sub);
  cursor: pointer; padding: 4px; transition: color 0.3s;
  margin-top: 2px;
}
.drawer-close:hover { color: var(--text); }

#devices-grid {
  flex: 1; overflow-y: auto;
  padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
  align-items: stretch;
  min-height: 0;
}
.drawer-footer {
  padding: 16px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.btn-scan-drawer {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 20px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--r);
  color: var(--text);
  font-family: 'DM Mono', monospace;
  font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; transition: all 0.3s;
}
.btn-scan-drawer:hover { border-color: var(--accent); color: var(--accent); background: var(--glow); }

/* devices button in header */
.btn-devices {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 16px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--r);
  color: var(--text);
  font-family: 'DM Mono', monospace;
  font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; transition: all .3s;
  position: relative;
}
.btn-devices:hover { border-color: var(--accent2); color: var(--accent2); background: var(--glow2); }
.btn-devices.pulse-glow { border-color: transparent; background: var(--surface); box-shadow: 0 0 16px rgba(255,107,53,0.28), 0 0 24px rgba(123,92,250,0.18); }
.btn-devices.pulse-glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: calc(var(--r) + 1px);
  background: conic-gradient(from var(--glow-angle, 0deg),var(--accent2) 0%,var(--accent) 25%,transparent 40%,transparent 60%,var(--accent) 75%,var(--accent2) 100%);
  animation: borderSpin 3s linear infinite;
  z-index: -1;
}
.btn-devices.pulse-glow::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: calc(var(--r) - 1px);
  background: var(--surface);
  z-index: -1;
}
.devices-count {
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  background: rgba(123,92,250,0.2); color: var(--accent2); margin-left: 4px;
}
/* ── MOBILE MENU ── */
.mobile-menu{position:fixed;top:0;left:0;right:0;background:rgba(10,10,15,0.97);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);padding:16px;display:flex;flex-direction:column;gap:10px;z-index:500;transform:translateY(-110%);transition:transform .42s cubic-bezier(.4,0,.2,1);pointer-events:none;}
.mobile-menu.open{transform:translateY(0);pointer-events:all;}
.mobile-menu-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--border);margin-bottom:4px;}
.mobile-menu-title{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:3px;color:var(--sub);text-transform:uppercase;}
.mobile-menu-close{background:none;border:none;color:var(--sub);font-size:18px;cursor:pointer;padding:2px 6px;}
.mobile-menu-row{display:flex;align-items:center;gap:12px;padding:12px 10px;border-radius:10px;background:var(--surface);border:1px solid var(--border);cursor:pointer;transition:all .22s;}
.mobile-menu-row:hover{border-color:var(--accent2);}
.mobile-menu-row-label{font-family:'DM Mono',monospace;font-size:12px;letter-spacing:2px;color:var(--text);text-transform:uppercase;}
.mobile-menu-row-sub{font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;margin-top:2px;}

/* ── MAIN ── */
main{max-width:1200px;margin:0 auto;padding:32px 24px 80px;}

.section-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--sub);margin-bottom:16px;display:flex;align-items:center;gap:12px;}
.section-label::after{content:'';flex:1;height:1px;background:var(--border);}

/* ── DEVICES ── */
.devices-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-bottom:40px;}
.device-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;cursor:pointer;transition:all .38s;position:relative;overflow:hidden;}
.device-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent2));opacity:0;transition:opacity .38s;}
.device-card:hover{border-color:var(--muted);transform:translateY(-1px);}
.device-card.active{border-color:var(--accent2);}
.device-card.active::before{opacity:1;}
.device-name{font-family:'DM Mono',monospace;font-size:13px;font-weight:500;margin-bottom:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.device-id{font-family:'DM Mono',monospace;font-size:10px;color:var(--sub);letter-spacing:1px;}
.device-badge{font-size:9px;padding:2px 7px;border-radius:4px;background:rgba(123,92,250,0.2);color:var(--accent2);letter-spacing:1px;text-transform:uppercase;}
.device-color-preview{width:20px;height:20px;border-radius:4px;border:1px solid var(--border);margin-left:auto;flex-shrink:0;}
.btn-reconnect{padding:3px 10px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;background:transparent;border:1px solid var(--accent2);border-radius:4px;color:var(--accent2);cursor:pointer;transition:all .2s;}
.btn-remove{padding:3px 8px;font-family:'DM Mono',monospace;font-size:9px;background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--sub);cursor:pointer;margin-left:auto;transition:all .2s;}
.btn-remove:hover{border-color:#ff5577;color:#ff5577;}
.empty-state{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;padding:48px 24px;border:1px dashed var(--border);border-radius:12px;gap:12px;color:var(--sub);}
.empty-state svg{opacity:.3;}
.empty-state p{font-family:'DM Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;}

/* ── HUD ── */
.device-hud{background:var(--surface);border:1px solid var(--border);border-radius:16px;margin-bottom:24px;overflow:hidden;position:relative;}
.hud-canvas-wrap{position:relative;height:180px;background:#07070d;overflow:hidden;}
.hud-canvas{display:block;width:100%;height:100%;}
.hud-3d{position:absolute;inset:0;display:none;pointer-events:auto;}
.hud-3d.active{display:block;}
.hud-3d :deep(canvas){display:block;width:100%!important;height:100%!important;}
.hud-device-label{position:absolute;top:12px;left:16px;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:3px;color:rgba(255,255,255,0.12);pointer-events:none;}
.hud-off-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:4px;color:var(--muted);text-transform:uppercase;opacity:0;pointer-events:none;transition:opacity .45s;}
.hud-off-label.visible{opacity:1;}
.hud-view-toggle{position:absolute;top:10px;right:10px;background:rgba(10,10,20,0.75);border:1px solid var(--border);border-radius:6px;color:var(--sub);font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;padding:4px 10px;cursor:pointer;z-index:10;transition:border-color .3s,color .3s;backdrop-filter:blur(4px);}
.hud-view-toggle:hover{border-color:var(--accent2);color:var(--accent2);}
.hud-stats{display:grid;grid-template-columns:repeat(5,1fr);border-top:1px solid var(--border);}
.hud-stat{padding:11px 0;text-align:center;border-right:1px solid var(--border);}
.hud-stat:last-child{border-right:none;}
.hud-stat-val{font-family:'DM Mono',monospace;font-size:13px;font-weight:500;color:var(--text);line-height:1;}
.hud-stat-lbl{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:1.5px;color:var(--muted);margin-top:4px;text-transform:uppercase;}
.hud-stat-val.hi{color:var(--connected);}
.hud-stat-val.warn{color:#f0c040;}
.hud-stat-val.crit{color:#ff5577;}
.hud-gauge-track{height:3px;border-radius:2px;background:var(--panel);overflow:hidden;}
.hud-gauge-fill{height:100%;border-radius:2px;transition:width .75s ease,background .75s;}

/* ── CONTROL PANEL ── */
.control-panel-wrap{animation:fadeUp .45s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;}
.panel-title{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;}
.panel-subtitle{font-family:'DM Mono',monospace;font-size:11px;color:var(--sub);letter-spacing:1px;margin-top:2px;}
.power-toggle{width:52px;height:28px;background:var(--panel);border:1px solid var(--border);border-radius:14px;position:relative;cursor:pointer;transition:all .45s;flex-shrink:0;}
.power-toggle.on{background:rgba(61,255,192,0.15);border-color:var(--connected);box-shadow:0 0 16px rgba(61,255,192,0.2);}
.power-toggle::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:var(--muted);transition:all .45s;}
.power-toggle.on::after{left:27px;background:var(--connected);}

/* scenes */
.scene-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.scene-btn{padding:10px 6px;background:var(--panel);border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all .3s;color:var(--sub);font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;text-align:center;}
.scene-btn:hover{border-color:var(--accent2);color:var(--accent2);background:var(--glow2);}
.scene-icon{font-size:16px;display:block;margin-bottom:4px;}

/* controls grid */
.controls-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
@media(max-width:600px){.controls-grid{grid-template-columns:1fr;}}
.control-block{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 22px;}
.control-block.full{grid-column:1/-1;}
.control-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--sub);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;}
.control-value{font-family:'DM Mono',monospace;font-size:13px;color:var(--text);}

/* color picker */
.color-picker-row{display:flex;align-items:flex-start;gap:12px;margin-top:4px;}
.color-presets{display:flex;gap:8px;flex-wrap:wrap;flex:1;align-content:flex-start;}
.preset-swatch{width:24px;height:24px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:all .18s;flex-shrink:0;}
.preset-swatch:hover{transform:scale(1.25);box-shadow:0 0 8px var(--swatch-color,rgba(255,255,255,.5));}
.preset-swatch.selected{border-color:white;transform:scale(1.2);box-shadow:0 0 10px var(--swatch-color,rgba(255,255,255,.6));}
.color-slot-tab{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;border:1.5px solid transparent;background:var(--surface);cursor:pointer;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--sub);transition:all .18s;}
.color-slot-tab.active{border-color:rgba(255,255,255,.4);color:var(--text);}
.slot-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;border:1px solid rgba(255,255,255,.2);}
input[type="color"]{-webkit-appearance:none;appearance:none;width:52px;height:52px;border:2px solid var(--border);border-radius:50%;padding:3px;background:var(--panel);cursor:pointer;display:block;flex-shrink:0;transition:border-color .2s;}
input[type="color"]::-webkit-color-swatch-wrapper{padding:0;border-radius:50%;overflow:hidden;}
input[type="color"]::-webkit-color-swatch{border:none;border-radius:50%;}
input[type="color"]:hover{border-color:var(--accent);}

/* sliders */
input[type="range"]{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;outline:none;cursor:pointer;background:var(--panel);border:1px solid var(--border);}
.brightness-slider{background:linear-gradient(90deg,#1a1a2e,#ffffff);}
.speed-slider{background:linear-gradient(90deg,#1a1a2e,var(--accent2));}
input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--text);border:2px solid var(--bg,#0a0a0f);box-shadow:0 0 8px rgba(0,0,0,.4);cursor:pointer;transition:transform .22s;}
input[type="range"]::-webkit-slider-thumb:hover{transform:scale(1.2);}

/* effects */
.effect-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.effect-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;background:var(--panel);border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:all .3s;color:var(--sub);font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase;text-align:center;}
.effect-btn:hover{border-color:var(--muted);color:var(--text);}
.effect-btn.active{border-color:var(--accent);background:var(--glow);color:var(--accent);}
.effect-icon{font-size:18px;line-height:1;}

/* advanced */
.adv-block{border-top:1px solid var(--border);padding-top:18px;margin-top:4px;}
.adv-row{display:flex;align-items:center;gap:12px;}
.adv-row-label{font-family:'DM Mono',monospace;font-size:10px;color:var(--sub);letter-spacing:1px;text-transform:uppercase;white-space:nowrap;min-width:80px;}
.toggle-small{width:34px;height:18px;border-radius:9px;background:var(--muted);border:none;cursor:pointer;position:relative;transition:background .3s;flex-shrink:0;}
.toggle-small::after{content:'';position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:#0a0a0f;transition:transform .3s;}
.toggle-small.on{background:var(--connected);}
.toggle-small.on::after{transform:translateX(16px);}
.stepper{display:flex;align-items:center;border:1px solid var(--border);border-radius:7px;overflow:hidden;}
.stepper button{background:var(--surface);border:none;color:var(--text);font-size:15px;width:32px;height:30px;cursor:pointer;transition:background .22s;}
.stepper button:hover{background:var(--panel);}
.stepper span{font-family:'DM Mono',monospace;font-size:11px;color:var(--text);padding:0 12px;min-width:46px;text-align:center;background:var(--surface);height:30px;display:flex;align-items:center;justify-content:center;border-left:1px solid var(--border);border-right:1px solid var(--border);}
.cycle-bar-wrap{margin-top:10px;background:var(--surface);border:1px solid var(--border);border-radius:4px;height:4px;overflow:hidden;}
.cycle-bar{height:100%;background:linear-gradient(90deg,var(--accent2),var(--accent));border-radius:4px;transition:width .2s;}

/* log */
.log-accordion{margin-top:24px;border:1px solid var(--border);border-radius:12px;overflow:hidden;}
.log-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;padding:11px 18px;background:var(--surface);border:none;cursor:pointer;color:var(--sub);font-family:'DM Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;transition:background .3s;}
.log-toggle:hover{background:var(--panel);}
.log-count{background:var(--muted);color:#0a0a0f;font-size:9px;padding:1px 6px;border-radius:8px;font-family:'DM Mono',monospace;}
.log-chevron{transition:transform .38s;color:var(--muted);}
.log-accordion.open .log-chevron{transform:rotate(180deg);}
.ble-log{background:var(--surface);border-top:1px solid var(--border);padding:12px 20px;max-height:160px;overflow-y:auto;font-family:'DM Mono',monospace;font-size:11px;color:var(--sub);line-height:1.8;}
.log-entry{display:flex;gap:12px;}
.log-time{color:var(--muted);flex-shrink:0;}
.log-ok{color:var(--connected);}
.log-err{color:#ff5577;}
.log-info{color:var(--accent2);}

/* no device */
.no-device-state{display:flex;align-items:center;justify-content:center;min-height:55vh;}
.no-device-inner{display:flex;flex-direction:column;align-items:center;gap:16px;}
.no-device-icon{opacity:.3;}
.no-device-msg{font-family:'DM Mono',monospace;font-size:13px;letter-spacing:2px;color:var(--sub);text-transform:uppercase;}
.no-device-sub{font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);letter-spacing:1px;text-align:center;max-width:320px;}

/* toast */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:10px 20px;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:1px;color:var(--text);opacity:0;transition:all .35s;pointer-events:none;z-index:9999;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}

::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}
</style>

<!-- scoped styles moved earlier; no additional changes needed -->
