
// Brickhouse App (UI preserved) — data loaded from /data/workouts.json and /data/quotes.json
const $ = (sel) => document.querySelector(sel);

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[s]));
}

let WORKOUTS = [];
let QUOTES = [];

// --- Quotes ---
function pickQuote() {
  if (!QUOTES.length) return { q: "Loading quote…", a: "" };
  const idx = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[idx];
}
function setQuote() {
  const { q, a } = pickQuote();
  $("#quoteText").textContent = "“" + q + "”";
  $("#quoteSrc").textContent = a ? ("— " + a) : "";
}

// --- Chip ---
function setChip(text) {
  $("#chipText").textContent = text;
}

// --- Timer (only in Day View) ---
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

function renderTimer() {
  const m = String(Math.floor(timerSeconds / 60)).padStart(2,"0");
  const s = String(timerSeconds % 60).padStart(2,"0");
  $("#timerText").textContent = `⏱ ${m}:${s}`;
}
function updateTimerBtn() {
  $("#timerToggleBtn").textContent = timerRunning ? "Pause" : "Resume";
}
function startTimer() {
  clearInterval(timerInterval);
  timerSeconds = 0;
  timerRunning = true;
  renderTimer();
  updateTimerBtn();
  timerInterval = setInterval(() => {
    if (!timerRunning) return;
    timerSeconds++;
    renderTimer();
  }, 1000);
}
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 0;
  timerRunning = false;
  renderTimer();
  updateTimerBtn();
}
function toggleTimer() {
  timerRunning = !timerRunning;
  updateTimerBtn();
}

// --- Render week buttons ---
function renderWeek() {
  const grid = $("#weekGrid");
  grid.innerHTML = "";
  WORKOUTS.forEach(w => {
    const btn = document.createElement("button");
    btn.className = "dayBtn";
    btn.type = "button";
    btn.setAttribute("data-key", w.key);
    btn.innerHTML = `
      <div class="left">
        <div class="dow">${escapeHtml(w.day)}</div>
        <div class="focus">${escapeHtml(w.focus)}</div>
      </div>
      <div class="pill">Open</div>
    `;
    btn.addEventListener("click", () => openDay(w.key));
    grid.appendChild(btn);
  });
}

// --- Open a day ---
function openDay(key) {
  const w = WORKOUTS.find(x => x.key === key);
  if (!w) return;

  setQuote();
  $("#dayName").textContent = w.day;
  $("#dayFocus").textContent = w.focus;

  const cards = $("#dayCards");
  cards.innerHTML = "";

  (w.cards || []).forEach((c) => {
    const card = document.createElement("section");
    card.className = "card" + (c.span2 ? " span2" : "");

    const items = (c.items || []).map(it => `
      <li class="ex">
        <p class="name">${escapeHtml(it.name)}</p>
        <p class="meta">${escapeHtml(it.meta || "")}</p>
      </li>
    `).join("");

    card.innerHTML = `
      <div class="hd">
        <h3>${escapeHtml(c.title)}</h3>
        <div class="badge">${escapeHtml(c.badge || "")}</div>
      </div>
      <div class="bd">
        <ul class="list">${items}</ul>
        ${c.hint ? `<div class="hint">${escapeHtml(c.hint)}</div>` : ``}
      </div>
    `;
    cards.appendChild(card);
  });

  $("#view-week").classList.remove("active");
  $("#view-day").classList.add("active");
  setChip(w.day + " loaded");

  // start timer on entry (timer is ONLY in day view)
  startTimer();

  history.pushState({ key }, "", "#"+key);
  window.scrollTo({ top: 0, behavior: "instant" });
}

// --- Back to week ---
function backToWeek(pushHistory = true) {
  stopTimer();
  setQuote();
  $("#view-day").classList.remove("active");
  $("#view-week").classList.add("active");
  setChip("Pick a day");
  if (pushHistory) history.pushState({}, "", "#week");
  window.scrollTo({ top: 0, behavior: "instant" });
}

async function init() {
  try{
    const [wRes, qRes] = await Promise.all([
      fetch("data/workouts.json", { cache: "no-store" }),
      fetch("data/quotes.json", { cache: "no-store" }),
    ]);
    if (!wRes.ok) throw new Error("Failed to load workouts.json");
    if (!qRes.ok) throw new Error("Failed to load quotes.json");
    WORKOUTS = await wRes.json();
    QUOTES = await qRes.json();

    renderWeek();
    setQuote();
    setChip("Pick a day");
    renderTimer(); // show 00:00 on load

    // Events
    $("#backBtn").addEventListener("click", () => backToWeek(true));
    $("#timerToggleBtn").addEventListener("click", toggleTimer);

    window.addEventListener("popstate", () => {
      const hash = (location.hash || "").replace("#","");
      if (!hash || hash === "week") return backToWeek(false);
      openDay(hash);
    });

    // Deep link support
    const initial = (location.hash || "").replace("#","");
    if (initial && initial !== "week") openDay(initial);

  }catch(err){
    console.error(err);
    setChip("Load error");
    $("#quoteText").textContent = "“Could not load data files. Make sure /data/workouts.json exists.”";
    $("#quoteSrc").textContent = "";
  }
}

init();
