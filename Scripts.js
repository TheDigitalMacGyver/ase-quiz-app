// ---------- 1. Load questions ----------
let QUESTIONS = [];
fetch('questions.json')
  .then(r => r.json())
  .then(data => { QUESTIONS = data; buildCategoryList(); })
  .catch(() => alert('Could not load questions.json'));

// ---------- 2. UI elements ----------
const menu = document.getElementById('menu');
const catSelectSec = document.getElementById('categorySelect');
const quizSec = document.getElementById('quiz');
const resultSec = document.getElementById('result');
const statsSec = document.getElementById('stats');

document.getElementById('mixed').onclick = () => startQuiz(null, 5);
document.getElementById('categoryBtn').onclick = () => { catSelectSec.classList.remove('hidden'); menu.classList.add('hidden'); };
document.getElementById('backMenu').onclick = () => { catSelectSec.classList.add('hidden'); menu.classList.remove('hidden'); };
document.getElementById('progressBtn').onclick = showStats;
document.getElementById('startCat').onclick = () => {
  const cat = document.getElementById('catSelect').value;
  const num = parseInt(document.getElementById('numQ').value) || 5;
  startQuiz(cat, num);
};
document.getElementById('retry').onclick = () => startQuiz(currentCat, currentNum);
document.getElementById('menuBtn').onclick = document.getElementById('menuBtn2').onclick = () => {
  resultSec.classList.add('hidden'); statsSec.classList.add('hidden'); menu.classList.remove('hidden');
};
document.getElementById('clearStats').onclick = () => {
  if (confirm('Delete all saved progress?')) {
    localStorage.removeItem('aseStats');
    showStats();
  }
};

// ---------- 3. Category list ----------
function buildCategoryList() {
  const cats = [...new Set(QUESTIONS.map(q => q.category))].sort();
  const sel = document.getElementById('catSelect');
  sel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

// ---------- 4. Quiz engine ----------
let currentCat = null, currentNum = 0;
let quizQuestions = [], idx = 0, correct = 0;

function startQuiz(category, num) {
  currentCat = category; currentNum = num;
  const pool = category ? QUESTIONS.filter(q => q.category === category) : QUESTIONS;
  if (pool.length < num) num = pool.length;
  quizQuestions = shuffle(pool).slice(0, num);
  idx = 0; correct = 0;
  hideAll(); quizSec.classList.remove('hidden');
  showQuestion();
}

function showQuestion() {
  if (idx >= quizQuestions.length) { endQuiz(); return; }
  const q = quizQuestions[idx];
  document.getElementById('qNum').textContent = `Question ${idx + 1} of ${quizQuestions.length}`;
  document.getElementById('question').textContent = q.question;
  const optsDiv = document.getElementById('options');
  optsDiv.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
    btn.onclick = () => selectAnswer(i, q.correct, btn);
    optsDiv.appendChild(btn);
  });
  document.getElementById('feedback').classList.add('hidden');
  document.getElementById('nextBtn').classList.add('hidden');
  // progress bar
  document.getElementById('fill').style.width = `${(idx / quizQuestions.length) * 100}%`;
}

function selectAnswer(chosen, correct, btn) {
  const feedback = document.getElementById('feedback');
  const allBtns = document.querySelectorAll('#options button');
  allBtns.forEach(b => b.disabled = true);
  if (chosen === correct) {
    btn.classList.add('correct');
    correct++;
  } else {
    btn.classList.add('incorrect');
    allBtns[correct].classList.add('correct');
  }
  feedback.textContent = QUESTIONS.find(q => q.question === quizQuestions[idx].question).explanation;
  feedback.classList.remove('hidden');
  document.getElementById('nextBtn').classList.remove('hidden');
  document.getElementById('nextBtn').onclick = () => { idx++; showQuestion(); };
  saveAnswer(currentCat || 'Mixed', chosen === correct);
}

function endQuiz() {
  hideAll(); resultSec.classList.remove('hidden');
  const pct = (correct / quizQuestions.length * 100).toFixed(1);
  document.getElementById('score').innerHTML = `
    You got <strong>${correct}/${quizQuestions.length}</strong> correct (<strong>${pct}%</strong>).
  `;
  saveQuizResult(currentCat || 'Mixed', correct, quizQuestions.length);
}

// ---------- 5. Persistence (localStorage) ----------
function getStats() {
  return JSON.parse(localStorage.getItem('aseStats') || '{}');
}
function saveStats(stats) {
  localStorage.setItem('aseStats', JSON.stringify(stats));
}
function saveAnswer(cat, right) {
  const s = getStats();
  if (!s[cat]) s[cat] = {answered:0, correct:0};
  s[cat].answered++;
  if (right) s[cat].correct++;
  saveStats(s);
}
function saveQuizResult(cat, corr, total) {
  const s = getStats();
  if (!s[cat]) s[cat] = {answered:0, correct:0};
  s[cat].answered += total;
  s[cat].correct += corr;
  saveStats(s);
}
function showStats() {
  hideAll(); statsSec.classList.remove('hidden');
  const s = getStats();
  const list = document.getElementById('statsList');
  list.innerHTML = '';
  for (const [cat, d] of Object.entries(s)) {
    const pct = d.answered ? (d.correct / d.answered * 100).toFixed(1) : 0;
    const div = document.createElement('div');
    div.innerHTML = `<strong>${cat}</strong>: ${d.correct}/${d.answered} (${pct}%)`;
    list.appendChild(div);
  }
  if (!Object.keys(s).length) list.innerHTML = '<em>No stats yet.</em>';
}

// ---------- 6. Helpers ----------
function hideAll() {
  [menu, catSelectSec, quizSec, resultSec, statsSec].forEach(el => el.classList.add('hidden'));
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
