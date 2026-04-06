import Question from "../Models/question.js";

const roomsByCode = new Map();
const roomByUserId = new Map();
const roomTimers = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function ensureUniqueRoomCode() {
  let attempts = 0;
  let code = generateRoomCode();
  while (roomsByCode.has(code) && attempts < 10) {
    code = generateRoomCode();
    attempts++;
  }
  return code;
}

function getTimerKey(roomCode, userId) {
  return `${roomCode}:${userId}`;
}

function clearPlayerTimer(roomCode, userId) {
  const key = getTimerKey(roomCode, userId);
  const timer = roomTimers.get(key);
  if (timer) {
    clearInterval(timer);
    roomTimers.delete(key);
  }
}

function clearRoomTimers(roomCode) {
  for (const key of roomTimers.keys()) {
    if (key.startsWith(`${roomCode}:`)) {
      const timer = roomTimers.get(key);
      if (timer) clearInterval(timer);
      roomTimers.delete(key);
    }
  }
}

function serializeRoom(room) {
  return {
    roomCode: room.roomCode,
    hostId: room.hostId,
    topic: room.topic,
    rounds: room.rounds,
    status: room.status,
    totalQuestions: room.totalQuestions || 0,
    participants: Array.from(room.participants.values()).map((player) => ({
      userId: player.userId,
      username: player.username,
      score: player.score || 0,
      waitingForRound: !!player.waitingForRound,
      finished: !!player.finished
    }))
  };
}

function serializeLeaderboard(room) {
  return Array.from(room.participants.values())
    .map((player) => ({
      userId: player.userId,
      username: player.username,
      score: player.score || 0
    }))
    .sort((a, b) => b.score - a.score);
}

function emitLeaderboard(io, roomCode) {
  const room = roomsByCode.get(roomCode);
  if (!room) return;

  io.to(roomCode).emit("multiplayerLeaderboardUpdate", {
    roomCode,
    leaderboard: serializeLeaderboard(room)
  });
}

function emitRoundWaitStatus(io, roomCode) {
  const room = roomsByCode.get(roomCode);
  if (!room || room.status !== "live") return;

  const totalPlayers = room.participants.size;
  const readyCount = Array.from(room.participants.values()).filter(
    (player) => player.waitingForRound || player.finished
  ).length;

  io.to(roomCode).emit("waitingForPlayers", {
    readyCount,
    totalPlayers
  });
}

function roundEndIndex(currentIndex, totalQuestions) {
  const currentRound = Math.floor(currentIndex / 5) + 1;
  return Math.min(currentRound * 5, totalQuestions);
}

function emitPlayerQuestion(io, roomCode, userId) {
  const room = roomsByCode.get(roomCode);
  if (!room || room.status !== "live") return;

  const player = room.participants.get(userId);
  if (!player || !player.socketId || player.finished) return;

  const questionIndex = player.currentQuestionIndex || 0;
  const question = player.questions?.[questionIndex];
  if (!question) {
    player.finished = true;
    return;
  }

  player.answered = false;
  player.selectedAnswer = null;
  player.endTime = Date.now() + 30000;

  io.to(player.socketId).emit("multiplayerQuestion", {
    roomCode,
    questionIndex,
    totalQuestions: room.totalQuestions,
    question: question.question,
    options: question.options,
    Qno: question.Qno,
    timeLeft: 30,
    round: Math.floor(questionIndex / 5) + 1,
    questionInRound: (questionIndex % 5) + 1,
    totalRounds: room.rounds
  });

  startPlayerTimer(io, roomCode, userId);
}

function startPlayerTimer(io, roomCode, userId) {
  clearPlayerTimer(roomCode, userId);

  const key = getTimerKey(roomCode, userId);
  const interval = setInterval(() => {
    const room = roomsByCode.get(roomCode);
    if (!room || room.status !== "live") {
      clearInterval(interval);
      roomTimers.delete(key);
      return;
    }

    const player = room.participants.get(userId);
    if (!player || player.finished || !player.socketId) {
      clearInterval(interval);
      roomTimers.delete(key);
      return;
    }

    const timeLeft = Math.ceil((player.endTime - Date.now()) / 1000);

    if (timeLeft <= 0) {
      clearInterval(interval);
      roomTimers.delete(key);
      submitPlayerAnswer(io, roomCode, userId, player.selectedAnswer ?? null);
      return;
    }

    io.to(player.socketId).emit("multiplayerTimerUpdate", { timeLeft });
  }, 1000);

  roomTimers.set(key, interval);
}

function syncRoomProgress(io, roomCode) {
  const room = roomsByCode.get(roomCode);
  if (!room || room.status !== "live") return;

  const players = Array.from(room.participants.values());
  if (!players.length) return;

  const allFinished = players.every((player) => player.finished);
  if (allFinished) {
    endRoomQuiz(io, roomCode);
    return;
  }

  const activePlayers = players.filter((player) => !player.finished);
  const allReadyForNextRound = activePlayers.every((player) => player.waitingForRound);

  if (allReadyForNextRound) {
    for (const player of activePlayers) {
      player.waitingForRound = false;
      emitPlayerQuestion(io, roomCode, player.userId);
    }
    return;
  }

  emitRoundWaitStatus(io, roomCode);
}

function submitPlayerAnswer(io, roomCode, userId, answer) {
  const room = roomsByCode.get(roomCode);
  if (!room || room.status !== "live") return;

  const player = room.participants.get(userId);
  if (!player || player.finished || player.answered) return;

  const questionIndex = player.currentQuestionIndex || 0;
  const question = player.questions?.[questionIndex];
  if (!question) {
    player.finished = true;
    syncRoomProgress(io, roomCode);
    return;
  }

  player.selectedAnswer = answer ?? null;
  player.answered = true;

  clearPlayerTimer(roomCode, userId);

  const isCorrect = player.selectedAnswer === question.answer;
  if (isCorrect) {
    player.score = (player.score || 0) + 1;
  }

  const totalQuestions = room.totalQuestions || player.questions.length;
  const currentRoundEnd = roundEndIndex(questionIndex, totalQuestions);

  player.currentQuestionIndex = questionIndex + 1;

  const hasFinished = player.currentQuestionIndex >= totalQuestions;
  const completedRound = player.currentQuestionIndex >= currentRoundEnd;

  player.finished = hasFinished;
  player.waitingForRound = !hasFinished && completedRound;

  if (player.socketId) {
    io.to(player.socketId).emit("multiplayerAnswerEvaluation", {
      isCorrect,
      correctAnswer: question.answer,
      selectedAnswer: player.selectedAnswer,
      score: player.score,
      roundCompleted: completedRound,
      finished: hasFinished
    });
  }

  emitLeaderboard(io, roomCode);

  if (!hasFinished && !completedRound) {
    setTimeout(() => {
      emitPlayerQuestion(io, roomCode, userId);
    }, 1000);
    return;
  }

  syncRoomProgress(io, roomCode);
}

function endRoomQuiz(io, roomCode) {
  const room = roomsByCode.get(roomCode);
  if (!room) return;

  clearRoomTimers(roomCode);

  room.status = "finished";
  const leaderboard = serializeLeaderboard(room);

  io.to(roomCode).emit("multiplayerQuizFinished", {
    roomCode,
    leaderboard,
    topic: room.topic,
    rounds: room.rounds,
    totalQuestions: room.totalQuestions
  });
}

function removeUserFromRoom(io, roomCode, userId, emitToSelfSocket = null) {
  const room = roomsByCode.get(roomCode);
  if (!room) return;

  clearPlayerTimer(roomCode, userId);
  room.participants.delete(userId);
  roomByUserId.delete(userId);

  if (emitToSelfSocket) {
    emitToSelfSocket.leave(roomCode);
    emitToSelfSocket.emit("roomLeft", { roomCode });
  }

  if (room.participants.size === 0) {
    clearRoomTimers(roomCode);
    roomsByCode.delete(roomCode);
    return;
  }

  if (!room.participants.has(room.hostId)) {
    room.hostId = Array.from(room.participants.keys())[0];
  }

  io.to(roomCode).emit("roomUpdated", { room: serializeRoom(room) });
  syncRoomProgress(io, roomCode);
}

const roomHandler = (io) => {
  io.on("connection", (socket) => {
    socket.on("createRoom", ({ userId, username, topic, rounds }) => {
      const normalizedUserId = String(userId || "").trim();
      const normalizedUsername = String(username || "Player").trim() || "Player";
      const normalizedTopic = String(topic || "").toLowerCase().trim();
      const parsedRounds = Number(rounds);

      if (!normalizedUserId || !normalizedTopic || !Number.isInteger(parsedRounds) || parsedRounds <= 0) {
        socket.emit("roomError", { message: "Invalid room settings." });
        return;
      }

      const currentRoomCode = roomByUserId.get(normalizedUserId);
      if (currentRoomCode) {
        removeUserFromRoom(io, currentRoomCode, normalizedUserId, socket);
      }

      const roomCode = ensureUniqueRoomCode();
      const room = {
        roomCode,
        hostId: normalizedUserId,
        topic: normalizedTopic,
        rounds: parsedRounds,
        status: "waiting",
        participants: new Map(),
        totalQuestions: 0
      };

      room.participants.set(normalizedUserId, {
        userId: normalizedUserId,
        username: normalizedUsername,
        socketId: socket.id,
        score: 0,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answered: false,
        waitingForRound: false,
        finished: false
      });

      roomsByCode.set(roomCode, room);
      roomByUserId.set(normalizedUserId, roomCode);
      socket.join(roomCode);

      socket.emit("roomCreated", { room: serializeRoom(room) });
      io.to(roomCode).emit("roomUpdated", { room: serializeRoom(room) });
    });

    socket.on("joinRoom", ({ roomCode, userId, username }) => {
      const normalizedCode = String(roomCode || "").toUpperCase().trim();
      const normalizedUserId = String(userId || "").trim();
      const normalizedUsername = String(username || "Player").trim() || "Player";

      if (!normalizedCode || !normalizedUserId) {
        socket.emit("roomError", { message: "Room code and user are required." });
        return;
      }

      const room = roomsByCode.get(normalizedCode);
      if (!room) {
        socket.emit("roomError", { message: "Room not found." });
        return;
      }

      if (room.status !== "waiting") {
        socket.emit("roomError", { message: "Quiz has already started for this room." });
        return;
      }

      const currentRoomCode = roomByUserId.get(normalizedUserId);
      if (currentRoomCode && currentRoomCode !== normalizedCode) {
        removeUserFromRoom(io, currentRoomCode, normalizedUserId, socket);
      }

      room.participants.set(normalizedUserId, {
        userId: normalizedUserId,
        username: normalizedUsername,
        socketId: socket.id,
        score: 0,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        answered: false,
        waitingForRound: false,
        finished: false
      });

      roomByUserId.set(normalizedUserId, normalizedCode);
      socket.join(normalizedCode);

      socket.emit("roomJoined", { room: serializeRoom(room) });
      io.to(normalizedCode).emit("roomUpdated", { room: serializeRoom(room) });
    });

    socket.on("leaveRoom", ({ roomCode, userId }) => {
      const normalizedCode = String(roomCode || "").toUpperCase().trim();
      const normalizedUserId = String(userId || "").trim();

      if (!normalizedCode || !normalizedUserId) {
        socket.emit("roomError", { message: "Invalid leave request." });
        return;
      }

      removeUserFromRoom(io, normalizedCode, normalizedUserId, socket);
    });

    socket.on("startRoomQuiz", async ({ roomCode, userId }) => {
      const normalizedCode = String(roomCode || "").toUpperCase().trim();
      const normalizedUserId = String(userId || "").trim();
      const room = roomsByCode.get(normalizedCode);

      if (!room) {
        socket.emit("roomError", { message: "Room not found." });
        return;
      }

      if (room.hostId !== normalizedUserId) {
        socket.emit("roomError", { message: "Only host can start the quiz." });
        return;
      }

      try {
        const normalizedTopic = String(room.topic || "").toLowerCase().trim();
        const parsedRounds = Number(room.rounds);

        const topicCandidates = Array.from(
          new Set([
            normalizedTopic,
            normalizedTopic.replace(/_/g, " ").trim(),
            normalizedTopic.replace(/\s+/g, "_").trim()
          ])
        ).filter(Boolean);

        const availableCount = await Question.countDocuments({ topic: { $in: topicCandidates } });
        if (availableCount <= 0) {
          socket.emit("roomError", { message: `No questions found for topic: ${normalizedTopic}.` });
          return;
        }

        const requestedTotal = parsedRounds * 5;
        const total = Math.min(requestedTotal, availableCount);
        const finalRounds = Math.max(1, Math.ceil(total / 5));

        const baseQuestions = await Question.aggregate([
          { $match: { topic: { $in: topicCandidates } } },
          { $sample: { size: total } }
        ]);

        if (!baseQuestions.length) {
          socket.emit("roomError", { message: "No questions available for the selected topic." });
          return;
        }

        room.status = "live";
        room.questions = baseQuestions;
        room.totalQuestions = baseQuestions.length;
        room.rounds = finalRounds;

        for (const player of room.participants.values()) {
          const shuffledQuestions = [...baseQuestions].sort(() => Math.random() - 0.5);
          player.questions = shuffledQuestions;
          player.score = 0;
          player.currentQuestionIndex = 0;
          player.selectedAnswer = null;
          player.answered = false;
          player.waitingForRound = false;
          player.finished = false;
        }

        emitLeaderboard(io, normalizedCode);
        io.to(normalizedCode).emit("roomQuizStarted", { room: serializeRoom(room) });

        setTimeout(() => {
          for (const participant of room.participants.values()) {
            emitPlayerQuestion(io, normalizedCode, participant.userId);
          }
        }, 800);
      } catch (err) {
        console.error("Error starting room quiz:", err);
        socket.emit("roomError", { message: "Failed to start quiz. Please try again." });
      }
    });

    socket.on("submitRoomAnswer", ({ roomCode, userId, answer }) => {
      const normalizedCode = String(roomCode || "").toUpperCase().trim();
      const normalizedUserId = String(userId || "").trim();

      if (!normalizedCode || !normalizedUserId) return;

      submitPlayerAnswer(io, normalizedCode, normalizedUserId, answer ?? null);
    });

    socket.on("nextRoomQuestion", ({ roomCode, userId }) => {
      const normalizedCode = String(roomCode || "").toUpperCase().trim();
      const normalizedUserId = String(userId || "").trim();
      const room = roomsByCode.get(normalizedCode);
      const player = room?.participants.get(normalizedUserId);

      if (!room || !player) return;

      submitPlayerAnswer(io, normalizedCode, normalizedUserId, player.selectedAnswer ?? null);
    });

    socket.on("disconnect", () => {
      let foundRoomCode = null;
      let foundUserId = null;

      for (const [roomCode, room] of roomsByCode.entries()) {
        for (const [participantId, participant] of room.participants.entries()) {
          if (participant.socketId === socket.id) {
            foundRoomCode = roomCode;
            foundUserId = participantId;
            break;
          }
        }
        if (foundRoomCode) break;
      }

      if (foundRoomCode && foundUserId) {
        removeUserFromRoom(io, foundRoomCode, foundUserId, null);
      }
    });
  });
};

export default roomHandler;
