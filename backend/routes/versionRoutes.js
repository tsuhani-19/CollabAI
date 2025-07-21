const express = require("express");
const Version = require("../models/Version");
const router = express.Router();

// Fetch previous versions for a file
router.get("/:projectId/:fileName", async (req, res) => {
  try {
    const { projectId, fileName } = req.params;
    const versions = await Version.find({ projectId, fileName })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(versions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rollback to a previous version
router.post("/rollback/:versionId", async (req, res) => {
  try {
    const version = await Version.findById(req.params.versionId);
    if (!version) return res.status(404).json({ message: "Version not found" });

    res.json({ fileName: version.fileName, content: version.content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
