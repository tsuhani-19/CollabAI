// routes/websiteBuilder.js
const express = require("express");
const router = express.Router();
const { generateWebsite } = require("../controller/websiteController.js");

router.post("/", generateWebsite);

module.exports = router;
