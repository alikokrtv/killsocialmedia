/**
 * PROJECT OCULI — core.js  (Phase 3: The Awakening)
 * ────────────────────────────────────────────────────
 *  Awakening Sequence State Machine:
 *    A. Digital Trance   (0–30s) — blue light, whispers, CSS scenes
 *    B. DUR.             (30–36s) — red shock text
 *    C. Warm Light       (36–52s) — dawn transition, synth birds
 *    MAIN — main site reveals
 *
 *  Humanity XP Engine (+5/s voice, -2/10s Gatur)
 *  Rank System: UYUYAN → UYANIŞTA → OCULİ REHBERİ
 *  body.awakened class → daylight theme at 501+ XP
 *  Flower bloom system
 *  LocalStorage persistence
 *  Web Audio API — 85–255Hz detection + synth nature sounds
 * ────────────────────────────────────────────────────
 */

'use strict';

/* ──────────────────────────────────────────────────
   LOCALSTORAGE  (must be above everything else)
────────────────────────────────────────────────── */
const LS_KEY_XP      = 'oculi_xp';
const LS_KEY_RESCUED = 'oculi_rescued_seconds';
const LS_KEY_GLOBAL  = 'oculi_global_gatur';

function loadXP()        { return parseFloat(localStorage.getItem(LS_KEY_XP) || '0'); }
function saveXP(v)       { localStorage.setItem(LS_KEY_XP, v.toFixed(2)); }
function loadRescued()   { return parseInt(localStorage.getItem(LS_KEY_RESCUED) || '0', 10); }
function saveRescued(v)  { localStorage.setItem(LS_KEY_RESCUED, String(v)); }
function loadGlobal()    { return parseFloat(localStorage.getItem(LS_KEY_GLOBAL) || '87.4'); }
function saveGlobal(v)   { localStorage.setItem(LS_KEY_GLOBAL, v.toFixed(2)); }

/* ──────────────────────────────────────────────────
   RANK DEFINITIONS
────────────────────────────────────────────────── */
const RANKS = [
  { id:'uyuyan',    label:'UYUYAN',         minXP:0,   maxXP:100,      color:'var(--red)',    glow:'var(--red-glow)',    shake:true,  desc:'Henüz uyanmadın. Frekansın bekleniyor.' },
  { id:'awakening', label:'UYANIŞTA',        minXP:101, maxXP:500,      color:'var(--violet)', glow:'var(--violet-glow)', shake:false, desc:'Gaturun farkındasın. Mücadele başlıyor.' },
  { id:'guide',     label:'OCULİ REHBERİ',  minXP:501, maxXP:Infinity, color:'var(--green)',  glow:'rgba(0,255,65,.35)', shake:false, desc:'Paraziti dağıtıyorsun. Başkalarının fişini çek.' },
];

function getRank(xp) { return [...RANKS].reverse().find(r => xp >= r.minXP) || RANKS[0]; }

/* ──────────────────────────────────────────────────
   STATE
────────────────────────────────────────────────── */
let xp          = loadXP();
let rescuedSec  = loadRescued();
let globalGatur = loadGlobal();
let xpDecayTick = 0;
let wasGuide    = xp >= 501;   // did we already trigger awakened?

/* ──────────────────────────────────────────────────
   WHISPER WORDS
────────────────────────────────────────────────── */
const WHISPERS = [
  'Kaydır...','Beğen...','Yenile...','Metroda...',
  'Sokakta...','Gece ayakta...','WC\'de...','Yatakta...',
  'Siyah ekran...','Sessizce...','Bir tane daha...',
  'Bildirim...','Tepki ver...','Görünmez...','Kaybol...',
  '47 yeni video...','Beğeni...','Sal...','3:00 AM...',
  'Haber yok...','İzle...','Kapat...','Aç...',
];

/* ──────────────────────────────────────────────────
   FAKE NOTIFICATION DATA
────────────────────────────────────────────────── */
const FAKE_NOTIFS = [
  { icon:'📱', app:'TikTok', msg:'Senin için 47 yeni video hazır!', sound:'ping' },
  { icon:'🛒', app:'FLASH SALE', msg:'%80 indirim! 1:47 kaldı. HEMEN AL →', sound:'ding' },
  { icon:'❤️', app:'Instagram', msg:'@mert_21 ve 23 kişi daha fotoğrafını beğendi', sound:'pop' },
  { icon:'📧', app:'Noreply@pazarlama', msg:'Özel teklifiniz 10 dakika sonra sona eriyor ⚡', sound:'ding' },
  { icon:'🎮', app:'PUBG Mobile', msg:'Arkadaşın Emre seni beklemeye aldı!', sound:'ping' },
  { icon:'📢', app:'CNN Türk', msg:'SON DAKİKA: Deprem! Detaylar için açın →', sound:'ping' },
  { icon:'💬', app:'WhatsApp', msg:'"Aile" grubunda 63 yeni mesaj var', sound:'pop' },
  { icon:'⭐', app:'Trendyol', msg:'Sana özel 50₺ hediye çeki! Bugün son gün 🎁', sound:'ding' },
  { icon:'🔥', app:'YouTube', msg:'4 saat 12 dk izledin. Harika seçimler! Devam et 🔥', sound:'ping' },
  { icon:'🤖', app:'ChatGPT', msg:'Premium planın sona eriyor. Şimdi yenile →', sound:'pop' },
  { icon:'📣', app:'Google Ads', msg:'[Sponsorlu] Komşuların bu ürünü tercih etti', sound:'pop' },
  { icon:'🛎️', app:'Yemeksepeti', msg:'Siparişin yola çıktı! 32 dakika ◉ Canlı takip', sound:'ding' },
  { icon:'💬', app:'+90 532 XXX', msg:'Tebrikler! 5.000₺ nakit ödülünüzü kazandınız', sound:'ping' },
  { icon:'😴', app:'Sağlık', msg:'Bu saatten sonra ekran, uyku kalitenizi %40 düşürür.', sound:'pop' },
  { icon:'🎵', app:'Spotify', msg:'Senin için Günlük Mix hazırlandı — 87 şarkı', sound:'ping' },
];

let notifActive = false;
let notifAC = null;   // shared AudioContext for notifications
let notifInterval = 2500;

// TRANCE INTERACTION PUNISHMENT (Phase Final)
let tranceHeat = 0;
let tranceHeatActive = false;
let tranceWarningEl = null;

function registerTrancePunishment() {
  const t = document.getElementById('aw-trance');
  tranceWarningEl = document.getElementById('trance-warning');
  if (!t) return;
  tranceHeatActive = true;
  tranceHeat = 0;

  const punish = (e) => {
    if (!tranceHeatActive) return;
    tranceHeat += 15; // big boost
    if (tranceHeat > 100) tranceHeat = 100;
  };

  t.addEventListener('mousemove', () => { if(tranceHeatActive) tranceHeat += 0.8; });
  t.addEventListener('mousedown', punish);
  t.addEventListener('touchstart', punish);
  window.addEventListener('keydown', punish);

  // Decay loop
  const decay = setInterval(() => {
    if (!tranceHeatActive) { clearInterval(decay); return; }
    if (tranceHeat > 0) tranceHeat -= 2;
    if (tranceHeat < 0) tranceHeat = 0;

    // Visuals
    if (tranceWarningEl) {
      tranceWarningEl.style.opacity = tranceHeat > 60 ? '1' : '0';
      tranceWarningEl.style.transform = `translate(-50%, -50%) scale(${1 + (tranceHeat/200)})`;
      if (tranceHeat > 80) tranceWarningEl.classList.add('glitch-active');
      else tranceWarningEl.classList.remove('glitch-active');
    }
  }, 100);
}

function startFakeNotifications() {
  notifActive = true;
  notifInterval = 2500;
  try { notifAC = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  function spawn() {
    if (!notifActive) return;
    const n = FAKE_NOTIFS[Math.floor(Math.random() * FAKE_NOTIFS.length)];
    showFakeNotif(n);
    playNotifSound(n.sound);
    // Standard acceleration
    notifInterval = Math.max(600, notifInterval - 80);
    // TRANCE HEAT speedup: can go down to 150ms
    const actualInterval = Math.max(150, notifInterval - (tranceHeat * 15));
    setTimeout(spawn, actualInterval + Math.random() * 200);
  }
  setTimeout(spawn, 2000);
  // Cacophony build — rapid fire last 5 seconds
  setTimeout(() => {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (!notifActive) return;
        showFakeNotif(FAKE_NOTIFS[Math.floor(Math.random() * FAKE_NOTIFS.length)]);
        playNotifSound(['ping','ding','pop'][i % 3]);
      }, i * 280);
    }
  }, 25000);
}

function stopFakeNotifications() {
  notifActive = false;
  const c = document.getElementById('aw-notifications');
  if (c) c.innerHTML = '';
  if (notifAC) { notifAC.close(); notifAC = null; }
}

/* Notification sound engine */
function playNotifSound(type) {
  if (!notifAC) return;
  try {
    const osc = notifAC.createOscillator();
    const gain = notifAC.createGain();
    osc.connect(gain); gain.connect(notifAC.destination);
    if (type === 'ping') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, notifAC.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, notifAC.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, notifAC.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, notifAC.currentTime + 0.18);
    } else if (type === 'ding') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, notifAC.currentTime);
      osc.frequency.setValueAtTime(1100, notifAC.currentTime + 0.05);
      gain.gain.setValueAtTime(0.14, notifAC.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, notifAC.currentTime + 0.25);
    } else { // pop
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, notifAC.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, notifAC.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, notifAC.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, notifAC.currentTime + 0.1);
    }
    osc.start(); osc.stop(notifAC.currentTime + 0.35);
  } catch(e) {}
}

function showFakeNotif(data) {
  const container = document.getElementById('aw-notifications');
  if (!container) return;
  const el = document.createElement('div');
  // Chaos: random directions
  const dir  = ['right','left','top','center'][Math.floor(Math.random() * 4)];
  el.className = 'fake-notif fn-dir-' + dir;
  el.innerHTML = `<span class="fn-icon">${data.icon}</span>
    <div class="fn-body">
      <div class="fn-app">${data.app}</div>
      <div class="fn-msg">${data.msg}</div>
    </div>
    <div class="fn-time">şimdi</div>`;
  // Position by direction
  if (dir === 'right') { el.style.top=(10+Math.random()*75)+'%'; el.style.right='16px'; }
  else if (dir === 'left')  { el.style.top=(10+Math.random()*75)+'%'; el.style.left='16px'; }
  else if (dir === 'top')   { el.style.top='16px'; el.style.left=(10+Math.random()*60)+'%'; }
  else { el.style.top=(38+Math.random()*20)+'%'; el.style.left='50%'; el.style.transform='translateX(-50%)'; }
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('fn-show'));
  setTimeout(() => {
    el.classList.remove('fn-show');
    setTimeout(() => el.remove(), 500);
  }, 2000 + Math.random() * 800);
}

/* ──────────────────────────────────────────────────
   LOCALSTORAGE — TASK TRACKING
────────────────────────────────────────────────── */
const LS_KEY_DONE_TASKS = 'oculi_done_tasks';
const LS_KEY_HOBI       = 'oculi_hobi';

function loadDoneTasks() { try { return JSON.parse(localStorage.getItem(LS_KEY_DONE_TASKS) || '[]'); } catch { return []; } }
function saveDoneTasks(a){ localStorage.setItem(LS_KEY_DONE_TASKS, JSON.stringify(a)); }
function loadHobi()      { return localStorage.getItem(LS_KEY_HOBI) || null; }
function saveHobi(h)     { localStorage.setItem(LS_KEY_HOBI, h); }

/* ──────────────────────────────────────────────────
   DYNAMIC TASK POOL (by rank)
   Each task: { id, title, desc, category, xpReward, rankReq }
────────────────────────────────────────────────── */
const TASK_POOL = [
  // ── UYUYAN (0-100 XP) — Temel ──
  { id:'t1', title:'Birini İsmiyle Çağır', desc:'Yanındaki kişiye adıyla seslen. Algoritma isim bilmez, sen bilirsin.', category:'bağlantı', xpReward:20, rankReq:0 },
  { id:'t2', title:'Pencereyi Aç', desc:'Telefonu bırak. Pencereyi aç. Dışarıdan gelen bir sesi fark et.', category:'doğa', xpReward:15, rankReq:0 },
  { id:'t3', title:'Kahve/Çay Yap, Tek Başına İç', desc:'Ekransız 5 dakika. Bardağın sıcaklığını hisset.', category:'farkındalık', xpReward:15, rankReq:0 },
  { id:'t4', title:'Birini Ara, Mesaj Atma', desc:'Anlık mesaj değil, gerçek ses. 85Hz-255Hz. Bir insanı duy.', category:'bağlantı', xpReward:25, rankReq:0 },
  { id:'t5', title:'Bugün İlk Selamı Ver', desc:'Metroda, asansörde, sokakta — göz temasıyla merhaba de.', category:'bağlantı', xpReward:20, rankReq:0 },

  // ── UYANIŞTA (101-500 XP) — Hobi & Öğrenme ──
  { id:'t6', title:'Bir Kitap Sayfası Oku', desc:'Dijital değil. Fiziksel bir kitap. Haftada 5 sayfa = yılda 2 kitap.', category:'öğrenme', xpReward:30, rankReq:101 },
  { id:'t7', title:'Ellerinle Bir Şey Yap', desc:'Çiz, pişir, tamir et. Bir şeyin nasıl çalıştığını elle öğren.', category:'hobi', xpReward:35, rankReq:101 },
  { id:'t8', title:'Bir Müzik Aleti Aç', desc:'YouTube izle değil — bir müzik aleti bul, sadece 5 dakika sesini duy.', category:'hobi', xpReward:30, rankReq:101 },
  { id:'t9', title:'Yürüyüşe Çık, Kulaklıksız', desc:'20 dakika. Kendi ayak seslerin, kuşlar, rüzgar. Sadece gerçek sesler.', category:'doğa', xpReward:40, rankReq:101 },
  { id:'t10', title:'Birine Bir Şey Öğret', desc:'Bugün öğrendiğin bir şeyi başkasına anlat. Bilgi paylaşılınca büyür.', category:'öğrenme', xpReward:45, rankReq:101 },
  { id:'t11', title:'Bir Yabancı Kelime Öğren', desc:'Sözlük aç. Bir yabancı dilde bugünün kelimesini öğren, akşam kullan.', category:'öğrenme', xpReward:25, rankReq:101 },
  { id:'t12', title:'Sanat Eseri Gör Ya Da Yap', desc:'Müzeye git, ya da bugün bir kağıda bir şey çiz. Estetik insani bir başkaldırıdır.', category:'hobi', xpReward:35, rankReq:101 },

  // ── OCULİ REHBERİ (501+ XP) — Toplum & Dönüşüm ──
  { id:'t13', title:'Birini Gönüllülüğe Davet Et', desc:'Bir arkadaşını bir gönüllü etkinliğe çağır. İki insan = güçlenmiş etki.', category:'toplum', xpReward:60, rankReq:501 },
  { id:'t14', title:'Sosyal Medya Uygulamasını Sil', desc:'Bir gün için bile olsa, en çok kullandığın uygulamayı sil. Geri dönüp dönmediğini izle.', category:'dijital özgürlük', xpReward:80, rankReq:501 },
  { id:'t15', title:'Bir Tohumun Bakımını Üstlen', desc:'Bir saksı bitkisi satın al. Haftada sulama takvimi oluştur. Algoritma bu sorumluluğu taşıyamaz.', category:'doğa', xpReward:50, rankReq:501 },
  { id:'t16', title:'Dijital Detoks Akşamı', desc:'Akşam 19:00-22:00 arası tüm ekranlar kapalı. Sadece insanlar, sesler, gerçeklik.', category:'dijital özgürlük', xpReward:70, rankReq:501 },
  { id:'t17', title:'Birine Mektup Yaz', desc:'Fiziksel kağıta, elle. Adres yaz, posta kutusuna at. Algoritmanın iletip iletemeyeceğini düşün.', category:'bağlantı', xpReward:65, rankReq:501 },
];

const TASK_CATEGORY_EMOJI = { 'bağlantı':'🤝', 'doğa':'🌿', 'farkındalık':'👁', 'öğrenme':'📖', 'hobi':'🎨', 'toplum':'🌍', 'dijital özgürlük':'🔓' };

function renderDynamicTasks() {
  const grid = document.getElementById('dynamic-task-grid');
  if (!grid) return;
  const rank     = getRank(xp);
  const done     = loadDoneTasks();
  const eligible = TASK_POOL.filter(t => t.rankReq <= xp && !done.includes(t.id));
  // Pick 3 random tasks for today
  const seed     = new Date().toDateString() + rank.id; // daily seed
  const rng      = seededRNG(seed);
  const daily    = shuffleSeeded(eligible, rng).slice(0, 3);

  if (daily.length === 0) {
    grid.innerHTML = '<div class="dtask-empty">Tüm görevler tamamlandı — yeni rütbes için hazırlan. 🌱</div>';
    return;
  }

  grid.innerHTML = daily.map(t => `
    <div class="dtask-card" data-task-id="${t.id}">
      <div class="dtask-cat">${TASK_CATEGORY_EMOJI[t.category] || '★'} ${t.category.toUpperCase()}</div>
      <h3 class="dtask-title">${t.title}</h3>
      <p class="dtask-desc">${t.desc}</p>
      <div class="dtask-footer">
        <span class="dtask-xp">+${t.xpReward} XP</span>
        <button class="dtask-btn secondary-btn" onclick="completeTask('${t.id}', ${t.xpReward})">TAMAMLADIM ✓</button>
      </div>
    </div>
  `).join('');
}

function completeTask(id, reward) {
  const done = loadDoneTasks();
  if (done.includes(id)) return;
  done.push(id);
  saveDoneTasks(done);
  xp = Math.min(xp + reward, 9999);
  saveXP(xp);
  renderDashboard();
  renderDynamicTasks();
  renderGlobalGatur();
  updateFlowers();
  checkAwakenedTheme();
  // Show completion flash
  const card = document.querySelector(`[data-task-id="${id}"]`);
  if (card) { card.style.borderColor='var(--green)'; card.style.opacity='.5'; }
}

// Seeded RNG for consistent daily tasks
function seededRNG(seed) {
  let s = [...seed].reduce((a,c)=>a+c.charCodeAt(0),0);
  return () => { s = (s*9301+49297)%233280; return s/233280; };
}
function shuffleSeeded(arr, rng) {
  const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
}

/* ──────────────────────────────────────────────────
   HUMANITY NEWS FEED — Real global data (2024 sources)
────────────────────────────────────────────────── */
const HUMANITY_HEADLINES = [
  {
    icon:'🌡️',
    title:'Dünya Sıcaklığı 2024’da Tarihinin En Yüksek Seviyesine Ulaştı',
    sub:'Copernicus İklim Değişikliği Servisi: 1.5°C sınırı ilk kez aşıldı. Küreselsısınma artık istatistik değil, yaşanan gerçek.',
    cta:'→ Climate.gov | IPCC Raporu 2024',
    src:'Copernicus CDS, Ocak 2024'
  },
  {
    icon:'🤧',
    title:'Yalnızlık Salgunu: DÜnya SAĞlıK ÖRGÜTÜ Küresel Acil Durum İlan Etti',
    sub:'DST/WHO 2023: 4 kişiden 1i kendini “son derece yalnız” hissediyor. Sosyal medya kullanımı ile yalnızlık arasında doğrusal korelasyon saptandı.',
    cta:'→ WHO Loneliness Report 2023',
    src:'WHO, 2023'
  },
  {
    icon:'📱',
    title:'Ekran Süresi Rekoru: Ortalama Günlük 6 Saat 37 Dakika',
    sub:'DataReportal 2024: Bu, uyku süresinin %83’ü. Ömrünün 12 yılını ekrana bakıyoruz. Bu sayı 2019’dan bu yana %37 arttı.',
    cta:'→ DataReportal Digital 2024 Report',
    src:'DataReportal, 2024'
  },
  {
    icon:'🧠',
    title:'Gençlerde Depresyon %150 Arttı: Meta’nın Kendi Araştırması',
    sub:'Meta’nın ihtiyatíe belgeleri: Instagram, 13-17 yaş grubunda beden algısını bozduğunu içsel olarak belgeliyor. Bu bilgi 2021’de gizli tutuldu.',
    cta:'→ WSJ: The Facebook Files, 2021',
    src:'Meta Internal Research, 2021'
  },
  {
    icon:'🌱',
    title:'Gönüllü Oranı Son 20 Yılın En Düşüğünde',
    sub:'Gallup 2023: Gönüllü çalışma oranı %27.8’den %18.3’e indi. Doğrudan korelasyon: Sosyal medya kullanımı ile topluluk katılımı ters orantılı.',
    cta:'→ meetup.com | birlikteyiz.org — Yakınındaki grupları bul',
    src:'Gallup, 2023'
  },
  {
    icon:'🎥',
    title:'TikTok: Ortalama Seans Süresi 95 Dakika/Gün',
    sub:'Qustodio 2024: 3 saniyede bir kaydırılan içerik, dopamin döngüsünü kumar bağımlılığıyla aynı mekanizmada çalıştırıyor.',
    cta:'→ Qustodio Annual Report 2024',
    src:'Qustodio, 2024'
  },
  {
    icon:'🌿',
    title:'Kent Bahçeciliği Hareketi: Türkiye’de 200K Aktif Katılımcı',
    sub:'Fiziksel toprakla temas kurmak kortizol üzretimini %28 düşürüyor (NIH 2023). Sehirdeysen de toprağa dokunabilirsin.',
    cta:'→ bahcekulubu.com | Tohum Ağı Projesi',
    src:'NIH Nature Study, 2023'
  },
];

function renderHumanityFeed() {
  const container = document.getElementById('hf-items');
  if (!container) return;
  container.innerHTML = HUMANITY_HEADLINES.map(h => `
    <div class="hf-item">
      <span class="hf-icon">${h.icon}</span>
      <div class="hf-text">
        <strong>${h.title}</strong>
        <p>${h.sub}</p>
        <div class="hf-footer">
          <span class="hf-cta">${h.cta}</span>
          <span class="hf-src">${h.src}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* ──────────────────────────────────────────────────
   FREQUENCY REMINDER NEEDLE ANIMATION
────────────────────────────────────────────────── */
function animateFreqNeedle() {
  const needle = document.getElementById('fr-needle');
  const zone   = document.getElementById('fr-human-zone');
  if (!needle || !zone) return;
  // Zone: 85Hz=18% → 255Hz=55% of 20Hz–20kHz log scale approx
  zone.style.cssText   = 'position:absolute;top:0;bottom:0;left:18%;right:45%;background:rgba(0,255,65,.15);border-left:2px solid var(--green);border-right:2px solid var(--green);';
  let dir = 1, pos = 10;
  setInterval(() => {
    const inZone = pos >= 18 && pos <= 55;
    needle.style.cssText = `position:absolute;top:-4px;bottom:-4px;width:2px;left:${pos}%;background:${inZone?'var(--green)':'var(--red)'};box-shadow:0 0 8px ${inZone?'var(--green)':'var(--red)'};transition:left .3s ease,background .3s;`;
    if (humanVoiceActive) {
      // when mic active, needle shows real position
      pos = 18 + Math.random() * 37;
    } else {
      pos += dir * (1.5 + Math.random());
      if (pos > 95 || pos < 5) dir *= -1;
    }
  }, 300);
}


/* ──────────────────────────────────────────────────
   AWAKENING SEQUENCE  (State machine)
────────────────────────────────────────────────── */
function runAwakeningSequence() {
  const overlay  = document.getElementById('awakening-overlay');
  const trance   = document.getElementById('aw-trance');
  const durPhase = document.getElementById('aw-dur');
  const lightPhase = document.getElementById('aw-light');

  // ── PHASE A: Digital Trance (0-30s) ──
  startWhispers();
  startSceneCycle();
  startFakeNotifications();
  registerTrancePunishment();

  // ── PHASE B: DUR. (30s) ──
  setTimeout(() => {
    tranceHeatActive = false; // Stop punishment
    if (tranceWarningEl) tranceWarningEl.style.opacity = '0';
    trance.classList.add('hidden');
    durPhase.classList.remove('hidden');
    stopWhispers();
    stopFakeNotifications();
    playDurSound();
  }, 30000);

  // ── PHASE C: Warm Light (36s) ──
  setTimeout(() => {
    durPhase.classList.add('hidden');
    lightPhase.classList.remove('hidden');
    showLightMessages();
    playNatureSounds();
  }, 36000);

  // ── Click / auto-reveal after light messages ──
  const cta = document.getElementById('awl-5');
  if (cta) {
    cta.addEventListener('click', () => revealMain(overlay));
  }
  // Auto-reveal safety at 54s
  setTimeout(() => revealMain(overlay), 54000);
}

/* ── Scene cycling ── */
const SCENE_IDS = ['scene-metro','scene-toilet','scene-bed','scene-street'];
let sceneIdx = 0;
let sceneTimer = null;

function startSceneCycle() {
  const scenes = document.querySelectorAll('.aw-scene');
  sceneTimer = setInterval(() => {
    scenes.forEach(s => s.classList.remove('aw-scene--active'));
    sceneIdx = (sceneIdx + 1) % SCENE_IDS.length;
    const next = document.getElementById(SCENE_IDS[sceneIdx]);
    if (next) next.classList.add('aw-scene--active');
  }, 7500);
}

/* ── Whispers ── */
let whisperTimer = null;
let whisperRunning = false;

function startWhispers() {
  const container = document.getElementById('aw-whispers');
  if (!container) return;
  whisperRunning = true;

  function spawnWhisper() {
    if (!whisperRunning) return;
    const span = document.createElement('div');
    span.className = 'whisper';
    span.textContent = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
    span.style.left  = Math.random() * 80 + 5 + '%';
    span.style.top   = Math.random() * 70 + 10 + '%';
    span.style.animationDelay = '0s';
    container.appendChild(span);
    setTimeout(() => span.remove(), 4200);
    whisperTimer = setTimeout(spawnWhisper, 800 + Math.random() * 1200);
  }
  spawnWhisper();
}

function stopWhispers() {
  whisperRunning = false;
  if (whisperTimer) clearTimeout(whisperTimer);
  const c = document.getElementById('aw-whispers');
  if (c) c.innerHTML = '';
}

/* ── DUR sound (brief sharp oscillator) ── */
function playDurSound() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 1.5);
    gain.gain.setValueAtTime(0.3, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 2);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(); osc.stop(ac.currentTime + 2);
  } catch(e) {}
}

/* ── Light messages (slap sequence) ── */
function showLightMessages() {
  // awl-1,2,3 are hard stat slaps — play impact sound
  // awl-4 is irony reveal — no hit
  // awl-5 is CTA
  const seq = [
    { id:'awl-1', delay:600,  sound:true },
    { id:'awl-2', delay:2400, sound:true },
    { id:'awl-3', delay:4200, sound:true },
    { id:'awl-4', delay:6400, sound:false },
    { id:'awl-5', delay:9000, sound:false },
  ];
  seq.forEach(({ id, delay, sound }) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('visible');
      if (sound) playLightImpact();
    }, delay);
  });
}

function playLightImpact() {
  try {
    const ac  = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.25);
    g.gain.setValueAtTime(0.35, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    osc.connect(g); g.connect(ac.destination);
    osc.start(); osc.stop(ac.currentTime + 0.32);
    setTimeout(() => { try { ac.close(); } catch(e){} }, 400);
  } catch(e) {}
}

/* ── Synth nature sounds (birds + wind) ── */
let natureAC = null;
let natureGain = null;

function playNatureSounds() {
  try {
    natureAC   = new (window.AudioContext || window.webkitAudioContext)();
    natureGain = natureAC.createGain();
    natureGain.gain.setValueAtTime(0, natureAC.currentTime);
    natureGain.gain.linearRampToValueAtTime(0.15, natureAC.currentTime + 3);
    natureGain.connect(natureAC.destination);

    // Wind: filtered noise
    spawnWind();
    // Recurring bird chirps
    scheduleBirds();
  } catch(e) {}
}

function spawnWind() {
  if (!natureAC) return;
  const buf    = natureAC.createBuffer(1, natureAC.sampleRate * 4, natureAC.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src    = natureAC.createBufferSource();
  src.buffer   = buf; src.loop = true;
  const filter = natureAC.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 600; filter.Q.value = 0.4;
  const windGain = natureAC.createGain();
  windGain.gain.setValueAtTime(0.04, natureAC.currentTime);
  src.connect(filter); filter.connect(windGain); windGain.connect(natureGain);
  src.start();
}

function scheduleBirds() {
  if (!natureAC) return;
  function chirp() {
    if (!natureAC) return;
    const freq = 1800 + Math.random() * 2200;
    const osc  = natureAC.createOscillator();
    const env  = natureAC.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, natureAC.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, natureAC.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.9, natureAC.currentTime + 0.18);
    env.gain.setValueAtTime(0, natureAC.currentTime);
    env.gain.linearRampToValueAtTime(0.07, natureAC.currentTime + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, natureAC.currentTime + 0.2);
    osc.connect(env); env.connect(natureGain);
    osc.start(); osc.stop(natureAC.currentTime + 0.25);
    // Random double-chirp
    if (Math.random() > 0.5) {
      setTimeout(() => { if (natureAC) chirp(); }, 200 + Math.random() * 100);
    }
    setTimeout(chirp, 1500 + Math.random() * 3500);
  }
  setTimeout(chirp, 1000);
}

function stopNatureSounds() {
  if (natureGain) { natureGain.gain.linearRampToValueAtTime(0, natureAC.currentTime + 1); }
  setTimeout(() => { if (natureAC) { natureAC.close(); natureAC = null; } }, 1200);
}

/* ── Reveal main site ── */
function revealMain(overlay) {
  if (overlay.dataset.revealed) return;
  overlay.dataset.revealed = '1';
  if (sceneTimer) clearInterval(sceneTimer);
  stopNatureSounds();
  overlay.classList.add('fade-out');
  setTimeout(() => {
    overlay.style.display = 'none';
    const main = document.getElementById('main-content');
    main.classList.remove('hidden');
    main.style.opacity = '0';
    main.style.transition = 'opacity 1s ease';
    requestAnimationFrame(() => requestAnimationFrame(() => { main.style.opacity = '1'; }));
    startGaturIntensityTimer();
    startXPEngine();
    renderDashboard();
    renderGlobalGatur();
    renderDynamicTasks();
    renderHumanityFeed();
    updateFlowers();
    animateFreqNeedle();
  }, 1200);
}

/* ──────────────────────────────────────────────────
   GATUR FILTER INTENSITY ENGINE
────────────────────────────────────────────────── */
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

function setGaturLevel(level) { gaturLevel = level; gaturEl.setAttribute('data-intensity', String(level)); updateGaturStat(); }
function clearGatur()   { gaturEl.classList.add('gatur-cleared');    updateGaturStat(true); }
function restoreGatur() { gaturEl.classList.remove('gatur-cleared'); updateGaturStat(false); }

function updateGaturStat(cleared = false) {
  const el = document.getElementById('stat-gatur');
  if (el) { el.textContent = cleared ? 'TEMİZLENDİ' : 'AKTİF [lvl' + gaturLevel + ']'; el.style.color = cleared ? 'var(--green)' : 'var(--red)'; }
}

/* ──────────────────────────────────────────────────
   HUMANITY XP ENGINE
────────────────────────────────────────────────── */
function startXPEngine() {
  setInterval(() => {
    const gaturCleared = gaturEl.classList.contains('gatur-cleared');

    if (humanVoiceActive) {
      xp = Math.max(0, xp + 5);
      rescuedSec++;
      saveRescued(rescuedSec);
      globalGatur = Math.max(0, globalGatur - 0.02);
      saveGlobal(globalGatur);
    }

    if (!gaturCleared && !humanVoiceActive) {
      xpDecayTick++;
      if (xpDecayTick >= 10) { xp = Math.max(0, xp - 2); xpDecayTick = 0; }
    } else { xpDecayTick = 0; }

    saveXP(xp);
    renderDashboard();
    renderGlobalGatur();
    updateFlowers();
    checkAwakenedTheme();
  }, 1000);
}

/* ──────────────────────────────────────────────────
   DASHBOARD RENDERER
────────────────────────────────────────────────── */
function renderDashboard() {
  const rank     = getRank(xp);
  const xpEl     = document.getElementById('dash-xp-value');
  const barEl    = document.getElementById('dash-xp-bar-fill');
  const rankEl   = document.getElementById('dash-rank-label');
  const descEl   = document.getElementById('dash-rank-desc');
  const rescEl   = document.getElementById('dash-rescued');
  if (!xpEl) return;

  xpEl.textContent = Math.floor(xp) + ' XP';
  xpEl.style.color = rank.color;

  rankEl.textContent = rank.label;
  rankEl.className   = 'dash-rank-value rank-' + rank.id;
  if (descEl) descEl.textContent = rank.description || rank.desc;
  if (rescEl) rescEl.textContent = formatSeconds(rescuedSec);

  const nextRank = RANKS.find(r => r.minXP > xp);
  const prevMin  = rank.minXP;
  const nextMax  = nextRank ? nextRank.minXP : rank.minXP + 500;
  const pct      = Math.min(((xp - prevMin) / (nextMax - prevMin)) * 100, 100);
  if (barEl) { barEl.style.width = pct + '%'; }

  rank.shake ? rankEl.classList.add('rank-shake') : rankEl.classList.remove('rank-shake');
}

function renderGlobalGatur() {
  const el  = document.getElementById('global-gatur-value');
  const bar = document.getElementById('global-gatur-bar-fill');
  const footer = document.getElementById('footer-gatur-live');
  if (el)  { el.textContent = globalGatur.toFixed(1) + '%'; el.style.color = globalGatur < 30 ? 'var(--green)' : globalGatur < 60 ? '#ffaa00' : 'var(--red)'; }
  if (bar) bar.style.width = Math.min(globalGatur, 100) + '%';
  if (footer) footer.textContent = '// küresel parazit: ' + globalGatur.toFixed(1) + '%';
}

function formatSeconds(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}s ${m}d ${sec}sn`;
  if (m > 0) return `${m}d ${sec}sn`;
  return `${sec}sn`;
}

/* ──────────────────────────────────────────────────
   FLOWER BLOOM SYSTEM
────────────────────────────────────────────────── */
const FLOWER_THRESHOLDS = [50, 150, 300, 450, 501];

function updateFlowers() {
  FLOWER_THRESHOLDS.forEach((threshold, i) => {
    const fl = document.getElementById('fl-' + (i + 1));
    if (!fl) return;
    if (xp >= threshold) {
      fl.classList.add('blooming');
      fl.style.transform = 'scale(' + (0.7 + i * 0.15) + ')';
    }
  });
}

/* ──────────────────────────────────────────────────
   AWAKENED THEME  (body.awakened when OCULİ REHBERİ)
────────────────────────────────────────────────── */
function checkAwakenedTheme() {
  const isGuide = xp >= 501;
  if (isGuide && !wasGuide) {
    wasGuide = true;
    document.body.classList.add('awakened');
    clearGatur(); // Gatur vanishes permanently
    if (gaturTimer) { clearInterval(gaturTimer); gaturTimer = null; }
  } else if (!isGuide && wasGuide) {
    wasGuide = false;
    document.body.classList.remove('awakened');
  }
}

/* ──────────────────────────────────────────────────
   WEB AUDIO API — Human Frequency Engine (85–255Hz)
────────────────────────────────────────────────── */
const HUMAN_LOW  = 85;
const HUMAN_HIGH = 255;
const DETECT_THRESHOLD = 55;
const DETECT_RATIO_MIN = 0.3;

// Bird sound detection (1000–4000 Hz)
const BIRD_LOW  = 1000;
const BIRD_HIGH = 4000;
const BIRD_THRESHOLD  = 70;
const BIRD_RATIO_MIN  = 0.25;
let birdDetected = false;

let audioCtx   = null;
let analyser   = null;
let micStream  = null;
let freqData   = null;
let animFrame  = null;
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
    const src = audioCtx.createMediaStreamSource(micStream);
    analyser  = audioCtx.createAnalyser();
    analyser.fftSize = 4096; analyser.smoothingTimeConstant = 0.75;
    src.connect(analyser);
    freqData = new Uint8Array(analyser.frequencyBinCount);
    if (statStatus) statStatus.textContent = 'AKTİF';
    setSignal(true);
    analyseLoop();
  } catch(e) {
    console.error('[OCULI] Mikrofon reddedildi:', e);
    if (statStatus) statStatus.textContent = 'REDDEDİLDİ';
  }
}

function analyseLoop() {
  animFrame = requestAnimationFrame(analyseLoop);
  analyser.getByteFrequencyData(freqData);
  const hz      = audioCtx.sampleRate / (analyser.frequencyBinCount * 2);

  // ── Human voice band (85–255Hz) ──
  const low     = Math.floor(HUMAN_LOW  / hz);
  const high    = Math.ceil(HUMAN_HIGH / hz);
  let totalEnergy = 0, activeBins = 0, maxBin = low;
  for (let i = low; i <= high && i < freqData.length; i++) {
    totalEnergy += freqData[i];
    if (freqData[i] > DETECT_THRESHOLD) activeBins++;
    if (freqData[i] > (freqData[maxBin] || 0)) maxBin = i;
  }
  const bandWidth   = high - low + 1;
  const avgEnergy   = totalEnergy / bandWidth;
  const activeRatio = activeBins / bandWidth;
  const domHz       = Math.round(maxBin * hz);
  const isHuman = avgEnergy > DETECT_THRESHOLD && activeRatio >= DETECT_RATIO_MIN;
  updateStats(domHz, isHuman);
  handleGaturResponse(isHuman);
  drawVisualizer(low, high, isHuman);

  // ── Bird sound band (1000–4000Hz) ──
  if (!birdDetected) {
    const bLow  = Math.floor(BIRD_LOW  / hz);
    const bHigh = Math.ceil(BIRD_HIGH / hz);
    let bTotal = 0, bActive = 0;
    for (let i = bLow; i <= bHigh && i < freqData.length; i++) {
      bTotal += freqData[i];
      if (freqData[i] > BIRD_THRESHOLD) bActive++;
    }
    const bBand  = bHigh - bLow + 1;
    const bAvg   = bTotal / bBand;
    const bRatio = bActive / bBand;
    if (bAvg > BIRD_THRESHOLD && bRatio >= BIRD_RATIO_MIN) {
      birdDetected = true;
      showBirdDetected();
    }
  }
}

function showBirdDetected() {
  const overlay = document.getElementById('bird-overlay');
  if (!overlay) return;
  overlay.classList.add('bird-show');
  // XP bonus
  xp = Math.min(xp + 30, 9999);
  saveXP(xp);
  renderDashboard();
  updateFlowers();
  checkAwakenedTheme();
  overlay.addEventListener('click', () => overlay.classList.remove('bird-show'), {once:true});
}

function updateStats(hz, isHuman) {
  if (statFreq)  statFreq.textContent  = hz + ' Hz';
  if (statHuman) { statHuman.textContent = isHuman ? 'EVET ✓' : 'HAYIR'; statHuman.className = 'stat-val' + (isHuman ? ' human-detected' : ''); }
  if (freqLabel) { freqLabel.textContent = isHuman ? '⬤ İNSAN SESİ — ' + hz + ' Hz' : '— GATURDA KAYIP —'; freqLabel.style.color = isHuman ? 'var(--green)' : 'var(--violet)'; }
}

function handleGaturResponse(isHuman) {
  if (isHuman && !humanVoiceActive) {
    humanVoiceActive = true; clearGatur();
    if (humanVoiceClearTimeout) clearTimeout(humanVoiceClearTimeout);
  } else if (!isHuman && humanVoiceActive) {
    if (humanVoiceClearTimeout) clearTimeout(humanVoiceClearTimeout);
    humanVoiceClearTimeout = setTimeout(() => { humanVoiceActive = false; restoreGatur(); }, 2000);
  }
}

function drawVisualizer(lowBin, highBin, isHuman) {
  if (!ctx2d) return;
  const W = canvas.width, H = canvas.height, bw = W / freqData.length;
  ctx2d.clearRect(0, 0, W, H);
  ctx2d.fillStyle = 'rgba(0,0,0,0.4)'; ctx2d.fillRect(0, 0, W, H);
  for (let i = 0; i < freqData.length; i++) {
    const amp = freqData[i] / 255, bh = amp * H, inR = i >= lowBin && i <= highBin;
    ctx2d.fillStyle = inR && isHuman ? `rgba(0,255,65,${0.4+amp*.6})` : inR ? `rgba(128,0,128,${0.3+amp*.7})` : `rgba(40,40,40,${0.2+amp*.5})`;
    ctx2d.fillRect(i * bw, H - bh, bw - 1, bh);
  }
  ctx2d.strokeStyle = 'rgba(128,0,128,0.4)'; ctx2d.lineWidth = 1;
  [lowBin, highBin].forEach(b => { const x = b * bw; ctx2d.beginPath(); ctx2d.moveTo(x,0); ctx2d.lineTo(x,H); ctx2d.stroke(); });
}

function stopAudio() {
  if (animFrame)  { cancelAnimationFrame(animFrame); animFrame = null; }
  if (micStream)  { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
  if (audioCtx)   { audioCtx.close(); audioCtx = null; }
  analyser = null; setSignal(false);
  if (statStatus) statStatus.textContent = 'PASİF';
}

/* ──────────────────────────────────────────────────
   CAMERA (AR)
────────────────────────────────────────────────── */
let camStream = null;

async function activateCamera() {
  const arSec = document.getElementById('ar-view');
  const vid   = document.getElementById('camera-feed');
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user', width:{ideal:1280}, height:{ideal:720} }, audio:false });
    vid.srcObject = camStream;
    arSec.classList.remove('hidden-section');
    arSec.scrollIntoView({ behavior:'smooth' });
  } catch(e) {
    alert('Kamera erişimi reddedildi.');
  }
}

function deactivateCamera() {
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
  document.getElementById('camera-feed').srcObject = null;
  document.getElementById('ar-view').classList.add('hidden-section');
}

/* ──────────────────────────────────────────────────
   SIGNAL INDICATOR
────────────────────────────────────────────────── */
function setSignal(live) {
  const dot = document.getElementById('signal-dot'), lbl = document.getElementById('signal-label');
  if (!dot || !lbl) return;
  live ? (dot.classList.add('live'), lbl.textContent='CANLI') : (dot.classList.remove('live'), lbl.textContent='OFFLINE');
}

/* ──────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  runAwakeningSequence();

  document.getElementById('red-pill-btn')?.addEventListener('click', async () => {
    await activateCamera(); await initAudio();
  });

  document.getElementById('mic-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('mic-btn');
    if (!audioCtx) { await initAudio(); if(btn) btn.textContent='MİKROFONU KAPAT'; }
    else           { stopAudio();        if(btn) btn.textContent='MİKROFONU ETKİNLEŞTİR'; }
  });

  document.getElementById('stop-cam-btn')?.addEventListener('click', deactivateCamera);

  document.getElementById('dash-reset-btn')?.addEventListener('click', () => {
    if (confirm('XP sıfırlansın mı?')) {
      xp=0; rescuedSec=0; globalGatur=87.4; wasGuide=false;
      saveXP(xp); saveRescued(rescuedSec); saveGlobal(globalGatur);
      document.body.classList.remove('awakened');
      document.querySelectorAll('.flower').forEach(f => { f.classList.remove('blooming'); f.style.transform='scale(0)'; });
      renderDashboard(); renderGlobalGatur();
    }
  });

  initDraggableFlowers();
});

/* ──────────────────────────────────────────────────
   DRAGGABLE FLOWERS
────────────────────────────────────────────────── */
function initDraggableFlowers() {
  document.querySelectorAll('.draggable-flower').forEach(flower => {
    let dragging = false, offX = 0, offY = 0;

    flower.style.cursor = 'grab';
    flower.style.position = 'fixed';

    flower.addEventListener('mousedown', e => {
      dragging = true;
      flower.style.cursor = 'grabbing';
      flower.style.zIndex = '1000';
      // Convert % positions to px
      const rect = flower.getBoundingClientRect();
      offX = e.clientX - rect.left;
      offY = e.clientY - rect.top;
      e.preventDefault();
    });

    flower.addEventListener('touchstart', e => {
      dragging = true;
      flower.style.cursor = 'grabbing';
      flower.style.zIndex = '1000';
      const t = e.touches[0];
      const rect = flower.getBoundingClientRect();
      offX = t.clientX - rect.left;
      offY = t.clientY - rect.top;
    }, { passive: true });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      flower.style.left = (e.clientX - offX) + 'px';
      flower.style.top  = (e.clientY - offY) + 'px';
    });

    document.addEventListener('touchmove', e => {
      if (!dragging) return;
      const t = e.touches[0];
      flower.style.left = (t.clientX - offX) + 'px';
      flower.style.top  = (t.clientY - offY) + 'px';
    }, { passive: true });

    const release = () => {
      if (!dragging) return;
      dragging = false;
      flower.style.cursor = 'grab';
      flower.style.zIndex = '490';
    };
    document.addEventListener('mouseup', release);
    document.addEventListener('touchend', release);
  });
}

/* ──────────────────────────────────────────────────
   NATURE BAR — Multi-Mode Synth Sound System
   Each mode gets its own AudioContext so they layer
────────────────────────────────────────────────── */
const nbContexts   = {};   // mode → { ac, gain }
const nbActiveModes = new Set();
const nbBirdTimers  = {};

function toggleNatureSound(mode) {
  if (nbActiveModes.has(mode)) {
    // Turn OFF this mode
    _nbStopMode(mode);
    document.getElementById('nb-' + mode)?.classList.remove('nb-active');
  } else {
    // Turn ON this mode
    _nbStartMode(mode);
    document.getElementById('nb-' + mode)?.classList.add('nb-active');
  }
  // Update irony visibility
  const hasAny = nbActiveModes.size > 0;
  const irony  = document.getElementById('nb-irony');
  if (irony) irony.style.opacity = hasAny ? '1' : '0';
}

function _nbStartMode(mode) {
  try {
    const ac   = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ac.currentTime + 2);
    gain.connect(ac.destination);
    nbContexts[mode] = { ac, gain };
    nbActiveModes.add(mode);

    if (mode === 'wind') _nbWind(ac, gain, 0.1);
    if (mode === 'rain') _nbRain(ac, gain);
    if (mode === 'bird') { _nbWind(ac, gain, 0.04); _nbBirdLoop(mode, ac, gain); }
  } catch(e) { console.warn('[nb] start failed', mode, e); }
}

function _nbStopMode(mode) {
  if (nbBirdTimers[mode]) { clearTimeout(nbBirdTimers[mode]); delete nbBirdTimers[mode]; }
  nbActiveModes.delete(mode);
  const ctx = nbContexts[mode];
  if (!ctx) return;
  try {
    ctx.gain.gain.cancelScheduledValues(ctx.ac.currentTime);
    ctx.gain.gain.linearRampToValueAtTime(0, ctx.ac.currentTime + 0.8);
    const acToClose = ctx.ac;
    setTimeout(() => {
      try { if(acToClose.state !== 'closed') acToClose.close(); } catch(e){}
    }, 1000);
  } catch(e) {}
  delete nbContexts[mode];
}

function stopNatureBar() {
  ['bird','wind','rain'].forEach(m => {
    _nbStopMode(m);
    document.getElementById('nb-' + m)?.classList.remove('nb-active');
  });
  const irony = document.getElementById('nb-irony');
  if (irony) irony.style.opacity = '0';
}

function _nbWind(ac, gain, vol = 0.1) {
  const buf  = ac.createBuffer(1, ac.sampleRate * 8, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src  = ac.createBufferSource(); src.buffer = buf; src.loop = true;

  // Double filter for "airy" quality
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 450; bp.Q.value = 0.5;

  // Slow volume tremolo (gusts)
  const lfo  = ac.createOscillator(); lfo.frequency.value = 0.12;
  const lmod = ac.createGain(); lmod.gain.value = vol * 0.5;
  lfo.connect(lmod); lmod.connect(gain.gain); lfo.start();

  const g = ac.createGain(); g.gain.value = vol;
  src.connect(lp); lp.connect(bp); bp.connect(g); g.connect(gain);
  src.start();
}

function _nbRain(ac, gain) {
  const buf  = ac.createBuffer(2, ac.sampleRate * 5, ac.sampleRate);
  [0,1].forEach(ch => {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  });
  const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp  = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5000; lp.Q.value = 0.5;
  const hp  = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
  const g   = ac.createGain(); g.gain.value = 0.13;
  // Tremolo for rainfall rhythm
  const lfo  = ac.createOscillator(); lfo.frequency.value = 12;
  const lmod = ac.createGain(); lmod.gain.value = 0.025;
  lfo.connect(lmod); lmod.connect(g.gain); lfo.start();
  src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(gain);
  src.start();
}

function _nbBirdLoop(mode, ac, gain) {
  if (!nbActiveModes.has(mode)) return;
  const tStart = ac.currentTime + 0.1;
  const baseFreq = 2200 + Math.random() * 1800;
  const count = 2 + Math.floor(Math.random() * 2);

  for(let i=0; i<count; i++) {
    const t0 = tStart + i * 0.15;
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.type = 'sine';
    const f = baseFreq + (i*150);
    osc.frequency.setValueAtTime(f, t0);
    osc.frequency.exponentialRampToValueAtTime(f * 1.5, t0 + 0.05);
    osc.frequency.exponentialRampToValueAtTime(f * 0.8, t0 + 0.12);

    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(0.08, t0 + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);

    osc.connect(env); env.connect(gain);
    osc.start(t0); osc.stop(t0 + 0.15);
  }

  const delay = 1000 + Math.random() * 3000;
  nbBirdTimers[mode] = setTimeout(() => _nbBirdLoop(mode, ac, gain), delay);
}


