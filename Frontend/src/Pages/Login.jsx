import {useState , useEffect} from 'react'
import { NavLink , useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          navigate("/Quiz/");
        }
      } catch {
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`,{
          method: "POST",
          headers: {"content-type":"application/json"},
          credentials: "include",
          body: JSON.stringify(form)
        })

        let responseData = null;
        try {
          responseData = await res.json();
        } catch {
          responseData = null;
        }

        setForm({email: "",password: ""})

        if(res.ok){
          navigate('/Quiz/')
        }else{
          alert(responseData?.message || "Invalid Login")
        }
      } catch {
        alert("Unable to connect to server. Please make sure backend is running and CORS is configured.");
      }
  }

  return (
    <main className='page-wrap flex justify-center items-center'>
      <section className='premium-card w-full max-w-lg p-8'>
        <h1 className='text-4xl font-bold card-title'>Login to QuizWorld</h1>
        <p className='text-secondary mt-2'>Have an account? Enter your details to continue.</p>

        <div className='flex flex-col justify-center items-center gap-5 mt-7'>
          <form className='flex flex-col gap-4 justify-center items-center w-full' onSubmit={handleSubmit}>
              <input type="text" name="email" placeholder="Email" className='inputbtns' onChange={handleChange} value={form.email}/>
              <input type="password" name="password" placeholder="Password" className='inputbtns' onChange={handleChange} value={form.password}/>
              <button type="submit" className='btn-primary w-full max-w-90'>Login</button>
          </form>
          <span className='text-secondary text-sm'>Or</span>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
            className='GoogleLogo'
          />
          <h4 className='text-secondary'>Don't have an account? <NavLink to="/Signup" className='text-[#C6A75E] hover:text-[#E5C97A]'>Register Here.</NavLink></h4>
        </div>
      </section>
    </main>
  )
}

export default Login
