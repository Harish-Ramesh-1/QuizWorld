import { useState , useEffect} from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
const Signup = () => {
  const navigate = useNavigate();
  const [form,setForm] = useState({
    username: "",
    email: "",
    password: ""
  })

  const handleChange = (e) => {
    setForm({...form,[e.target.name]:e.target.value})
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:3000/auth/signup",{
      method: "POST",
      headers: {"content-type":"application/json"},
      credentials: "include",
      body: JSON.stringify(form)
    })
    
    setForm({
      username: "",
      email: "",
      password: ""
    })

    const data = await res.json();
    console.log(data);

    if(res.ok){
      navigate("/Quiz");
    }


  }
  return (
    <>
      <h1 className='text-5xl'>Signup To QuizWorld</h1>
        <div className='flex flex-col justify-center items-center gap-7 bg-indigo-100 w-180 h-130 mt-10 ml-70 pb-5'>
        <form  autoComplete='off' className='flex flex-col gap-6 justify-center items-center mx-20 mt-16' onSubmit={handleSubmit}>
            <input type="text" name="username" onChange={handleChange} placeholder="Username" className='inputbtns'/>
            <input type="email" name="email" onChange={handleChange} placeholder="Email" className='inputbtns'/>
            <input type="password" name="password" onChange={handleChange} placeholder="Password" className='inputbtns'/>
            <button type="submit" className='bg-blue-200 h-12 w-40 text-center cursor-pointer hover: bg-blue-300'>Signup</button>
        </form>
        <h3>Or</h3>
        <img
    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
    alt="Google logo"
    className='GoogleLogo'
    />
    <div>
    <h4>Already have an account? <NavLink to="/Login" className='text-blue-800'>Sign In.</NavLink></h4>
    </div>
    </div>
    </>
  )
}

export default Signup
