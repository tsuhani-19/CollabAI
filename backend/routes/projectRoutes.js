const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
  createProject,
  getMyProjects,
} = require("../controller/projectController");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

router.post("/create", verifyToken, createProject);
router.get("/my-projects", verifyToken, getMyProjects);

module.exports = router;
