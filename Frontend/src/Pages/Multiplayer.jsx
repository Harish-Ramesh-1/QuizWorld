import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../../socket.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const topics = [
  { value: 'dsa', label: 'DSA' },
  { value: 'dbms', label: 'DBMS' },
  { value: 'os', label: 'OS' },
  { value: 'mern', label: 'MERN STACK' },
  { value: 'aptitude', label: 'APTITUDE' },
  { value: 'gk', label: 'GK' },
  { value: 'cricket', label: 'CRICKET' },
  { value: 'football', label: 'FOOTBALL' },
  { value: 'movies', label: 'MOVIES' },
  { value: 'got_hotd', label: 'GOT HOTD' },
  { value: 'marvel', label: 'MARVEL' }
]

const Multiplayer = () => {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [topic, setTopic] = useState('dsa')
  const [rounds, setRounds] = useState(1)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState({ userId: '', username: '' })

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
        if (!res.ok) {
          setMessage('Please login again to use multiplayer.')
          return
        }
        const data = await res.json()
        setUserInfo({
          userId: data?.user?.id || '',
          username: data?.user?.username || 'Player'
        })
      } catch {
        setMessage('Unable to verify user session.')
      }
    }

    const onRoomCreated = ({ room }) => {
      setLoading(false)
      setShowCreateModal(false)
      setMessage('Room created. Moving to waiting room...')
      navigate('/Quiz/Mainquiz', { state: { roomCode: room.roomCode } })
    }

    const onRoomJoined = ({ room }) => {
      setLoading(false)
      setMessage('Room joined. Moving to waiting room...')
      navigate('/Quiz/Mainquiz', { state: { roomCode: room.roomCode } })
    }

    const onRoomError = ({ message: error }) => {
      setLoading(false)
      setMessage(error || 'Unable to join/create room.')
    }

    loadUser()
    socket.on('roomCreated', onRoomCreated)
    socket.on('roomJoined', onRoomJoined)
    socket.on('roomError', onRoomError)

    return () => {
      socket.off('roomCreated', onRoomCreated)
      socket.off('roomJoined', onRoomJoined)
      socket.off('roomError', onRoomError)
    }
  }, [navigate])

  const joinRoom = () => {
    const trimmedCode = roomCode.trim().toUpperCase()
    if (!trimmedCode) {
      setMessage('Please enter a valid room code.')
      return
    }
    if (!userInfo.userId) {
      setMessage('User session not loaded yet. Try again.')
      return
    }

    setLoading(true)
    setMessage('Joining room...')
    socket.emit('joinRoom', {
      roomCode: trimmedCode,
      userId: userInfo.userId,
      username: userInfo.username
    })
  }

  const createRoom = () => {
    if (!userInfo.userId) {
      setMessage('User session not loaded yet. Try again.')
      return
    }

    setLoading(true)
    setMessage('Creating room...')
    socket.emit('createRoom', {
      userId: userInfo.userId,
      username: userInfo.username,
      topic,
      rounds
    })
  }

  return (
    <main className='page-wrap'>
      <section className='premium-card p-8 text-left'>
        <h1 className='text-3xl font-bold card-title'>Multiplayer Arena</h1>
        <p className='text-secondary mt-2'>Join a live room and compete in real-time quiz battles.</p>

        <div className='mt-6 grid gap-4 md:grid-cols-2'>
          <div className='premium-card p-5'>
            <h2 className='card-title text-xl font-semibold'>Join Room</h2>
            <p className='text-secondary mt-2 mb-3'>Enter room code to join your squad.</p>
            <input
              className='inputbtns max-w-full'
              placeholder='Room code'
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
            <button className='btn-primary mt-4' onClick={joinRoom} disabled={loading}>Join</button>
          </div>

          <div className='premium-card p-5'>
            <h2 className='card-title text-xl font-semibold'>Create Room</h2>
            <p className='text-secondary mt-2 mb-3'>Host a room and invite your friends.</p>
            <button className='btn-secondary mr-3' onClick={() => setShowCreateModal(true)} disabled={loading}>Create</button>
          </div>
        </div>

        {message ? <p className='text-secondary mt-5'>{message}</p> : null}
      </section>

      {showCreateModal ? (
        <div className='modal-overlay'>
          <div className='modal-card'>
            <h2 className='card-title text-2xl font-semibold'>Create Multiplayer Room</h2>
            <p className='text-secondary mt-2'>Choose topic and rounds, then start to open your waiting room.</p>

            <div className='mt-5 grid gap-4'>
              <div>
                <label className='text-secondary text-sm'>Topic</label>
                <select className='inputbtns mt-2 max-w-full' value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {topics.map((entry) => (
                    <option value={entry.value} key={entry.value}>{entry.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className='text-secondary text-sm'>Total Rounds</label>
                <select className='inputbtns mt-2 max-w-full' value={rounds} onChange={(e) => setRounds(Number(e.target.value))}>
                  <option value={1}>1 Round</option>
                  <option value={2}>2 Rounds</option>
                  <option value={3}>3 Rounds</option>
                  <option value={4}>4 Rounds</option>
                  <option value={5}>5 Rounds</option>
                </select>
              </div>
            </div>

            <div className='action-row'>
              <button className='btn-primary' onClick={createRoom} disabled={loading}>Start</button>
              <button className='btn-danger' onClick={() => setShowCreateModal(false)} disabled={loading}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default Multiplayer