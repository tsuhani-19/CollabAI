const mongoose = require("mongoose");

const VersionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  fileName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

VersionSchema.index({ projectId: 1, fileName: 1, timestamp: -1 });
module.exports = mongoose.model("Version", VersionSchema);
