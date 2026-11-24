const express = require("express");
const { v4: uuid } = require("uuid");
const { run, get, all } = require("../models/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.json({ success: true, data: await all("SELECT * FROM tables_list ORDER BY number") });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post("/:id/reserve", async (req, res) => {
  try {
    const { customer_name, customer_phone, party_size, date, time } = req.body;
    if (!customer_name || !date || !time || !party_size)
      return res.status(400).json({ success: false, error: "name, date, time, party_size are required." });

    const table = await get("SELECT * FROM tables_list WHERE id=?", [req.params.id]);
    if (!table) return res.status(404).json({ success: false, error: "Table not found." });
    if (table.capacity < Number(party_size))
      return res.status(409).json({ success: false, error: `Table capacity is ${table.capacity}, party size ${party_size} is too large.` });

    const conflict = await get("SELECT id FROM reservations WHERE table_id=? AND date=? AND time=? AND status='confirmed'", [req.params.id, date, time]);
    if (conflict) return res.status(409).json({ success: false, error: "This table is already reserved at that time." });

    const id = uuid();
    await run("INSERT INTO reservations (id,table_id,customer_name,customer_phone,party_size,date,time,status) VALUES (?,?,?,?,?,?,?,'confirmed')",
      [id, req.params.id, customer_name, customer_phone || null, Number(party_size), date, time]);
    await run("UPDATE tables_list SET status='reserved' WHERE id=?", [req.params.id]);
    res.status(201).json({ success: true, message: "Table reserved!", data: { id, table_number: table.number, date, time } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete("/reservations/:resId", async (req, res) => {
  try {
    const r = await get("SELECT * FROM reservations WHERE id=?", [req.params.resId]);
    if (!r) return res.status(404).json({ success: false, error: "Reservation not found." });
    await run("UPDATE reservations SET status='cancelled' WHERE id=?", [req.params.resId]);
    await run("UPDATE tables_list SET status='available' WHERE id=?", [r.table_id]);
    res.json({ success: true, message: "Reservation cancelled." });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
