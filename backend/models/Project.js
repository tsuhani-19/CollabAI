const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["file", "folder"], default: "file" },
    content: { type: String, default: "" }, // For files
    children: [mongoose.Schema.Types.Mixed], // Avoid recursion errors
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    code: { type: String, default: "" },
    files: [FileSchema],
    activeUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        currentFileId: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
