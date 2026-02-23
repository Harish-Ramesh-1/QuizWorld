import Question from "../Models/question.js";
import redisClient from "../Config/redisdb.js";

const timerByUser = new Map();

const socketHandler = (io) => {

  io.on("connection", (socket) => {

    // START QUIZ
    socket.on("startQuiz", async ({ userId, topic, rounds }) => {
      try {
        const normalizedTopic = String(topic || "").toLowerCase().trim();
        const parsedRounds = Number(rounds);

        if (!normalizedTopic || !Number.isInteger(parsedRounds) || parsedRounds <= 0) {
          socket.emit("errorMessage", "Invalid topic or rounds.");
          return;
        }

        const topicCandidates = Array.from(
          new Set([
            normalizedTopic,
            normalizedTopic.replace(/_/g, " ").trim(),
            normalizedTopic.replace(/\s+/g, "_").trim()
          ])
        ).filter(Boolean);

        const availableCount = await Question.countDocuments({ topic: { $in: topicCandidates } });
        if (availableCount <= 0) {
          socket.emit("errorMessage", `No questions found for topic: ${normalizedTopic}.`);
          return;
        }

        const requestedTotal = parsedRounds * 5;
        const total = Math.min(requestedTotal, availableCount);
        const finalRounds = Math.max(1, Math.ceil(total / 5));

        const questions = await Question.aggregate([
          { $match: { topic: { $in: topicCandidates } } },
          { $sample: { size: total } }
        ]);

        if (!questions.length) {
          socket.emit("errorMessage", "No questions available for the selected topic.");
          return;
        }

        if (total < requestedTotal) {
          socket.emit("quizAdjusted", {
            requestedRounds: parsedRounds,
            rounds: finalRounds,
            totalQuestions: total
          });
        }

        const session = {
          questions,
          currentIndex: 0,
          score: 0,
          selectedOption: null,
          endTime: Date.now() + 30000,
          rounds: finalRounds,
          topic: normalizedTopic,
          totalQuestions: total,
          gameId: `quiz:${userId}`
        };

        await redisClient.set(
          `quiz:${userId}`,
          JSON.stringify(session),
          { EX: 1800 }
        );

        sendQuestion(socket, userId);
      } catch {
        socket.emit("errorMessage", "Failed to start quiz. Please try again.");
      }
    });

    socket.on("selectOption", async ({ userId, Qno, option }) => {

      const data = await redisClient.get(`quiz:${userId}`);
      if (!data) return;

      const session = JSON.parse(data);
      const current = session.questions[session.currentIndex];

      if (current.Qno !== Qno) return;

      session.selectedOption = option;

      await redisClient.set(
        `quiz:${userId}`,
        JSON.stringify(session),
        { EX: 1800 }
      );
    });

    socket.on("reconnectPlayer", async ({ userId }) => {

      const data = await redisClient.get(`quiz:${userId}`);
      if (!data) return;

      const session = JSON.parse(data);
      const timeLeft = session.endTime - Date.now();

      if (timeLeft <= 0) {
        submitCurrent(socket, userId);
      } else {
        emitQuestion(socket, session, Math.ceil(timeLeft / 1000));
      }
    });

    socket.on("submitAnswer", async ({ userId }) => {
      await submitCurrent(socket, userId);
    });

  });

  async function sendQuestion(socket, userId) {

    const data = await redisClient.get(`quiz:${userId}`);
    if (!data) return;

    const session = JSON.parse(data);

    session.selectedOption = null;
    session.endTime = Date.now() + 30000;

    await redisClient.set(
      `quiz:${userId}`,
      JSON.stringify(session),
      { EX: 1800 }
    );

    startTimer(socket, userId);
    emitQuestion(socket, session, 30);
  }

  function startTimer(socket, userId) {
    const existingTimer = timerByUser.get(userId);
    if (existingTimer) {
      clearInterval(existingTimer);
      timerByUser.delete(userId);
    }

    const interval = setInterval(async () => {

      const data = await redisClient.get(`quiz:${userId}`);
      if (!data) {
        clearInterval(interval);
        timerByUser.delete(userId);
        return;
      }

      const session = JSON.parse(data);
      const timeLeft = session.endTime - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        timerByUser.delete(userId);
        submitCurrent(socket, userId);
        return;
      }

      socket.emit("timerUpdate", Math.ceil(timeLeft / 1000));

    }, 1000);

    timerByUser.set(userId, interval);
  }

  async function submitCurrent(socket, userId) {

    const data = await redisClient.get(`quiz:${userId}`);
    if (!data) return;

    const session = JSON.parse(data);
    const question = session.questions[session.currentIndex];

    if (session.selectedOption === question.answer) {
      session.score++;
    }

    session.currentIndex++;

    if (session.currentIndex >= session.questions.length) {

      socket.emit("quizFinished", {
        score: session.score,
        total: session.questions.length,
        topic: session.topic,
        rounds: session.rounds,
        totalQuestions: session.totalQuestions,
        gameId: `quiz:${userId}`
      });

      await redisClient.del(`quiz:${userId}`);
      const existingTimer = timerByUser.get(userId);
      if (existingTimer) {
        clearInterval(existingTimer);
        timerByUser.delete(userId);
      }
      return;
    }

    await redisClient.set(
      `quiz:${userId}`,
      JSON.stringify(session),
      { EX: 1800 }
    );

    sendQuestion(socket, userId);
  }

  function emitQuestion(socket, session, timeLeft) {

    const question = session.questions[session.currentIndex];
    const round = Math.floor(session.currentIndex / 5) + 1;

    socket.emit("newQuestion", {
      Qno: question.Qno,
      question: question.question,
      options: question.options,
      round,
      questionInRound: (session.currentIndex % 5) + 1,
      totalRounds: session.rounds,
      timeLeft,
      totalQuestions: session.totalQuestions,
      topic: session.topic,
      gameId: session.gameId || null,
      questionIndex: session.currentIndex
    });
  }
};

export default socketHandler;