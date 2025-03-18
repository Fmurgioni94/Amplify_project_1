import { signOut } from 'aws-amplify/auth'
import { Button } from '@aws-amplify/ui-react'

const Navbar = () => {
  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <div className="w-1/3">
        {/* Section empty for alignment */}
      </div>
      <div className="w-1/3 text-center">
        <h1 className="text-xl font-bold">Goal Breaking App</h1>
      </div>
      <div className="w-1/3 flex justify-end">
        <Button onClick={handleSignOut} variation="primary">
          Sign Out
        </Button>
      </div>
    </nav>
  )
}

export default Navbar 