const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { body, validationResult } = require("express-validator");
const { run, get, all } = require("../models/db");

const router = express.Router();

// GET /api/events
router.get("/", async (req, res) => {
  try {
    const events = await all(`
      SELECT e.*, COUNT(r.id) AS registered
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id AND r.status='confirmed'
      GROUP BY e.id ORDER BY e.date ASC
    `);
    res.json({ success: true, data: events });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// GET /api/events/:id
router.get("/:id", async (req, res) => {
  try {
    const event = await get(`
      SELECT e.*, COUNT(r.id) AS registered
      FROM events e
      LEFT JOIN registrations r ON r.event_id=e.id AND r.status='confirmed'
      WHERE e.id=? GROUP BY e.id
    `, [req.params.id]);
    if (!event) return res.status(404).json({ success: false, error: "Event not found." });
    res.json({ success: true, data: event });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// POST /api/events/:id/register
router.post("/:id/register",
  [body("name").trim().notEmpty().withMessage("Full name is required."),
   body("email").isEmail().withMessage("Valid email is required.").normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    try {
      const event = await get("SELECT * FROM events WHERE id=?", [req.params.id]);
      if (!event) return res.status(404).json({ success: false, error: "Event not found." });

      const reg = await get("SELECT COUNT(*) as n FROM registrations WHERE event_id=? AND status='confirmed'", [req.params.id]);
      if (reg.n >= event.capacity) return res.status(409).json({ success: false, error: "This event is fully booked." });

      const { name, email, phone } = req.body;
      const existing = await get("SELECT id FROM registrations WHERE event_id=? AND email=?", [req.params.id, email]);
      if (existing) return res.status(409).json({ success: false, error: "This email is already registered for this event." });

      const id = uuidv4();
      await run("INSERT INTO registrations (id,event_id,name,email,phone,status) VALUES (?,?,?,?,?,'confirmed')",
        [id, req.params.id, name, email, phone || null]);
      res.status(201).json({ success: true, message: "Registration successful!", data: { id, event_id: req.params.id, name, email, status: "confirmed" } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  }
);

// GET /api/events/:id/registrations
router.get("/:id/registrations", async (req, res) => {
  try {
    const event = await get("SELECT title FROM events WHERE id=?", [req.params.id]);
    if (!event) return res.status(404).json({ success: false, error: "Event not found." });
    const registrations = await all("SELECT * FROM registrations WHERE event_id=? ORDER BY created_at DESC", [req.params.id]);
    res.json({ success: true, event: event.title, data: registrations });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// DELETE /api/events/:eventId/registrations/:regId
router.delete("/:eventId/registrations/:regId", async (req, res) => {
  try {
    const reg = await get("SELECT * FROM registrations WHERE id=? AND event_id=?", [req.params.regId, req.params.eventId]);
    if (!reg) return res.status(404).json({ success: false, error: "Registration not found." });
    await run("UPDATE registrations SET status='cancelled' WHERE id=?", [req.params.regId]);
    res.json({ success: true, message: "Registration cancelled." });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
