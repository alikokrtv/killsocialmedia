/**
 * PROJECT OCULI — core.js  (Phase 1: Humanity XP & Rank System)
 * ─────────────────────────────────────────────────────────────
 *  • Terminal Breach sekansı
 *  • Web Audio API — 85Hz–255Hz insan sesi dedektörü
 *  • Gatur Filtresi (glitch overlay) yönetimi + yoğunluk zamanlayıcısı
 *  • Humanity XP motoru (+5 XP/sn ses, -2 XP her 10sn Gatur)
 *  • Rütbe sistemi: ZOMBİ / UYANIŞTA / OCULİ REHBERİ
 *  • Global Gatur Seviyesi (kurgusal, XP'ye göre düşer)
 *  • LocalStorage kalıcılığı
 *  • Kamera (AR) aktivasyonu
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════════════════
   BREACH SEQUENCE (Terminal Intro)
═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
   LOCALSTORAGE — must be defined before BREACH_LINES
═══════════════════════════════════════════════════════ */
const LS_KEY_XP      = 'oculi_xp';
const LS_KEY_RESCUED = 'oculi_rescued_seconds';
const LS_KEY_GLOBAL  = 'oculi_global_gatur';

function loadXP()       { return parseFloat(localStorage.getItem(LS_KEY_XP) || '0'); }
function saveXP(xp)     { localStorage.setItem(LS_KEY_XP, xp.toFixed(2)); }
function loadRescued()  { return parseInt(localStorage.getItem(LS_KEY_RESCUED) || '0', 10); }
function saveRescued(s) { localStorage.setItem(LS_KEY_RESCUED, String(s)); }
function loadGlobalGatur() { return parseFloat(localStorage.getItem(LS_KEY_GLOBAL) || '87.4'); }
function saveGlobalGatur(v) { localStorage.setItem(LS_KEY_GLOBAL, v.toFixed(2)); }

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
  { text: '  HUMANITY_XP :: ' + loadXP() + ' XP [BULUNDU]', cls: 'info', delay: 2900 },
  { text: '  KONUM       :: [MASKELEME AKTİF — ŞİFRELİ]', cls: 'warn', delay: 3100 },
  { text: '', cls: '', delay: 3300 },
  { text: '> GATUR FİLTRESİ YÜKLENİYOR...', cls: 'err', delay: 3500 },
  { text: '  PARAZIT KATMANI AKTİF', cls: 'err', delay: 3800 },
  { text: '  MIX_BLEND_MODE :: difference [SAĞLANDI]', cls: 'err', delay: 4000 },
  { text: '', cls: '', delay: 4200 },
  { text: '> XP MOTORU YÜKLENİYOR... +5/sn | -2/10sn', cls: 'ok', delay: 4400 },
  { text: '> SİSTEM HAZIR. OCULI PROTOKOLÜ AKTİF.', cls: 'ok', delay: 4700 },
  { text: '> FREKANSINI KIR. İNSANI BUL.', cls: 'info', delay: 5100 },
];

function fakeGPU() {
  const gpus = ['NVIDIA RTX [SAPTANDI]', 'AMD Radeon [SAPTANDI]', 'Intel Arc [SAPTANDI]', 'Apple M-Series [SAPTANDI]'];
  return gpus[Math.floor(Math.random() * gpus.length)];
}
function fakeRAM() { return [4, 8, 16, 32][Math.floor(Math.random() * 4)]; }
function getTZ() {
  const offset = -(new Date().getTimezoneOffset() / 60);
  return (offset >= 0 ? '+' : '') + offset;
}
function getBrowserTag() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Mozilla Firefox';
  if (ua.includes('Edg'))     return 'Microsoft Edge';
  if (ua.includes('Chrome'))  return 'Chromium';
  if (ua.includes('Safari'))  return 'Safari';
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
      progressBar.style.width = Math.min(((i + 1) / BREACH_LINES.length) * 100, 100) + '%';
    }, delay);
  });

  setTimeout(() => { statusEl.textContent = 'PROTOKOL TAMAMLANDI — GİRİŞ YAPILIYOR...'; }, totalTime - 400);

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
  requestAnimationFrame(() => requestAnimationFrame(() => { main.style.opacity = '1'; }));
  startGaturIntensityTimer();
  startXPEngine();
  renderDashboard();
  renderGlobalGatur();
}

/* ═══════════════════════════════════════════════════════
   GATUR FILTER — Intensity Engine
═══════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════
   HUMANITY XP ENGINE
   +5 XP per second while human voice active
   -2 XP per 10 seconds while Gatur is active (not cleared)
═══════════════════════════════════════════════════════ */

// ── Rank definitions ──
const RANKS = [
  {
    id: 'zombie',
    label: 'ZOMBİ',
    minXP: 0,
    maxXP: 100,
    color: 'var(--red)',
    glow: 'var(--red-glow)',
    shake: true,
    description: 'Algoritmanın besinisin. Uyku modunda.',
  },
  {
    id: 'awakening',
    label: 'UYANIŞTA',
    minXP: 101,
    maxXP: 500,
    color: 'var(--violet)',
    glow: 'var(--violet-glow)',
    shake: false,
    description: 'Gaturun farkındasın. Mücadele başlıyor.',
  },
  {
    id: 'guide',
    label: 'OCULİ REHBERİ',
    minXP: 501,
    maxXP: Infinity,
    color: 'var(--green)',
    glow: 'rgba(0,255,65,0.35)',
    shake: false,
    description: 'Paraziti dağıtıyorsun. Başkalarının fişini çek.',
  },
];

// ── (LS helpers moved to top of file, before BREACH_LINES) ──

// ── State ──
let xp            = loadXP();
let rescuedSec    = loadRescued();
let globalGatur   = loadGlobalGatur();
let xpGainTick    = 0;   // counts seconds voice is active
let xpDecayTick   = 0;   // counts seconds Gatur is active (not cleared)

function getRank(currentXP) {
  return RANKS.slice().reverse().find(r => currentXP >= r.minXP) || RANKS[0];
}

function startXPEngine() {
  // Every 1 second — XP gain/loss tick
  setInterval(() => {
    const gaturCleared = gaturEl.classList.contains('gatur-cleared');

    // +5 XP per second while human voice active
    if (humanVoiceActive) {
      xp = Math.max(0, xp + 5);
      rescuedSec++;
      saveRescued(rescuedSec);

      // Global Gatur drops 0.01 per XP point gained
      globalGatur = Math.max(0, globalGatur - 0.02);
      saveGlobalGatur(globalGatur);
    }

    // -2 XP every 10 seconds while Gatur is active AND voice not detected
    if (!gaturCleared && !humanVoiceActive) {
      xpDecayTick++;
      if (xpDecayTick >= 10) {
        xp = Math.max(0, xp - 2);
        xpDecayTick = 0;
      }
    } else {
      xpDecayTick = 0;
    }

    saveXP(xp);
    renderDashboard();
    renderGlobalGatur();
  }, 1000);
}

// ── Dashboard Renderer ──
function renderDashboard() {
  const rank = getRank(xp);

  // XP bar
  const xpEl    = document.getElementById('dash-xp-value');
  const barEl   = document.getElementById('dash-xp-bar-fill');
  const rankEl  = document.getElementById('dash-rank-label');
  const descEl  = document.getElementById('dash-rank-desc');
  const rescEl  = document.getElementById('dash-rescued');

  if (!xpEl) return;

  xpEl.textContent  = Math.floor(xp) + ' XP';
  rankEl.textContent = rank.label;
  rankEl.className  = 'dash-rank-value rank-' + rank.id;
  if (descEl) descEl.textContent = rank.description;
  if (rescEl) rescEl.textContent = formatSeconds(rescuedSec);

  // XP bar width — capped to next rank threshold
  const nextRank  = RANKS.find(r => r.minXP > xp);
  const prevMin   = rank.minXP;
  const nextMax   = nextRank ? nextRank.minXP : rank.minXP + 500;
  const pct       = Math.min(((xp - prevMin) / (nextMax - prevMin)) * 100, 100);
  if (barEl) {
    barEl.style.width      = pct + '%';
    barEl.style.background = `linear-gradient(90deg, ${rank.color}, ${rank.color.replace('var(', '').replace(')', '')})`;
    barEl.style.boxShadow  = `0 0 12px ${rank.glow}`;
  }

  // Apply rank shake to rank label
  if (rank.shake) {
    rankEl.classList.add('rank-shake');
  } else {
    rankEl.classList.remove('rank-shake');
  }

  // Rank color on XP value
  if (xpEl) xpEl.style.color = rank.color;
}

function renderGlobalGatur() {
  const el = document.getElementById('global-gatur-value');
  if (!el) return;
  el.textContent = globalGatur.toFixed(1) + '%';

  const barEl = document.getElementById('global-gatur-bar-fill');
  if (barEl) {
    barEl.style.width = Math.min(globalGatur, 100) + '%';
  }

  // Color shifts based on value
  const hue = globalGatur < 30 ? 'var(--green)' : globalGatur < 60 ? '#ffaa00' : 'var(--red)';
  el.style.color = hue;
}

function formatSeconds(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}s ${m}d ${sec}sn`;
  if (m > 0) return `${m}d ${sec}sn`;
  return `${sec}sn`;
}

/* ═══════════════════════════════════════════════════════
   WEB AUDIO API — Human Frequency Engine  (85–255 Hz)
═══════════════════════════════════════════════════════ */
const HUMAN_LOW  = 85;
const HUMAN_HIGH = 255;
const DETECTION_THRESHOLD = 80;

let audioCtx      = null;
let analyser      = null;
let micStream     = null;
let freqDataArray = null;
let animFrameId   = null;
let humanVoiceActive = false;
let humanVoiceClearTimeout = null;

const canvas     = document.getElementById('freq-canvas');
const ctx2d      = canvas ? canvas.getContext('2d') : null;
const freqLabel  = document.getElementById('freq-label');
const statStatus = document.getElementById('stat-status');
const statFreq   = document.getElementById('stat-freq');
const statHuman  = document.getElementById('stat-human');

async function initAudio() {
  if (audioCtx) return;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(micStream);
    analyser  = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    freqDataArray = new Uint8Array(analyser.frequencyBinCount);
    if (statStatus) statStatus.textContent = 'AKTİF';
    setSignal(true);
    analyseLoop();
  } catch (err) {
    console.error('[OCULI] Mikrofon erişimi reddedildi:', err);
    if (statStatus) statStatus.textContent = 'REDDEDİLDİ';
  }
}

function analyseLoop() {
  animFrameId = requestAnimationFrame(analyseLoop);
  analyser.getByteFrequencyData(freqDataArray);

  const sampleRate = audioCtx.sampleRate;
  const hzPerBin   = sampleRate / (analyser.frequencyBinCount * 2);
  const lowBin     = Math.floor(HUMAN_LOW  / hzPerBin);
  const highBin    = Math.ceil(HUMAN_HIGH / hzPerBin);

  let maxAmp = 0, maxBin = lowBin;
  for (let i = lowBin; i <= highBin && i < freqDataArray.length; i++) {
    if (freqDataArray[i] > maxAmp) { maxAmp = freqDataArray[i]; maxBin = i; }
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
    if (humanVoiceClearTimeout) clearTimeout(humanVoiceClearTimeout);
    humanVoiceClearTimeout = setTimeout(() => {
      humanVoiceActive = false;
      restoreGatur();
    }, 2000);
  }
}

function drawVisualizer(lowBin, highBin, isHuman) {
  if (!ctx2d) return;
  const W = canvas.width, H = canvas.height;
  ctx2d.clearRect(0, 0, W, H);
  ctx2d.fillStyle = 'rgba(0,0,0,0.4)';
  ctx2d.fillRect(0, 0, W, H);
  const barW = W / freqDataArray.length;

  for (let i = 0; i < freqDataArray.length; i++) {
    const amp     = freqDataArray[i] / 255;
    const barH    = amp * H;
    const inRange = i >= lowBin && i <= highBin;
    let color;
    if (inRange && isHuman)  color = `rgba(0, 255, 65, ${0.4 + amp * 0.6})`;
    else if (inRange)        color = `rgba(128, 0, 128, ${0.3 + amp * 0.7})`;
    else                     color = `rgba(40, 40, 40, ${0.2 + amp * 0.5})`;
    ctx2d.fillStyle = color;
    ctx2d.fillRect(i * barW, H - barH, barW - 1, barH);
  }

  ctx2d.strokeStyle = 'rgba(128,0,128,0.4)';
  ctx2d.lineWidth = 1;
  [lowBin, highBin].forEach(bin => {
    const x = bin * barW;
    ctx2d.beginPath(); ctx2d.moveTo(x, 0); ctx2d.lineTo(x, H); ctx2d.stroke();
  });
}

function stopAudio() {
  if (animFrameId)  { cancelAnimationFrame(animFrameId); animFrameId = null; }
  if (micStream)    { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
  if (audioCtx)     { audioCtx.close(); audioCtx = null; }
  analyser = null;
  setSignal(false);
  if (statStatus) statStatus.textContent = 'PASİF';
}

/* ═══════════════════════════════════════════════════════
   CAMERA (AR Skeleton)
═══════════════════════════════════════════════════════ */
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
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
  document.getElementById('camera-feed').srcObject = null;
  document.getElementById('ar-view').classList.add('hidden-section');
}

/* ═══════════════════════════════════════════════════════
   SIGNAL INDICATOR
═══════════════════════════════════════════════════════ */
function setSignal(live) {
  const dot   = document.getElementById('signal-dot');
  const label = document.getElementById('signal-label');
  if (!dot || !label) return;
  if (live) { dot.classList.add('live');    label.textContent = 'CANLI'; }
  else       { dot.classList.remove('live'); label.textContent = 'OFFLINE'; }
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  runBreachSequence();

  document.getElementById('red-pill-btn')?.addEventListener('click', async () => {
    await activateCamera();
    await initAudio();
  });

  document.getElementById('mic-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('mic-btn');
    if (!audioCtx) {
      await initAudio();
      if (btn) btn.textContent = 'MİKROFONU KAPAT';
    } else {
      stopAudio();
      if (btn) btn.textContent = 'MİKROFONU ETKİNLEŞTİR';
    }
  });

  document.getElementById('stop-cam-btn')?.addEventListener('click', deactivateCamera);

  // Reset XP button (cheat / test)
  document.getElementById('dash-reset-btn')?.addEventListener('click', () => {
    if (confirm('XP sıfırlansın mı?')) {
      xp = 0; rescuedSec = 0; globalGatur = 87.4;
      saveXP(xp); saveRescued(rescuedSec); saveGlobalGatur(globalGatur);
      renderDashboard(); renderGlobalGatur();
    }
  });
});
