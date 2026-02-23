import logoutIcon from '../assets/icons/logout.svg'
import { NavLink, useNavigate } from 'react-router-dom'; 

const Navbar = () => {

  const navigate = useNavigate();

  const handleclick = async(e) => {
    e.preventDefault();

      const res = await fetch("http://localhost:3000/auth/logout", {
          method: "GET",
          credentials: "include",

      })

       if(res.ok){
        navigate('/login')
      }
  } 
  return (
    <>
    <div className='Navbarmain'>
      <div className='navbar-inner'>
        <div className='logo-wrap'>
          <span className='flame' aria-hidden='true'></span>
          <span>QuizWorld</span>
        </div>

        <ul className='flex flex-row justify-center gap-8'>
            <li>
              <NavLink to="/Quiz/Singleplayer" className={({ isActive }) => `Navbarbtn ${isActive ? 'active' : ''}`}>Singleplayer</NavLink>
            </li>
            <li>
              <NavLink to="/Quiz/Multiplayer" className={({ isActive }) => `Navbarbtn ${isActive ? 'active' : ''}`}>Multiplayer</NavLink>
            </li>
        </ul>

        <button className='btn-danger flex items-center gap-2' onClick={handleclick}>
          <img src={logoutIcon} alt="Logout" className='w-5 h-5' />
          Logout
        </button>
      </div>
    </div>
    </>
  )
}

export default Navbar