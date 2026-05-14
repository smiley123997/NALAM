// ======== CONSTANTS ========
const GOAL_WEIGHT = 65;
const BMR = 1450;
const CAL_PER_KG = 7700;
const AVG_DEFICIT = 600;

// ======== DATA ========
let data = JSON.parse(localStorage.getItem('nalamData') || JSON.stringify({
  foodLog: [],
  actLog: [],
  weightLog: [],
  skinChecks: {},
  lastReset: ''
}));

const SKIN_ITEMS = [
  '💧 Drink 3L water today',
  '🌿 Eat greens / fruits',
  '🧴 Morning SPF applied',
  '🌙 Night skincare done',
  '😴 Sleep 7–8 hours',
  '🚶 30+ min walk / exercise',
  '🚫 No sugar / fried food',
  '🧖 Face pack / ubtan (2×/week)',
  '🍋 Lemon water morning',
  '🫧 Clean pillowcase this week'
];

// ======== SAVE & RESET ========
function save() {
  localStorage.setItem('nalamData', JSON.stringify(data));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function checkReset() {
  const today = getTodayKey();
  if (data.lastReset !== today) {
    data.foodLog = [];
    data.actLog = [];
    if (!data.skinChecks[today]) data.skinChecks[today] = {};
    data.lastReset = today;
    save();
  }
}

// ======== CALORIE HELPERS ========
function getTotalCalIn() {
  return data.foodLog.reduce((s, i) => s + i.cal, 0);
}
function getTotalCalBurned() {
  return data.actLog.reduce((s, i) => s + i.cal, 0);
}
function getDeficit() {
  return (BMR - getTotalCalIn()) + getTotalCalBurned();
}

// ======== HEADER ========
function updateHeader() {
  const calIn = getTotalCalIn();
  const burned = getTotalCalBurned();
  const deficit = Math.max(0, getDeficit());
  document.getElementById('hCalIn').textContent = calIn;
  document.getElementById('hCalBurned').textContent = burned;
  document.getElementById('hDeficit').textContent = deficit;

  const latestW = data.weightLog.length ? data.weightLog[data.weightLog.length - 1].w : null;
  if (latestW) {
    const startW = data.weightLog[0].w;
    const totalToLose = startW - GOAL_WEIGHT;
    const lost = startW - latestW;
    const pct = totalToLose > 0 ? Math.min(100, Math.max(0, (lost / totalToLose) * 100)) : 0;
    document.getElementById('goalBar').style.width = pct + '%';
    document.getElementById('currentWeightLabel').textContent = 'Current: ' + latestW + ' kg';
  } else {
    document.getElementById('currentWeightLabel').textContent = 'Current: -- kg';
  }
}

// ======== FOOD ========
function addFood(name, cal) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  data.foodLog.push({ name, cal, time });
  save();
  renderFoodLog();
  updateHeader();
  updateProgress();
  showToast('✅ ' + name + ' — ' + cal + ' kcal added');
}

function addCustomFood() {
  const n = document.getElementById('customFoodName').value.trim();
  const c = parseInt(document.getElementById('customFoodCal').value);
  if (!n || !c) { showToast('⚠️ Enter food name & calories'); return; }
  addFood(n, c);
  document.getElementById('customFoodName').value = '';
  document.getElementById('customFoodCal').value = '';
}

function removeFood(idx) {
  data.foodLog.splice(idx, 1);
  save();
  renderFoodLog();
  updateHeader();
  updateProgress();
}

function renderFoodLog() {
  const el = document.getElementById('foodLogList');
  const total = document.getElementById('totalCalIn');
  if (!data.foodLog.length) {
    el.innerHTML = '<div class="empty-state"><div class="e-icon">🍽</div>No food logged yet</div>';
    total.style.display = 'none';
    return;
  }
  el.innerHTML = '<div class="log-list">' + data.foodLog.map((f, i) =>
    `<div class="log-item">
      <div><div class="name">${f.name}</div><div class="time">${f.time}</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="cal">${f.cal} kcal</span>
        <button class="del-btn" onclick="removeFood(${i})">✕</button>
      </div>
    </div>`
  ).join('') + '</div>';
  total.textContent = 'Total: ' + getTotalCalIn() + ' kcal';
  total.style.display = 'block';
}

// ======== ACTIVITY ========
function addActivity(name, cal) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  data.actLog.push({ name, cal, time });
  save();
  renderActLog();
  updateHeader();
  updateProgress();
  showToast('🔥 ' + name + ' — ' + cal + ' kcal burned!');
}

function addCustomActivity() {
  const n = document.getElementById('customActName').value.trim();
  const c = parseInt(document.getElementById('customActCal').value);
  if (!n || !c) { showToast('⚠️ Enter activity name & calories'); return; }
  addActivity(n, c);
  document.getElementById('customActName').value = '';
  document.getElementById('customActCal').value = '';
}

function removeAct(idx) {
  data.actLog.splice(idx, 1);
  save();
  renderActLog();
  updateHeader();
  updateProgress();
}

function renderActLog() {
  const el = document.getElementById('actLogList');
  const total = document.getElementById('totalCalBurned');
  if (!data.actLog.length) {
    el.innerHTML = '<div class="empty-state"><div class="e-icon">🏃</div>No activity logged yet</div>';
    total.style.display = 'none';
    return;
  }
  el.innerHTML = '<div class="log-list">' + data.actLog.map((a, i) =>
    `<div class="log-item">
      <div><div class="name">${a.name}</div><div class="time">${a.time}</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="cal burned">${a.cal} kcal</span>
        <button class="del-btn" onclick="removeAct(${i})">✕</button>
      </div>
    </div>`
  ).join('') + '</div>';
  total.textContent = 'Burned: ' + getTotalCalBurned() + ' kcal';
  total.style.display = 'block';
}

// ======== PROGRESS ========
function updateProgress() {
  const deficit = Math.max(0, getDeficit());
  document.getElementById('netDeficit').textContent = deficit + ' kcal';
  document.getElementById('fatBurned').textContent = Math.round(deficit / 7.7) + ' g';

  const startW = data.weightLog.length ? data.weightLog[0].w : null;
  const latestW = data.weightLog.length ? data.weightLog[data.weightLog.length - 1].w : null;
  const lostSoFar = (startW && latestW) ? (startW - latestW) : 0;
  const daysPerKg = CAL_PER_KG / AVG_DEFICIT;

  const milestones = [
    { kg: 5, label: 'First 5 kg off! 🎉', icon: '🥈' },
    { kg: 10, label: '10 kg milestone! 💪', icon: '🥇' },
    { kg: 15, label: '15 kg champion! 🏆', icon: '🏆' },
    { kg: startW ? Math.max(1, startW - GOAL_WEIGHT) : 20, label: 'Reached Goal Weight! 🌟', icon: '⭐' }
  ];

  document.getElementById('milestoneList').innerHTML = milestones.map(m => {
    const remaining = Math.max(0, m.kg - lostSoFar);
    const weeksLeft = Math.ceil((remaining * daysPerKg) / 7);
    const done = lostSoFar >= m.kg;
    return `<div class="milestone">
      <div class="ms-icon">${m.icon}</div>
      <div class="ms-info">
        <div class="ms-title">${m.label}</div>
        <div class="ms-sub">Lose ${m.kg} kg total ${done ? '— Done!' : '· ~' + weeksLeft + ' weeks away'}</div>
      </div>
      <div class="ms-badge ${done ? 'done' : ''}">${done ? '✅ Done' : weeksLeft + 'w'}</div>
    </div>`;
  }).join('');

  const weeklyLoss = ((AVG_DEFICIT * 7) / CAL_PER_KG).toFixed(2);
  document.getElementById('weeklyProjection').innerHTML = `
    <div style="margin-bottom:8px">📌 Avg deficit assumed: <strong>~600 kcal/day</strong></div>
    <div style="margin-bottom:8px">⚖️ Expected weekly loss: <strong>${weeklyLoss} kg</strong></div>
    <div style="margin-bottom:8px">🎯 Goal weight: <strong>${GOAL_WEIGHT} kg</strong></div>
    ${startW ? `<div>📉 Lost so far: <strong>${lostSoFar.toFixed(1)} kg</strong> (from ${startW} kg)</div>` : '<div style="color:#7a8f7c">Log your starting weight in the Weight tab to see projections.</div>'}
  `;
}

// ======== WEIGHT ========
function logWeight() {
  const w = parseFloat(document.getElementById('weightInput').value);
  if (!w || w < 30 || w > 200) { showToast('⚠️ Enter a valid weight (30–200 kg)'); return; }
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  data.weightLog.push({ w, date });
  save();
  document.getElementById('weightInput').value = '';
  renderWeightHistory();
  updateHeader();
  updateProgress();
  showToast('⚖️ Weight ' + w + ' kg saved!');
}

function removeWeight(idx) {
  data.weightLog.splice(idx, 1);
  save();
  renderWeightHistory();
  updateHeader();
  updateProgress();
}

function renderWeightHistory() {
  const el = document.getElementById('weightHistory');
  if (!data.weightLog.length) {
    el.innerHTML = '<div class="empty-state"><div class="e-icon">⚖️</div>No weight logged yet. Start today!</div>';
    return;
  }
  const reversed = [...data.weightLog].reverse();
  el.innerHTML = reversed.map((entry, ri) => {
    const realIdx = data.weightLog.length - 1 - ri;
    const prev = data.weightLog[realIdx - 1];
    let change = '';
    if (prev) {
      const diff = (entry.w - prev.w).toFixed(1);
      const cls = diff < 0 ? 'loss' : 'gain';
      const arrow = diff < 0 ? '▼' : '▲';
      change = `<div class="w-change ${cls}">${arrow} ${Math.abs(diff)} kg</div>`;
    } else {
      change = '<div class="w-change" style="color:#7a8f7c">Starting weight</div>';
    }
    return `<div class="weight-item">
      <div><div class="w-val">${entry.w} kg</div>${change}</div>
      <div style="text-align:right">
        <div style="font-size:12px;color:#7a8f7c">${entry.date}</div>
        <button class="del-btn" onclick="removeWeight(${realIdx})" style="margin-top:4px;font-size:12px">✕ Remove</button>
      </div>
    </div>`;
  }).join('');
}

// ======== SKIN ========
function renderSkinChecklist() {
  const today = getTodayKey();
  const checks = data.skinChecks[today] || {};
  document.getElementById('skinChecklist').innerHTML = SKIN_ITEMS.map((item, i) => {
    const done = checks[i];
    return `<div class="check-item ${done ? 'done' : ''}" onclick="toggleSkin(${i})">
      <div class="check-box">${done ? '✓' : ''}</div>
      <div class="check-text">${item}</div>
    </div>`;
  }).join('');
}

function toggleSkin(idx) {
  const today = getTodayKey();
  if (!data.skinChecks[today]) data.skinChecks[today] = {};
  data.skinChecks[today][idx] = !data.skinChecks[today][idx];
  save();
  renderSkinChecklist();
  if (data.skinChecks[today][idx]) showToast('✨ Great habit!');
}

// ======== TABS ========
const TABS = ['log', 'progress', 'weight', 'diet', 'skin'];
function showTab(name) {
  TABS.forEach(t => {
    document.getElementById('page-' + t).classList.toggle('active', t === name);
    const nb = document.getElementById('nav-' + t);
    if (nb) nb.classList.toggle('active', t === name);
  });
  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes("'" + name + "'"));
  });
  if (name === 'progress') updateProgress();
}

// ======== TOAST ========
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ======== PWA INSTALL ========
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBanner').style.display = 'block';
});
function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      document.getElementById('installBanner').style.display = 'none';
    });
  }
}

// ======== SERVICE WORKER ========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err));
}

// ======== INIT ========
checkReset();
document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
renderFoodLog();
renderActLog();
renderWeightHistory();
renderSkinChecklist();
updateHeader();
updateProgress();
