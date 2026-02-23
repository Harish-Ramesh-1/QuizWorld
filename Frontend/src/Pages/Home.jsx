
import { NavLink } from 'react-router-dom'

const Home = () => {
  return (
    <main className='page-wrap flex justify-center items-center'>
      <section className='premium-card w-full max-w-3xl p-10 text-center'>
        <h1 className='text-4xl font-bold card-title'>Welcome to QuizWorld</h1>
        <p className='text-secondary mt-3'>Black for authority, gold for action. Step in and play your way.</p>

        <div className='homebtns'>
          <NavLink to="/Login" className='btn-primary min-w-32'>Login</NavLink>
          <NavLink to="/Signup" className='btn-secondary min-w-32'>Signup</NavLink>
        </div>
      </section>
    </main>
  )
}

export default Home
