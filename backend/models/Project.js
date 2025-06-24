const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    code: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);