import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`,{
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

      setForm({
        username: "",
        email: "",
        password: ""
      })

      if(res.ok){
        navigate("/Quiz/");
      } else {
        alert(responseData?.error || responseData?.message || "Signup failed");
      }
    } catch {
      alert("Unable to connect to server. Please make sure backend is running and CORS is configured.");
    }


  }
  return (
    <main className='page-wrap flex justify-center items-center'>
      <section className='premium-card w-full max-w-lg p-8'>
        <h1 className='text-4xl font-bold card-title'>Signup to QuizWorld</h1>
        <p className='text-secondary mt-2'>Create your profile and start climbing the ranks.</p>

        <div className='flex flex-col justify-center items-center gap-5 mt-7'>
          <form autoComplete='off' className='flex flex-col gap-4 justify-center items-center w-full' onSubmit={handleSubmit}>
              <input type="text" name="username" onChange={handleChange} placeholder="Username" className='inputbtns' value={form.username}/>
              <input type="email" name="email" onChange={handleChange} placeholder="Email" className='inputbtns' value={form.email}/>
              <input type="password" name="password" onChange={handleChange} placeholder="Password" className='inputbtns' value={form.password}/>
              <button type="submit" className='btn-primary w-full max-w-90'>Signup</button>
          </form>
          <span className='text-secondary text-sm'>Or</span>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
            className='GoogleLogo'
          />
          <h4 className='text-secondary'>Already have an account? <NavLink to="/Login" className='text-[#C6A75E] hover:text-[#E5C97A]'>Sign In.</NavLink></h4>
        </div>
      </section>
    </main>
  )
}

export default Signup
