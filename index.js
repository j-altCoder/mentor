<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>The Coderoom — Vol. 2</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&family=Newsreader:ital,wght@0,400;1,400&display=swap" rel="stylesheet"/>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #080a0f;
  --surface:  #0e1118;
  --card:     #141720;
  --border:   #1e2230;
  --text:     #dfe2ec;
  --muted:    #5a607a;
  --raj:      #f5a623;
  --you:      #61dca3;
  --cat1:     #61dca3;
  --cat2:     #f5a623;
  --cat3:     #e879f9;
  --cat4:     #38bdf8;
  --cat5:     #fb7185;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Newsreader', serif;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Animated background grid */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
}

/* ── HEADER ── */
header {
  position: relative;
  z-index: 1;
  padding: 4rem 2rem 3rem;
  text-align: center;
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}

header::after {
  content: '';
  position: absolute;
  bottom: -60px; left: 50%;
  transform: translateX(-50%);
  width: 600px; height: 120px;
  background: radial-gradient(ellipse, rgba(251,113,133,0.15) 0%, transparent 70%);
  pointer-events: none;
}

.vol-tag {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cat5);
  border: 1px solid rgba(251,113,133,0.3);
  padding: 0.3rem 0.8rem;
  border-radius: 2rem;
  margin-bottom: 1.2rem;
}

header h1 {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-weight: 800;
  font-size: clamp(2.2rem, 6vw, 4rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--text);
}

header h1 span {
  background: linear-gradient(135deg, #fb7185 0%, #f5a623 50%, #e879f9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

header p {
  color: var(--muted);
  font-style: italic;
  margin-top: 0.9rem;
  font-size: 1.05rem;
}

.chars {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  margin-top: 1.6rem;
  flex-wrap: wrap;
}

.char {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--muted);
  padding: 0.35rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 2rem;
  background: var(--card);
}

.char .pip {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── LAYOUT ── */
.app {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: calc(100vh - 180px);
}

/* ── SIDEBAR ── */
.sidebar {
  border-right: 1px solid var(--border);
  padding: 2rem 0;
  position: sticky;
  top: 0;
  height: calc(100vh - 180px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
  background: var(--surface);
}

.sidebar-section {
  margin-bottom: 0.4rem;
}

.cat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.2rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 0.8rem;
}

.cat-header .cat-icon {
  font-size: 0.8rem;
}

.lesson-btn {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.6rem 1.2rem 0.6rem 2rem;
  font-family: 'Newsreader', serif;
  font-size: 0.88rem;
  color: var(--muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.35;
  position: relative;
}

.lesson-btn::before {
  content: '';
  position: absolute;
  left: 1.1rem;
  top: 50%; transform: translateY(-50%);
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--border);
  transition: background 0.15s;
}

.lesson-btn:hover {
  color: var(--text);
  background: rgba(255,255,255,0.03);
}

.lesson-btn.active {
  color: var(--text);
  background: rgba(255,255,255,0.05);
}

.lesson-btn.active::before {
  background: var(--active-color, var(--cat5));
  box-shadow: 0 0 6px var(--active-color, var(--cat5));
}

/* ── MAIN CONTENT ── */
.content {
  padding: 3rem 3rem 6rem;
  max-width: 800px;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  color: var(--muted);
  text-align: center;
}

.empty-state .big-icon {
  font-size: 3rem;
  opacity: 0.4;
}

.empty-state p {
  font-style: italic;
  font-size: 1rem;
}

/* ── LESSON ── */
.lesson { animation: fadeUp 0.35s ease; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

.lesson-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.7rem;
}

.lesson-cat-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 0.25rem 0.65rem;
  border-radius: 0.3rem;
  border: 1px solid;
}

.lesson-sub-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--muted);
  letter-spacing: 0.08em;
}

.lesson-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-weight: 800;
  font-size: clamp(1.6rem, 3.5vw, 2.3rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.lesson-intro {
  color: var(--muted);
  font-style: italic;
  font-size: 0.97rem;
  line-height: 1.7;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

/* ── SCENE CARDS ── */
.scene {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem 1.6rem;
  margin-bottom: 1.2rem;
  position: relative;
  overflow: hidden;
}

.scene-accent {
  position: absolute;
  top: 0; left: 0;
  width: 3px; height: 100%;
  border-radius: 0.75rem 0 0 0.75rem;
}

.speaker-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.speaker-label::before {
  content: '';
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.dialogue {
  font-size: 1rem;
  line-height: 1.85;
  color: var(--text);
}

.dialogue em   { color: var(--raj); font-style: normal; font-weight: 600; }
.dialogue strong { color: var(--you); }

/* ── ANALOGY ── */
.analogy-card {
  background: linear-gradient(135deg, rgba(245,166,35,0.06) 0%, rgba(232,121,249,0.06) 100%);
  border: 1px solid rgba(245,166,35,0.18);
  border-radius: 0.75rem;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1.2rem;
}

.analogy-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--raj);
  margin-bottom: 0.5rem;
}

.analogy-text {
  color: #b8b4ab;
  font-size: 0.97rem;
  line-height: 1.75;
}

/* ── CODE ── */
.code-card {
  background: #06080d;
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  margin-bottom: 1.2rem;
  overflow: hidden;
}

.code-topbar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--border);
  background: #090b10;
}

.code-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
}

.code-body {
  padding: 1.2rem 1.4rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.8;
  color: #9ca3af;
  white-space: pre;
  overflow-x: auto;
}

/* Syntax colors */
.k  { color: #c792ea; }  /* keyword */
.f  { color: #82aaff; }  /* function */
.s  { color: #c3e88d; }  /* string */
.n  { color: #f78c6c; }  /* number */
.c  { color: #3d4560; font-style: italic; } /* comment */
.t  { color: #f07178; }  /* tag/type */
.a  { color: #ffcb6b; }  /* attr */

/* ── SUMMARY ── */
.summary-card {
  background: var(--surface);
  border: 1px solid rgba(97,220,163,0.25);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1rem;
}

.summary-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--you);
  margin-bottom: 1rem;
}

.summary-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.summary-list li {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--text);
  padding-left: 1.3rem;
  position: relative;
  line-height: 1.55;
}

.summary-list li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--you);
}

/* ── BOTTOM NAV ── */
.lesson-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
  gap: 1rem;
}

.nav-btn-arrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  padding: 0.65rem 1.3rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn-arrow:hover:not(:disabled) {
  border-color: var(--raj);
  color: var(--raj);
}

.nav-btn-arrow:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.nav-btn-arrow.next-btn {
  background: var(--raj);
  color: #000;
  border-color: var(--raj);
  font-weight: 500;
}

.nav-btn-arrow.next-btn:hover:not(:disabled) {
  opacity: 0.85;
  color: #000;
}

/* ── PROGRESS ── */
.progress-wrap {
  padding: 0.8rem 1.2rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-track {
  flex: 1;
  height: 2px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cat5), var(--cat2));
  border-radius: 2px;
  transition: width 0.4s ease;
}

.progress-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--muted);
  white-space: nowrap;
}

/* ── MOBILE ── */
.mobile-nav-toggle {
  display: none;
}

@media (max-width: 768px) {
  .app {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    top: 0; left: 0;
    width: 80vw; max-width: 300px;
    height: 100vh;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    border-right: 1px solid var(--border);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .mobile-nav-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 200;
    background: var(--raj);
    color: #000;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.65rem 1.1rem;
    border-radius: 2rem;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(245,166,35,0.35);
  }

  .overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 99;
  }

  .overlay.show { display: block; }

  .content {
    padding: 2rem 1.2rem 5rem;
  }
}
</style>
</head>
<body>

<header>
  <div class="vol-tag">The Coderoom · Vol. 2</div>
  <h1>Senior Dev <span>Mentorship</span></h1>
  <p>Raj explains the hard stuff. You ask the real questions.</p>
  <div class="chars">
    <div class="char"><span class="pip" style="background:#f5a623"></span> Raj — Senior Dev, 10 yrs</div>
    <div class="char"><span class="pip" style="background:#61dca3"></span> You — Mid Dev, back from break</div>
  </div>
</header>

<div class="progress-wrap">
  <div class="progress-track"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
  <span class="progress-label" id="progressLabel">0 / 0</span>
</div>

<div class="app">
  <aside class="sidebar" id="sidebar">
    <div id="sidebarContent"></div>
  </aside>

  <main class="content" id="mainContent">
    <div class="empty-state" id="emptyState">
      <div class="big-icon">📖</div>
      <p>Select a lesson from the sidebar to begin.</p>
    </div>
    <div id="lessonView" style="display:none"></div>
  </main>
</div>

<div class="overlay" id="overlay" onclick="closeSidebar()"></div>
<button class="mobile-nav-toggle" onclick="toggleSidebar()">☰ Lessons</button>

<script src="lesson-auth.js"></script>
<script src="lesson-tooling.js"></script>
<script src="lesson-packages.js"></script>
<script src="lesson-backend-libs.js"></script>
<script src="lesson-scaling.js"></script>
<script src="lesson-performance.js"></script>
<script src="lesson-mongodb.js"></script>
<script src="lesson-security.js"></script>
<script src="lesson-devops.js"></script>
<script src="lesson-observability.js"></script>
<script src="lesson-distributed.js"></script>
<script src="lesson-code-quality.js"></script>
<script src="lesson-debugging.js"></script>
<script>
const LESSONS = [LESSON_AUTH, LESSON_TOOLING, LESSON_PACKAGES, LESSON_BACKEND_LIBS, LESSON_SCALING, LESSON_PERFORMANCE, LESSON_MONGODB, LESSON_SECURITY, LESSON_DEVOPS, LESSON_OBSERVABILITY, LESSON_DISTRIBUTED, LESSON_CODE_QUALITY, LESSON_DEBUGGING];
const CATEGORIES = [
  "Language & Framework Fundamentals",
  "Architecture & System Design",
  "Scalability & Performance",
  "Code Quality & Debugging",
  "Security & Production Operations"
];
const CATEGORY_META = {
  "Language & Framework Fundamentals": { icon: "⚙️",  color: "#61dca3" },
  "Architecture & System Design":      { icon: "🏗️", color: "#f5a623" },
  "Scalability & Performance":         { icon: "⚡",  color: "#e879f9" },
  "Code Quality & Debugging":          { icon: "🔍",  color: "#38bdf8" },
  "Security & Production Operations":  { icon: "🔒",  color: "#fb7185" }
};</script>
<script>
// ── State ──
let currentIdx = null;
let flatLessons = []; // ordered list for prev/next

// ── Build sidebar ──
function buildSidebar() {
  const container = document.getElementById('sidebarContent');
  const grouped = {};

  LESSONS.forEach((lesson, idx) => {
    if (!grouped[lesson.category]) grouped[lesson.category] = [];
    grouped[lesson.category].push({ ...lesson, idx });
    flatLessons.push(idx);
  });

  let html = '';
  CATEGORIES.forEach(cat => {
    if (!grouped[cat]) return;
    const meta = CATEGORY_META[cat];
    html += `<div class="sidebar-section">
      <div class="cat-header">
        <span class="cat-icon">${meta.icon}</span>
        <span>${cat}</span>
      </div>`;
    grouped[cat].forEach(({ tag, idx }) => {
      html += `<button
        class="lesson-btn"
        id="sidebarBtn-${idx}"
        style="--active-color:${meta.color}"
        onclick="selectLesson(${idx})"
      >${tag}</button>`;
    });
    html += `</div>`;
  });

  container.innerHTML = html;
  updateProgress();
}

// ── Render lesson ──
function selectLesson(idx) {
  currentIdx = idx;
  const lesson = LESSONS[idx];

  // Update sidebar active states
  document.querySelectorAll('.lesson-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(`sidebarBtn-${idx}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Hide empty state
  document.getElementById('emptyState').style.display = 'none';
  const view = document.getElementById('lessonView');
  view.style.display = 'block';

  const catMeta = CATEGORY_META[lesson.category];

  // Build scenes HTML
  const scenesHTML = lesson.scenes.map(s => renderScene(s, catMeta)).join('');

  // Build nav buttons
  const flatPos = flatLessons.indexOf(idx);
  const hasPrev = flatPos > 0;
  const hasNext = flatPos < flatLessons.length - 1;
  const prevIdx = hasPrev ? flatLessons[flatPos - 1] : null;
  const nextIdx = hasNext ? flatLessons[flatPos + 1] : null;

  view.innerHTML = `
    <div class="lesson">
      <div class="lesson-eyebrow">
        <span class="lesson-cat-tag" style="color:${catMeta.color};border-color:${catMeta.color}33;background:${catMeta.color}11">
          ${catMeta.icon} ${lesson.category}
        </span>
        <span class="lesson-sub-tag">/ ${lesson.tag}</span>
      </div>
      <h2 class="lesson-title">${lesson.title}</h2>
      <p class="lesson-intro">${lesson.intro}</p>
      ${scenesHTML}
      <div class="lesson-nav">
        <button class="nav-btn-arrow" onclick="selectLesson(${prevIdx})" ${!hasPrev ? 'disabled' : ''}>← Prev</button>
        <button class="nav-btn-arrow next-btn" onclick="selectLesson(${nextIdx})" ${!hasNext ? 'disabled' : ''}>${hasNext ? 'Next →' : '✓ Done'}</button>
      </div>
    </div>`;

  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeSidebar();
}

function renderScene(s, catMeta) {
  if (s.type === 'analogy') {
    return `<div class="analogy-card">
      <div class="analogy-label">🎯 The Analogy</div>
      <div class="analogy-text">${s.text}</div>
    </div>`;
  }

  if (s.type === 'code') {
    return `<div class="code-card">
      <div class="code-topbar">
        <div class="code-dot" style="background:#ff5f57"></div>
        <div class="code-dot" style="background:#febc2e"></div>
        <div class="code-dot" style="background:#28c840"></div>
      </div>
      <div class="code-body">${s.text}</div>
    </div>`;
  }

  if (s.type === 'summary') {
    return `<div class="summary-card">
      <div class="summary-title">📌 Quick Recap</div>
      <ul class="summary-list">${s.points.map(p => `<li>${p}</li>`).join('')}</ul>
    </div>`;
  }

  const isRaj = s.speaker === 'raj';
  const color = isRaj ? 'var(--raj)' : 'var(--you)';
  const label = isRaj ? '👨‍💻 Raj' : '🧑‍💻 You';
  return `<div class="scene">
    <div class="scene-accent" style="background:${color}"></div>
    <div class="speaker-label" style="color:${color}">${label}</div>
    <div class="dialogue">${s.text}</div>
  </div>`;
}

// ── Progress ──
function updateProgress() {
  const total = LESSONS.length;
  const fill = currentIdx !== null
    ? ((flatLessons.indexOf(currentIdx) + 1) / total) * 100
    : 0;
  const viewed = currentIdx !== null ? flatLessons.indexOf(currentIdx) + 1 : 0;
  document.getElementById('progressFill').style.width = fill + '%';
  document.getElementById('progressLabel').textContent = `${viewed} / ${total}`;
}

// ── Mobile sidebar ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ── Init ──
buildSidebar();
// Auto-open first lesson
if (LESSONS.length > 0) selectLesson(0);
</script>
</body>
</html>
