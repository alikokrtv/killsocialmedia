/**
 * PROJECT OCULI — core.js
 * ─────────────────────────────────────────────────────────
 * Human Interaction Engine
 *   • Web Audio API — 85 Hz–255 Hz insan sesi dedektörü
 *   • Gatur Filtresi kontrolü (glitch overlay yönetimi)
 *   • Kamera (AR) aktivasyonu
 *   • Terminal Breach sekansı (intro)
 * ─────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════
   BREACH SEQUENCE
═══════════════════════════════════════ */
const BREACH_LINES = [
  { text: '> BAĞLANTI KURULUYOR... 98.43.17.212', cls: 'info', delay: 200 },
  { text: '> DONANIM TARAMASI BAŞLATILIYOR', cls: 'ok', delay: 600 },
  { text: '  CPU_ARCH    :: x86_64 [ALINDI]', cls: 'ok', delay: 900 },
  { text: '  GPU_VENDOR  :: ' + fakeGPU(), cls: 'ok', delay: 1100 },
  { text: '  EKRAN_RES   :: ' + screen.width + 'x' + screen.height, cls: 'ok', delay: 1300 },
  { text: '  BELLEK      :: ~' + fakeRAM() + ' GB KULLANILDI', cls: 'warn', delay: 1500 },
  { text: '  ZAMAN_DİLİMİ:: UTC' + getTZ(), cls: 'ok', delay: 1700 },
  { text: '  TARAYICI    :: ' + getBrowserTag(), cls: 'ok', delay: 1900 },
  { text: '', cls: '', delay: 2100 },
  { text: '> KULLANICI PROFİLİ OLUŞTURULUYOR...', cls: 'warn', delay: 2300 },
  { text: '  KİMLİK HASH :: ' + fakeHash(), cls: 'ok', delay: 2700 },
  { text: '  KONUM       :: [MASKELEME AKTİF — ŞİFRELİ]', cls: 'warn', delay: 3000 },
  { text: '', cls: '', delay: 3200 },
  { text: '> GATUR FİLTRESİ YÜKLENİYOR...', cls: 'err', delay: 3400 },
  { text: '  PARAZIT KATMANI AKTIF', cls: 'err', delay: 3700 },
  { text: '  MIX_BLEND_MODE :: difference [SAĞLANDI]', cls: 'err', delay: 3900 },
  { text: '', cls: '', delay: 4200 },
  { text: '> SİSTEM HAZIR. OCULI PROTOKOLÜ AKTİF.', cls: 'ok', delay: 4500 },
  { text: '> FREKANSINI KIR. İNSANI BUL.', cls: 'info', delay: 4900 },
];

function fakeGPU() {
  const gpus = ['NVIDIA RTX [SAPTANDI]', 'AMD Radeon [SAPTANDI]', 'Intel Arc [SAPTANDI]', 'Apple M-Series [SAPTANDI]'];
  return gpus[Math.floor(Math.random() * gpus.length)];
}
function fakeRAM() {
  return [4, 8, 16, 32][Math.floor(Math.random() * 4)];
}
function getTZ() {
  const offset = -(new Date().getTimezoneOffset() / 60);
  return (offset >= 0 ? '+' : '') + offset;
}
function getBrowserTag() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Mozilla Firefox';
  if (ua.includes('Edg')) return 'Microsoft Edge';
  if (ua.includes('Chrome')) return 'Chromium';
  if (ua.includes('Safari')) return 'Safari';
  return 'Bilinmeyen Tarayıcı';
}
function fakeHash() {
  return [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
}

function runBreachSequence() {
  const overlay     = document.getElementById('breach-overlay');
  const linesEl     = document.getElementById('breach-lines');
  const progressBar = document.getElementById('breach-progress-bar');
  const statusEl    = document.getElementById('breach-status');
  const clockEl     = document.getElementById('breach-clock');

  // Live clock
  const clockTick = setInterval(() => {
    clockEl.textContent = new Date().toISOString().replace('T', ' ').slice(0, 19);
  }, 1000);
  clockEl.textContent = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const totalTime = BREACH_LINES[BREACH_LINES.length - 1].delay + 600;

  BREACH_LINES.forEach(({ text, cls, delay }, i) => {
    setTimeout(() => {
      const span = document.createElement('span');
      span.classList.add('line');
      if (cls) span.classList.add(cls);
      span.textContent = text;
      linesEl.appendChild(span);
      linesEl.scrollTop = linesEl.scrollHeight;

      const pct = Math.min(((i + 1) / BREACH_LINES.length) * 100, 100);
      progressBar.style.width = pct + '%';
    }, delay);
  });

  setTimeout(() => {
    statusEl.textContent = 'PROTOKOL TAMAMLANDI — GİRİŞ YAPILIYOR...';
  }, totalTime - 400);

  setTimeout(() => {
    clearInterval(clockTick);
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.style.display = 'none';
      revealMain();
    }, 800);
  }, totalTime);
}

function revealMain() {
  const main = document.getElementById('main-content');
  main.classList.remove('hidden');
  main.style.opacity = '0';
  main.style.transition = 'opacity 1s ease';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { main.style.opacity = '1'; });
  });
  startGaturIntensityTimer();
}

/* ═══════════════════════════════════════
   GATUR FILTER INTENSITY ENGINE
   Ekranda geçirilen süreye göre artar
═══════════════════════════════════════ */
const gaturEl = document.getElementById('gatur-overlay');
let gaturLevel = 0;
let gaturTimer = null;

function startGaturIntensityTimer() {
  let elapsed = 0;
  gaturEl.setAttribute('data-intensity', '0');

  gaturTimer = setInterval(() => {
    elapsed++;
    if (elapsed === 20 && gaturLevel < 1) setGaturLevel(1);
    if (elapsed === 60 && gaturLevel < 2) setGaturLevel(2);
    if (elapsed === 120 && gaturLevel < 3) setGaturLevel(3);
  }, 1000);
}

function setGaturLevel(level) {
  gaturLevel = level;
  gaturEl.setAttribute('data-intensity', String(level));
  updateGaturStat();
}

function clearGatur() {
  gaturEl.classList.add('gatur-cleared');
  updateGaturStat(true);
}

function restoreGatur() {
  gaturEl.classList.remove('gatur-cleared');
  updateGaturStat(false);
}

function updateGaturStat(cleared = false) {
  const statGatur = document.getElementById('stat-gatur');
  if (statGatur) {
    statGatur.textContent = cleared ? 'TEMİZLENDİ' : 'AKTİF [lvl' + gaturLevel + ']';
    statGatur.style.color = cleared ? 'var(--green)' : 'var(--red)';
  }
}

/* ═══════════════════════════════════════
   WEB AUDIO API — Human Frequency Engine
   Detects 85 Hz – 255 Hz range
═══════════════════════════════════════ */
const HUMAN_LOW  = 85;
const HUMAN_HIGH = 255;
const DETECTION_THRESHOLD = 80; // minimum amplitude (0–255) to qualify

let audioCtx      = null;
let analyser      = null;
let micStream     = null;
let freqDataArray = null;
let animFrameId   = null;
let humanVoiceActive = false;
let humanVoiceClearTimeout = null;

const canvas    = document.getElementById('freq-canvas');
const ctx2d     = canvas ? canvas.getContext('2d') : null;
const freqLabel = document.getElementById('freq-label');
const statStatus = document.getElementById('stat-status');
const statFreq   = document.getElementById('stat-freq');
const statHuman  = document.getElementById('stat-human');

async function initAudio() {
  if (audioCtx) return; // already running

  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(micStream);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);

    freqDataArray = new Uint8Array(analyser.frequencyBinCount);

    if (statStatus) statStatus.textContent = 'AKTİF';
    setSignal(true);
    analyseLoop();
  } catch (err) {
    console.error('[OCULI] Mikrofon erişimi reddedildi:', err);
    if (statStatus) statStatus.textContent = 'REDDEDILDI';
  }
}

function analyseLoop() {
  animFrameId = requestAnimationFrame(analyseLoop);
  analyser.getByteFrequencyData(freqDataArray);

  const sampleRate = audioCtx.sampleRate;
  const binCount   = analyser.frequencyBinCount;
  const hzPerBin   = sampleRate / (binCount * 2);

  const lowBin  = Math.floor(HUMAN_LOW  / hzPerBin);
  const highBin = Math.ceil(HUMAN_HIGH / hzPerBin);

  // Find peak in human range
  let maxAmp = 0;
  let maxBin = lowBin;
  for (let i = lowBin; i <= highBin && i < freqDataArray.length; i++) {
    if (freqDataArray[i] > maxAmp) {
      maxAmp = freqDataArray[i];
      maxBin = i;
    }
  }

  const dominantHz = Math.round(maxBin * hzPerBin);
  const isHuman    = maxAmp > DETECTION_THRESHOLD;

  updateStats(dominantHz, isHuman);
  handleGaturResponse(isHuman);
  drawVisualizer(lowBin, highBin, isHuman);
}

function updateStats(hz, isHuman) {
  if (statFreq)  statFreq.textContent  = hz + ' Hz';
  if (statHuman) {
    statHuman.textContent = isHuman ? 'EVET ✓' : 'HAYIR';
    statHuman.className   = 'stat-val' + (isHuman ? ' human-detected' : '');
  }
  if (freqLabel) {
    freqLabel.textContent = isHuman
      ? '⬤ İNSAN SESİ ALGILANDI — ' + hz + ' Hz'
      : '— GATURDA KAYIP —';
    freqLabel.style.color = isHuman ? 'var(--green)' : 'var(--violet)';
  }
}

function handleGaturResponse(isHuman) {
  if (isHuman && !humanVoiceActive) {
    humanVoiceActive = true;
    clearGatur();
    if (humanVoiceClearTimeout) clearTimeout(humanVoiceClearTimeout);
  } else if (!isHuman && humanVoiceActive) {
    // Restore gatur after 2s silence
    if (humanVoiceClearTimeout) clearTimeout(humanVoiceClearTimeout);
    humanVoiceClearTimeout = setTimeout(() => {
      humanVoiceActive = false;
      restoreGatur();
    }, 2000);
  }
}

function drawVisualizer(lowBin, highBin, isHuman) {
  if (!ctx2d) return;
  const W = canvas.width;
  const H = canvas.height;
  const barCount = freqDataArray.length;

  ctx2d.clearRect(0, 0, W, H);
  ctx2d.fillStyle = 'rgba(0,0,0,0.4)';
  ctx2d.fillRect(0, 0, W, H);

  const barW = W / barCount;

  for (let i = 0; i < barCount; i++) {
    const amp = freqDataArray[i] / 255;
    const barH = amp * H;
    const inRange = i >= lowBin && i <= highBin;

    let color;
    if (inRange && isHuman) {
      color = `rgba(0, 255, 65, ${0.4 + amp * 0.6})`;
    } else if (inRange) {
      color = `rgba(128, 0, 128, ${0.3 + amp * 0.7})`;
    } else {
      color = `rgba(40, 40, 40, ${0.2 + amp * 0.5})`;
    }

    ctx2d.fillStyle = color;
    ctx2d.fillRect(i * barW, H - barH, barW - 1, barH);
  }

  // Draw human range markers
  ctx2d.strokeStyle = 'rgba(128,0,128,0.4)';
  ctx2d.lineWidth = 1;
  [lowBin, highBin].forEach(bin => {
    const x = bin * barW;
    ctx2d.beginPath();
    ctx2d.moveTo(x, 0);
    ctx2d.lineTo(x, H);
    ctx2d.stroke();
  });
}

function stopAudio() {
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  analyser = null;
  setSignal(false);
  if (statStatus) statStatus.textContent = 'PASİF';
}

/* ═══════════════════════════════════════
   CAMERA (AR Skeleton)
═══════════════════════════════════════ */
let cameraStream = null;

async function activateCamera() {
  const arSection = document.getElementById('ar-view');
  const videoEl   = document.getElementById('camera-feed');

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    videoEl.srcObject = cameraStream;

    arSection.classList.remove('hidden-section');
    arSection.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('[OCULI] Kamera erişimi reddedildi:', err);
    alert('Kamera erişimi reddedildi. Lensi açmak için izin ver.');
  }
}

function deactivateCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  const videoEl   = document.getElementById('camera-feed');
  const arSection = document.getElementById('ar-view');
  videoEl.srcObject = null;
  arSection.classList.add('hidden-section');
}

/* ═══════════════════════════════════════
   SIGNAL INDICATOR
═══════════════════════════════════════ */
function setSignal(live) {
  const dot   = document.getElementById('signal-dot');
  const label = document.getElementById('signal-label');
  if (live) {
    dot.classList.add('live');
    label.textContent = 'CANLI';
  } else {
    dot.classList.remove('live');
    label.textContent = 'OFFLINE';
  }
}

/* ═══════════════════════════════════════
   EVENT BINDINGS
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  runBreachSequence();

  const redPillBtn = document.getElementById('red-pill-btn');
  if (redPillBtn) {
    redPillBtn.addEventListener('click', async () => {
      await activateCamera();
      await initAudio();
    });
  }

  const micBtn = document.getElementById('mic-btn');
  if (micBtn) {
    micBtn.addEventListener('click', async () => {
      if (!audioCtx) {
        await initAudio();
        micBtn.textContent = 'MİKROFONU KAPAT';
      } else {
        stopAudio();
        micBtn.textContent = 'MİKROFONU ETKİNLEŞTİR';
      }
    });
  }

  const stopCamBtn = document.getElementById('stop-cam-btn');
  if (stopCamBtn) {
    stopCamBtn.addEventListener('click', deactivateCamera);
  }
});
