import express from "express";
import singleHistory from "../Models/singleHistory.js";
import User from "../Models/UserModel.js";
import auth from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.get("/singleplayer", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await singleHistory
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    if (!history.length) {
      return res.json([]);
    }

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.post("/singleplayer", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId, topic, rounds, score, totalQuestions } = req.body;

    if (!gameId || !topic || !rounds || score === undefined || !totalQuestions) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch username from User model
    const user = await User.findById(userId).select("username");
    const username = user?.username || "Player";

    const record = await singleHistory.create({
      gameId,
      userId,
      username,
      topic,
      rounds,
      score,
      totalQuestions
    });

    res.status(201).json(record);
  } catch (err) {
    console.error("Error saving history:", err);
    res.status(500).json({ error: "Failed to save history" });
  }
});

export default router;
