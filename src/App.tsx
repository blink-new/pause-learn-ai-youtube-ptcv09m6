import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { LandingPage } from './components/LandingPage'
import { Dashboard } from './components/Dashboard'
import { VideoPlayer } from './components/VideoPlayer'

interface User {
  id: string
  email: string
  displayName?: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'player'>('landing')
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
      if (state.user && currentView === 'landing') {
        setCurrentView('dashboard')
      }
    })
    return unsubscribe
  }, [currentView])

  const handleVideoSelect = (videoId: string) => {
    setCurrentVideoId(videoId)
    setCurrentView('player')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setCurrentVideoId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Pause Learn...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  if (currentView === 'player' && currentVideoId) {
    return (
      <VideoPlayer 
        videoId={currentVideoId} 
        onBack={handleBackToDashboard}
        user={user}
      />
    )
  }

  return (
    <Dashboard 
      user={user} 
      onVideoSelect={handleVideoSelect}
    />
  )
}

export default App