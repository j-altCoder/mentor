// ─── XP & LEVELS ─────────────────────────────────────────────────────────────
const XP_CORRECT = 100;
const XP_HINT    = 70;
const XP_SKIP    = 20;

// Levels are computed after STEPS loads (see initLevels()).
// Thresholds are derived from total course size so they scale
// automatically when modules or questions are added.
let LEVELS = [];

function initLevels() {
  const maxXP = STEPS.length * XP_CORRECT;
  LEVELS = [
    { title: 'Junior Dev',     min: 0                         },
    { title: 'Mid-level Dev',  min: Math.round(maxXP * 0.20) },
    { title: 'Senior Dev',     min: Math.round(maxXP * 0.45) },
    { title: 'Staff Engineer', min: Math.round(maxXP * 0.75) },
  ];
}

// ─── LOCALSTORAGE KEYS ────────────────────────────────────────────────────────
const LS_NAME     = 'mm_name';
const LS_PROGRESS = 'mm_progress';

// ─── STATE ───────────────────────────────────────────────────────────────────
const S = {
  name: '', idx: 0, attempts: 0, hints: 0, done: 0,
  hist: [], histIdx: -1, locked: false,
  saved: [], savedOpen: true,
  xp: 0, hintUsedThisStep: false,
  answers: {},   // stepIdx → { text, type: 'cmd'|'code'|'quiz'|'skipped' }
};

// ─── FILE TREE STATE ─────────────────────────────────────────────────────────
const FT = {
  liveFiles:    {},
  selectedFile: null,
  ftOpen:       false,
};

// ─── CODEMIRROR INSTANCES ────────────────────────────────────────────────────
// Keyed by stepIdx. Cleared when modules are restarted or navigated away from.
const cmInstances = {};

// ─── MODULE CHAT CACHE ───────────────────────────────────────────────────────
// viewingPastMod: index of the past module being viewed, null = live session
let viewingPastMod = null;

// completedMods: set of module indices the user has ever reached
// Persisted so it survives page reload. Never shrinks — restart doesn't remove.
const completedMods = new Set();

// ─── CONFIDENCE METER STATE ──────────────────────────────────────────────────
// Per-module confidence, keyed by module index.
// Recalculated as a ratio after every step: clean=1.0, hint=0.65, skip=0.2.
// Resets to 100 when a module starts fresh.
const CONF = {};

// ─── PERSISTENCE ─────────────────────────────────────────────────────────────
function saveProgress() {
  try {
    localStorage.setItem(LS_PROGRESS, JSON.stringify({
      idx:      S.idx,
      attempts: S.attempts,
      hints:    S.hints,
      done:     S.done,
      saved:    S.saved,
      xp:       S.xp,
      conf:     CONF,
      answers:  S.answers,
      completedMods: [...completedMods],
      ftFiles:  Object.fromEntries(
        Object.entries(FT.liveFiles).map(([k, v]) => [k, v.content])
      ),
    }));
  } catch (e) { /* storage unavailable */ }
}

function loadSaved() {
  try {
    return {
      name:     localStorage.getItem(LS_NAME),
      progress: JSON.parse(localStorage.getItem(LS_PROGRESS) || 'null'),
    };
  } catch (e) {
    return { name: null, progress: null };
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function esc(s)  { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function ts()    { return new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) }
function chat()  { return document.getElementById('chat') }
function sc()    { setTimeout(() => { const c = chat(); c.scrollTop = c.scrollHeight }, 80) }
function showT() { document.getElementById('typing').classList.add('vis') }
function hideT() { document.getElementById('typing').classList.remove('vis') }

/** Replace {name} tokens in any string with the stored name. */
function injectName(str) {
  const n = S.name ? esc(S.name) : 'there';
  return String(str).replace(/\{name\}/g, n);
}

// ─── THEME ───────────────────────────────────────────────────────────────────
function toggleTheme() {
  const html   = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  const next   = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  try { localStorage.setItem('mm_theme', next); } catch (e) {}
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.innerHTML = isDark
      ? /* moon SVG */
        '<path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7 7 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678z"/>'
      : /* sun SVG */
        '<path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13zM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.061-1.06a.75.75 0 0 1 0-1.061zm9.193 9.193a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061zM0 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H.75A.75.75 0 0 1 0 8zm13 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 13 8zM2.343 13.657a.75.75 0 0 1 0-1.06l1.061-1.061a.75.75 0 0 1 1.06 1.06l-1.06 1.061a.75.75 0 0 1-1.061 0zm9.193-9.193a.75.75 0 0 1 0-1.06l1.06-1.061a.75.75 0 0 1 1.061 1.06l-1.06 1.061a.75.75 0 0 1-1.061 0z"/>';
  }
}

// ─── NAME PROMPT ─────────────────────────────────────────────────────────────
function showNamePrompt() {
  const id   = ++MC;
  const wrap = document.createElement('div');
  wrap.className = 'msg';
  wrap.id        = 'alex-msg-' + id;
  wrap.innerHTML = alexHead(id) + `
    <div class="mbody"><p>before we start — what should i call you?</p></div>
    <div class="name-input-wrap" id="name-input-wrap">
      <input class="name-in" id="name-in" placeholder="your name…" autocomplete="off" spellcheck="false" maxlength="30"/>
      <button class="name-submit" id="name-submit-btn" onclick="submitName()">→</button>
    </div>`;
  chat().appendChild(wrap);
  sc();
  setTimeout(() => {
    const ni = document.getElementById('name-in');
    if (!ni) return;
    ni.focus();
    ni.addEventListener('keydown', e => { if (e.key === 'Enter') submitName(); });
  }, 80);
}

function submitName() {
  const ni  = document.getElementById('name-in');
  const btn = document.getElementById('name-submit-btn');
  if (!ni) return;
  const name = ni.value.trim();
  if (!name) { ni.focus(); return; }
  S.name = name;
  ni.disabled  = true;
  if (btn) btn.disabled = true;
  const wrap = document.getElementById('name-input-wrap');
  if (wrap) wrap.classList.add('submitted');
  try { localStorage.setItem(LS_NAME, name); } catch (e) {}
  setTimeout(() => startModule(0, true), 420);
}

// ─── RESUME BAR ──────────────────────────────────────────────────────────────
function showResumeBar(name, progress) {
  const bar      = document.getElementById('resume-bar');
  const msg      = document.getElementById('resume-msg');
  const mod      = STEPS[progress.idx]?.mod ?? 0;
  const modLabel = MODULES[mod]?.label ?? '';
  msg.innerHTML  = `welcome back, <strong>${esc(name)}</strong> — module ${mod + 1} · <span style="color:var(--text2)">${esc(modLabel)}</span> · step ${progress.idx + 1} of ${STEPS.length}`;
  bar.classList.add('vis');
}

function resumeSession() {
  const raw = localStorage.getItem(LS_PROGRESS);
  if (!raw) return;
  let progress;
  try { progress = JSON.parse(raw); } catch (e) { return; }

  S.idx      = progress.idx;
  S.attempts = progress.attempts || 0;
  S.hints    = progress.hints    || 0;
  S.done     = progress.done     || 0;
  S.saved    = progress.saved    || [];
  S.xp       = progress.xp      || 0;
  S.answers  = progress.answers  || {};
  if (progress.completedMods) {
    progress.completedMods.forEach(m => completedMods.add(m));
  }
  // Fallback: infer from S.answers which modules were ever started
  Object.keys(S.answers).forEach(idxStr => {
    const mod = STEPS[parseInt(idxStr)]?.mod;
    if (mod !== undefined) completedMods.add(mod);
  });
  // Also mark every module up to and including the active one as completed
  const curMod = STEPS[S.idx]?.mod ?? 0;
  for (let m = 0; m <= curMod; m++) completedMods.add(m);

  // Restore confidence meter
  if (progress.conf) {
    Object.assign(CONF, progress.conf);
  }

  // Restore file tree
  if (progress.ftFiles) {
    for (const [path, content] of Object.entries(progress.ftFiles)) {
      FT.liveFiles[path] = { content, newlyAdded: false };
    }
    renderFileTree();
  }

  document.getElementById('resume-bar').classList.remove('vis');
  renderXP();

  // Replay only completed steps from the CURRENT module
  const resumeMod = STEPS[S.idx]?.mod ?? 0;
  const modStart  = STEPS.findIndex(s => s.mod === resumeMod);

  if (modStart >= 0) {
    addDivider(MODULES[resumeMod]?.label ?? '');
    for (let i = modStart; i < S.idx; i++) {
      const step = STEPS[i];
      if (!step) continue;
      replayStep(step, i);
    }
  }

  // Alex resuming greeting
  const id       = ++MC;
  const wrap     = document.createElement('div');
  wrap.className = 'msg';
  wrap.id        = 'alex-msg-' + id;
  const mod      = STEPS[S.idx]?.mod ?? 0;
  const modLabel = MODULES[mod]?.label ?? '';
  wrap.innerHTML = alexHead(id) + `
    <div class="mbody">
      <p>welcome back, <strong>${esc(S.name)}</strong>. picking up at <em>${esc(modLabel)}</em>, step ${S.idx + 1}.</p>
    </div>`;
  chat().appendChild(wrap);
  sc();
  updateStats();
  renderSaved();
  setTimeout(() => runStep(S.idx), 400);
}

/** Render a completed step as collapsed history including the user's answer. */
function replayStep(step, idx) {
  const id       = ++MC;
  const wrap     = document.createElement('div');
  wrap.className = 'msg msg-replayed';
  wrap.id        = 'alex-msg-' + id;
  wrap.dataset.stepidx = idx;
  const lines    = step.alex || [];
  const answer   = S.answers[idx];
  const skipped  = answer?.type === 'skipped';

  let html = alexHead(id, idx);
  if (lines.length > 0) html += `<div class="mbody">${lines.map(l => `<p>${injectName(l)}</p>`).join('')}</div>`;
  if (step.callout) html += renderCallout(step.callout);


  if (step.task?.context) {
    const file = step.task.file || '';
    html += `<div class="ctx-block" data-lang="${esc(step.task.lang || 'javascript')}" data-stepidx="${idx}">
      <div class="ctx-bar">
        <svg viewBox="0 0 16 16" width="11" height="11" fill="var(--text3)" style="flex-shrink:0"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/></svg>
        <span class="ctx-filename">${esc(file)}</span>
        <span class="ctx-label">context</span>
      </div>
      <div class="ctx-cm-host" id="ctx-cm-${idx}"></div>
    </div>`;
  }


  if (step.after) {
    const apClass = step.task
      ? (step.task.type === 'quiz' ? 'ap-quiz' : 'ap-task')
      : (step.nextOn ? 'ap-info' : 'ap-task');
    html += `<div class="after-prompt ${apClass}">${injectName(step.after)}</div>`;
  }

  wrap.innerHTML = html;
  chat().appendChild(wrap);


  if (step.task?.context) {
    setTimeout(() => initContextMirror(idx, step.task), 60);
  }

  // Set status on the step-check span right after render
  if (step.task) {
    const sc = document.getElementById('step-check-' + idx);
    if (sc) {
      sc.innerHTML = skipped
        ? '<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M2.75 3a.75.75 0 0 1 .75.75v3.546l9.38-4.502a.75.75 0 0 1 1.07.68v9.052a.75.75 0 0 1-1.07.681L3.5 8.704v3.546a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 2.75 3z"/></svg>'
        : '<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>';
      sc.className = 'step-check done' + (skipped ? ' skipped' : '');
    }
  }


  const savedStep = S.saved.filter(s => (s.stepIdx ?? s.id) === idx);
  if (savedStep.length) {
    const favBtn = wrap.querySelector('.sbtn-fav');
    if (favBtn && savedStep.some(s => s.type === 'fav')) favBtn.classList.add('active-fav');
  }

  // Render user answer bubble if answered (not skipped)
  if (answer && !skipped && answer.type !== 'info') {
    const userWrap     = document.createElement('div');
    userWrap.className = 'msg user-input msg-replayed';
    if (answer.type === 'code') {
      userWrap.innerHTML = userHead() + `
        <div class="replay-code-answer">
          <div class="replay-code-label">submitted code</div>
          <pre class="replay-code-pre">${esc(answer.text)}</pre>
        </div>`;
    } else {
      userWrap.innerHTML = userHead() + `<div class="user-answer-bubble">${esc(answer.text)}</div>`;
    }
    chat().appendChild(userWrap);
  }
}

function restartSession() {
  try {
    localStorage.removeItem(LS_NAME);
    localStorage.removeItem(LS_PROGRESS);
  } catch (e) {}
  window.location.reload();
}

// ─── SAVE / LATER ─────────────────────────────────────────────────────────────
function saveMsg(msgId, type) {
  const el = document.getElementById('alex-msg-' + msgId);
  if (!el) return;

  // Prefer stepIdx for stable identity across replays; fall back to msgId
  const stepIdx = el.dataset.stepidx !== undefined ? parseInt(el.dataset.stepidx) : msgId;

  const body    = el.querySelector('.mbody');
  const callout = el.querySelector('.callout');
  let text = (body ? body.textContent : callout ? callout.textContent : '').trim().replace(/\s+/g, ' ').slice(0, 90);
  if (text.length === 90) text += '…';

  // Toggle off if already saved with same stepIdx + type
  const existing = S.saved.findIndex(s => s.stepIdx === stepIdx && s.type === type);
  if (existing !== -1) {
    S.saved.splice(existing, 1);
    updateSaveBtns(msgId);
    renderSaved();
    saveProgress();
    return;
  }

  const SVG_STAR = `<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>`;
  S.saved.push({
    stepIdx,
    type,
    text,
    icon:  SVG_STAR,
    label: 'saved',
  });
  updateSaveBtns(msgId);
  renderSaved();
  saveProgress();
}

function updateSaveBtns(msgId) {
  const el = document.getElementById('alex-msg-' + msgId);
  if (!el) return;
  const stepIdx = el.dataset.stepidx !== undefined ? parseInt(el.dataset.stepidx) : msgId;
  const favBtn  = el.querySelector('.sbtn-fav');
  if (favBtn) favBtn.classList.toggle('active-fav', S.saved.some(s => s.stepIdx === stepIdx && s.type === 'fav'));
}

function renderSaved() {
  const list  = document.getElementById('saved-list');
  const badge = document.getElementById('saved-count');
  badge.textContent = S.saved.length;
  list.classList.toggle('collapsed', !S.savedOpen);

  if (S.saved.length === 0) {
    const SVG_STAR = `<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" style="vertical-align:-1px"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>`;
    list.innerHTML = `<div class="saved-empty">Click ${SVG_STAR} on any message to save it here.</div>`;
    return;
  }

  list.innerHTML = S.saved.map(s => `
    <div class="saved-item" onclick="scrollToStepMsg(${s.stepIdx ?? s.id})">
      <span class="si-icon">${s.icon}</span>
      <div class="si-body">
        <div class="si-label">${s.label}</div>
        <div class="si-text">${esc(s.text)}</div>
      </div>
      <span class="si-del" onclick="event.stopPropagation();removeSaved(${s.stepIdx ?? s.id},'${s.type}')">×</span>
    </div>`).join('');
}

function removeSaved(stepIdx, type) {
  S.saved = S.saved.filter(s => !((s.stepIdx === stepIdx || s.id === stepIdx) && s.type === type));
  // Refresh active state on the message if it's currently in DOM
  const el = document.querySelector(`[data-stepidx="${stepIdx}"]`);
  if (el) {
    const msgId = el.id.replace('alex-msg-', '');
    updateSaveBtns(parseInt(msgId));
  }
  renderSaved();
  saveProgress();
}

function toggleSaved() { S.savedOpen = !S.savedOpen; renderSaved(); }

/** Scroll to an alex message by stepIdx — works across replays */
function scrollToStepMsg(stepIdx) {
  const el = document.querySelector(`[data-stepidx="${stepIdx}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── MODULES SIDEBAR ─────────────────────────────────────────────────────────

function getModStepRange(modIdx) {
  const first = STEPS.findIndex(s => s.mod === modIdx);
  const last  = STEPS.reduce((l, s, i) => s.mod === modIdx ? i : l, first);
  return { first, last };
}

function renderMods() {
  document.getElementById('mod-list').innerHTML = MODULES.map((m, i) => {
    const { first, last } = getModStepRange(i);

    // active  = S.idx is within this module's step range
    // done    = user has entered this module before (even if restarting)
    // locked  = never reached
    let state;
    const inRange = S.idx >= first && S.idx <= last;

    if (inRange) {
      state = 'active';
    } else if (completedMods.has(i)) {
      state = 'done';
    } else {
      state = 'locked';
    }

    const isViewing = viewingPastMod === i;

    const dot = state === 'done'
      ? `<svg class="mod-dot" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="var(--green)"/><path d="M4.5 8.5l2.5 2.5 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
      : state === 'active'
      ? `<svg class="mod-dot" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="var(--blue2)"/><circle cx="8" cy="8" r="3" fill="#fff"/></svg>`
      : `<svg class="mod-dot" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="var(--border2)" stroke-width="1.5" fill="none"/><circle cx="8" cy="8" r="2.5" fill="var(--border2)"/></svg>`;

    let onclick = '';
    if (state === 'done') {
      // Clicking a done module always views it (or returns to live if already viewing it)
      onclick = isViewing
        ? `onclick="returnToLive()" title="Return to current"`
        : `onclick="viewModule(${i})" title="View module"`;
    } else if (state === 'active' && viewingPastMod !== null) {
      // Active module is clickable only when viewing a past one — returns to live
      onclick = `onclick="returnToLive()" title="Return to current"`;
    }

    const viewingMark = isViewing ? '<span class="mod-viewing-mark">◀</span>' : '';
    const activeMark  = (state === 'active' && viewingPastMod !== null) ? '<span class="mod-viewing-mark">live</span>' : '';

    return `<div class="mod-item ${state}${isViewing ? ' viewing' : ''}" ${onclick}>${dot}<span>${m.label}</span>${viewingMark}${activeMark}</div>`;
  }).join('');

  document.getElementById('prog-fill').style.width = (S.idx / STEPS.length * 100) + '%';
  const activeMod = STEPS[S.idx]?.mod ?? 0;
  document.getElementById('tb-mod').textContent = `module ${activeMod + 1} / ${MODULES.length}`;
}

/** Open a past module's chat by replaying from S.answers. */
function viewModule(modIdx) {
  viewingPastMod = modIdx;

  // Clear the live step's CM instance — it will be re-created on returnToLive
  delete cmInstances[S.idx];

  const modLabel     = MODULES[modIdx]?.label ?? '';
  const firstStepIdx = STEPS.findIndex(s => s.mod === modIdx);
  const lastStepIdx  = STEPS.reduce((last, s, i) => s.mod === modIdx ? i : last, firstStepIdx);

  chat().innerHTML = '';
  addDivider(modLabel);
  for (let i = firstStepIdx; i <= lastStepIdx; i++) {
    if (STEPS[i]) replayStep(STEPS[i], i);
  }

  chat().scrollTop = 0;

  // Show restart button in topbar, store which module it targets
  const tbRestartBtn = document.getElementById('tb-restart-btn');
  if (tbRestartBtn) {
    tbRestartBtn.style.display = '';
    tbRestartBtn.dataset.modidx = modIdx;
  }

  // Disable input — read only
  document.getElementById('cmd-in').disabled  = true;
  document.getElementById('run-btn').disabled = true;
  document.getElementById('cmd-row').classList.add('row-disabled');
  const modeHint = document.getElementById('mode-hint');
  if (modeHint) modeHint.textContent = 'Viewing past module — click current module to return';

  renderMods();
  renderConfidence(modIdx);
}

/** Return from viewing a past module to the live session. */
function returnToLive() {
  viewingPastMod = null;

  // Hide the topbar restart button
  const tbRestartBtn = document.getElementById('tb-restart-btn');
  if (tbRestartBtn) { tbRestartBtn.style.display = 'none'; delete tbRestartBtn.dataset.modidx; }

  const liveMod  = STEPS[S.idx]?.mod ?? 0;
  const modStart = STEPS.findIndex(s => s.mod === liveMod);
  chat().innerHTML = '';

  // Rebuild file tree for completed steps in this module
  FT.liveFiles    = {};
  FT.selectedFile = null;
  if (typeof FILE_SNAPSHOTS !== 'undefined') {
    for (let i = modStart; i < S.idx; i++) {
      const snap = FILE_SNAPSHOTS[i];
      if (!snap) continue;
      for (const [path, content] of Object.entries(snap)) {
        FT.liveFiles[path] = { content, newlyAdded: false };
      }
    }
  }
  renderFileTree();
  renderFileTreeViewer();

  addDivider(MODULES[liveMod]?.label ?? '');
  for (let i = modStart; i < S.idx; i++) {
    if (STEPS[i]) replayStep(STEPS[i], i);
  }

  delete cmInstances[S.idx];

  document.getElementById('cmd-in').disabled  = false;
  document.getElementById('run-btn').disabled = false;
  document.getElementById('cmd-row').classList.remove('row-disabled');

  renderMods();
  renderConfidence(liveMod);
  runStep(S.idx);
}

function restartModule(modIdx) {
  const firstStepIdx = STEPS.findIndex(s => s.mod === modIdx);
  const lastStepIdx  = STEPS.reduce((last, s, i) => s.mod === modIdx ? i : last, firstStepIdx);

  // Clear only this module's answers
  for (let i = firstStepIdx; i <= lastStepIdx; i++) {
    delete S.answers[i];
    delete cmInstances[i];   // stale CM instances for this module's steps
  }

  // Reset this module's confidence only
  CONF[modIdx] = 100;

  // Clear file tree — will be rebuilt from scratch as steps are completed
  FT.liveFiles    = {};
  FT.selectedFile = null;
  renderFileTree();
  renderFileTreeViewer();

  // Move S.idx to this module's first step
  S.idx    = firstStepIdx;
  S.locked = false;
  viewingPastMod = null;

  // Hide topbar restart button
  const tbRestartBtn = document.getElementById('tb-restart-btn');
  if (tbRestartBtn) { tbRestartBtn.style.display = 'none'; delete tbRestartBtn.dataset.modidx; }

  // Re-enable input area
  document.getElementById('cmd-in').disabled  = false;
  document.getElementById('run-btn').disabled = false;
  document.getElementById('cmd-row').classList.remove('row-disabled');

  saveProgress();
  renderMods();
  startModule(firstStepIdx);
}
function restartModuleFromTopbar() {
  const btn    = document.getElementById('tb-restart-btn');
  const modIdx = btn ? parseInt(btn.dataset.modidx) : NaN;
  if (!isNaN(modIdx)) restartModule(modIdx);
}

function cmMode(lang) {
  const map = {
    javascript: { name: 'javascript', esVersion: 9 },
    js:         { name: 'javascript', esVersion: 9 },
    jsx:        { name: 'javascript', esVersion: 9, jsx: true },
    typescript: { name: 'javascript', esVersion: 9, typescript: true },
    ts:         { name: 'javascript', esVersion: 9, typescript: true },
    css:        'css',
    html:       'htmlmixed',
    xml:        'xml',
    json:       { name: 'javascript', json: true },
    sql:        'sql',
    bash:       'shell',
    shell:      'shell',
    properties: 'properties',
    text:       null,
  };
  return map[lang] || { name: 'javascript', esVersion: 9 };
}

function initCodeMirror(task, stepIdx) {
  const host = document.getElementById('cm-host-' + stepIdx);
  if (!host || cmInstances[stepIdx]) return;

  const placeholder  = task.placeholder || '';

  const cm = CodeMirror(host, {
    value:             placeholder,
    mode:              cmMode(task.lang || 'javascript'),
    theme:             'default',
    lineNumbers:       true,
    matchBrackets:     true,
    autoCloseBrackets: true,
    autoCloseTags:     true,
    styleActiveLine:   true,
    gutters:           ['CodeMirror-linenumbers'],
    viewportMargin:    Infinity,
    indentUnit:        2,
    tabSize:           2,
    indentWithTabs:    false,
    lineWrapping:      false,
    extraKeys: {
      'Ctrl-Enter': () => submit(),
      'Cmd-Enter':  () => submit(),
      'Ctrl-/':     c  => c.execCommand('toggleComment'),
      'Tab':        c  => { if (c.somethingSelected()) c.indentSelection('add'); else c.replaceSelection('  ', 'end'); },
      'Shift-Tab':  c  => c.indentSelection('subtract'),
    },
  });

  cmInstances[stepIdx] = { cm };

  cm.setCursor({ line: 0, ch: 0 });
  const lastLine = cm.lastLine();
  cm.setSelection({ line: 0, ch: 0 }, { line: lastLine, ch: cm.getLine(lastLine).length });
  cm.on('change', () => clearErrorBar());

  setTimeout(() => {
    cm.refresh();
    cm.focus();
    const alexMsg = document.querySelector('.msg:not(.user-input):last-of-type');
    if (alexMsg) alexMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}

function getCmUserValue(stepIdx) {
  const inst = cmInstances[stepIdx];
  if (!inst) return '';
  const { cm } = inst;
  const lastLine = cm.lastLine();
  return cm.getRange({ line: 0, ch: 0 }, { line: lastLine, ch: cm.getLine(lastLine).length }).trim();
}

// ─── RENDERING ────────────────────────────────────────────────────────────────
let MC = 0;

function renderCallout(c) {
  const cls = { ok: 'c-ok', err: 'c-err', hint: 'c-hint', info: 'c-info' }[c.type] || 'c-task';
  return `<div class="callout ${cls}"><div class="c-label">${injectName(c.label)}</div><ul>${c.items.map(i => `<li>${injectName(i)}</li>`).join('')}</ul></div>`;
}

function buildTaskBlock(task, stepIdx) {
  if (task.type === 'quiz') {
    const inputType = task.multi ? 'checkbox' : 'radio';
    let html = `<div class="quiz-block" id="quiz-block-${stepIdx}"><div class="quiz-opts">`;
    task.options.forEach((opt, i) => {
      html += `<div class="quiz-opt" id="quiz-opt-${stepIdx}-${i}" onclick="toggleQuizOpt(${stepIdx},${i})">
        <input type="${inputType}" name="quiz-${stepIdx}" value="${i}" id="qi-${stepIdx}-${i}" onclick="event.stopPropagation()">
        <span class="quiz-opt-label">${esc(opt)}</span></div>`;
    });
    html += `</div><div class="quiz-footer"><button class="quiz-submit" id="quiz-submit-${stepIdx}" onclick="submitQuiz(${stepIdx})">Submit</button></div>`;
    html += `<div class="cmd-status" id="cmd-status-${stepIdx}"><div class="cs-label"></div><div class="cs-msg"></div></div></div>`;
    return html;
  }

  if (task.type === 'code') {
    return `<div class="task-block"><div class="file-editor-inner">
      <div class="fe-bar">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="var(--text3)" style="flex-shrink:0"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/></svg>
        <div class="fe-path">${task.file || 'untitled'}</div>
      </div>
      <div class="cm-host" id="cm-host-${stepIdx}"></div>
      <div class="fe-footer">
        <span class="fe-shortcut"><kbd>⌘</kbd><kbd>↵</kbd> submit</span>
        <button class="fe-submit" id="fe-submit-${stepIdx}" onclick="submit()">Submit</button>
      </div>
      <div class="fe-status" id="fe-status-${stepIdx}"><div class="fs-label"></div><div class="fs-msg"></div></div>
    </div></div>`;
  }

  // cmd / ask / default
  return `<div class="task-block cmd-task">
    <div class="cmd-status" id="cmd-status-${stepIdx}"><div class="cs-label"></div><div class="cs-msg"></div></div>
  </div>`;
}

function alexHead(id, stepIdx) {
  const statusSpan = stepIdx !== undefined
    ? `<span class="step-check" id="step-check-${stepIdx}" aria-hidden="true"></span>`
    : `<span class="step-check" id="step-check-mc-${id}" aria-hidden="true"></span>`;
  return `<div class="mhead">
    <div class="av alex">a</div>
    <span class="mname alex">alex</span>
    <span class="mts" id="mts-${id}">${ts()}</span>
    ${statusSpan}
    <div class="save-btns">
      <button class="sbtn sbtn-fav" title="Mark as favourite" onclick="saveMsg(${id},'fav')"><svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg></button>
    </div>
  </div>`;
}

function userHead() {
  const displayName = S.name || 'you';
  const initial     = displayName.charAt(0).toUpperCase();
  return `<div class="user-input-head">
    <div class="av user">${initial}</div>
    <span class="mname user">${esc(displayName)}</span>
    <span class="mts">${ts()}</span>
  </div>`;
}

function addAlexMsg(step, stepIdx) {
  const id       = ++MC;
  const wrap     = document.createElement('div');
  wrap.className = 'msg';
  wrap.id        = 'alex-msg-' + id;
  if (stepIdx !== undefined) wrap.dataset.stepidx = stepIdx;
  const lines    = step.alex || [];
  let html = alexHead(id, stepIdx);
  if (lines.length > 0) html += `<div class="mbody">${lines.map(l => `<p>${injectName(l)}</p>`).join('')}</div>`;
  if (step.callout) html += renderCallout(step.callout);
  if (step.task?.context) {
    const file = step.task.file || '';
    html += `<div class="ctx-block" data-lang="${esc(step.task.lang || 'javascript')}" data-stepidx="${stepIdx}">
      <div class="ctx-bar">
        <svg viewBox="0 0 16 16" width="11" height="11" fill="var(--text3)" style="flex-shrink:0"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/></svg>
        <span class="ctx-filename">${esc(file)}</span>
        <span class="ctx-label">context</span>
      </div>
      <div class="ctx-cm-host" id="ctx-cm-${stepIdx}"></div>
    </div>`;
  }
  if (step.after) {
    const apClass = step.task
      ? (step.task.type === 'quiz' ? 'ap-quiz' : 'ap-task')
      : (step.nextOn ? 'ap-info' : 'ap-task');
    html += `<div class="after-prompt ${apClass}">${injectName(step.after)}</div>`;
  }
  if (step.task?.type === 'quiz') {
    const modeLabel = step.task.multi ? 'Select all that apply' : 'Select one';
    html += `<div class="after-prompt ap-quiz" style="margin-top:6px">${injectName(esc(step.task.question))}<br>
      <span style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace">${modeLabel}</span>
    </div>`;
  }
  wrap.innerHTML = html;
  chat().appendChild(wrap);
  sc();

  // Mount read-only CodeMirror for context after the DOM is ready
  if (step.task?.context) {
    setTimeout(() => initContextMirror(stepIdx, step.task), 60);
  }
}

/** Mount a read-only CodeMirror in Alex's bubble to show task.context. */
function initContextMirror(stepIdx, task) {
  const host = document.getElementById('ctx-cm-' + stepIdx);
  if (!host || host._cmInstance) return;
  const cm = CodeMirror(host, {
    value:          task.context,
    mode:           cmMode(task.lang || 'javascript'),
    theme:          'default',
    lineNumbers:    true,
    readOnly:       true,
    lineWrapping:   false,
    viewportMargin: Infinity,
    cursorBlinkRate: -1,   // hide cursor entirely
  });
  host._cmInstance = cm;
  setTimeout(() => cm.refresh(), 60);
}

function addUserInputBubble(step, stepIdx) {
  if (!step.task || step.task.type === 'cmd' || step.task.type === 'ask') return;
  const isCode   = step.task.type === 'code';
  const wrap     = document.createElement('div');
  wrap.className = 'msg user-input' + (isCode ? ' code-task-bubble' : '');
  wrap.id        = 'user-input-' + stepIdx;
  wrap.innerHTML = userHead() + buildTaskBlock(step.task, stepIdx);
  chat().appendChild(wrap);

  if (step.task.type === 'quiz') {
    setTimeout(() => {
      document.querySelectorAll(`input[name="quiz-${stepIdx}"]`).forEach(input => {
        input.addEventListener('change', () => { clearStatus(stepIdx); clearErrorBar(); });
      });
    }, 60);
  }
  if (isCode) setTimeout(() => initCodeMirror(step.task, stepIdx), 80);
  sc();
}

let _statusTimer = null;

function showStatusBar(msg, type = 'ok') {
  const bar   = document.getElementById('status-bar');
  const label = document.getElementById('status-label');
  const text  = document.getElementById('status-msg');
  if (!bar) return;
  const SVG_CHECK  = `<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" style="vertical-align:-1px"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>`;
  const SVG_SKIP   = `<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" style="vertical-align:-1px"><path d="M2.75 3a.75.75 0 0 1 .75.75v3.546l9.38-4.502a.75.75 0 0 1 1.07.68v9.052a.75.75 0 0 1-1.07.681L3.5 8.704v3.546a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 2.75 3z"/></svg>`;
  const labels = { ok: `${SVG_CHECK} Correct`, skip: `${SVG_SKIP} Skipped` };
  label.innerHTML   = labels[type] || `${SVG_CHECK} Correct`;
  text.innerHTML    = injectName(msg);
  bar.className     = 'status-bar vis ' + type;

  // Auto-dismiss after 4s
  clearTimeout(_statusTimer);
  _statusTimer = setTimeout(() => clearStatusBar(), 4000);
}

function clearStatusBar() {
  clearTimeout(_statusTimer);
  const bar = document.getElementById('status-bar');
  if (bar) bar.classList.remove('vis');
}

function addAlexCorrectBubble(msg) { showStatusBar(msg, 'ok'); }

function addUserAnswerBubble(text) {
  const wrap     = document.createElement('div');
  wrap.className = 'msg user-input';
  wrap.innerHTML = userHead() + `<div class="user-answer-bubble">${esc(text)}</div>`;
  chat().appendChild(wrap);
  sc();
}

function addDivider(text) {
  const d       = document.createElement('div');
  d.className   = 'divider';
  d.textContent = text;
  chat().appendChild(d);
}

function setTermTab(name) {
  const panel = document.getElementById('terminal-panel');
  document.querySelectorAll('.term-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');

  if (name === 'command') {
    panel.classList.remove('open');
    panel.innerHTML = '';
  } else {
    const content = document.getElementById('tab-' + name)._content || '';
    panel.innerHTML = content;
    panel.classList.toggle('open', !!content);
    if (name === 'hint') {
      if (!S.hintUsedThisStep) {
        S.hints++;
        S.hintUsedThisStep = true;
        drainConfidence('hint');
        updateStats();
      }
    }
  }
}

function updateStats() {
  document.getElementById('st-done').textContent  = S.done;
  document.getElementById('st-att').textContent   = S.attempts;
  document.getElementById('st-hints').textContent = S.hints;
}

// ─── RUN STEP ─────────────────────────────────────────────────────────────────

/** Called when entering a new module — clears chat, resets file tree, shows module intro divider. */
function startModule(idx, skipClear = false) {
  const step     = STEPS[idx];
  const modIdx   = step.mod;
  const modLabel = MODULES[modIdx]?.label ?? '';

  viewingPastMod = null;
  completedMods.add(modIdx);   // mark this module as ever-entered

  // Always reset this module's confidence to 100 on a fresh start.
  // This runs before runStep so drainConfidence later starts from a clean slate.
  CONF[modIdx] = 100;
  renderConfidence(modIdx);

  if (!skipClear) {
    // Clear chat for fresh module start
    chat().innerHTML = '';

    // Clear file tree to only show files for this module
    FT.liveFiles    = {};
    FT.selectedFile = null;
    renderFileTree();
    renderFileTreeViewer();
  }

  // Module intro divider
  addDivider(modLabel);
  runStep(idx);
}

function runStep(idx) {
  if (idx >= STEPS.length) return;
  try {
    const step = STEPS[idx];
    addAlexMsg(step, idx);
    addUserInputBubble(step, idx);
    clearErrorBar();

    const task       = step.task;
    const isBlocking = task?.type === 'code' || task?.type === 'quiz';
    const cmdIn      = document.getElementById('cmd-in');
    const cmdRow     = document.getElementById('cmd-row');
    const runBtn     = document.getElementById('run-btn');

    cmdIn.disabled  = isBlocking;
    runBtn.disabled = isBlocking;
    cmdRow.classList.toggle('row-disabled', isBlocking);

    const modeHint  = document.getElementById('mode-hint');

    if (task?.type === 'code') {
      modeHint.textContent  = 'Write in the editor above';
    } else if (task?.type === 'quiz') {
      modeHint.textContent  = 'Select options above';
    } else if (task?.type === 'cmd') {
      modeHint.textContent  = 'terminal command — Press Enter to send';
    } else if (step.nextOn) {
      modeHint.textContent  = `Type "${step.nextOn}" to continue`;
    } else {
      modeHint.textContent  = 'Press Enter to send';
    }

    if (!isBlocking) setTimeout(() => cmdIn.focus(), 60);

    const hintContent = task?.hint   ? `<pre>${esc(task.hint)}</pre>`   : '';
    const solContent  = task?.answer ? `<pre>${esc(task.answer)}</pre>` : '';
    document.getElementById('tab-hint')._content     = hintContent;
    document.getElementById('tab-solution')._content = solContent;
    document.getElementById('tab-hint').disabled     = !task?.hint;
    document.getElementById('tab-solution').disabled = !task?.answer;

    setTermTab('command');
    S.hist             = [];   // reset per-step history so ↑/↓ only shows this step's attempts
    S.histIdx          = -1;
    S.hintUsedThisStep = false;
    setLocked(false);
    document.getElementById('skip-btn').style.visibility = (task || step.nextOn) ? 'visible' : 'hidden';
    renderMods();
    updateStats();
    renderSaved();
    // Re-render confidence for the current module (value managed by startModule / drainConfidence)
    renderConfidence(step.mod);
  } catch (err) {
    console.error('runStep failed at idx', idx, err);
    setLocked(false);
  }
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
function toggleQuizOpt(stepIdx, optIdx) {
  const input = document.getElementById('qi-' + stepIdx + '-' + optIdx);
  if (!input || input.disabled) return;
  if (input.type === 'radio') input.checked = true;
  else input.checked = !input.checked;
  clearStatus(stepIdx);
}

document.getElementById('cmd-in').addEventListener('keydown', e => {
  const cmdIn = document.getElementById('cmd-in');
  if (e.key === 'Enter') {
    e.preventDefault();
    submit();
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (S.histIdx < S.hist.length - 1) {
      S.histIdx++;
      cmdIn.value = S.hist[S.hist.length - 1 - S.histIdx] || '';
    }
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (S.histIdx > 0) {
      S.histIdx--;
      cmdIn.value = S.hist[S.hist.length - 1 - S.histIdx] || '';
    } else {
      S.histIdx   = -1;
      cmdIn.value = '';
    }
    return;
  }
  clearStatus(S.idx);
});

// ─── SUBMIT ───────────────────────────────────────────────────────────────────
function setLocked(locked) {
  S.locked = locked;
  document.getElementById('run-btn').disabled = locked;
  const feBtn = document.getElementById('fe-submit-' + S.idx);
  if (feBtn) feBtn.disabled = locked;
}

function submitQuiz(stepIdx) {
  if (S.locked) return;
  clearStatusBar();
  const step = STEPS[stepIdx];
  if (!step?.task || step.task.type !== 'quiz') return;

  const task     = step.task;
  const inputs   = document.querySelectorAll(`input[name="quiz-${stepIdx}"]:checked`);
  const selected = Array.from(inputs).map(i => parseInt(i.value, 10)).sort((a, b) => a - b);
  if (selected.length === 0) return;

  S.attempts++; S.hist.push(selected.join(',')); S.histIdx = -1; updateStats();

  const correct = [...task.correct].sort((a, b) => a - b);
  const isOk    = selected.length === correct.length && selected.every((v, i) => v === correct[i]);

  if (isOk) {
    document.querySelectorAll(`input[name="quiz-${stepIdx}"]`).forEach(i => i.disabled = true);
    document.getElementById('quiz-submit-' + stepIdx).disabled = true;
    task.options.forEach((_, i) => {
      const optEl = document.getElementById(`quiz-opt-${stepIdx}-${i}`);
      if (optEl && correct.includes(i)) optEl.classList.add('correct');
    });
    S.answers[stepIdx] = {
      type: 'quiz',
      text: selected.map(i => task.options[i]).join(' · '),
      hintUsed: S.hintUsedThisStep,
    };
    setLocked(true);
    addAlexCorrectBubble(task.explanation || 'All correct.');
    setTimeout(() => advance(), 1100);
  } else {
    showErrorBar('Not quite — adjust your selection and try again.');
  }
}

function submit() {
  if (S.locked) return;
  clearStatusBar();
  const step = STEPS[S.idx];
  if (!step) return;
  const task = step.task;

  if (task?.type === 'quiz') return;

  const cmdIn = document.getElementById('cmd-in');

  if (!task && step.nextOn) {
    const raw = cmdIn.value.trim();
    if (!raw) return;
    if (!raw.toLowerCase().includes(step.nextOn.toLowerCase())) {
      showErrorBar(`Type <strong>${esc(step.nextOn)}</strong> to continue.`);
      return;
    }
    cmdIn.value = '';
    S.attempts++; S.hist.push(raw); S.histIdx = -1; updateStats();
    S.answers[S.idx] = { type: 'cmd', text: raw, hintUsed: S.hintUsedThisStep };
    advance();
    return;
  }

  if (!task) {
    const raw = cmdIn.value.trim() || '…';
    S.attempts++; S.hist.push(raw); S.histIdx = -1;
    cmdIn.value = '';
    S.answers[S.idx] = { type: 'info', text: raw };
    updateStats();
    advance();
    return;
  }

  let input = '';
  if (task.type === 'code') {
    input = getCmUserValue(S.idx);
    if (!input || input.trim() === (task.placeholder || '').trim()) {
      showErrorBar("You haven't written anything yet.");
      return;
    }
  } else {
    input = cmdIn.value.trim();
  }
  if (!input) return;

  S.attempts++; S.hist.push(input); S.histIdx = -1; updateStats(); setLocked(true);
  if (task.type !== 'code') showT();

  setTimeout(() => {
    if (task.type !== 'code') hideT();
    const r = task.check(input);
    if (task.type === 'code') {
      if (r.ok) {
        S.answers[S.idx] = { type: 'code', text: input, hintUsed: S.hintUsedThisStep };
        addAlexCorrectBubble(r.msg);
        setTimeout(() => advance(), 900);
      } else {
        showErrorBar(r.msg);
        setLocked(false);
        cmInstances[S.idx]?.cm.focus();
      }
    } else {
      if (r.ok) {
        S.answers[S.idx] = { type: 'cmd', text: input, hintUsed: S.hintUsedThisStep };
        addUserAnswerBubble(input);
        cmdIn.value = '';
        addAlexCorrectBubble(r.msg);
        setTimeout(() => advance(), 700);
      } else {
        // Don't clear input — let user correct it in place
        showErrorBar(r.msg);
        setLocked(false);
        cmdIn.focus();
      }
    }
  }, task.type === 'code' ? 120 : 400);
}

function showErrorBar(msg) {
  document.getElementById('error-msg').innerHTML = injectName(msg);
  document.getElementById('error-bar').classList.add('vis');
}

function clearErrorBar() {
  document.getElementById('error-bar')?.classList.remove('vis');
}

function clearStatus(stepIdx) {
  clearErrorBar();
  const fe  = document.getElementById('fe-status-'  + stepIdx);
  if (fe  && fe.classList.contains('err'))  fe.className  = 'fe-status';
  const cmd = document.getElementById('cmd-status-' + stepIdx);
  if (cmd && cmd.classList.contains('err')) cmd.className = 'cmd-status';
}

function advance(xpType = 'correct', nextDelay = 350) {
  // ── XP ──
  const earned = xpType === 'skip'
    ? XP_SKIP
    : S.hintUsedThisStep ? XP_HINT : XP_CORRECT;

  S.xp += earned;
  renderXP(earned);

  // ── FILE TREE ──
  updateFileTree(S.idx);

  // ── CONFIDENCE — recalc now that S.answers[S.idx] is written ──
  const completedMod = STEPS[S.idx]?.mod;
  if (completedMod !== undefined) recalcConfidence(completedMod);

  markStepDone();
  S.done++; S.idx++; S.locked = true; updateStats();
  saveProgress();

  if (S.idx < STEPS.length) {
    const nextMod = STEPS[S.idx]?.mod;
    const prevMod = STEPS[S.idx - 1]?.mod;
    const crossingModules = nextMod !== prevMod;

    if (crossingModules) {
      // Find the actual frontier: first step in the upcoming modules with no answer
      let frontier = S.idx;
      while (frontier < STEPS.length && S.answers[frontier] !== undefined) {
        frontier++;
      }

      if (frontier === S.idx) {
        // Next step is unanswered — normal fresh module start
        setTimeout(() => startModule(S.idx), nextDelay);
      } else if (frontier >= STEPS.length) {
        // Every step ahead is answered — course complete
        setTimeout(() => {
          addDivider('course complete');
          const id   = ++MC;
          const wrap = document.createElement('div');
          wrap.className = 'msg';
          wrap.innerHTML = alexHead(id) + `
            <div class="callout c-ok" style="margin-left:var(--av-offset)">
              <div class="c-label">all done</div>
              <p style="font-size:13px;color:var(--text)">${injectName("you've completed the bootcamp, {name}. the full MERN stack is yours.")}</p>
            </div>`;
          chat().appendChild(wrap);
          sc();
          document.getElementById('run-btn').disabled = true;
          try { localStorage.removeItem(LS_PROGRESS); } catch (e) {}
        }, 350);
      } else {
        // Some steps ahead are already answered — replay the next module's
        // existing progress and land at the frontier step
        S.idx = frontier;
        updateStats();
        saveProgress();
        setTimeout(() => {
          const frontierMod      = STEPS[frontier]?.mod ?? nextMod;
          const frontierModStart = STEPS.findIndex(s => s.mod === frontierMod);
          completedMods.add(frontierMod);
          chat().innerHTML = '';

          // Rebuild file tree for completed steps in the frontier module
          FT.liveFiles    = {};
          FT.selectedFile = null;
          if (typeof FILE_SNAPSHOTS !== 'undefined') {
            for (let i = frontierModStart; i < frontier; i++) {
              const snap = FILE_SNAPSHOTS[i];
              if (!snap) continue;
              for (const [path, content] of Object.entries(snap)) {
                FT.liveFiles[path] = { content, newlyAdded: false };
              }
            }
          }
          renderFileTree();
          renderFileTreeViewer();
          addDivider(MODULES[frontierMod]?.label ?? '');
          for (let i = frontierModStart; i < frontier; i++) {
            if (STEPS[i]) replayStep(STEPS[i], i);
          }
          delete cmInstances[frontier];
          renderMods();
          runStep(frontier);
        }, nextDelay);
      }
    } else {
      setTimeout(() => runStep(S.idx), nextDelay);
    }
  } else {
    addDivider('course complete');
    const id       = ++MC;
    const wrap     = document.createElement('div');
    wrap.className = 'msg';
    wrap.innerHTML = alexHead(id) + `
      <div class="callout c-ok" style="margin-left:var(--av-offset)">
        <div class="c-label">all done</div>
        <p style="font-size:13px;color:var(--text)">${injectName("you've completed the bootcamp, {name}. the full MERN stack is yours.")}</p>
      </div>`;
    chat().appendChild(wrap);
    sc();
    document.getElementById('run-btn').disabled = true;
    try { localStorage.removeItem(LS_PROGRESS); } catch (e) {}
  }
}

function skipStep() {
  const step = STEPS[S.idx];
  if (!step || S.locked) return;

  // nextOn steps have no task but can still be skipped
  const hasSkippable = step.task || step.nextOn;
  if (!hasSkippable) return;

  if (step.task?.type === 'quiz') {
    const task = step.task;
    document.querySelectorAll(`input[name="quiz-${S.idx}"]`).forEach(i => i.disabled = true);
    const sb = document.getElementById('quiz-submit-' + S.idx);
    if (sb) sb.disabled = true;
    task.options.forEach((_, i) => {
      const optEl = document.getElementById(`quiz-opt-${S.idx}-${i}`);
      if (optEl && task.correct.includes(i)) optEl.classList.add('reveal-correct');
    });
  }

  // Stamp the step-check on this step's alex message as skipped
  const sc = document.getElementById('step-check-' + S.idx);
  if (sc) { sc.innerHTML = '<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M2.75 3a.75.75 0 0 1 .75.75v3.546l9.38-4.502a.75.75 0 0 1 1.07.68v9.052a.75.75 0 0 1-1.07.681L3.5 8.704v3.546a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 2.75 3z"/></svg>'; sc.className = 'step-check done skipped'; }

  // Show skipped in the status bar
  showStatusBar('Study the solution before moving on.', 'skip');

  S.hints++;
  S.answers[S.idx] = { type: 'skipped', text: 'skipped' };
  // recalcConfidence runs inside advance() after the answer is written — no need to drain here
  updateStats();
  setLocked(true);
  saveProgress();
  setTimeout(() => advance('skip', 0), 400);
}

// ─── XP ENGINE ───────────────────────────────────────────────────────────────
function currentLevel(xp) {
  if (!LEVELS.length) return { title: 'Junior Dev', min: 0 };
  let lv = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.min) lv = l; }
  return lv;
}

function nextLevel(xp) {
  if (!LEVELS.length) return null;
  return LEVELS.find(l => l.min > xp) || null;
}

let _prevLevel = null;
let _levelUpTimer = null;

function renderXP(flashAmount) {
  const lv   = currentLevel(S.xp);
  const next = nextLevel(S.xp);

  // Detect level-up — compare against previous level title
  const didLevelUp = flashAmount != null && _prevLevel !== null && _prevLevel !== lv.title;
  _prevLevel = lv.title;

  // Topbar level pill
  const titleEl = document.getElementById('tb-xp-title');
  const totalEl = document.getElementById('tb-xp-total');
  if (titleEl) titleEl.textContent = lv.title;
  if (totalEl) totalEl.textContent = S.xp + ' XP';

  // Topbar circular progress ring
  const rangeStart = lv.min;
  const rangeEnd   = next ? next.min : S.xp + 1;
  const pct        = Math.min(((S.xp - rangeStart) / (rangeEnd - rangeStart)) * 100, 100);
  const ring = document.getElementById('tb-xp-ring');
  if (ring) {
    const r          = 14;
    const circ       = 2 * Math.PI * r;
    const dashOffset = circ - (pct / 100) * circ;
    ring.style.strokeDashoffset = dashOffset;
  }

  if (flashAmount != null) {
    const flash = document.getElementById('xp-flash');
    if (flash) {
      flash.textContent = '+' + flashAmount + ' XP';
      flash.classList.remove('pop');
      void flash.offsetWidth;
      flash.classList.add('pop');
    }
  }

  if (didLevelUp) showLevelUpBanner(lv.title);
}

function showLevelUpBanner(title) {
  const banner  = document.getElementById('levelup-banner');
  const luTitle = document.getElementById('lu-title');
  if (!banner || !luTitle) return;
  luTitle.textContent = title;
  banner.classList.add('vis');
  clearTimeout(_levelUpTimer);
  _levelUpTimer = setTimeout(() => banner.classList.remove('vis'), 3200);
}

// ─── STEP DONE CHECKMARK ─────────────────────────────────────────────────────
/** Stamp a check on the alex message header when a step passes. */
function markStepDone() {
  const sc = document.getElementById('step-check-' + S.idx);
  if (!sc) return;
  // Don't overwrite a skipped stamp — skipStep already set it before advance() ran
  if (sc.classList.contains('skipped')) return;
  sc.innerHTML  = '<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>';
  sc.className   = 'step-check done';
}

// ─── FILE TREE ENGINE ────────────────────────────────────────────────────────

/** Called after a step is passed. Merges FILE_SNAPSHOTS[stepIdx] into FT.liveFiles. */
function updateFileTree(stepIdx) {
  const snapshot = (typeof FILE_SNAPSHOTS !== 'undefined') ? FILE_SNAPSHOTS[stepIdx] : null;
  if (!snapshot) return;

  const wasEmpty = Object.keys(FT.liveFiles).length === 0;
  let hadNewFile = false;
  for (const [path, content] of Object.entries(snapshot)) {
    const isNew = !FT.liveFiles[path];
    FT.liveFiles[path] = { content, newlyAdded: isNew };
    if (isNew) hadNewFile = true;
  }

  renderFileTree();


  if (wasEmpty && hadNewFile && !FT.ftOpen) {
    const btn = document.getElementById('ft-toggle-btn');
    if (btn) {
      btn.classList.add('ft-btn-pulse');
      setTimeout(() => btn.classList.remove('ft-btn-pulse'), 2000);
    }
  }

  // Clear the newlyAdded flag after the highlight animation finishes (1.6s)
  if (hadNewFile) {
    setTimeout(() => {
      for (const path of Object.keys(snapshot)) {
        if (FT.liveFiles[path]) FT.liveFiles[path].newlyAdded = false;
      }
    }, 1600);
  }

  // Auto-select the first file from this snapshot if none is selected
  if (!FT.selectedFile) {
    FT.selectedFile = Object.keys(snapshot)[0];
    renderFileTreeViewer();
  }
}

/** Render the file tree item list into #ft-list. */
function renderFileTree() {
  const list = document.getElementById('ft-list');
  if (!list) return;

  const allPaths = Object.keys(FT.liveFiles);
  if (allPaths.length === 0) {
    list.innerHTML = `<div class="ft-empty">complete a code step<br>to see files appear here</div>`;
    return;
  }

  // Sort by FILE_TREE_ORDER, then alphabetically for anything not listed
  const order = (typeof FILE_TREE_ORDER !== 'undefined') ? FILE_TREE_ORDER : [];
  allPaths.sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  // Group into folders for display
  const seen = new Set();
  let html = '';
  for (const path of allPaths) {
    const parts  = path.split('/');
    const file   = parts.pop();
    const folder = parts.join('/');

    if (folder && !seen.has(folder)) {
      seen.add(folder);
      html += `<div class="ft-folder">
        <svg viewBox="0 0 16 16" width="13" height="13"><path fill="var(--yellow)" d="M1.75 2.5A.75.75 0 0 0 1 3.25v9.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75v-7a.75.75 0 0 0-.75-.75H7.56L6.03 3.22A1.75 1.75 0 0 0 4.78 2.5H1.75Z"/></svg>
        <span>${esc(folder)}/</span>
      </div>`;
    }

    const indent   = folder ? 'ft-file-indent' : '';
    const isActive = FT.selectedFile === path;
    const isNew    = FT.liveFiles[path]?.newlyAdded;
    const ext      = file.split('.').pop() || '';
    const icon     = ftFileIcon(ext);

    html += `<div class="ft-file ${indent}${isActive ? ' active' : ''}${isNew ? ' ft-new' : ''}"
      onclick="selectFTFile('${path.replace(/'/g, "\\'")}')">
      <span class="ft-file-icon">${icon}</span>
      <span class="ft-file-name">${esc(file)}</span>
      ${isNew ? '<span class="ft-new-badge">new</span>' : ''}
    </div>`;
  }
  list.innerHTML = html;
  updateOpenTabBtn();
}
function renderFileTreeViewer() {
  const viewer = document.getElementById('ft-viewer');
  if (!viewer) return;

  const path = FT.selectedFile;
  if (!path || !FT.liveFiles[path]) {
    viewer.innerHTML = `<div class="ft-viewer-empty">select a file to view its contents</div>`;
    return;
  }

  const content = FT.liveFiles[path].content;
  const ext     = path.split('.').pop() || '';
  const langMap = {
    js: 'javascript', jsx: 'javascript', ts: 'javascript',
    json: 'json', css: 'css', html: 'htmlmixed',
    env: 'properties', gitignore: 'shell', yml: 'yaml', yaml: 'yaml',
  };
  const lang = langMap[ext] || 'javascript';

  // Destroy any previous viewer instance
  const prev = viewer._cmInstance;
  if (prev) { prev.toTextArea(); }
  viewer.innerHTML = '';

  const ta = document.createElement('textarea');
  viewer.appendChild(ta);
  const cm = CodeMirror.fromTextArea(ta, {
    value:       content,
    mode:        lang === 'json' ? { name: 'javascript', json: true } : lang,
    theme:       'default',
    lineNumbers: true,
    readOnly:    true,
    lineWrapping: false,
    viewportMargin: Infinity,
  });
  cm.setValue(content);
  viewer._cmInstance = cm;
  setTimeout(() => cm.refresh(), 60);
}

function selectFTFile(path) {
  FT.selectedFile = path;
  renderFileTree();
  renderFileTreeViewer();
  updateOpenTabBtn();
}

function openFileInNewTab(path) {
  const entry = FT.liveFiles[path];
  if (!entry) return;

  const ext    = path.split('.').pop() || '';
  const langMap = {
    js: 'javascript', jsx: 'javascript', ts: 'javascript',
    json: 'javascript', css: 'css', html: 'htmlmixed',
    env: 'properties', gitignore: 'shell', yml: 'yaml', yaml: 'yaml',
  };
  const cmMode  = langMap[ext] || 'javascript';
  const modeUrl = {
    javascript: 'mode/javascript/javascript.min.js',
    css:        'mode/css/css.min.js',
    htmlmixed:  'mode/htmlmixed/htmlmixed.min.js',
    properties: 'mode/properties/properties.min.js',
    shell:      'mode/shell/shell.min.js',
  }[cmMode] || 'mode/javascript/javascript.min.js';
  const cdnBase = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.17/';

  const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>${path}</title>
    <link rel="stylesheet" href="${cdnBase}codemirror.min.css">
    <script src="${cdnBase}codemirror.min.js"><\/script>
    <script src="${cdnBase}${modeUrl}"><\/script>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:#0d1117;color:#cdd9e5;font-family:'JetBrains Mono',monospace}
      #topbar{height:38px;background:#161b22;border-bottom:1px solid #21262d;display:flex;align-items:center;padding:0 16px;gap:10px;font-size:12px;color:#8b949e}
      #topbar strong{color:#58a6ff}
      .CodeMirror{height:calc(100vh - 38px);font-family:'JetBrains Mono',monospace;font-size:13px;background:#0d1117;color:#cdd9e5}
      .CodeMirror-gutters{background:#0a0e13;border-right:1px solid #21262d}
      .CodeMirror-linenumber{color:#484f58}
    </style>
  </head><body>
    <div id="topbar"><strong>${path}</strong><span style="margin-left:auto;opacity:.5">read-only · taskapp</span></div>
    <textarea id="code-ta"></textarea>
    <script>
      const cm = CodeMirror.fromTextArea(document.getElementById('code-ta'), {
        mode: ${JSON.stringify(cmMode === 'json' ? { name: 'javascript', json: true } : cmMode)},
        lineNumbers: true,
        readOnly: true,
        theme: 'default',
      });
      cm.setValue(${JSON.stringify(entry.content)});
    <\/script>
  </body></html>`;

  // Use Blob URL instead of deprecated document.write
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  // Revoke after a short delay to allow the new tab to load
  if (win) setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function ftFileIcon(ext) {
  const icons = {
    js: '<svg viewBox="0 0 16 16" width="13" height="13"><rect width="16" height="16" rx="2" fill="#f7df1e"/><text x="3" y="13" font-size="10" font-weight="bold" fill="#000">JS</text></svg>',
    jsx: '<svg viewBox="0 0 16 16" width="13" height="13"><rect width="16" height="16" rx="2" fill="#61dafb"/><text x="2.5" y="13" font-size="9" font-weight="bold" fill="#000">JSX</text></svg>',
    json: '<svg viewBox="0 0 16 16" width="13" height="13"><rect width="16" height="16" rx="2" fill="#f7df1e"/><text x="1" y="13" font-size="8" font-weight="bold" fill="#000">JSON</text></svg>',
    css: '<svg viewBox="0 0 16 16" width="13" height="13"><rect width="16" height="16" rx="2" fill="#264de4"/><text x="2" y="13" font-size="9" font-weight="bold" fill="#fff">CSS</text></svg>',
    html: '<svg viewBox="0 0 16 16" width="13" height="13"><rect width="16" height="16" rx="2" fill="#e34f26"/><text x="1" y="13" font-size="8" font-weight="bold" fill="#fff">HTML</text></svg>',
    env: '<svg viewBox="0 0 16 16" width="13" height="13"><rect width="16" height="16" rx="2" fill="#3fb950"/><text x="2" y="13" font-size="9" font-weight="bold" fill="#fff">ENV</text></svg>',
    yml: '<svg viewBox="0 0 16 16" width="13" height="13"><rect width="16" height="16" rx="2" fill="#bc8cff"/><text x="1.5" y="13" font-size="8" font-weight="bold" fill="#fff">YML</text></svg>',
    yaml: '<svg viewBox="0 0 16 16" width="13" height="13"><rect width="16" height="16" rx="2" fill="#bc8cff"/><text x="1.5" y="13" font-size="8" font-weight="bold" fill="#fff">YML</text></svg>',
  };
  return icons[ext] || '<svg viewBox="0 0 16 16" width="13" height="13"><path fill="var(--text3)" d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.5L9.5 2H4Z"/></svg>';
}

function toggleFileTree() {
  FT.ftOpen = !FT.ftOpen;
  document.getElementById('ft-panel').classList.toggle('open', FT.ftOpen);
  document.getElementById('main').classList.toggle('ft-open', FT.ftOpen);
  document.getElementById('ft-toggle-btn').classList.toggle('active', FT.ftOpen);
  if (FT.ftOpen) {
    renderFileTreeViewer();
    updateOpenTabBtn();
  }
}

function updateOpenTabBtn() {
  const btn = document.getElementById('ft-open-tab-btn');
  if (!btn) return;
  btn.disabled = !FT.selectedFile || !FT.liveFiles[FT.selectedFile];
}

// ─── CONFIDENCE METER ENGINE ─────────────────────────────────────────────────

// Scores per step outcome — used by recalcConfidence
// skip is 0.2 not 0.0 — skipping is an honest choice, not total failure
const CONF_SCORE = { clean: 1.0, hint: 0.65, skip: 0.2 };

/**
 * Recalculates confidence for a module as the average score of all completed
 * steps in that module. Each step scores 1.0 (clean), 0.6 (hint used), or
 * 0.0 (skipped).
 *
 * pendingScore: pass a score for the current in-flight step when it hasn't
 * been written to S.answers yet (e.g. hint opened mid-step).
 */
function recalcConfidence(mod, pendingScore = null) {
  if (mod === undefined) return;

  const modStepIndices = STEPS.reduce((acc, s, i) => {
    if (s.mod === mod) acc.push(i);
    return acc;
  }, []);

  const scores = [];

  for (const i of modStepIndices) {
    if (i === S.idx && pendingScore !== null) {
      // Current step not yet in S.answers — use the passed-in score
      scores.push(pendingScore);
    } else if (S.answers[i]) {
      const ans = S.answers[i];
      if (ans.type === 'skipped') {
        scores.push(CONF_SCORE.skip);
      } else if (ans.hintUsed) {
        scores.push(CONF_SCORE.hint);
      } else {
        scores.push(CONF_SCORE.clean); // covers 'code', 'cmd', 'quiz', 'info'
      }
    }
    // Steps with no answer yet (not reached) are excluded from the average
  }

  if (scores.length === 0) {
    CONF[mod] = 100;
  } else {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    CONF[mod] = Math.round(avg * 100);
  }

  renderConfidence(mod);
}

function drainConfidence(type) {
  const mod = STEPS[S.idx]?.mod;
  if (mod === undefined) return;
  const pendingScore = type === 'skip' ? CONF_SCORE.skip : CONF_SCORE.hint;
  recalcConfidence(mod, pendingScore);
}

function renderConfidence(mod) {
  const pct   = CONF[mod] ?? 100;
  const label = MODULES[mod]?.label ?? '';
  const color = pct >= 80 ? 'var(--green)' : pct >= 45 ? 'var(--yellow)' : 'var(--red)';
  const text  = pct >= 80 ? 'solid' : pct >= 45 ? 'shaky' : 'struggling';

  // Topbar confidence ring
  const confRing = document.getElementById('tb-conf-ring');
  if (confRing) {
    const r          = 14;
    const circ       = 2 * Math.PI * r;
    const dashOffset = circ - (pct / 100) * circ;
    confRing.style.strokeDashoffset = dashOffset;
    confRing.style.stroke           = color;
  }
  const confPct = document.getElementById('tb-conf-pct');
  if (confPct) {
    confPct.textContent = pct + '%';
    confPct.style.color = color;
  }

  const confPill = document.getElementById('tb-conf-pill');
  if (confPill) confPill.title = `confidence · ${label} · ${text}`;
}

// ─── SCROLL TO BOTTOM ────────────────────────────────────────────────────────
function scrollToBottom() {
  const c = chat();
  c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' });
}

function initScrollBtn() {
  const c   = chat();
  const btn = document.getElementById('scroll-btn');
  if (!c || !btn) return;
  c.addEventListener('scroll', () => {
    const atBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 60;
    btn.classList.toggle('vis', !atBottom);
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Restore theme before anything renders to avoid flash
  try {
    const saved = localStorage.getItem('mm_theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
      const icon = document.getElementById('theme-icon');
      if (icon && saved === 'light') {
        icon.innerHTML = '<path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7 7 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678z"/>';
      }
    }
  } catch (e) {}

  initLevels();   // must run first — derives XP thresholds from STEPS.length
  _prevLevel = currentLevel(S.xp).title; // seed before any renderXP call
  renderMods();
  renderSaved();
  renderFileTree();
  initScrollBtn();

  const { name, progress } = loadSaved();

  const hasProgress = progress &&
    (progress.idx > 0 || (progress.answers && Object.keys(progress.answers).length > 0));

  if (!name) {
    renderXP();
    showNamePrompt();
  } else if (hasProgress) {
    S.name = name;
    S.xp   = progress.xp || 0;
    renderXP();
    showResumeBar(name, progress);
  } else {
    S.name = name;
    renderXP();
    startModule(0);
  }
});
