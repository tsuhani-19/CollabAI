const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/", (req, res) => {
  const { projectName, files } = req.body;

  if (!projectName || !Array.isArray(files)) {
    return res.status(400).json({ success: false, error: "Invalid data" });
  }

  const projectPath = path.join(__dirname, "..", "generated-sites", projectName);

  try {
    files.forEach(({ name, content }) => {
      const fullPath = path.join(projectPath, name);
      const dir = path.dirname(fullPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, content, "utf8");
    });

    res.status(200).json({ success: true, message: "✅ Project saved to disk!" });
  } catch (err) {
    console.error("❌ Save Error:", err);
    res.status(500).json({ success: false, error: "Failed to save project" });
  }
});

module.exports = router;
