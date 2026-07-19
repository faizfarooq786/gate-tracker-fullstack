"use strict";

// ---------- state ----------
let subjects = [];
const app = document.getElementById("app");
const PRIORITY_LABEL = { q: "Quick", m: "Moderate", h: "Heavy" };

// ---------- helpers ----------
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function api(method, url, body) {
  const opt = { method, headers: {} };
  if (body !== undefined) {
    opt.headers["Content-Type"] = "application/json";
    opt.body = JSON.stringify(body);
  }
  const res = await fetch(url, opt);
  if (!res.ok) {
    let msg = "Something went wrong";
    try { msg = (await res.json()).error || msg; } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}

let toastTimer;
function toast(msg, isErr) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.toggle("err", !!isErr);
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

// ---------- templates ----------
function topicHTML(t) {
  return `<li class="topic ${t.done ? "done" : ""}" data-tid="${t._id}">
    <span class="box" role="checkbox" tabindex="0" aria-checked="${t.done ? "true" : "false"}" aria-label="Toggle ${esc(t.name)}"></span>
    <span class="name">${esc(t.name)}</span>
    <button class="del" type="button" title="Delete topic" aria-label="Delete topic ${esc(t.name)}">×</button>
  </li>`;
}

function topicsListHTML(s) {
  if (!s.topics.length) return `<li class="empty">No topics yet — add one below.</li>`;
  return s.topics.map(topicHTML).join("");
}

function subjectHTML(s) {
  return `<section class="subject ${s.priority}" data-sid="${s._id}">
    <div class="subject-head">
      <div class="subject-title">
        <h3>${esc(s.name)}</h3>
        <span class="tag ${s.priority}">${PRIORITY_LABEL[s.priority] || "Moderate"}</span>
        <button class="icon-btn del-subject" type="button" title="Delete subject" aria-label="Delete subject ${esc(s.name)}">🗑</button>
      </div>
      <div class="subject-meta">
        <div class="mini-track"><div class="mini-fill"></div></div>
        <span class="mini-label">0/0</span>
      </div>
    </div>
    <ul class="topics">${topicsListHTML(s)}</ul>
    <form class="add-topic" autocomplete="off">
      <input type="text" placeholder="Add a new topic…" maxlength="200" aria-label="New topic name" />
      <button type="submit" class="btn">Add</button>
    </form>
  </section>`;
}

function render() {
  if (!subjects.length) {
    app.innerHTML = `<div class="empty" style="padding:2rem 0">No subjects yet. Add one using the “+ Subject” button above. 🙂</div>`;
    updateOverall();
    return;
  }
  app.innerHTML = `<div class="subjects">${subjects.map(subjectHTML).join("")}</div>`;
  subjects.forEach((s) => updateSubjectProgress(s._id));
  updateOverall();
}

// ---------- progress ----------
function updateSubjectProgress(sid) {
  const s = subjects.find((x) => x._id === sid);
  if (!s) return;
  const total = s.topics.length;
  const done = s.topics.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const card = app.querySelector(`.subject[data-sid="${sid}"]`);
  if (!card) return;
  card.querySelector(".mini-fill").style.width = pct + "%";
  card.querySelector(".mini-label").textContent = `${done}/${total}`;
}

function updateOverall() {
  let total = 0, done = 0;
  subjects.forEach((s) => { total += s.topics.length; done += s.topics.filter((t) => t.done).length; });
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("bar").style.width = pct + "%";
  document.getElementById("pct").textContent = pct + "%";
  document.getElementById("count").textContent = `${done}/${total} topics`;
  document.getElementById("progRole").setAttribute("aria-valuenow", String(pct));
}

// ---------- mutations ----------
async function toggleTopic(sid, tid) {
  const s = subjects.find((x) => x._id === sid);
  const t = s && s.topics.find((x) => x._id === tid);
  if (!t) return;
  const next = !t.done;
  t.done = next; // optimistic
  applyTopicDOM(sid, tid, next);
  updateSubjectProgress(sid);
  updateOverall();
  try {
    await api("PATCH", `/api/subjects/${sid}/topics/${tid}`, { done: next });
  } catch (e) {
    t.done = !next; // rollback
    applyTopicDOM(sid, tid, !next);
    updateSubjectProgress(sid);
    updateOverall();
    toast(e.message, true);
  }
}

function applyTopicDOM(sid, tid, done) {
  const li = app.querySelector(`.subject[data-sid="${sid}"] .topic[data-tid="${tid}"]`);
  if (!li) return;
  li.classList.toggle("done", done);
  li.querySelector(".box").setAttribute("aria-checked", done ? "true" : "false");
}

async function addTopic(sid, name, inputEl) {
  try {
    const topic = await api("POST", `/api/subjects/${sid}/topics`, { name });
    const s = subjects.find((x) => x._id === sid);
    s.topics.push(topic);
    const ul = app.querySelector(`.subject[data-sid="${sid}"] .topics`);
    const emptyEl = ul.querySelector(".empty");
    if (emptyEl) emptyEl.remove();
    ul.insertAdjacentHTML("beforeend", topicHTML(topic));
    updateSubjectProgress(sid);
    updateOverall();
    inputEl.value = "";
    inputEl.focus();
    toast("Topic added ✓");
  } catch (e) {
    toast(e.message, true);
  }
}

async function deleteTopic(sid, tid) {
  try {
    await api("DELETE", `/api/subjects/${sid}/topics/${tid}`);
    const s = subjects.find((x) => x._id === sid);
    s.topics = s.topics.filter((t) => t._id !== tid);
    const li = app.querySelector(`.topic[data-tid="${tid}"]`);
    if (li) li.remove();
    const ul = app.querySelector(`.subject[data-sid="${sid}"] .topics`);
    if (!s.topics.length) ul.innerHTML = `<li class="empty">No topics yet — add one below.</li>`;
    updateSubjectProgress(sid);
    updateOverall();
  } catch (e) {
    toast(e.message, true);
  }
}

async function addSubject(name, priority) {
  try {
    const subject = await api("POST", "/api/subjects", { name, priority });
    subject.topics = subject.topics || [];
    subjects.push(subject);
    let grid = app.querySelector(".subjects");
    if (!grid) { app.innerHTML = `<div class="subjects"></div>`; grid = app.querySelector(".subjects"); }
    grid.insertAdjacentHTML("beforeend", subjectHTML(subject));
    updateSubjectProgress(subject._id);
    updateOverall();
    toast("Subject added ✓");
  } catch (e) {
    toast(e.message, true);
  }
}

async function deleteSubject(sid) {
  const s = subjects.find((x) => x._id === sid);
  if (!s) return;
  if (!confirm(`Delete the "${s.name}" subject? All of its topics will be removed too.`)) return;
  try {
    await api("DELETE", `/api/subjects/${sid}`);
    subjects = subjects.filter((x) => x._id !== sid);
    const card = app.querySelector(`.subject[data-sid="${sid}"]`);
    if (card) card.remove();
    if (!subjects.length) render();
    updateOverall();
    toast("Subject deleted");
  } catch (e) {
    toast(e.message, true);
  }
}

// ---------- events (delegated) ----------
app.addEventListener("click", (e) => {
  const box = e.target.closest(".box");
  const name = e.target.closest(".name");
  const delTopicBtn = e.target.closest(".del");
  const delSubjBtn = e.target.closest(".del-subject");
  const card = e.target.closest(".subject");
  if (!card) return;
  const sid = card.dataset.sid;
  if (delSubjBtn) { deleteSubject(sid); return; }
  const li = e.target.closest(".topic");
  if (delTopicBtn && li) { deleteTopic(sid, li.dataset.tid); return; }
  if ((box || name) && li) { toggleTopic(sid, li.dataset.tid); return; }
});

app.addEventListener("keydown", (e) => {
  if (!e.target.classList.contains("box")) return;
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    const li = e.target.closest(".topic");
    const card = e.target.closest(".subject");
    if (li && card) toggleTopic(card.dataset.sid, li.dataset.tid);
  }
});

app.addEventListener("submit", (e) => {
  const form = e.target.closest(".add-topic");
  if (!form) return;
  e.preventDefault();
  const card = form.closest(".subject");
  const input = form.querySelector("input");
  const val = input.value.trim();
  if (val) addTopic(card.dataset.sid, val, input);
});

document.getElementById("addSubjectForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const nameEl = document.getElementById("newSubjectName");
  const priEl = document.getElementById("newSubjectPriority");
  const val = nameEl.value.trim();
  if (!val) return;
  addSubject(val, priEl.value);
  nameEl.value = "";
});

// ---------- theme ----------
(function initTheme() {
  const saved = localStorage.getItem("gate2028-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
})();
document.getElementById("theme").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effective = cur || (prefersDark ? "dark" : "light");
  const next = effective === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("gate2028-theme", next); } catch (e) {}
});

// ---------- countdown ----------
(function countdown() {
  const exam = new Date("2028-02-07T00:00:00");
  const days = Math.max(0, Math.ceil((exam - new Date()) / 86400000));
  document.getElementById("countdown").textContent = days.toLocaleString();
})();

// ---------- boot ----------
(async function boot() {
  try {
    const data = await api("GET", "/api/state");
    subjects = data.subjects || [];
    render();
    document.getElementById("dbnote").textContent = "connected ✓";
  } catch (e) {
    app.innerHTML = `<div class="fatal">Couldn't connect to the backend.<br />Make sure the server is running and MONGODB_URI is set correctly.<br /><small>${esc(e.message)}</small></div>`;
    document.getElementById("dbnote").textContent = "offline";
  }
})();
