import { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Play, Plus, Clock, BookOpen, Brain, LogOut, Search, AlertCircle } from 'lucide-react'
import { storage, VideoSession } from '../utils/storage'

interface User {
  id: string
  email: string
  displayName?: string
}

interface DashboardProps {
  user: User
  onVideoSelect: (videoId: string) => void
}

export function Dashboard({ user, onVideoSelect }: DashboardProps) {
  const [videoUrl, setVideoUrl] = useState('')
  const [recentSessions, setRecentSessions] = useState<VideoSession[]>([])
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')

  const loadRecentSessions = useCallback(async () => {
    try {
      // Check database availability first
      const isDbAvailable = await storage.checkDatabaseAvailability()
      setDbStatus(isDbAvailable ? 'available' : 'unavailable')
      
      const sessions = await storage.getVideoSessions(user.id)
      setRecentSessions(sessions.slice(0, 6)) // Show only 6 recent sessions
    } catch (error) {
      console.warn('Failed to load sessions, using empty state:', error)
      setDbStatus('unavailable')
      setRecentSessions([])
    }
  }, [user.id])

  useEffect(() => {
    loadRecentSessions()
  }, [loadRecentSessions])

  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const handleStartLearning = async () => {
    if (!videoUrl.trim()) return

    const videoId = extractVideoId(videoUrl)
    if (!videoId) {
      alert('Please enter a valid YouTube URL')
      return
    }

    setLoading(true)
    try {
      // Create or update session
      const existingSession = recentSessions.find(s => s.video_id === videoId)
      if (!existingSession) {
        const newSession: VideoSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          video_id: videoId,
          title: 'Loading...',
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          progress: 0,
          duration: 0,
          last_watched: new Date().toISOString(),
          user_id: user.id
        }
        
        await storage.saveVideoSession(newSession)
        setRecentSessions(prev => [newSession, ...prev.slice(0, 5)])
      }
      
      onVideoSelect(videoId)
    } catch (error) {
      console.error('Failed to start session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    // Import blink for logout
    import('../blink/client').then(({ blink }) => {
      blink.auth.logout()
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatProgress = (progress: number, duration: number) => {
    if (duration === 0) return '0%'
    return `${Math.round((progress / duration) * 100)}%`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">Pause Learn</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.displayName || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Database Status Banner */}
        {dbStatus === 'unavailable' && (
          <div className="mb-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Running in offline mode
                    </p>
                    <p className="text-xs text-blue-700">
                      Your learning sessions are being saved locally. All features are fully functional!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Start Learning Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Start Learning</h1>
          <p className="text-muted-foreground mb-6">
            Paste any YouTube URL to begin your AI-powered learning session
          </p>
          
          <Card className="max-w-2xl">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="text-base"
                  />
                </div>
                <Button 
                  onClick={handleStartLearning}
                  disabled={loading || !videoUrl.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Start Learning
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Continue Learning</h2>
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>

          {recentSessions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No learning sessions yet</h3>
                <p className="text-muted-foreground">
                  Start your first learning session by pasting a YouTube URL above
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSessions.map((session) => (
                <Card 
                  key={session.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => onVideoSelect(session.video_id)}
                >
                  <div className="relative">
                    <img 
                      src={session.thumbnail} 
                      alt={session.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors rounded-t-lg" />
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white">
                        {formatDuration(session.duration)}
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: formatProgress(session.progress, session.duration) }}
                      />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-2 mb-2">{session.title}</h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatProgress(session.progress, session.duration)} complete
                      </div>
                      <div className="flex items-center">
                        <Brain className="w-3 h-3 mr-1" />
                        AI Ready
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Learning Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentSessions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hours Learned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(recentSessions.reduce((acc, s) => acc + s.progress, 0) / 3600)}h
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Insights Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentSessions.reduce((acc, s) => acc + Math.floor(s.progress / 300), 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}