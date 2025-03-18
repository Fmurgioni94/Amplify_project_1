import { useEffect } from 'react'
import Home from './pages/home'
import Navbar from './components/Navbar'
import './App.css'
import { Amplify } from 'aws-amplify'

function App() {
  useEffect(() => {
    console.log('Amplify.configure:')
    console.log(Amplify.getConfig())
  }, [])
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-20">
        <Home />
      </main>
    </div>
  )
}

export default App
