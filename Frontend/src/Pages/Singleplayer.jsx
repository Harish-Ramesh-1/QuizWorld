import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import socket from "../../socket.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const getUserId = () => {
  let id = localStorage.getItem("quizUserId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("quizUserId", id);
  }
  return id;
};

const userId = getUserId();

function Quiz() {

  const [topic, setTopic] = useState("dsa");
  const [rounds, setRounds] = useState(1);

  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(null);
  const [started, setStarted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [quizMeta, setQuizMeta] = useState({
    gameId: "",
    topic: "",
    rounds: 0,
    totalQuestions: 0
  });

  const saveHistory = async (quizData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/singleplayer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          gameId: quizData.gameId || `quiz:${userId}`,
          topic: quizData.topic || topic,
          rounds: quizData.rounds || rounds,
          score: quizData.score || 0,
          totalQuestions: quizData.totalQuestions || (rounds * 5)
        })
      });

      if (!response.ok) {
        console.warn("Failed to save history");
      }
    } catch (err) {
      console.error("Error saving history:", err);
    }
  };

  useEffect(() => {

    socket.emit("reconnectPlayer", { userId });

    socket.on("newQuestion", (data) => {
      setStarted(true);
      setQuestion(data);
      setSelectedOption(null);
      setErrorMessage("");
      setNoticeMessage("");
      setQuizMeta({
        gameId: data.gameId || "",
        topic: data.topic || "",
        rounds: data.totalRounds || 0,
        totalQuestions: data.totalQuestions || 0
      });
    });

    socket.on("timerUpdate", (seconds) => {
      setQuestion(prev => (prev ? { ...prev, timeLeft: seconds } : prev));
    });

    socket.on("quizFinished", (data) => {
      setScore(data.score);
      setStarted(false);
      setQuestion(null);
      setQuizMeta({
        gameId: data.gameId || "",
        topic: data.topic || "",
        rounds: data.rounds || 0,
        totalQuestions: data.totalQuestions || data.total || 0
      });

      // Save history to the backend
      saveHistory(data);
    });

    socket.on("errorMessage", (message) => {
      setErrorMessage(message || "Unable to start quiz.");
      setStarted(false);
      setQuestion(null);
    });

    socket.on("quizAdjusted", ({ requestedRounds, rounds: adjustedRounds, totalQuestions }) => {
      if (adjustedRounds && requestedRounds && adjustedRounds < requestedRounds) {
        const totalText = totalQuestions ? ` (${totalQuestions} questions available)` : "";
        setNoticeMessage(`Rounds reduced to ${adjustedRounds}${totalText}.`);
      }
    });

    return () => {
      socket.off("newQuestion");
      socket.off("timerUpdate");
      socket.off("quizFinished");
      socket.off("errorMessage");
      socket.off("quizAdjusted");
    };

  }, []);

  const startQuiz = () => {
    setErrorMessage("");
    setNoticeMessage("");
    socket.emit("startQuiz", {
      userId,
      topic,
      rounds
    });
  };

  const selectOption = (option) => {
    setSelectedOption(option);
    socket.emit("selectOption", {
      userId,
      Qno: question.Qno,
      option
    });
  };

  const submitAnswer = () => {
    socket.emit("submitAnswer", { userId });
  };

  const resetToStart = () => {
    setScore(null);
    setStarted(false);
    setQuestion(null);
    setSelectedOption(null);
    setErrorMessage("");
    setNoticeMessage("");
    setTopic("dsa");
    setRounds(1);
  };

  const timeLeft = question?.timeLeft ?? 0;
  const timerClass = timeLeft <= 5 ? "timer timer-critical" : timeLeft <= 10 ? "timer timer-low" : "timer";
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 30) * 100));
  const progressClass = timeLeft <= 10 ? "progress-fill low" : "progress-fill";
  const currentIndex = question?.questionIndex ?? 0;
  const totalQuestions = question?.totalQuestions || (question?.totalRounds ? question.totalRounds * 5 : 0);
  const isLastQuestion = totalQuestions ? currentIndex + 1 >= totalQuestions : false;

  if (score !== null) {
    return (
      <main className="page-wrap singleplayer-shell">
        <section className="premium-card singleplayer-card p-8 text-center">
          <div className="chip-row justify-center">
            <span className="chip">Result</span>
            <span className="chip chip-muted">Solo Mode</span>
          </div>
          <h2 className="text-3xl font-bold card-title mt-4">Quiz Finished</h2>
          <p className="text-secondary mt-2">You have completed the round.</p>
          <div className="score-ring mt-6">
            <p className="text-sm text-secondary">Final Score</p>
            <p className="text-4xl font-semibold card-title mt-2">{score}</p>
          </div>
          <div className="mt-6 grid gap-2 text-sm text-secondary">
            {quizMeta.gameId ? <p>Game ID: {quizMeta.gameId}</p> : null}
            {quizMeta.topic ? <p>Topic: {quizMeta.topic}</p> : null}
            {quizMeta.rounds ? <p>Rounds: {quizMeta.rounds}</p> : null}
            {quizMeta.totalQuestions ? <p>Total Questions: {quizMeta.totalQuestions}</p> : null}
          </div>
          <div className="action-row justify-center mt-6">
            <button className="btn-primary btn-hero" onClick={() => setScore(null)}>Restart</button>
            <button className="btn-secondary" onClick={resetToStart}>Back to Singleplayer</button>
          </div>
        </section>
      </main>
    );
  }

  if (!started) {
    return (
      <main className="page-wrap singleplayer-shell">
        <section className="premium-card singleplayer-card p-8">
          <div className="singleplayer-hero">
            <div>
              <p className="hero-eyebrow">Singleplayer</p>
              <h2 className="hero-title">Golden Focus Challenge</h2>
              <p className="hero-sub">Pick a topic, choose rounds, and begin your solo run.</p>
            </div>
            <div className="chip-row">
              <span className="chip">30s per question</span>
              <span className="chip">5 questions per round</span>
            </div>
          </div>

          <div className="settings-grid mt-6">
            <div className="settings-card">
              <h3 className="text-lg font-semibold">Select Topic</h3>
              <select className="inputbtns mt-3" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="dsa">DSA</option>
          <option value="dbms">DBMS</option>
          <option value="os">OS</option>
          <option value="mern">MERN STACK</option>
          <option value="aptitude">APTITUDE</option>
          <option value="gk">GK</option>
          <option value="cricket">CRICKET</option>
          <option value="football">FOOTBALL</option>
          <option value="movies">MOVIES</option>
          <option value="got_hotd">GOT HOTD</option>
          <option value="marvel">MARVEL</option>
              </select>
            </div>

            <div className="settings-card">
              <h3 className="text-lg font-semibold">Select Rounds</h3>
              <select className="inputbtns mt-3" value={rounds} onChange={(e) => setRounds(Number(e.target.value))}>
          <option value={1}>1 Round</option>
          <option value={2}>2 Rounds</option>
          <option value={3}>3 Rounds</option>
          <option value={4}>4 Rounds</option>
          <option value={5}>5 Rounds</option>
              </select>
            </div>
          </div>

          <div className="action-row">
            <button className="btn-primary btn-hero" onClick={startQuiz}>Start Quiz</button>
            <Link to="/Quiz/History" className="btn-secondary">History</Link>
          </div>
          {errorMessage ? (
            <p className="text-secondary text-sm mt-4">{errorMessage}</p>
          ) : null}
          {noticeMessage ? (
            <p className="text-secondary text-sm mt-2">{noticeMessage}</p>
          ) : null}
        </section>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="page-wrap singleplayer-shell">
        <section className="premium-card singleplayer-card p-8 text-center">
          <p className="text-secondary">Preparing your next question…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-wrap singleplayer-shell">
      <section className="premium-card singleplayer-card p-8">
        <div className="quiz-header">
          <div>
            <p className="text-secondary">Round {question.round} / {question.totalRounds}</p>
            <h2 className="text-2xl font-semibold mt-1">Question {question.questionInRound} of 5</h2>
          </div>
          <div className="timer-block">
            <p className="text-secondary">Time Left</p>
            <p className={timerClass}>{timeLeft}s</p>
          </div>
        </div>

        <div className="progress-track mt-4">
          <div className={progressClass} style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="question-block">
          <h3 className="text-xl font-semibold">{question.question}</h3>
          <p className="text-secondary text-sm mt-2">Choose one option to lock your answer.</p>
        </div>

        <div className="option-grid">
          {question.options.map((opt, i) => (
            <button
              key={i}
              className={`answer-option option-button ${selectedOption === opt ? "selected" : ""}`}
              onClick={() => selectOption(opt)}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="action-row mt-6">
          <button className="btn-primary btn-hero" onClick={submitAnswer}>
            {isLastQuestion ? "Submit" : "Next"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default Quiz;