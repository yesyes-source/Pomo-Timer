// Safe invocation wrapper for Tauri Rust commands
async function callRust(cmd, args = {}) {
  try {
    const tauri = window.__TAURI__;
    if (tauri) {
      const invokeFn = (tauri.core && tauri.core.invoke) || tauri.invoke;
      if (invokeFn) {
        return await invokeFn(cmd, args);
      }
    }
    console.log(`[Mock Rust Call] ${cmd}`, args);
  } catch (e) {
    console.error(`Error invoking Rust command '${cmd}':`, e);
  }
}

// ── State variables ──
let store;
let settings = {
  work: 25,
  short: 5,
  long: 15,
  target: 4
};
let history = [];

let timerInterval = null;
let timerState = 'idle'; // 'idle' | 'running' | 'paused'
let sessionType = 'work'; // 'work' | 'short' | 'long'
let secondsLeft = 25 * 60;
let totalSeconds = 25 * 60;

// ── DOM elements ──
let timerDisplay;
let progressBar;
let sessionLabel;
let btnStart;
let btnReset;
let viewPanels;

// Helper: Get date string YYYY-MM-DD
function getDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Get the rolling 7 days ending today
function getWeeklyRange() {
  const days = [];
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    days.push({
      dateStr: getDateString(d),
      label: labels[d.getDay()],
      isToday: i === 0
    });
  }
  return days;
}

// ── Initialize Store and data ──
async function initStore() {
  try {
    const tauri = window.__TAURI__;
    if (tauri) {
      let StoreClass;
      if (tauri.store && tauri.store.Store) {
        StoreClass = tauri.store.Store;
      } else if (tauri.plugins && tauri.plugins.store && tauri.plugins.store.Store) {
        StoreClass = tauri.plugins.store.Store;
      }
      
      if (StoreClass) {
        store = await StoreClass.load('pomodoro_timer_data.json');
        console.log("Tauri Store plugin loaded.");
      }
    }
  } catch (e) {
    console.error("Error loading Tauri Store:", e);
  }

  // Fallback to localstorage if store plugin isn't active
  if (!store) {
    console.log("Using LocalStorage fallback.");
    store = {
      get: async (key) => {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
      },
      set: async (key, val) => {
        localStorage.setItem(key, JSON.stringify(val));
        return val;
      },
      save: async () => {}
    };
  }

  // Load saved settings
  const savedSettings = await store.get('settings');
  if (savedSettings) {
    settings = { ...settings, ...savedSettings };
  }

  // Load history
  const savedHistory = await store.get('history');
  if (savedHistory) {
    history = savedHistory;
  }

  // Set inputs to saved settings values
  document.getElementById('input-work').value = settings.work;
  document.getElementById('input-short').value = settings.short;
  document.getElementById('input-long').value = settings.long;
  document.getElementById('input-target').value = settings.target;

  // Initialize display
  resetTimer();
  updateStats();
}

// ── Save Stats and Settings ──
async function saveSettings() {
  const w = parseInt(document.getElementById('input-work').value) || 25;
  const s = parseInt(document.getElementById('input-short').value) || 5;
  const l = parseInt(document.getElementById('input-long').value) || 15;
  const t = parseInt(document.getElementById('input-target').value) || 4;

  settings = { work: w, short: s, long: l, target: t };
  await store.set('settings', settings);
  await store.save();

  // If timer is idle, update display immediately
  if (timerState === 'idle') {
    resetTimer();
  }
  
  // Visual confirmation
  alert('Settings saved successfully!');
}

async function addCompletedSession(type, duration) {
  const session = {
    date: getDateString(),
    timestamp: Date.now(),
    type: type,
    duration: duration
  };
  history.push(session);
  await store.set('history', history);
  await store.save();
  updateStats();
}

// ── Render Statistics ──
function updateStats() {
  const todayStr = getDateString();
  const rolling7Days = getWeeklyRange();
  
  // Filter sessions
  const todaySessions = history.filter(s => s.date === todayStr && s.type === 'work');
  const weeklySessions = history.filter(s => {
    return rolling7Days.some(day => day.dateStr === s.date);
  });
  
  // Today values
  const todayCount = todaySessions.length;
  const todayTime = todaySessions.reduce((acc, curr) => acc + curr.duration, 0);
  
  document.getElementById('stats-today-count').textContent = todayCount;
  document.getElementById('stats-today-time').textContent = todayTime + 'm';

  // Week values
  const weekCount = weeklySessions.filter(s => s.type === 'work').length;
  const weekTimeMins = weeklySessions.reduce((acc, curr) => acc + (curr.type === 'work' ? curr.duration : 0), 0);
  
  const weekHours = Math.floor(weekTimeMins / 60);
  const weekMins = weekTimeMins % 60;
  document.getElementById('stats-week-time').textContent = `${weekHours}h ${weekMins}m`;
  document.getElementById('stats-week-count').textContent = weekCount;

  // Chart Rendering
  const chartContainer = document.getElementById('weekly-chart');
  chartContainer.innerHTML = '';

  // Get completed counts grouped by date
  const countsByDate = {};
  rolling7Days.forEach(day => {
    countsByDate[day.dateStr] = 0;
  });
  weeklySessions.forEach(s => {
    if (s.type === 'work') {
      countsByDate[s.date] = (countsByDate[s.date] || 0) + 1;
    }
  });

  // Calculate scaling max
  const counts = Object.values(countsByDate);
  const maxVal = Math.max(...counts, settings.target, 1);

  rolling7Days.forEach(day => {
    const count = countsByDate[day.dateStr] || 0;
    const pct = (count / maxVal) * 100;
    
    const col = document.createElement('div');
    col.className = 'chart-col';
    
    const barWrap = document.createElement('div');
    barWrap.className = 'chart-bar-wrap';
    
    const bar = document.createElement('div');
    bar.className = 'chart-bar' + (day.isToday ? ' today' : '');
    bar.style.height = `${pct}%`;
    bar.title = `${count} Pomodoros`;
    
    const label = document.createElement('div');
    label.className = 'chart-label';
    label.textContent = day.label;
    
    barWrap.appendChild(bar);
    col.appendChild(barWrap);
    col.appendChild(label);
    chartContainer.appendChild(col);
  });
}

// ── Timer Mechanics ──
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerState = 'idle';
  
  if (sessionType === 'work') {
    totalSeconds = settings.work * 60;
    sessionLabel.textContent = 'Focus';
    sessionLabel.style.color = 'var(--accent-color)';
    document.documentElement.style.setProperty('--accent-color', '#ff453a');
  } else if (sessionType === 'short') {
    totalSeconds = settings.short * 60;
    sessionLabel.textContent = 'Short Break';
    sessionLabel.style.color = 'var(--accent-break)';
    document.documentElement.style.setProperty('--accent-color', '#30d158');
  } else {
    totalSeconds = settings.long * 60;
    sessionLabel.textContent = 'Long Break';
    sessionLabel.style.color = 'var(--accent-long)';
    document.documentElement.style.setProperty('--accent-color', '#0a84ff');
  }
  
  secondsLeft = totalSeconds;
  updateTimerDisplay();
  
  btnStart.textContent = 'Start';
  btnStart.className = 'control-btn btn-primary start-state';
}

function updateTimerDisplay() {
  const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const s = String(secondsLeft % 60).padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;

  // Update SVG ring stroke
  const circumference = 615.75;
  const pct = secondsLeft / totalSeconds;
  const offset = circumference * (1 - pct);
  progressBar.style.strokeDashoffset = offset;
}

function toggleTimer() {
  if (timerState === 'idle' || timerState === 'paused') {
    timerState = 'running';
    btnStart.textContent = 'Pause';
    btnStart.className = 'control-btn btn-primary';
    
    timerInterval = setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft--;
        updateTimerDisplay();
      } else {
        handleTimerEnd();
      }
    }, 1000);
  } else {
    // Pause
    clearInterval(timerInterval);
    timerInterval = null;
    timerState = 'paused';
    btnStart.textContent = 'Resume';
    btnStart.className = 'control-btn btn-primary start-state';
  }
}

async function handleTimerEnd() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerState = 'idle';

  // Sound + Notification
  await callRust('play_alert_sound');
  
  let title = '';
  let body = '';
  let completedType = sessionType;
  let completedDuration = Math.round(totalSeconds / 60);

  if (sessionType === 'work') {
    title = 'Session Completed!';
    body = 'Great job! Time for a short break.';
    
    // Calculate breaks - check how many sessions completed today
    const todayStr = getDateString();
    const todaySessionsCount = history.filter(s => s.date === todayStr && s.type === 'work').length + 1;
    
    // Add completed session stats
    await addCompletedSession(completedType, completedDuration);
    
    if (todaySessionsCount > 0 && todaySessionsCount % 4 === 0) {
      sessionType = 'long';
      body = 'Fantastic work! You earned a long break.';
    } else {
      sessionType = 'short';
    }
  } else {
    // Break completed
    title = 'Break Finished!';
    body = 'Ready to focus again?';
    sessionType = 'work';
  }

  await callRust('send_session_notification', { title, body });
  resetTimer();
}

// ── DOM Events ──
window.addEventListener("DOMContentLoaded", () => {
  timerDisplay = document.getElementById('timer-display');
  progressBar = document.getElementById('progress-bar');
  sessionLabel = document.getElementById('session-type-label');
  btnStart = document.getElementById('btn-start');
  btnReset = document.getElementById('btn-reset');
  viewPanels = document.querySelectorAll('.view-panel');

  // Sidebar navigation toggles
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.getAttribute('data-target');
      viewPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === target) {
          panel.classList.add('active');
        }
      });
      
      // Update statistics view when clicked
      if (target === 'stats-view') {
        updateStats();
      }
    });
  });

  // Timer controls
  btnStart.addEventListener('click', toggleTimer);
  btnReset.addEventListener('click', resetTimer);

  // Settings
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);

  // Initialize
  initStore();
});
