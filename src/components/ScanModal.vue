<template>
  <Teleport to="body">
    <div class="scan-overlay" :class="{ visible: modelValue }" @click.self="$emit('update:modelValue', false)">
      <div class="scan-modal">
        <div class="scan-modal-header">
          <div>
            <div class="scan-modal-title">ADD DEVICE</div>
            <div class="scan-modal-sub">{{ subText }}</div>
          </div>
          <button class="scan-close" @click="$emit('update:modelValue', false)">✕</button>
        </div>

        <!-- Method tabs -->
        <div class="scan-method-tabs">
          <button
            v-for="m in methods"
            :key="m.id"
            class="scan-method-tab"
            :class="{ active: activeMethod === m.id, disabled: !m.available }"
            @click="m.available && (activeMethod = m.id)"
          >
            <span v-html="m.icon" />
            {{ m.label }}
            <span v-if="!m.available" class="method-unavail">N/A</span>
          </button>
        </div>

        <!-- BLE Scan -->
        <div v-if="activeMethod === 'ble'" class="scan-body">
          <div class="scan-status-msg" :class="scanning ? 'scanning' : ''">
            <div class="scan-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2l4 4-4 4V2zM12 14l4 4-4 4v-8zM4 7l4 5-4 5M20 7l-4 5 4 5"/>
              </svg>
            </div>
            <p id="scan-status-text">{{ bleStatusText }}</p>
          </div>

          <div v-if="!bleSupported" class="ble-unsupported">
            <p>Web Bluetooth is not available in this browser.</p>
            <p class="ble-hint">Use Chrome or Edge on Android/Desktop, or enable <code>chrome://flags/#enable-experimental-web-platform-features</code></p>
            <button class="scan-btn demo-btn" @click="addMockDevice">LOAD DEMO DEVICE</button>
          </div>
          <div v-else>
            <button class="scan-btn" :disabled="connecting" @click="startBLEScan">
              {{ connecting ? 'CONNECTING…' : 'SCAN FOR DEVICES' }}
            </button>
            <p class="scan-hint">The browser will show a device picker. Select your Hyphi device.</p>
          </div>
        </div>

        <!-- QR Scan -->
        <div v-if="activeMethod === 'qr'" class="scan-body">
          <div class="qr-viewfinder" id="qr-viewfinder">
            <div class="qr-corner tl"/><div class="qr-corner tr"/>
            <div class="qr-corner bl"/><div class="qr-corner br"/>
            <div class="qr-scan-line" :class="{ active: scanningQR }" id="qr-scan-line"/>
          </div>
          <p class="scan-hint">{{ qrHint }}</p>
          <div v-if="!cameraSupported" class="ble-unsupported">
            <p>Camera access not available.</p>
            <button class="scan-btn demo-btn" @click="addMockDevice">LOAD DEMO DEVICE</button>
          </div>
          <div v-else>
            <button class="scan-btn" :disabled="scanningQR" @click="startQRScan">
              {{ scanningQR ? 'SCANNING…' : 'START CAMERA' }}
            </button>
          </div>
        </div>

        <!-- NFC Tap -->
        <div v-if="activeMethod === 'nfc'" class="scan-body nfc-body">
          <div class="nfc-rings">
            <div class="nfc-ring" :class="{ tap: nfcReading }" v-for="i in 3" :key="i" :style="`--i:${i}`"/>
            <div class="nfc-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 12a8 8 0 00-8-8M16 12a4 4 0 00-4-4M12 12h.01"/>
              </svg>
            </div>
          </div>
          <p class="nfc-label">{{ nfcLabel }}</p>
          <div v-if="!nfcSupported" class="ble-unsupported">
            <p>Web NFC is not available on this device.</p>
            <p class="ble-hint">Requires Android Chrome with NFC hardware.</p>
            <button class="scan-btn demo-btn" @click="addMockDevice">LOAD DEMO DEVICE</button>
          </div>
          <div v-else>
            <button class="scan-btn" :disabled="nfcReading" @click="startNFC">
              {{ nfcReading ? 'WAITING FOR TAG…' : 'START NFC SCAN' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDeviceStore } from '@/stores/deviceStore'
import { bleSupported, requestBLEDevice, connectGATT, readNFCAndConnect } from '@/composables/useBLE'
import { MOCK_DEVICES } from '@/composables/useMock'

const props = defineProps({ modelValue: Boolean })
const emit  = defineEmits(['update:modelValue'])

const store = useDeviceStore()
const activeMethod = ref('ble')
const connecting    = ref(false)
const scanning      = ref(false)
const scanningQR    = ref(false)
const nfcReading   = ref(false)
const bleStatusText = ref('Click SCAN to open device picker')
const qrHint       = ref('Point camera at the QR code on your device')
const nfcLabel     = ref('Hold your device near the NFC tag')
const nfcSupported  = 'NDEFReader' in window
const cameraSupported = !!(navigator.mediaDevices?.getUserMedia)

const subText = computed(() => ({
  ble: 'Scan for nearby BLE devices',
  qr:  'Scan the QR code on your device',
  nfc: 'Hold near an NFC-enabled device',
}[activeMethod.value]))

const methods = [
  {
    id: 'ble', label: 'BLE', available: true,
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l4 4-4 4V2zM12 14l4 4-4 4v-8zM4 7l4 5-4 5"/></svg>'
  },
  {
    id: 'qr', label: 'QR CODE', available: cameraSupported,
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3v3M14 20h3"/></svg>'
  },
  {
    id: 'nfc', label: 'NFC TAP', available: nfcSupported,
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12a8 8 0 00-8-8M16 12a4 4 0 00-4-4M12 12h.01"/></svg>'
  },
]

async function startBLEScan() {
  if (connecting.value) return
  connecting.value = true
  scanning.value = true
  bleStatusText.value = 'Opening device picker…'
  try {
    const bleDevice = await requestBLEDevice((msg, type) => store.log(msg, type))
    if (!bleDevice) {
      bleStatusText.value = 'Scan cancelled'
      return
    }
    bleStatusText.value = `Found ${bleDevice.name ?? bleDevice.id} — connecting…`
    const result = await connectGATT(bleDevice, (msg, type) => store.log(msg, type))
    if (result) {
      store._addDevicePublic(result)
      emit('update:modelValue', false)
    }
  } catch (e: unknown) {
    bleStatusText.value = `Error: ${(e as Error).message}`
  } finally {
    connecting.value = false
    scanning.value = false
  }
}

async function startNFC() {
  if (nfcReading.value) return
  nfcReading.value = true
  nfcLabel.value = 'Hold near NFC tag…'
  try {
    await store.connectNFC()
    emit('update:modelValue', false)
  } catch (e) {
    nfcLabel.value = `NFC error: ${e.message}`
  } finally {
    nfcReading.value = false
  }
}

function startQRScan() {
  // Real QR scanning requires a library like jsQR + getUserMedia
  // For now, open BLE picker as fallback after QR decode
  qrHint.value = 'QR scanning requires camera — launching BLE picker…'
  scanningQR.value = true
  setTimeout(() => {
    scanningQR.value = false
    startBLEScan()
  }, 1500)
}

function addMockDevice() {
  const unused = MOCK_DEVICES.find(m => !store.devices.find(d => d.info.id === m.id))
  if (unused) store.connectMock(unused)
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* ── Scan overlay ── */
.scan-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.75);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  opacity: 0; pointer-events: none;
  transition: opacity .3s;
}
.scan-overlay.visible { opacity: 1; pointer-events: all; }
.scan-modal {
  background: #111118;
  border: 1px solid #2a2a3a;
  border-radius: 18px 18px 0 0;
  width: 100%; max-width: 480px;
  padding: 24px;
  transform: translateY(20px);
  transition: transform .3s;
}
.scan-overlay.visible .scan-modal { transform: translateY(0); }
.scan-modal-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
.scan-modal-title { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:3px; color:#e8e8f0; }
.scan-modal-sub   { font-family:'DM Mono',monospace; font-size:10px; color:#6060a0; margin-top:4px; letter-spacing:2px; }
.scan-close { background:none; border:none; color:#6060a0; font-size:16px; cursor:pointer; padding:4px 8px; }
.scan-close:hover { color:#e8e8f0; }

.scan-method-tabs { display:flex; gap:8px; margin-bottom:20px; }
.scan-method-tab {
  flex:1; padding:8px 4px; border-radius:8px;
  border:1px solid #2a2a3a; background:#16161f;
  color:#6060a0; font-family:'DM Mono',monospace;
  font-size:9px; letter-spacing:2px; cursor:pointer;
  display:flex; flex-direction:column; align-items:center; gap:4px;
  transition: all .2s;
}
.scan-method-tab.active { border-color:#7b5cfa; color:#e8e8f0; }
.scan-method-tab.disabled { opacity:.4; cursor:not-allowed; }
.method-unavail { font-size:8px; color:#ff5577; }

.scan-body { padding: 12px 0; }
.scan-status-msg { display:flex; flex-direction:column; align-items:center; gap:12px; padding:24px; }
.scan-icon { color:#7b5cfa; }
.scanning .scan-icon { animation: spin 1.5s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.scan-btn {
  width:100%; padding:12px; margin-top:16px;
  border-radius:8px; border:1px solid #7b5cfa;
  background:transparent; color:#7b5cfa;
  font-family:'DM Mono',monospace; font-size:11px; letter-spacing:2px;
  cursor:pointer; transition:all .2s;
}
.scan-btn:hover:not(:disabled) { background:#7b5cfa22; }
.scan-btn:disabled { opacity:.4; cursor:not-allowed; }
.demo-btn { border-color:#ff6b35; color:#ff6b35; margin-top:8px; }
.demo-btn:hover { background:#ff6b3522; }

.scan-hint { font-family:'DM Mono',monospace; font-size:10px; color:#3a3a50; text-align:center; margin-top:8px; }

.ble-unsupported { margin-top:16px; padding:16px; border:1px solid #ff557733; border-radius:8px; background:#ff55770a; }
.ble-unsupported p { font-family:'DM Mono',monospace; font-size:11px; color:#ff8899; margin:0 0 8px; }
.ble-hint { font-size:10px !important; color:#6060a0 !important; }
.ble-hint code { background:#16161f; padding:2px 4px; border-radius:3px; font-size:9px; }

/* QR */
.qr-viewfinder {
  position:relative; width:200px; height:200px;
  margin:0 auto; background:#0a0a0f;
}
.qr-corner {
  position:absolute; width:20px; height:20px;
  border-color:#ff6b35; border-style:solid;
}
.qr-corner.tl { top:0; left:0; border-width:2px 0 0 2px; }
.qr-corner.tr { top:0; right:0; border-width:2px 2px 0 0; }
.qr-corner.bl { bottom:0; left:0; border-width:0 0 2px 2px; }
.qr-corner.br { bottom:0; right:0; border-width:0 2px 2px 0; }
.qr-scan-line {
  position:absolute; left:8px; right:8px; top:0; height:1px;
  background:linear-gradient(90deg, transparent, #ff6b35, transparent);
  opacity:0; transition:opacity .3s;
}
.qr-scan-line.active { opacity:1; animation: scan-sweep 1.8s ease-in-out infinite; }
@keyframes scan-sweep {
  0%,100% { top:8px; } 50% { top:calc(100% - 8px); }
}

/* NFC */
.nfc-body { display:flex; flex-direction:column; align-items:center; padding:20px 0; }
.nfc-rings {
  position:relative; width:120px; height:120px;
  display:flex; align-items:center; justify-content:center;
}
.nfc-ring {
  position:absolute;
  width:calc(40px * var(--i)); height:calc(40px * var(--i));
  border-radius:50%; border:1.5px solid #2a2a3a;
  transition:border-color .3s;
}
.nfc-ring.tap { border-color:#3dffc0; animation:nfc-pulse 1s ease-out infinite; }
@keyframes nfc-pulse {
  0% { transform:scale(1); opacity:1; }
  100% { transform:scale(1.15); opacity:0; }
}
.nfc-icon { position:relative; z-index:1; color:#3dffc0; }
.nfc-label { font-family:'DM Mono',monospace; font-size:11px; color:#6060a0; margin-top:16px; }
</style>