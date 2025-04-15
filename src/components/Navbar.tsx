import { Link, useLocation } from 'react-router-dom'
import { signOut } from 'aws-amplify/auth'
import { Button } from '@aws-amplify/ui-react'

function isActive(path: string, location: string) {
  return location === path ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
}

const Navbar = () => {
  const location = useLocation().pathname
  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <div className="w-1/3 flex gap-4">
        <Link
          to="/"
          className={`px-4 py-2 rounded-lg bg-gray-100 text-gray-700 ${isActive('/', location)}`}
        >
          Home
        </Link>
        <Link
          to="/coursework"
          className={`px-4 py-2 rounded-lg bg-gray-100 text-gray-700 ${isActive('/coursework', location)}`}
        >
          Coursework
        </Link>
      </div>
      <div className="w-1/3 text-center">
        <h1 className="text-xl font-bold">Goal Breaking App</h1>
      </div>
      <div className="w-1/3 flex justify-end gap-4">
        <Link
          to="/saved"
          className={`px-4 py-2 rounded-lg bg-gray-100 text-gray-700 ${isActive('/saved', location)}`}
        >
          View Saved
        </Link>
        <Button onClick={handleSignOut} variation="primary">
          Sign Out
        </Button>
      </div>
    </nav>
  )
}

export default Navbar 