const state = {
  activeId:     1,
  activeTab:    'solution',
  activeFilter: 'all',
  activeStatus: 'all',   // 'all' | 'solved' | 'unsolved'
  done:         new Set(),
};

// ── PERSIST ───────────────────────────────────────────────────────────────────

function saveState() {
  localStorage.setItem('mern-prep', JSON.stringify({
    activeId:     state.activeId,
    done:         [...state.done],
    activeTab:    state.activeTab,
    activeStatus: state.activeStatus,
  }));
}

function loadState() {
  try {
    const raw = localStorage.getItem('mern-prep');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.activeId)     state.activeId     = s.activeId;
    if (s.done)         state.done         = new Set(s.done);
    if (s.activeTab)    state.activeTab    = s.activeTab;
    if (s.activeStatus) state.activeStatus = s.activeStatus;
  } catch (_) {}
}

// ── THEME ─────────────────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('mern-theme') || 'dark';
  applyTheme(saved, false);
}

function applyTheme(theme, save = true) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-icon').textContent = theme === 'dark' ? '☀' : '☾';
  if (save) localStorage.setItem('mern-theme', theme);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

// ── PROGRESS ──────────────────────────────────────────────────────────────────

function updateProgress() {
  const n = state.done.size;
  document.getElementById('progress-text').textContent = n + ' / ' + QUESTIONS.length + ' solved';
  document.getElementById('progress-fill').style.width = (n / QUESTIONS.length * 100) + '%';
}

// ── UTILITIES ─────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlight(code) {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(=&gt;)|(`[^`]*`)|('[^'\\]*(?:\\.[^'\\]*)*')|("[^"\\]*(?:\\.[^"\\]*)*")|\b(\d+(?:\.\d+)?)\b|\b(async|await|function|const|let|var|return|if|else|for|while|of|in|new|try|catch|throw|class|extends|import|export|default|typeof|instanceof|null|undefined|true|false|this|from|module)\b|\b(Promise|Map|Set|Array|Object|Error|Date|JSON|Math|fetch|console|process|mongoose|require)\b/g,
    (m, lineC, blockC, arrow, tmpl, sq, dq, num, kw, cls) => {
      if (lineC  !== undefined) return `<span class="cm">${m}</span>`;
      if (blockC !== undefined) return `<span class="cm">${m}</span>`;
      if (arrow  !== undefined) return `<span class="op">${m}</span>`;
      if (tmpl   !== undefined) return `<span class="str">${m}</span>`;
      if (sq     !== undefined) return `<span class="str">${m}</span>`;
      if (dq     !== undefined) return `<span class="str">${m}</span>`;
      if (num    !== undefined) return `<span class="num">${m}</span>`;
      if (kw     !== undefined) return `<span class="kw">${m}</span>`;
      if (cls    !== undefined) return `<span class="cls">${m}</span>`;
      return m;
    }
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────

function getFilteredQuestions() {
  let list = state.activeFilter === 'all'
    ? QUESTIONS
    : QUESTIONS.filter(q => q.category === state.activeFilter);

  if (state.activeStatus === 'solved') {
    list = list.filter(q => state.done.has(q.id));
  } else if (state.activeStatus === 'unsolved') {
    list = list.filter(q => !state.done.has(q.id));
  }

  return list;
}

function renderSidebar() {
  const list = document.getElementById('q-list');
  const filtered = getFilteredQuestions();

  if (!filtered.length) {
    list.innerHTML = '<p class="empty-state">No questions.</p>';
    return;
  }

  list.innerHTML = filtered.map(q => {
    const isActive = q.id === state.activeId;
    const isDone   = state.done.has(q.id);
    return `<button
      class="q-item${isActive ? ' active' : ''}${isDone ? ' done' : ''}"
      onclick="selectQuestion(${q.id})"
    >
      <span class="q-num">${q.id}</span>
      <span class="q-name">${esc(q.title)}</span>
      <span class="q-done-mark">✓</span>
    </button>`;
  }).join('');
}

// ── QUESTION PANE ─────────────────────────────────────────────────────────────

function renderQuestion(id) {
  const q     = QUESTIONS.find(q => q.id === id);
  const pane  = document.getElementById('q-pane');
  const isDone = state.done.has(id);

  if (!q) { pane.innerHTML = '<p class="empty-state">Select a question.</p>'; return; }

  const badgeStyle = `background:${q.categoryColor};color:${q.categoryTextColor}`;

  const reqsHtml = q.requirements.map(r =>
    '<li>' + esc(r) + '</li>'
  ).join('');

  const hintsHtml = q.hints.map(h =>
    '<li>' + esc(h) + '</li>'
  ).join('');

  pane.innerHTML = `
    <div class="q-header">
      <div class="q-header-left">
        <div class="q-meta">
          <span class="q-id">#${q.id}</span>
          <span class="badge" style="${badgeStyle}">${q.category}</span>
        </div>
        <h2 class="q-title">${esc(q.title)}</h2>
      </div>
      <input
        type="checkbox"
        class="done-cb"
        ${isDone ? 'checked' : ''}
        onchange="toggleDone(${id})"
        title="Mark as solved"
      />
    </div>

    <div class="q-section">
      <div class="section-label">Problem</div>
      <p class="q-desc">${esc(q.description)}</p>
    </div>

    <div class="q-section">
      <div class="section-label">Requirements</div>
      <ul class="req-list">${reqsHtml}</ul>
    </div>

    <div class="q-section">
      <div class="section-label">Example</div>
      <div class="example-block">
        <pre><code>${highlight(q.example.usage)}</code></pre>
        <p class="example-note">${esc(q.example.explanation)}</p>
      </div>
    </div>

    <div class="q-section">
      <div class="section-label">Hints</div>
      <ul class="hints-list">${hintsHtml}</ul>
    </div>
  `;

  pane.scrollTop = 0;
}

// ── ANSWER PANE ───────────────────────────────────────────────────────────────

function renderAnswer(id, tab) {
  const a = ANSWERS.find(a => a.id === id);
  const content = document.getElementById('tab-content');

  if (!a) { content.innerHTML = '<p class="empty-state">No answer found.</p>'; return; }

  let html = '';

  if (tab === 'solution') {
    html = `<pre><code>${highlight(a.solution)}</code></pre>`;

  } else if (tab === 'approach') {
    html = `<p class="a-text">${esc(a.explanation)}</p>`;

  } else if (tab === 'steps') {
    const stepsHtml = a.walkthrough.map(s => '<li>' + esc(s) + '</li>').join('');
    html = `
      <div class="a-section">
        <ol class="walkthrough">${stepsHtml}</ol>
      </div>
      <div class="a-section">
        <div class="complexity-row">
          <span class="complexity-tag"><b>Time</b> ${esc(a.timeComplexity)}</span>
          <span class="complexity-tag"><b>Space</b> ${esc(a.spaceComplexity)}</span>
        </div>
      </div>`;

  } else if (tab === 'mistakes') {
    const mistakesHtml = a.commonMistakes.map(m => '<li>' + esc(m) + '</li>').join('');
    html = `<ul class="mistakes">${mistakesHtml}</ul>`;

  } else if (tab === 'followup') {
    html = `
      <p class="followup-q">${esc(a.followUp.question)}</p>
      <pre><code>${highlight(a.followUp.answer)}</code></pre>`;
  }

  content.innerHTML = html;
  content.scrollTop = 0;
}

// ── ACTIONS ───────────────────────────────────────────────────────────────────

function selectQuestion(id) {
  state.activeId = id;
  renderSidebar();
  renderQuestion(id);
  renderAnswer(id, state.activeTab);
  saveState();
}

function selectTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  renderAnswer(state.activeId, tab);
  saveState();
}

function toggleDone(id) {
  if (state.done.has(id)) state.done.delete(id);
  else state.done.add(id);

  // Under a status filter the toggled question may disappear from the list
  const filtered = getFilteredQuestions();
  if (filtered.length && !filtered.find(q => q.id === state.activeId)) {
    state.activeId = filtered[0].id;
    renderQuestion(state.activeId);
    renderAnswer(state.activeId, state.activeTab);
  } else {
    renderQuestion(id);
  }

  renderSidebar();
  updateProgress();
  saveState();
}

function setFilter(cat) {
  state.activeFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === cat);
  });

  const filtered = getFilteredQuestions();
  if (filtered.length && !filtered.find(q => q.id === state.activeId)) {
    state.activeId = filtered[0].id;
    renderQuestion(state.activeId);
    renderAnswer(state.activeId, state.activeTab);
  }

  renderSidebar();
  updateProgress();
}

function setStatusFilter(status) {
  state.activeStatus = status;
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });

  const filtered = getFilteredQuestions();
  if (filtered.length && !filtered.find(q => q.id === state.activeId)) {
    state.activeId = filtered[0].id;
    renderQuestion(state.activeId);
    renderAnswer(state.activeId, state.activeTab);
  }

  renderSidebar();
  saveState();
}

// ── RESIZE ────────────────────────────────────────────────────────────────────

function initResize() {
  const handle = document.getElementById('resize-handle');
  const apane  = document.getElementById('a-pane');

  const saved = localStorage.getItem('mern-apane-width');
  if (saved) apane.style.width = saved + 'px';

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const startX     = e.clientX;
    const startWidth = apane.offsetWidth;

    handle.classList.add('dragging');
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';

    function onMove(e) {
      const delta    = startX - e.clientX;               // left = wider, right = narrower
      const maxWidth = window.innerWidth * 0.65;
      const newWidth = Math.max(260, Math.min(maxWidth, startWidth + delta));
      apane.style.width = newWidth + 'px';
    }

    function onUp() {
      handle.classList.remove('dragging');
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
      localStorage.setItem('mern-apane-width', apane.offsetWidth);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadState();

  // restore active tab button
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
  });

  // restore active status button
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === state.activeStatus);
  });

  renderSidebar();
  renderQuestion(state.activeId);
  renderAnswer(state.activeId, state.activeTab);
  updateProgress();

  initResize();
  document.getElementById('theme-btn').addEventListener('click', toggleTheme);

  document.getElementById('tab-bar').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (btn) selectTab(btn.dataset.tab);
  });

  document.querySelector('.sidebar-filters').addEventListener('click', e => {
    const filterBtn = e.target.closest('.filter-btn');
    if (filterBtn) setFilter(filterBtn.dataset.filter);
    const statusBtn = e.target.closest('.status-btn');
    if (statusBtn) setStatusFilter(statusBtn.dataset.status);
  });
});
