const express = require("express");
const { run, get, all } = require("../models/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let sql = "SELECT * FROM menu_items WHERE available=1";
    const p = [];
    if (category) { sql += " AND category=?"; p.push(category); }
    sql += " ORDER BY category,name";
    res.json({ success: true, data: await all(sql, p) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get("/categories", async (req, res) => {
  try {
    const rows = await all("SELECT DISTINCT category FROM menu_items WHERE available=1 ORDER BY category");
    res.json({ success: true, data: rows.map(r => r.category) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.patch("/:id/stock", async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock == null || isNaN(stock)) return res.status(400).json({ success: false, error: "stock is required." });
    const info = await run("UPDATE menu_items SET stock=? WHERE id=?", [Number(stock), req.params.id]);
    if (!info.changes) return res.status(404).json({ success: false, error: "Item not found." });
    res.json({ success: true, message: "Stock updated." });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
