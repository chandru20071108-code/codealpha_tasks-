const sqlite3 = require("sqlite3").verbose();
const path    = require("path");

const DB_PATH = path.join(__dirname, "../../events.db");
const db = new sqlite3.Database(DB_PATH);

// Helper: run a statement that returns nothing (INSERT, UPDATE, DELETE, CREATE)
const run = (sql, params = []) =>
  new Promise((res, rej) =>
    db.run(sql, params, function (err) { err ? rej(err) : res(this); })
  );

// Helper: get one row
const get = (sql, params = []) =>
  new Promise((res, rej) =>
    db.get(sql, params, (err, row) => { err ? rej(err) : res(row); })
  );

// Helper: get all rows
const all = (sql, params = []) =>
  new Promise((res, rej) =>
    db.all(sql, params, (err, rows) => { err ? rej(err) : res(rows); })
  );

// ── Init tables ────────────────────────────────────────────────────────────
async function init() {
  await run("PRAGMA journal_mode=WAL");
  await run(`CREATE TABLE IF NOT EXISTS events (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    location    TEXT NOT NULL,
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    capacity    INTEGER NOT NULL DEFAULT 100,
    organizer   TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  )`);
  await run(`CREATE TABLE IF NOT EXISTS registrations (
    id         TEXT PRIMARY KEY,
    event_id   TEXT NOT NULL,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT,
    status     TEXT NOT NULL DEFAULT 'confirmed',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(event_id, email)
  )`);

  // Seed sample events if empty
  const row = await get("SELECT COUNT(*) as n FROM events");
  if (row.n === 0) {
    const ins = "INSERT INTO events (id,title,description,location,date,time,capacity,organizer) VALUES (?,?,?,?,?,?,?,?)";
    await run(ins,["ev-001","Tech Summit 2026","Annual technology conference covering AI, Web Dev, and Cloud.","Chennai Convention Centre","2026-12-15","09:00",200,"TechWorld Inc."]);
    await run(ins,["ev-002","Startup Pitch Night","Present your startup idea to investors and industry experts.","IIT Madras Research Park","2026-12-20","18:00",80,"StartupHub Chennai"]);
    await run(ins,["ev-003","Web Dev Workshop","Hands-on workshop: Build full-stack apps with Node.js and React.","Online (Zoom)","2026-12-28","10:00",50,"CodeAlpha"]);
  }
}

module.exports = { db, run, get, all, init };
