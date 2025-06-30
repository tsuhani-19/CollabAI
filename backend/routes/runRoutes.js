const express = require("express");
const router = express.Router();
const axios = require("axios");

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";

router.post("/", async (req, res) => {
  const { code, languageId = 71, stdin = "" } = req.body;

  try {
    // Step 1: Submit the code to Judge0
    const submissionResponse = await axios.post(
      `${JUDGE0_URL}/submissions`,
      {
        source_code: code,
        language_id: languageId,
        stdin,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    const token = submissionResponse.data.token;

    // Step 2: Poll until execution is done
    let result;
    const maxTries = 20;
    let tries = 0;

    while (tries < maxTries) {
      const statusResponse = await axios.get(
        `${JUDGE0_URL}/submissions/${token}`,
        {
          params: {
            base64_encoded: "false",
            fields: "*",
          },
          headers: {
            "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      result = statusResponse.data;
      if (result.status && result.status.id >= 3) break;

      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait before polling again
      tries++;
    }

    if (!result) {
      return res.status(500).json({ error: "Execution timeout" });
    }

    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      message: result.message,
      status: result.status,
    });
  } catch (err) {
    console.error("⚠️ Judge0 error:", err.message);
    res.status(500).json({ error: "Code execution failed" });
  }
});

module.exports = router;
