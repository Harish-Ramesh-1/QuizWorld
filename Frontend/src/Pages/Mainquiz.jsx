import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import socket from '../../socket.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const Mainquiz = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [room, setRoom] = useState(null)
  const [phase, setPhase] = useState('waiting') // 'waiting', 'quiz', 'finished'
  const [message, setMessage] = useState('Connecting to room...')
  const [userInfo, setUserInfo] = useState({ userId: '', username: '' })
  
  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [leaderboard, setLeaderboard] = useState([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [answerResult, setAnswerResult] = useState(null)

  const roomCodeFromState = location.state?.roomCode || ''

  useEffect(() => {
    const loadUserAndRoom = async () => {
      try {
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
        if (!meRes.ok) {
          setMessage('Session expired. Please login again.')
          return
        }
        const meData = await meRes.json()
        const currentUser = {
          userId: meData?.user?.id || '',
          username: meData?.user?.username || 'Player'
        }
        setUserInfo(currentUser)

        const roomCode = roomCodeFromState || sessionStorage.getItem('quizRoomCode') || ''
        if (!roomCode) {
          setMessage('No room selected. Please create or join a room first.')
          return
        }

        sessionStorage.setItem('quizRoomCode', roomCode)
        socket.emit('joinRoom', {
          roomCode,
          userId: currentUser.userId,
          username: currentUser.username
        })
      } catch {
        setMessage('Unable to connect to room right now.')
      }
    }

    const onRoomJoined = ({ room: roomState }) => {
      setRoom(roomState)
      setMessage('Joined waiting room.')
    }

    const onRoomUpdated = ({ room: roomState }) => {
      setRoom(roomState)
      if (roomState.status === 'waiting') {
        setMessage('Waiting for host to start...')
      }
    }

    const onRoomStarted = ({ room: roomState }) => {
      setRoom(roomState)
      setMessage('Quiz starting...')
    }

    const onMultiplayerQuestion = (data) => {
      setPhase('quiz')
      setCurrentQuestion(data)
      setSelectedAnswer(null)
      setHasSubmitted(false)
      setAnswerResult(null)
      setTimeLeft(data.timeLeft || 30)
      setMessage('')
    }

    const onMultiplayerTimerUpdate = ({ timeLeft: time }) => {
      setTimeLeft(time)
    }

    const onMultiplayerAnswerEvaluation = (data) => {
      setHasSubmitted(true)
      setAnswerResult(data)
    }

    const onMultiplayerLeaderboardUpdate = ({ leaderboard: lb }) => {
      setLeaderboard(lb)
    }

    const onWaitingForPlayers = () => {}

    const onMultiplayerQuizFinished = ({ leaderboard: lb, topic, rounds, totalQuestions }) => {
      setPhase('finished')
      setLeaderboard(lb)
      setCurrentQuestion(null)
      setMessage(`Quiz finished! Topic: ${topic}, Rounds: ${rounds}, Total Questions: ${totalQuestions}`)
    }

    const onRoomLeft = () => {
      sessionStorage.removeItem('quizRoomCode')
      navigate('/Quiz/Multiplayer')
    }

    const onRoomError = ({ message: error }) => {
      setMessage(error || 'Room action failed.')
    }

    loadUserAndRoom()
    socket.on('roomJoined', onRoomJoined)
    socket.on('roomUpdated', onRoomUpdated)
    socket.on('roomQuizStarted', onRoomStarted)
    socket.on('multiplayerQuestion', onMultiplayerQuestion)
    socket.on('multiplayerTimerUpdate', onMultiplayerTimerUpdate)
    socket.on('multiplayerAnswerEvaluation', onMultiplayerAnswerEvaluation)
    socket.on('multiplayerLeaderboardUpdate', onMultiplayerLeaderboardUpdate)
    socket.on('multiplayerQuizFinished', onMultiplayerQuizFinished)
    socket.on('waitingForPlayers', onWaitingForPlayers)
    socket.on('roomLeft', onRoomLeft)
    socket.on('roomError', onRoomError)

    return () => {
      socket.off('roomJoined', onRoomJoined)
      socket.off('roomUpdated', onRoomUpdated)
      socket.off('roomQuizStarted', onRoomStarted)
      socket.off('multiplayerQuestion', onMultiplayerQuestion)
      socket.off('multiplayerTimerUpdate', onMultiplayerTimerUpdate)
      socket.off('multiplayerAnswerEvaluation', onMultiplayerAnswerEvaluation)
      socket.off('multiplayerLeaderboardUpdate', onMultiplayerLeaderboardUpdate)
      socket.off('multiplayerQuizFinished', onMultiplayerQuizFinished)
      socket.off('waitingForPlayers', onWaitingForPlayers)
      socket.off('roomLeft', onRoomLeft)
      socket.off('roomError', onRoomError)
    }
  }, [navigate, roomCodeFromState])

  const isHost = useMemo(() => {
    if (!room || !userInfo.userId) return false
    return room.hostId === userInfo.userId
  }, [room, userInfo.userId])

  const hostPresent = useMemo(() => {
    if (!room?.participants?.length || !room?.hostId) return false
    return room.participants.some((player) => player.userId === room.hostId)
  }, [room])

  const startRoomQuiz = () => {
    if (!room || !userInfo.userId) return
    socket.emit('startRoomQuiz', {
      roomCode: room.roomCode,
      userId: userInfo.userId
    })
  }

  const leaveRoom = () => {
    if (!room || !userInfo.userId) {
      sessionStorage.removeItem('quizRoomCode')
      navigate('/Quiz/Multiplayer')
      return
    }

    socket.emit('leaveRoom', {
      roomCode: room.roomCode,
      userId: userInfo.userId
    })
  }

  const submitAnswer = () => {
    if (!currentQuestion || !room || !userInfo.userId || selectedAnswer === null || hasSubmitted) return

    socket.emit('submitRoomAnswer', {
      roomCode: room.roomCode,
      userId: userInfo.userId,
      answer: selectedAnswer
    })

    setHasSubmitted(true)
  }

  const backToMultiplayer = () => {
    sessionStorage.removeItem('quizRoomCode')
    navigate('/Quiz/Multiplayer')
  }

  const backToRoom = () => {
    setPhase('waiting')
    setCurrentQuestion(null)
    setSelectedAnswer(null)
    setHasSubmitted(false)
    setAnswerResult(null)
    setTimeLeft(30)

    if (hostPresent) {
      setMessage('Back in waiting room. Host can start the next round.')
    } else {
      setMessage('Host is not present. Waiting for a new room to be created.')
    }
  }

  if (!room) {
    return (
      <main className='page-wrap'>
        <section className='premium-card p-8 text-center'>
          <h1 className='text-3xl font-bold card-title'>Main Quiz Room</h1>
          <p className='text-secondary mt-3'>{message}</p>
          <button className='btn-secondary mt-5' onClick={() => navigate('/Quiz/Multiplayer')}>Back</button>
        </section>
      </main>
    )
  }

  // WAITING ROOM PHASE
  if (phase === 'waiting') {
    return (
      <main className='page-wrap'>
        <section className='premium-card p-8'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <h1 className='text-3xl font-bold card-title'>Waiting Room • {room.roomCode}</h1>
              <p className='text-secondary mt-1'>Topic: {room.topic} • Rounds: {room.rounds}</p>
            </div>
            <div className='chip-row'>
              <span className='chip'>Waiting</span>
              <span className='chip chip-muted'>{room.participants.length} Players</span>
            </div>
          </div>

          <div className='mt-7 grid gap-4 md:grid-cols-2'>
            <div className='premium-card p-5'>
              <h2 className='card-title text-xl font-semibold'>Waiting Room</h2>
              <p className='text-secondary mt-2'>Share room code <strong>{room.roomCode}</strong> with friends and wait until everyone joins.</p>
              <p className='text-secondary mt-3'>{message}</p>
              {isHost ? (
                <button className='btn-primary mt-4' onClick={startRoomQuiz}>Start Quiz</button>
              ) : (
                <p className='text-secondary mt-4'>
                  {hostPresent
                    ? 'Host will start the quiz once all players are ready.'
                    : 'Host is not present. Waiting for a new room to be created.'}
                </p>
              )}
              <button className='btn-danger mt-3' onClick={leaveRoom}>Leave Room</button>
            </div>

            <div className='premium-card p-5'>
              <h2 className='card-title text-xl font-semibold'>Players Joined</h2>
              <ul className='mt-3 grid gap-2'>
                {room.participants.map((player) => (
                  <li key={player.userId} className='answer-option'>
                    {player.username} {player.userId === room.hostId ? '(Host)' : ''}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // QUIZ QUESTION PHASE with Live Leaderboard Sidebar
  if (phase === 'quiz' && currentQuestion) {
    const timerClass = timeLeft <= 5 ? "timer timer-critical" : timeLeft <= 10 ? "timer timer-low" : "timer";
    const progressPercent = Math.max(0, Math.min(100, (timeLeft / 30) * 100));
    const progressClass = timeLeft <= 10 ? "progress-fill low" : "progress-fill";

    return (
      <main className='page-wrap'>
        <div className='grid gap-4 lg:grid-cols-[1fr_320px]'>
          {/* Main Quiz Section */}
          <section className='premium-card p-8'>
            <div className='quiz-header'>
              <div>
                <p className='text-secondary'>Round {currentQuestion.round} / {currentQuestion.totalRounds}</p>
                <h2 className='text-2xl font-semibold mt-1'>Question {currentQuestion.questionInRound} of 5</h2>
                <p className='text-secondary text-sm mt-1'>Room: {room.roomCode}</p>
              </div>
              <div className='timer-block'>
                <p className='text-secondary'>Time Left</p>
                <p className={timerClass}>{timeLeft}s</p>
              </div>
            </div>

            <div className='progress-track mt-4'>
              <div className={progressClass} style={{ width: `${progressPercent}%` }} />
            </div>

            <div className='question-block'>
              <h3 className='text-xl font-semibold'>{currentQuestion.question}</h3>
              <p className='text-secondary text-sm mt-2'>Choose one option to lock your answer.</p>
            </div>

            <div className='option-grid'>
              {currentQuestion.options.map((opt, i) => {
                let optionClass = 'answer-option option-button';
                if (answerResult) {
                  if (opt === answerResult.correctAnswer) {
                    optionClass += ' correct';
                  } else if (opt === selectedAnswer && !answerResult.isCorrect) {
                    optionClass += ' wrong';
                  }
                } else if (selectedAnswer === opt) {
                  optionClass += ' selected';
                }
                return (
                  <button
                    key={i}
                    className={optionClass}
                    onClick={() => !hasSubmitted && setSelectedAnswer(opt)}
                    disabled={hasSubmitted || !timeLeft}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className='action-row mt-6'>
              <button
                className='btn-primary btn-hero'
                onClick={submitAnswer}
                disabled={selectedAnswer === null || hasSubmitted || !timeLeft}
              >
                {currentQuestion.questionIndex + 1 >= currentQuestion.totalQuestions ? 'Finish' : 'Next'}
              </button>
            </div>
          </section>

          {/* Live Leaderboard Sidebar */}
          <aside className='premium-card p-5'>
            <h2 className='card-title text-xl font-semibold mb-4'>Live Leaderboard</h2>
            <div className='grid gap-2'>
              {leaderboard.map((player, index) => (
                <div 
                  key={player.userId}
                  className={`answer-option p-3 transition-all ${
                    player.userId === userInfo.userId ? 'current-user-row' : ''
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'text-secondary'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className='text-sm'>
                        {player.username.length > 12 ? player.username.substring(0, 12) + '...' : player.username}
                        {player.userId === userInfo.userId ? ' (You)' : ''}
                      </span>
                    </div>
                    <span className='card-title text-lg font-bold'>{player.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    )
  }

  // FINISHED PHASE (Final leaderboard)
  if (phase === 'finished') {
    return (
      <main className='page-wrap'>
        <section className='premium-card p-8'>
          <div className='text-center'>
            <h1 className='text-3xl font-bold card-title'>Quiz Finished!</h1>
            <p className='text-secondary mt-2'>{message}</p>
            <p className='text-secondary mt-1'>Room: {room.roomCode}</p>
          </div>

          <div className='mt-7'>
            <h2 className='card-title text-2xl font-semibold text-center mb-5'>Final Leaderboard</h2>
            <table className='leaderboard w-full'>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => (
                  <tr 
                    key={player.userId}
                    className={player.userId === userInfo.userId ? 'current-user-row' : ''}
                  >
                    <td className={index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}>
                      #{index + 1}
                    </td>
                    <td>{player.username}{player.userId === userInfo.userId ? ' (You)' : ''}</td>
                    <td>{player.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='action-row justify-center mt-7'>
            <button className='btn-primary' onClick={backToMultiplayer}>Back to Multiplayer</button>
            <button className='btn-danger' onClick={backToRoom}>Back to Room</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className='page-wrap'>
      <section className='premium-card p-8 text-center'>
        <h1 className='text-3xl font-bold card-title'>Main Quiz</h1>
        <p className='text-secondary mt-3'>Loading...</p>
      </section>
    </main>
  )
}

export default Mainquiz
