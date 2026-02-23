const Multiplayer = () => {
  return (
    <main className='page-wrap'>
      <section className='premium-card p-8 text-left'>
        <h1 className='text-3xl font-bold card-title'>Multiplayer Arena</h1>
        <p className='text-secondary mt-2'>Join a live room and compete in real-time quiz battles.</p>

        <div className='mt-6 grid gap-4 md:grid-cols-2'>
          <div className='premium-card p-5'>
            <h2 className='card-title text-xl font-semibold'>Join Room</h2>
            <p className='text-secondary mt-2 mb-3'>Enter room code to join your squad.</p>
            <input className='inputbtns max-w-full' placeholder='Room code' />
            <button className='btn-primary mt-4'>Join</button>
          </div>

          <div className='premium-card p-5'>
            <h2 className='card-title text-xl font-semibold'>Create Room</h2>
            <p className='text-secondary mt-2 mb-3'>Host a room and invite your friends.</p>
            <button className='btn-secondary mr-3'>Create</button>
            <button className='btn-danger'>Leave</button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Multiplayer