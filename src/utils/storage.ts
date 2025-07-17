import { blink } from '../blink/client'

export interface VideoSession {
  id: string
  video_id: string
  title: string
  thumbnail: string
  progress: number
  duration: number
  last_watched: string
  user_id: string
}

export interface PauseInsight {
  id: string
  session_id: string
  timestamp: number
  summary: string
  flashcards: Array<{ question: string; answer: string }>
  quiz_questions: Array<{ question: string; options: string[]; correct: number }>
  user_id: string
  created_at: string
}

class StorageManager {
  private dbAvailable = true

  async checkDatabaseAvailability(): Promise<boolean> {
    try {
      // Try a simple query to check if database is available
      await blink.db.videoSessions.list({ limit: 1 })
      this.dbAvailable = true
      return true
    } catch (error: any) {
      // Check if it's a database not found error specifically
      if (error?.status === 404 || error?.message?.includes('Database for project') || error?.message?.includes('not found')) {
        console.warn('Database not found for this project, using localStorage fallback')
      } else {
        console.warn('Database temporarily unavailable, using localStorage fallback:', error?.message)
      }
      this.dbAvailable = false
      return false
    }
  }

  // Video Sessions Management
  async getVideoSessions(userId: string): Promise<VideoSession[]> {
    // Always check database availability first
    await this.checkDatabaseAvailability()
    
    if (this.dbAvailable) {
      try {
        return await blink.db.videoSessions.list({
          where: { userId: userId }, // Use camelCase as per SDK docs
          orderBy: { lastWatched: 'desc' },
          limit: 20
        })
      } catch (error) {
        console.warn('Database query failed, falling back to localStorage:', error)
        this.dbAvailable = false
      }
    }

    // Fallback to localStorage
    const sessions = localStorage.getItem(`video_sessions_${userId}`)
    return sessions ? JSON.parse(sessions) : []
  }

  async saveVideoSession(session: VideoSession): Promise<void> {
    // Always check database availability first
    await this.checkDatabaseAvailability()
    
    if (this.dbAvailable) {
      try {
        const existing = await blink.db.videoSessions.list({
          where: { videoId: session.video_id, userId: session.user_id }, // Use camelCase
          limit: 1
        })

        if (existing.length > 0) {
          await blink.db.videoSessions.update(existing[0].id, {
            title: session.title,
            progress: session.progress,
            duration: session.duration,
            lastWatched: session.last_watched // Use camelCase
          })
        } else {
          // Convert to camelCase for database
          await blink.db.videoSessions.create({
            id: session.id,
            videoId: session.video_id,
            title: session.title,
            thumbnail: session.thumbnail,
            progress: session.progress,
            duration: session.duration,
            lastWatched: session.last_watched,
            userId: session.user_id
          })
        }
        return
      } catch (error) {
        console.warn('Database save failed, falling back to localStorage:', error)
        this.dbAvailable = false
      }
    }

    // Fallback to localStorage
    const sessions = await this.getVideoSessions(session.user_id)
    const existingIndex = sessions.findIndex(s => s.video_id === session.video_id)
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.unshift(session)
    }

    // Keep only last 20 sessions
    const limitedSessions = sessions.slice(0, 20)
    localStorage.setItem(`video_sessions_${session.user_id}`, JSON.stringify(limitedSessions))
  }

  // Pause Insights Management
  async getPauseInsights(sessionId: string): Promise<PauseInsight[]> {
    // Always check database availability first
    await this.checkDatabaseAvailability()
    
    if (this.dbAvailable) {
      try {
        return await blink.db.pauseInsights.list({
          where: { sessionId: sessionId }, // Use camelCase
          orderBy: { timestamp: 'asc' }
        })
      } catch (error) {
        console.warn('Database query failed, falling back to localStorage:', error)
        this.dbAvailable = false
      }
    }

    // Fallback to localStorage
    const insights = localStorage.getItem(`pause_insights_${sessionId}`)
    return insights ? JSON.parse(insights) : []
  }

  async savePauseInsight(insight: PauseInsight): Promise<void> {
    // Always check database availability first
    await this.checkDatabaseAvailability()
    
    if (this.dbAvailable) {
      try {
        // Convert to camelCase for database
        await blink.db.pauseInsights.create({
          id: insight.id,
          sessionId: insight.session_id,
          timestamp: insight.timestamp,
          summary: insight.summary,
          flashcards: insight.flashcards,
          quizQuestions: insight.quiz_questions,
          userId: insight.user_id,
          createdAt: insight.created_at
        })
        return
      } catch (error) {
        console.warn('Database save failed, falling back to localStorage:', error)
        this.dbAvailable = false
      }
    }

    // Fallback to localStorage
    const insights = await this.getPauseInsights(insight.session_id)
    insights.push(insight)
    localStorage.setItem(`pause_insights_${insight.session_id}`, JSON.stringify(insights))
  }

  isDatabaseAvailable(): boolean {
    return this.dbAvailable
  }
}

export const storage = new StorageManager()