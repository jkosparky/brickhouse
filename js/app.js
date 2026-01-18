const $ = s => document.querySelector(s);

let WORKOUTS=[], QUOTES=[];
let timerInterval=null, timerSeconds=0, timerRunning=false;

// ---------- Theme ----------
const toggle=$("#themeToggle");
function setTheme(m){
  document.body.className=m==="dark"?"dark":"";
  toggle.textContent=m==="dark"?"☀️":"🌙";
  localStorage.setItem("theme",m);
}
toggle.onclick=()=>setTheme(document.body.classList.contains("dark")?"light":"dark");
setTheme(localStorage.getItem("theme")||"light");

// ---------- Timer ----------
function renderTimer(){
  const m=String(Math.floor(timerSeconds/60)).padStart(2,"0");
  const s=String(timerSeconds%60).padStart(2,"0");
  $("#timerText").textContent=`⏱ ${m}:${s}`;
}
function startTimer(){
  clearInterval(timerInterval);
  timerSeconds=0; timerRunning=true;
  timerInterval=setInterval(()=>{if(timerRunning){timerSeconds++;renderTimer()}},1000);
}
$("#timerToggleBtn").onclick=()=>{timerRunning=!timerRunning};

// ---------- Quotes ----------
function setQuote(){
  const q=QUOTES[Math.floor(Math.random()*QUOTES.length)];
  $("#quoteText").textContent=`“${q.q}”`;
  $("#quoteSrc").textContent=q.a?`— ${q.a}`:"";
}

// ---------- Week ----------
function renderWeek(){
  const g=$("#weekGrid"); g.innerHTML="";
  WORKOUTS.forEach(w=>{
    const b=document.createElement("button");
    b.className="dayBtn";
    b.innerHTML=`<span class="pill">Open</span><div class="dow">${w.day}</div><div class="focus">${w.focus}</div>`;
    b.onclick=()=>openDay(w.key);
    g.appendChild(b);
  });
}

// ---------- Day ----------
function openDay(key){
  const w=WORKOUTS.find(x=>x.key===key);
  $("#view-week").classList.remove("active");
  $("#view-day").classList.add("active");
  $("#dayName").textContent=w.day;
  $("#dayFocus").textContent=w.focus;

  const c=$("#dayCards"); c.innerHTML="";

  w.cards.forEach(cardData=>{
    const card=document.createElement("section");
    card.className="card";
    card.innerHTML=`<div class="hd"><span>${cardData.title}</span><span class="badge">${cardData.badge||""}</span></div><div class="bd"><ul class="list"></ul></div>`;
    const list=card.querySelector(".list");

    cardData.items.forEach(it=>{
      const li=document.createElement("li");
      li.className="ex";
      li.innerHTML=`<div class="name">${it.name}</div><div class="meta">${it.meta||""}</div>`;
      list.appendChild(li);
    });

   // Bind directly to each exercise (cross-browser safe)
list.querySelectorAll(".ex").forEach(ex => {
  ex.addEventListener("click", () => {
    const badge = card.querySelector(".badge");

    ex.classList.toggle("done");

    // Move completed down, undone up
    if (ex.classList.contains("done")) {
      list.appendChild(ex);
    } else {
      list.prepend(ex);
    }

    // Collapse card if all exercises are done
    const total = list.children.length;
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
    c.appendChild(card);
  });

  startTimer();
}

// ---------- Back ----------
$("#backBtn").onclick=()=>{
  clearInterval(timerInterval);
  $("#view-day").classList.remove("active");
  $("#view-week").classList.add("active");
};

// ---------- Init ----------
(async()=>{
  WORKOUTS=await fetch("data/workouts.json").then(r=>r.json());
  QUOTES=await fetch("data/quotes.json").then(r=>r.json());
  setQuote();
  renderWeek();
})();
