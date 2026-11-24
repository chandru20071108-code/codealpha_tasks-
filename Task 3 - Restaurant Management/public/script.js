"use strict";

// ── Helpers ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
let menuItems = [];

function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $(`view-${name}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === name));
}

function statusBadge(s) {
  return `<span class="badge badge-${s}">${s.toUpperCase()}</span>`;
}

// ── MENU ──────────────────────────────────────────────────────────────────
async function loadMenu(cat = "") {
  const url = "/api/menu" + (cat ? `?category=${encodeURIComponent(cat)}` : "");
  const res  = await fetch(url);
  const json = await res.json();
  menuItems  = json.data || [];
  renderMenuGrid(menuItems);
}

async function loadCategories() {
  const res  = await fetch("/api/menu/categories");
  const json = await res.json();
  const cats = json.data || [];
  const bar  = $("catFilters");
  bar.innerHTML = `<button class="filter-btn active" data-cat="">All</button>` +
    cats.map(c => `<button class="filter-btn" data-cat="${c}">${c}</button>`).join("");
  bar.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      bar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadMenu(btn.dataset.cat);
    });
  });
}

function renderMenuGrid(items) {
  if (!items.length) { $("menuGrid").innerHTML = `<p class="empty">No items found.</p>`; return; }
  $("menuGrid").innerHTML = items.map(i => {
    const sc = i.stock === 0 ? "stock-out" : i.stock < 10 ? "stock-low" : "stock-ok";
    const sl = i.stock === 0 ? "Out of Stock" : i.stock < 10 ? `Low: ${i.stock}` : `Stock: ${i.stock}`;
    return `<div class="menu-card">
      <div class="menu-card-cat">${i.category}</div>
      <div class="menu-card-name">${i.name}</div>
      <div class="menu-card-desc">${i.description || ""}</div>
      <div class="menu-card-footer">
        <span class="menu-price">₹${i.price}</span>
        <span class="stock-badge ${sc}">${sl}</span>
      </div>
    </div>`;
  }).join("");
}

// ── ORDERS ────────────────────────────────────────────────────────────────
function populateItemSelects() {
  document.querySelectorAll(".item-select").forEach(sel => {
    const cur = sel.value;
    sel.innerHTML = menuItems.map(m =>
      `<option value="${m.id}" ${m.id === cur ? "selected" : ""}>${m.name} – ₹${m.price}</option>`
    ).join("");
  });
}

$("newOrderBtn").addEventListener("click", () => {
  const card = $("orderFormCard");
  card.hidden = !card.hidden;
  if (!card.hidden) { populateItemSelects(); $("orderMsg").hidden = true; }
});

$("addItemRowBtn").addEventListener("click", () => {
  const container = $("orderItemsForm");
  const idx = container.children.length;
  const row = document.createElement("div");
  row.className = "order-item-row";
  row.dataset.idx = idx;
  row.innerHTML = `<select class="item-select"></select>
    <input type="number" class="item-qty" value="1" min="1"/>
    <button class="btn-remove-item">✕</button>`;
  row.querySelector(".btn-remove-item").addEventListener("click", () => row.remove());
  container.appendChild(row);
  populateItemSelects();
});

$("orderItemsForm").querySelector(".btn-remove-item").addEventListener("click", function() {
  if ($("orderItemsForm").children.length > 1) this.closest(".order-item-row").remove();
});

$("submitOrderBtn").addEventListener("click", async () => {
  const btn = $("submitOrderBtn");
  const msg = $("orderMsg");
  btn.disabled = true;

  const rows = [...$("orderItemsForm").querySelectorAll(".order-item-row")];
  const items = rows.map(r => ({
    menu_item_id: r.querySelector(".item-select").value,
    quantity: Number(r.querySelector(".item-qty").value) || 1
  }));

  try {
    const res  = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_id: $("orderTable").value || null, notes: $("orderNotes").value, items })
    });
    const json = await res.json();
    msg.hidden = false;
    if (json.success) {
      msg.className = "msg success";
      msg.textContent = `✅ Order placed! Total: ₹${json.data.total.toFixed(2)}`;
      $("orderFormCard").hidden = true;
      await loadMenu(); // refresh stock counts
      await loadOrders();
    } else {
      msg.className = "msg error";
      msg.textContent = "❌ " + (json.error || "Failed to place order.");
    }
  } catch { msg.hidden=false; msg.className="msg error"; msg.textContent="❌ Network error."; }
  finally { btn.disabled = false; }
});

async function loadOrders() {
  const res  = await fetch("/api/orders");
  const json = await res.json();
  const orders = json.data || [];
  if (!orders.length) { $("orderList").innerHTML = `<p class="empty">No orders yet.</p>`; return; }
  $("orderList").innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <span class="order-id">#${o.id.slice(0,8)}</span>
          ${o.table_id ? `· Table ${o.table_id}` : "· Takeaway"}
        </div>
        ${statusBadge(o.status)}
        <span class="order-total">₹${Number(o.total).toFixed(2)}</span>
        <select class="status-select" data-id="${o.id}">
          ${["pending","preparing","ready","served","cancelled"].map(s =>
            `<option value="${s}" ${o.status===s?"selected":""}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
          ).join("")}
        </select>
      </div>
      <div class="order-items-list">${o.items.map(i=>`${i.name} × ${i.quantity}`).join(" · ")}</div>
      ${o.notes ? `<div style="font-size:.8rem;color:#9ca3af;margin-top:.3rem">📝 ${o.notes}</div>` : ""}
    </div>`).join("");

  $("orderList").querySelectorAll(".status-select").forEach(sel => {
    sel.addEventListener("change", async () => {
      await fetch(`/api/orders/${sel.dataset.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: sel.value })
      });
      await loadOrders();
    });
  });
}

// ── TABLES ────────────────────────────────────────────────────────────────
let currentTableId = null;

async function loadTables() {
  const res  = await fetch("/api/tables");
  const json = await res.json();
  const tables = json.data || [];
  $("tableGrid").innerHTML = tables.map(t => `
    <div class="table-card ${t.status}" data-id="${t.id}" data-cap="${t.capacity}">
      <div class="table-num">T${t.number}</div>
      <div class="table-cap">👥 ${t.capacity} seats</div>
      <div class="table-status ts-${t.status}">${t.status.charAt(0).toUpperCase()+t.status.slice(1)}</div>
      ${t.status==="available" ? `<div style="font-size:.78rem;color:#16a34a;margin-top:.4rem">Click to reserve</div>` : ""}
    </div>`).join("");

  $("tableGrid").querySelectorAll(".table-card").forEach(card => {
    card.addEventListener("click", () => {
      if (card.classList.contains("occupied")) return;
      currentTableId = card.dataset.id;
      $("reserveTitle").textContent = `Reserve Table ${card.querySelector(".table-num").textContent}`;
      $("reserveTableId").value     = card.dataset.id;
      $("resPartySize").max         = card.dataset.cap;
      $("reserveMsg").hidden        = true;
      $("reserveForm").reset();
      $("reserveModal").hidden      = false;
    });
  });
}

$("reserveClose").addEventListener("click", () => { $("reserveModal").hidden = true; });
$("reserveModal").addEventListener("click", e => { if (e.target===$("reserveModal")) $("reserveModal").hidden=true; });

$("reserveForm").addEventListener("submit", async e => {
  e.preventDefault();
  const msg = $("reserveMsg");
  const btn = $("reserveForm").querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const res  = await fetch(`/api/tables/${$("reserveTableId").value}/reserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name:  $("resCustName").value,
        customer_phone: $("resCustPhone").value,
        party_size:     Number($("resPartySize").value),
        date:           $("resDate").value,
        time:           $("resTime").value
      })
    });
    const json = await res.json();
    msg.hidden = false;
    if (json.success) {
      msg.className = "msg success";
      msg.textContent = `✅ ${json.message} (Table ${json.data.table_number}, ${json.data.date} ${json.data.time})`;
      await loadTables();
    } else {
      msg.className = "msg error";
      msg.textContent = "❌ " + (json.error || "Failed.");
      btn.disabled = false;
    }
  } catch { msg.hidden=false; msg.className="msg error"; msg.textContent="❌ Network error."; btn.disabled=false; }
});

// ── REPORTS ───────────────────────────────────────────────────────────────
async function loadReports() {
  const res  = await fetch("/api/orders/report/daily");
  const json = await res.json();
  const { daily_sales, low_stock_alerts } = json.data || {};

  const salesHtml = !daily_sales?.length ? "<p class='empty'>No sales data yet.</p>" :
    daily_sales.map(r => `<div class="sales-row"><span>${r.day}</span><span>${r.orders} orders</span><span class="sales-rev">₹${r.revenue}</span></div>`).join("");

  const stockHtml = !low_stock_alerts?.length ? `<p class="empty" style="color:#15803d">✅ All items well stocked!</p>` :
    low_stock_alerts.map(i => `<div class="alert-row"><span>${i.name}</span><span class="alert-stock">⚠️ ${i.stock} left</span></div>`).join("");

  $("reportContent").innerHTML = `
    <div class="report-grid">
      <div class="report-card"><h3>📅 Daily Sales (last 30 days)</h3>${salesHtml}</div>
      <div class="report-card"><h3>⚠️ Low Stock Alerts</h3>${stockHtml}</div>
    </div>`;
}

// ── Nav ───────────────────────────────────────────────────────────────────
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    showView(btn.dataset.view);
    if (btn.dataset.view === "menu")    { loadCategories(); loadMenu(); }
    if (btn.dataset.view === "orders")  loadOrders();
    if (btn.dataset.view === "tables")  loadTables();
    if (btn.dataset.view === "reports") loadReports();
  });
});

// ── Init ──────────────────────────────────────────────────────────────────
loadCategories();
loadMenu();
