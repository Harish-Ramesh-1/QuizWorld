import logoutIcon from '../assets/icons/logout.svg'
import { useNavigate } from 'react-router-dom'; 

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
      <div></div>
    <ul className='flex flex-row justify-center gap-20'>
        <li className='Navbarbtn'>Singleplayer</li>
        <li className='Navbarbtn'>Multiplayer</li>
    </ul>
    <button className='text-red-500 font-bold flex items-center gap-2 ml-10 cursor-pointer hover:text-red-600' onClick={handleclick}>
      <img src={logoutIcon} alt="Logout" className='w-6 h-6' />
      Logout
    </button>
    </div>
    </>
  )
}

export default Navbar