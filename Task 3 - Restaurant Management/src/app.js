const express = require("express");
const path    = require("path");
const { init } = require("./models/db");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/menu",   require("./routes/menu"));
app.use("/api/tables", require("./routes/tables"));
app.use("/api/orders", require("./routes/orders"));

app.get(/^(?!\/api).*/, (req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);

app.use((req, res) => res.status(404).json({ success: false, error: "Route not found." }));
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Internal server error." });
});

init().then(() => {
  app.listen(PORT, () =>
    console.log(`\n🍽️  Restaurant Management System → http://localhost:${PORT}\n`)
  );
}).catch(err => { console.error("DB init failed:", err); process.exit(1); });
