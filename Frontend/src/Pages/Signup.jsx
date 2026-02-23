import { useState } from 'react'
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

    await res.json();

    if(res.ok){
      navigate("/Quiz");
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
