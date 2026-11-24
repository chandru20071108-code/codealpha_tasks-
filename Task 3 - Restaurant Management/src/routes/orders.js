const express = require("express");
const { v4: uuid } = require("uuid");
const { run, get, all } = require("../models/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const orders = await all("SELECT * FROM orders ORDER BY created_at DESC");
    const withItems = await Promise.all(orders.map(async o => ({
      ...o,
      items: await all(`SELECT oi.*,m.name,m.category FROM order_items oi JOIN menu_items m ON m.id=oi.menu_item_id WHERE oi.order_id=?`, [o.id])
    })));
    res.json({ success: true, data: withItems });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { table_id, notes, items } = req.body;
    if (!items || !Array.isArray(items) || !items.length)
      return res.status(400).json({ success: false, error: "items array is required." });

    let total = 0;
    const resolved = [];
    for (const { menu_item_id, quantity } of items) {
      const item = await get("SELECT * FROM menu_items WHERE id=? AND available=1", [menu_item_id]);
      if (!item) return res.status(404).json({ success: false, error: `Menu item "${menu_item_id}" not found.` });
      if (item.stock < quantity) return res.status(409).json({ success: false, error: `Insufficient stock for "${item.name}". Available: ${item.stock}.` });
      const subtotal = item.price * quantity;
      total += subtotal;
      resolved.push({ id: uuid(), menu_item_id, quantity, unit_price: item.price, subtotal });
    }

    const orderId = uuid();
    await run("INSERT INTO orders (id,table_id,status,total,notes) VALUES (?,?,?,?,?)", [orderId, table_id || null, "pending", total, notes || null]);
    for (const r of resolved) {
      await run("INSERT INTO order_items (id,order_id,menu_item_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)", [r.id, orderId, r.menu_item_id, r.quantity, r.unit_price, r.subtotal]);
      await run("UPDATE menu_items SET stock=stock-? WHERE id=?", [r.quantity, r.menu_item_id]);
    }
    res.status(201).json({ success: true, message: "Order placed!", data: { id: orderId, total, status: "pending" } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["pending","preparing","ready","served","cancelled"];
    if (!valid.includes(status)) return res.status(400).json({ success: false, error: `Status must be one of: ${valid.join(", ")}.` });
    const info = await run("UPDATE orders SET status=? WHERE id=?", [status, req.params.id]);
    if (!info.changes) return res.status(404).json({ success: false, error: "Order not found." });
    res.json({ success: true, message: `Order status updated to "${status}".` });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get("/report/daily", async (req, res) => {
  try {
    const daily = await all(`SELECT date(created_at) as day, COUNT(*) as orders, ROUND(SUM(total),2) as revenue FROM orders WHERE status!='cancelled' GROUP BY day ORDER BY day DESC LIMIT 30`);
    const lowStock = await all("SELECT * FROM menu_items WHERE stock<10 AND available=1 ORDER BY stock ASC");
    res.json({ success: true, data: { daily_sales: daily, low_stock_alerts: lowStock } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
