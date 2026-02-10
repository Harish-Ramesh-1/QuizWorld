
import { NavLink } from 'react-router-dom'

const Home = () => {
 

  return (
    <>
      <h1 className='text-4xl font-bold text-center'>Welcome to QuizWorld</h1>

      <div className='homebtns'>
        <button className='bg-green-400 h-20 w-36 text-center cursor-pointer'><NavLink to="/Login">Login</NavLink></button>
        <button className='bg-blue-400 h-20 w-44 text-center cursor-pointer'><NavLink to="/Signup">Signup</NavLink></button>
      </div>

    </>
  )
}

export default Home
