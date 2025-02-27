import { useEffect } from 'react'
import Home from './pages/home'
import './App.css'
import { Amplify } from 'aws-amplify'


function App() {
  useEffect(() => {
    console.log('Amplify.configure:')
    console.log(Amplify.getConfig())
  }, [])
  return (
    <>
      <div>
        <Home />
      </div>
    </>
  )
}

export default App
