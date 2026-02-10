import {useState , useEffect} from 'react'
import { NavLink , useNavigate } from 'react-router-dom'

const Login = () => {
   const [form,setForm] = useState({
    email: "",
    password: ""
  })
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({...form,[e.target.name]:e.target.value})
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          navigate("/Quiz/");
        }
      } catch (err) {
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
      e.preventDefault();

      const res = await fetch("http://localhost:3000/auth/login",{
        method: "POST",
        headers: {"content-type":"application/json"},
        credentials: "include",
        body: JSON.stringify(form)
      })

      setForm({email: "",password: ""})

      const data = await res.json()
      if(res.ok){
        navigate('/Quiz/')
      }else{
        alert("Invalid Login")
      }
  }

  return (
    <>
        <h1 className='text-5xl'>Login To QuizWorld</h1>
        <p className='p-2'>Have an account, Please enter your details.</p>
        <div className='flex flex-col justify-center items-center gap-7'>
        <form className='flex flex-col gap-6 justify-center items-center mx-20 mt-16' onSubmit={handleSubmit}>
            <input type="text" name="email" placeholder="email" className='inputbtns' onChange={handleChange} value={form.email}/>
            <input type="password" name="password" placeholder="password" className='inputbtns' onChange={handleChange} value={form.password}/>
            <button type="submit" className='bg-blue-200 h-12 w-40 text-center cursor-pointer hover:bg-blue-400' >Login</button>
        </form>
        <h3>Or</h3>
        <img
    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
    alt="Google logo"
    className='GoogleLogo'
    />
    <div>
    <h4>Don't have an account? <NavLink to="/Signup" className='text-blue-800'>Register Here.</NavLink></h4>
    </div>
    </div>
    </>
  )
}

export default Login
