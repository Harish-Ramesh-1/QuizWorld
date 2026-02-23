import { NavLink } from 'react-router-dom'

const Quiz = () => {
  return (
    <main className='page-wrap'>
      <section className='premium-card p-8 text-center'>
        <h1 className='text-3xl font-bold card-title'>Quiz Hub</h1>
        <p className='text-secondary mt-2'>Choose your mode and start competing.</p>
        <div className='homebtns mt-8'>
          <NavLink className='btn-primary min-w-40' to='/Quiz/Singleplayer'>Singleplayer</NavLink>
          <NavLink className='btn-secondary min-w-40' to='/Quiz/Multiplayer'>Multiplayer</NavLink>
        </div>
      </section>
    </main>
  )
}

export default Quiz
