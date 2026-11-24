const sqlite3 = require("sqlite3").verbose();
const path    = require("path");

const DB_PATH = path.join(__dirname, "../../restaurant.db");
const db = new sqlite3.Database(DB_PATH);

const run = (sql, params = []) =>
  new Promise((res, rej) =>
    db.run(sql, params, function (err) { err ? rej(err) : res(this); })
  );
const get = (sql, params = []) =>
  new Promise((res, rej) =>
    db.get(sql, params, (err, row) => { err ? rej(err) : res(row); })
  );
const all = (sql, params = []) =>
  new Promise((res, rej) =>
    db.all(sql, params, (err, rows) => { err ? rej(err) : res(rows); })
  );

async function init() {
  await run("PRAGMA journal_mode=WAL");
  await run("PRAGMA foreign_keys=ON");

  await run(`CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
    category TEXT NOT NULL, price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 50, available INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  await run(`CREATE TABLE IF NOT EXISTS tables_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER NOT NULL UNIQUE,
    capacity INTEGER NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'available'
  )`);
  await run(`CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY, table_id INTEGER,
    customer_name TEXT NOT NULL, customer_phone TEXT,
    party_size INTEGER NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  await run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, table_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    total REAL NOT NULL DEFAULT 0, notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  await run(`CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY, order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL, subtotal REAL NOT NULL
  )`);

  // Seed
  const c = await get("SELECT COUNT(*) as n FROM menu_items");
  if (c.n === 0) {
    const mi = "INSERT INTO menu_items (id,name,description,category,price,stock) VALUES (?,?,?,?,?,?)";
    await run(mi,["m1","Butter Chicken","Creamy tomato-based chicken curry","Main Course",320,40]);
    await run(mi,["m2","Paneer Tikka","Marinated cottage cheese grilled in tandoor","Starter",220,35]);
    await run(mi,["m3","Veg Biryani","Aromatic basmati rice with mixed vegetables","Main Course",280,30]);
    await run(mi,["m4","Masala Dosa","Crispy crepe with spiced potato filling","Breakfast",180,50]);
    await run(mi,["m5","Gulab Jamun","Soft milk-solid dumplings in sugar syrup","Dessert",120,60]);
    await run(mi,["m6","Mango Lassi","Chilled yoghurt drink with mango pulp","Beverages",100,70]);
    await run(mi,["m7","Chicken Biryani","Fragrant basmati rice with spiced chicken","Main Course",380,25]);
    await run(mi,["m8","Veg Spring Roll","Crispy rolls stuffed with veggies","Starter",160,45]);

    const t = "INSERT INTO tables_list (number,capacity,status) VALUES (?,?,?)";
    for (let i=1;i<=10;i++) await run(t,[i, i<=4?2:i<=8?4:6,"available"]);
  }
}

module.exports = { db, run, get, all, init };
