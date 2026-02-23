
import './App.css'
import { createBrowserRouter,RouterProvider } from 'react-router-dom'
import Home from './Pages/Home.jsx'
import Layout from './Layouts/Layout.jsx'
import Layout1 from './Layouts/Layout1.jsx'
import Multiplayer from './Pages/Multiplayer.jsx'
import Login from './Pages/Login.jsx'
import Signup from './Pages/Signup.jsx'
import Quiz from './Pages/Quiz.jsx'
import Singleplayer from './Pages/Singleplayer.jsx'
import ProtectedRoute from './Components/ProtectedRoute.jsx'
import History1 from './Components/history1.jsx'

function App() {
  const routes = createBrowserRouter([
    {
      path: '/',
      element: <Layout1 />,
      children: [
        {
          path: '/',
          element: <Home />
        },
        {
          path: '/Login',
          element: <Login />
        },
        {
          path: '/Signup',
          element: <Signup />
        }
      ]
    },
    {
      path: '/Quiz',
      element: <ProtectedRoute />,
  children: [
    {
      element: <Layout />,
      children: [
        {
          path: '/Quiz/',
          element: <Quiz />
        },
        {
          path: '/Quiz/Multiplayer',
          element: <Multiplayer />
        },
        {
          path: '/Quiz/Singleplayer',
          element: <Singleplayer />
        },
        {
          path: '/Quiz/History',
          element: <History1 />
        }
      ]
      }
      ]
    }
  ])

  return (
    <>
    <RouterProvider router={routes} />

    </>
  )
}

export default App
