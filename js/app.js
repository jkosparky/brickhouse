const $ = s => document.querySelector(s);

let WORKOUTS = [];
let QUOTES = [];
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

/* ===================== THEME ===================== */
const toggle = $("#themeToggle");
function setTheme(m){
  document.body.className = m === "dark" ? "dark" : "";
  toggle.textContent = m === "dark" ? "☀️" : "🌙";
  localStorage.setItem("theme", m);
}
toggle.onclick = () =>
  setTheme(document.body.classList.contains("dark") ? "light" : "dark");
setTheme(localStorage.getItem("theme") || "light");

/* ===================== TIMER ===================== */
function renderTimer(){
  const m = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const s = String(timerSeconds % 60).padStart(2, "0");
  $("#timerText").textContent = `⏱ ${m}:${s}`;
}
function startTimer(){
  clearInterval(timerInterval);
  timerSeconds = 0;
  timerRunning = true;
  renderTimer();
  timerInterval = setInterval(() => {
    if (timerRunning) {
      timerSeconds++;
      renderTimer();
    }
  }, 1000);
}
$("#timerToggleBtn").onclick = () => {
  timerRunning = !timerRunning;
};

/* ===================== QUOTES ===================== */
function setQuote(){
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  $("#quoteText").textContent = `“${q.q}”`;
  $("#quoteSrc").textContent = q.a ? `— ${q.a}` : "";
}

/* ===================== WEEK VIEW ===================== */
function renderWeek(){
  const grid = $("#weekGrid");
  grid.innerHTML = "";

  WORKOUTS.forEach(w => {
    const btn = document.createElement("button");
    btn.className = "dayBtn";
    btn.innerHTML = `
      <span class="pill">Open</span>
      <div class="dow">${w.day}</div>
      <div class="focus">${w.focus}</div>
    `;
    btn.onclick = () => openDay(w.key);
    grid.appendChild(btn);
  });
}

/* ===================== DAY VIEW ===================== */
function openDay(key){
  const w = WORKOUTS.find(x => x.key === key);
  if (!w) return;

  $("#view-week").classList.remove("active");
  $("#view-day").classList.add("active");
  $("#dayName").textContent = w.day;
  $("#dayFocus").textContent = w.focus;

  const container = $("#dayCards");
  container.innerHTML = "";

  w.cards.forEach(cardData => {
    const card = document.createElement("section");
    card.className = "card";
    card.innerHTML = `
      <div class="hd">
        <span>${cardData.title}</span>
        <span class="badge">${cardData.badge || ""}</span>
      </div>
      <div class="bd">
        <ul class="list"></ul>
      </div>
    `;

    const list = card.querySelector(".list");
    const badge = card.querySelector(".badge");

    /* ---- build exercises ---- */
    cardData.items.forEach(it => {
      const li = document.createElement("li");
      li.className = "ex";
      li.innerHTML = `
        <div class="name">${it.name}</div>
        <div class="meta">${it.meta || ""}</div>
      `;
      list.appendChild(li);
    });

    /* ---- bind clicks DIRECTLY (cross-browser safe) ---- */
    list.querySelectorAll(".ex").forEach(ex => {
      ex.addEventListener("click", () => {
        ex.classList.toggle("done");

        // Move done down, undone up
        if (ex.classList.contains("done")) {
          list.appendChild(ex);
        } else {
          list.prepend(ex);
        }

        // SAFE counts (no children.length!)
        const total = list.querySelectorAll(".ex").length;
        const done = list.querySelectorAll(".ex.done").length;

        if (done === total) {
          card.classList.add("collapsed");
          badge.textContent = "Completed";
          badge.classList.add("done");
        } else {
          card.classList.remove("collapsed");
          badge.textContent = cardData.badge || "";
          badge.classList.remove("done");
        }
      });
    });

    container.appendChild(card);
  });

  startTimer();
}

/* ===================== BACK ===================== */
$("#backBtn").onclick = () => {
  clearInterval(timerInterval);
  $("#view-day").classList.remove("active");
  $("#view-week").classList.add("active");
};

/* ===================== INIT ===================== */
(async () => {
  WORKOUTS = await fetch("data/workouts.json", { cache: "no-store" }).then(r => r.json());
  QUOTES   = await fetch("data/quotes.json",   { cache: "no-store" }).then(r => r.json());

  setQuote();
  renderWeek();
})();
