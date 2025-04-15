import { useEffect } from 'react'
import Home from './pages/home'
import Navbar from './components/Navbar'
import './App.css'
import { Amplify } from 'aws-amplify'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SavedRoadmaps from './pages/saved_roadmaps'
import CourseworkOrganiser from './pages/courseworkOrganiser'

function App() {
  useEffect(() => {
    console.log('Amplify.configure:')
    console.log(Amplify.getConfig())
  }, [])
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/saved" element={<SavedRoadmaps />} />
            <Route path="/coursework" element={<CourseworkOrganiser />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
