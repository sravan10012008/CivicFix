const express = require("express");
const helmet = require("helmet");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "CivicFix API"
  });
});

app.get("/api/instance", (req, res) => {
  res.status(200).json({
    service: "CivicFix API",
    instance: os.hostname(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CivicFix API running on port ${PORT}`);
});
