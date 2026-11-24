/* ── EventHub script.js ──────────────────────────────────────────────────── */
"use strict";

// ── State ─────────────────────────────────────────────────────────────────
let currentView = "events";
let allEvents   = [];

// ── DOM helpers ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const showView = name => {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $(`view-${name}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.view === name);
  });
  currentView = name;
  $("heroSection").style.display = name === "events" ? "block" : "none";
};

// ── Format helpers ────────────────────────────────────────────────────────
const fmtDate = d => new Date(d).toLocaleDateString("en-IN", {weekday:"short",year:"numeric",month:"short",day:"numeric"});
const pct = (reg, cap) => Math.min(100, Math.round((reg / cap) * 100));

// ── Fetch events ──────────────────────────────────────────────────────────
async function loadEvents() {
  try {
    const res  = await fetch("/api/events");
    const json = await res.json();
    allEvents  = json.data || [];
    renderEventGrid(allEvents);
  } catch {
    $("eventGrid").innerHTML = `<p class="empty-state">❌ Could not load events. Is the server running?</p>`;
  }
}

function renderEventGrid(events) {
  if (!events.length) {
    $("eventGrid").innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>No events found.</p></div>`;
    return;
  }
  $("eventGrid").innerHTML = events.map(e => {
    const full = e.registered >= e.capacity;
    return `
    <div class="event-card" data-id="${e.id}">
      <div class="event-card-banner"></div>
      <div class="event-card-body">
        <div class="event-card-date">📅 ${fmtDate(e.date)} · ${e.time}</div>
        <div class="event-card-title">${e.title}</div>
        <div class="event-card-desc">${e.description}</div>
        <div class="event-card-footer">
          <span class="event-card-loc">📍 ${e.location}</span>
          <span class="badge ${full ? "badge-full" : "badge-available"}">${full ? "Full" : `${e.capacity - e.registered} left`}</span>
        </div>
        <button class="btn-register" data-id="${e.id}" ${full ? "disabled" : ""}>
          ${full ? "Fully Booked" : "Register Now"}
        </button>
      </div>
    </div>`;
  }).join("");

  // Card click → detail; Register click → modal
  $("eventGrid").querySelectorAll(".event-card").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.classList.contains("btn-register")) return;
      showDetail(card.dataset.id);
    });
  });
  $("eventGrid").querySelectorAll(".btn-register").forEach(btn => {
    btn.addEventListener("click", e => { e.stopPropagation(); openModal(btn.dataset.id); });
  });
}

// ── Event Detail ──────────────────────────────────────────────────────────
async function showDetail(id) {
  showView("detail");
  $("eventDetail").innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>Loading…</p></div>`;
  const res  = await fetch(`/api/events/${id}`);
  const json = await res.json();
  if (!json.success) { $("eventDetail").innerHTML = `<p>Event not found.</p>`; return; }
  const e    = json.data;
  const full = e.registered >= e.capacity;
  $("eventDetail").innerHTML = `
    <div class="detail-card">
      <div class="detail-banner"></div>
      <div class="detail-body">
        <h2 class="detail-title">${e.title}</h2>
        <div class="detail-meta">
          <span>📅 ${fmtDate(e.date)}</span>
          <span>🕐 ${e.time}</span>
          <span>📍 ${e.location}</span>
          <span>👤 ${e.organizer}</span>
        </div>
        <p class="detail-desc">${e.description}</p>
        <div class="detail-capacity">
          <strong>Capacity:</strong> ${e.registered} / ${e.capacity} registered
          <div class="capacity-bar"><div class="capacity-fill" style="width:${pct(e.registered,e.capacity)}%"></div></div>
        </div>
        <button class="btn-primary" id="detailRegBtn" ${full ? "disabled" : ""} data-id="${e.id}">
          ${full ? "Fully Booked" : "Register for this Event"}
        </button>
      </div>
    </div>`;
  if (!full) $("detailRegBtn").addEventListener("click", () => openModal(id));
}

// ── Modal ─────────────────────────────────────────────────────────────────
function openModal(eventId) {
  const ev = allEvents.find(e => e.id === eventId);
  $("modalTitle").textContent  = `Register: ${ev ? ev.title : ""}`;
  $("regEventId").value        = eventId;
  $("regName").value           = "";
  $("regEmail").value          = "";
  $("regPhone").value          = "";
  $("modalMsg").hidden         = true;
  $("regModal").hidden         = false;
}
function closeModal() { $("regModal").hidden = true; }
$("modalClose").addEventListener("click", closeModal);
$("regModal").addEventListener("click", e => { if (e.target === $("regModal")) closeModal(); });

// ── Register Submit ───────────────────────────────────────────────────────
$("regForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn  = $("submitRegBtn");
  const txt  = btn.querySelector(".btn-txt");
  const spin = btn.querySelector(".btn-spin");
  const msg  = $("modalMsg");

  btn.disabled = true; txt.hidden = true; spin.hidden = false;

  try {
    const res  = await fetch(`/api/events/${$("regEventId").value}/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: $("regName").value, email: $("regEmail").value, phone: $("regPhone").value }),
    });
    const json = await res.json();
    msg.hidden = false;
    if (json.success) {
      msg.className  = "modal-msg success";
      msg.textContent = `✅ ${json.message} A confirmation was saved for ${$("regEmail").value}.`;
      $("regForm").querySelectorAll("input").forEach(i => i.disabled = true);
      btn.textContent = "Registered!";
      await loadEvents(); // refresh counts
    } else {
      msg.className  = "modal-msg error";
      msg.textContent = `❌ ${json.error || (json.errors && json.errors[0]?.msg) || "Something went wrong."}`;
      btn.disabled   = false; txt.hidden = false; spin.hidden = true;
    }
  } catch {
    msg.hidden    = false;
    msg.className = "modal-msg error";
    msg.textContent = "❌ Network error. Please try again.";
    btn.disabled  = false; txt.hidden = false; spin.hidden = true;
  }
});

// ── My Registrations ──────────────────────────────────────────────────────
$("lookupBtn").addEventListener("click", lookupRegistrations);
$("lookupEmail").addEventListener("keydown", e => { if (e.key === "Enter") lookupRegistrations(); });

async function lookupRegistrations() {
  const email = $("lookupEmail").value.trim();
  const out   = $("myRegResults");
  if (!email) { out.innerHTML = `<p class="empty-state">Please enter your email.</p>`; return; }
  out.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>Searching…</p></div>`;

  // Search across all events
  const res   = await fetch("/api/events");
  const json  = await res.json();
  const events = json.data || [];

  const results = [];
  for (const ev of events) {
    const rRes  = await fetch(`/api/events/${ev.id}/registrations`);
    const rJson = await rRes.json();
    const mine  = (rJson.data || []).filter(r => r.email.toLowerCase() === email.toLowerCase());
    mine.forEach(r => results.push({ ...r, eventTitle: ev.title, eventDate: ev.date }));
  }

  if (!results.length) {
    out.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><p>No registrations found for <strong>${email}</strong>.</p></div>`;
    return;
  }
  out.innerHTML = `<div class="reg-list">${results.map(r => `
    <div class="reg-item">
      <div class="reg-item-info">
        <div class="reg-item-event">${r.eventTitle}</div>
        <div class="reg-item-meta">📅 ${fmtDate(r.eventDate)} · 👤 ${r.name}</div>
      </div>
      <span class="badge badge-${r.status}">${r.status.toUpperCase()}</span>
      ${r.status === "confirmed" ? `<button class="btn-cancel" data-reg-id="${r.id}" data-event-id="${r.event_id}">Cancel</button>` : ""}
    </div>`).join("")}</div>`;

  out.querySelectorAll(".btn-cancel").forEach(btn => {
    btn.addEventListener("click", () => cancelReg(btn.dataset.eventId, btn.dataset.regId, email));
  });
}

async function cancelReg(eventId, regId, email) {
  if (!confirm("Cancel this registration?")) return;
  const res = await fetch(`/api/events/${eventId}/registrations/${regId}`, { method: "DELETE" });
  const json = await res.json();
  if (json.success) { await lookupRegistrations(); await loadEvents(); }
  else alert("Failed: " + json.error);
}

// ── Nav ───────────────────────────────────────────────────────────────────
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    showView(btn.dataset.view);
    if (btn.dataset.view === "events") loadEvents();
  });
});
$("backBtn").addEventListener("click", () => { showView("events"); loadEvents(); });

// ── Init ──────────────────────────────────────────────────────────────────
loadEvents();
