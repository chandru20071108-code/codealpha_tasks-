const express = require("express");
const path    = require("path");
const { init } = require("./models/db");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

const eventsRouter = require("./routes/events");
app.use("/api/events", eventsRouter);

// SPA fallback
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use((req, res) => res.status(404).json({ success: false, error: "Route not found." }));
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Internal server error." });
});

// Start after DB is ready
init().then(() => {
  app.listen(PORT, () =>
    console.log(`\n🎉 Event Registration System → http://localhost:${PORT}\n`)
  );
}).catch(err => { console.error("DB init failed:", err); process.exit(1); });
