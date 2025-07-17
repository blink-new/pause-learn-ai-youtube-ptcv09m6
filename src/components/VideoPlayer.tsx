import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Brain, 
  BookOpen, 
  MessageCircle, 
  Clock,
  Lightbulb,
  CheckCircle,
  Send
} from 'lucide-react'
import { blink } from '../blink/client'
import { storage, PauseInsight } from '../utils/storage'

interface User {
  id: string
  email: string
  displayName?: string
}

interface VideoPlayerProps {
  videoId: string
  onBack: () => void
  user: User
}

// PauseInsight interface is now imported from storage utils

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function VideoPlayer({ videoId, onBack, user }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showInsights, setShowInsights] = useState(false)
  const [insights, setInsights] = useState<PauseInsight | null>(null)
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null)
  const [currentFlashcard, setCurrentFlashcard] = useState(0)
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false)

  const playerRef = useRef<HTMLIFrameElement>(null)

  const handlePause = useCallback(async (timestamp: number) => {
    if (timestamp < 30) return // Don't generate insights for very short videos
    
    setGeneratingInsights(true)
    setShowInsights(true)

    try {
      // Generate AI insights based on video content up to this point
      const { text } = await blink.ai.generateText({
        prompt: `Generate learning insights for a YouTube video (ID: ${videoId}) paused at ${Math.floor(timestamp)} seconds. 
        
        Create:
        1. A concise summary of key concepts covered so far
        2. 3-4 important key points as bullet points
        3. 2 flashcard questions with answers
        4. 1 multiple choice quiz question with 4 options
        
        Format as JSON with this structure:
        {
          "summary": "Brief summary...",
          "keyPoints": ["Point 1", "Point 2", "Point 3"],
          "flashcards": [{"question": "Q1?", "answer": "A1"}, {"question": "Q2?", "answer": "A2"}],
          "quiz": [{"question": "Quiz question?", "options": ["A", "B", "C", "D"], "correct": 0}]
        }`
      })

      try {
        const parsedInsights = JSON.parse(text)
        const newInsight: PauseInsight = {
          id: `insight_${Date.now()}`,
          session_id: `session_${videoId}_${user.id}`,
          timestamp,
          summary: parsedInsights.summary,
          flashcards: parsedInsights.flashcards,
          quiz_questions: parsedInsights.quiz,
          user_id: user.id,
          created_at: new Date().toISOString()
        }

        // Save using storage manager
        await storage.savePauseInsight(newInsight)
        setInsights(newInsight)
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        // Fallback insights
        setInsights({
          id: `insight_${Date.now()}`,
          session_id: `session_${videoId}_${user.id}`,
          timestamp,
          summary: "AI-generated summary will appear here when you pause the video.",
          flashcards: [
            { question: "What is the main topic?", answer: "The main topic will be identified from the video content." },
            { question: "What are the key takeaways?", answer: "Key takeaways will be summarized automatically." }
          ],
          quiz_questions: [{ question: "Sample quiz question", options: ["Option A", "Option B", "Option C", "Option D"], correct: 0 }],
          user_id: user.id,
          created_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Failed to generate insights:', error)
    } finally {
      setGeneratingInsights(false)
    }
  }, [videoId, user.id])

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration())
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              const time = event.target.getCurrentTime()
              setCurrentTime(time)
              handlePause(time)
            }
          }
        }
      })
    }

    return () => {
      window.onYouTubeIframeAPIReady = null
    }
  }, [videoId, handlePause])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: Date.now()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setSendingMessage(true)

    try {
      const { text } = await blink.ai.generateText({
        prompt: `You are an AI tutor helping a student understand a YouTube video (ID: ${videoId}). 
        The student is currently at ${Math.floor(currentTime)} seconds into the video.
        
        Student question: "${userMessage.content}"
        
        Provide a helpful, educational response that relates to the video content and helps the student learn.`
      })

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: text,
        timestamp: Date.now()
      }

      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <Play className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="font-medium">Pause Learn</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(currentTime)} / {formatTime(duration)}
              </Badge>
              <Badge variant={isPlaying ? "default" : "secondary"}>
                {isPlaying ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                {isPlaying ? 'Playing' : 'Paused'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <div id="youtube-player" className="w-full h-full"></div>
                </div>
              </CardContent>
            </Card>

            {/* Video Info */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <h1 className="text-xl font-semibold mb-2">Learning Session</h1>
                <p className="text-muted-foreground">
                  Pause the video anytime to get AI-powered summaries, flashcards, and quizzes based on what you've watched.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Panel */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Brain className="w-5 h-5 mr-2 text-accent" />
                  AI Learning Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                {!showInsights ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <Brain className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Pause to Learn</h3>
                    <p className="text-sm text-muted-foreground">
                      Pause the video to get instant AI-generated summaries, flashcards, and quizzes.
                    </p>
                  </div>
                ) : generatingInsights ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h3 className="font-medium mb-2">Generating Insights...</h3>
                    <p className="text-sm text-muted-foreground">
                      AI is analyzing the video content to create personalized learning materials.
                    </p>
                  </div>
                ) : insights ? (
                  <Tabs defaultValue="summary" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 mx-4">
                      <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                      <TabsTrigger value="flashcards" className="text-xs">Cards</TabsTrigger>
                      <TabsTrigger value="quiz" className="text-xs">Quiz</TabsTrigger>
                      <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden">
                      <TabsContent value="summary" className="h-full m-0">
                        <ScrollArea className="h-full px-4">
                          <div className="space-y-4 pb-4">
                            <div>
                              <h4 className="font-medium mb-2 flex items-center">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Summary
                              </h4>
                              <p className="text-sm text-muted-foreground">{insights.summary}</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2 flex items-center">
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Learning Focus
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Use the flashcards and quiz tabs to test your understanding of the content covered so far.
                              </p>
                            </div>
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="flashcards" className="h-full m-0">
                        <div className="h-full flex flex-col p-4">
                          {insights.flashcards.length > 0 && (
                            <>
                              <div className="flex-1 flex flex-col justify-center">
                                <Card className="mb-4">
                                  <CardContent className="p-4 text-center">
                                    <h4 className="font-medium mb-2">
                                      {showFlashcardAnswer ? 'Answer' : 'Question'}
                                    </h4>
                                    <p className="text-sm">
                                      {showFlashcardAnswer 
                                        ? insights.flashcards[currentFlashcard].answer
                                        : insights.flashcards[currentFlashcard].question
                                      }
                                    </p>
                                  </CardContent>
                                </Card>
                                <Button 
                                  onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                                  variant="outline"
                                  className="mb-4"
                                >
                                  {showFlashcardAnswer ? 'Show Question' : 'Show Answer'}
                                </Button>
                              </div>
                              <div className="flex justify-between items-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setCurrentFlashcard(Math.max(0, currentFlashcard - 1))
                                    setShowFlashcardAnswer(false)
                                  }}
                                  disabled={currentFlashcard === 0}
                                >
                                  Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  {currentFlashcard + 1} of {insights.flashcards.length}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setCurrentFlashcard(Math.min(insights.flashcards.length - 1, currentFlashcard + 1))
                                    setShowFlashcardAnswer(false)
                                  }}
                                  disabled={currentFlashcard === insights.flashcards.length - 1}
                                >
                                  Next
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="quiz" className="h-full m-0">
                        <div className="h-full p-4">
                          {insights.quiz_questions.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="font-medium">{insights.quiz_questions[0].question}</h4>
                              <div className="space-y-2">
                                {insights.quiz_questions[0].options.map((option, index) => (
                                  <Button
                                    key={index}
                                    variant={selectedQuizAnswer === index ? "default" : "outline"}
                                    className="w-full justify-start text-left h-auto p-3"
                                    onClick={() => setSelectedQuizAnswer(index)}
                                  >
                                    <span className="mr-2 font-medium">{String.fromCharCode(65 + index)}.</span>
                                    {option}
                                  </Button>
                                ))}
                              </div>
                              {selectedQuizAnswer !== null && (
                                <div className={`p-3 rounded-lg ${
                                  selectedQuizAnswer === insights.quiz_questions[0].correct 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-red-50 border border-red-200'
                                }`}>
                                  <p className="text-sm font-medium">
                                    {selectedQuizAnswer === insights.quiz_questions[0].correct ? '✅ Correct!' : '❌ Incorrect'}
                                  </p>
                                  {selectedQuizAnswer !== insights.quiz_questions[0].correct && (
                                    <p className="text-sm mt-1">
                                      The correct answer is {String.fromCharCode(65 + insights.quiz_questions[0].correct)}.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="chat" className="h-full m-0 flex flex-col">
                        <ScrollArea className="flex-1 px-4">
                          <div className="space-y-3 pb-4">
                            {chatMessages.length === 0 ? (
                              <div className="text-center py-8">
                                <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Ask questions about the video content
                                </p>
                              </div>
                            ) : (
                              chatMessages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                      message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                                  >
                                    {message.content}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                        <div className="p-4 border-t">
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Ask about the video..."
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              disabled={sendingMessage}
                            />
                            <Button 
                              onClick={handleSendMessage}
                              disabled={sendingMessage || !chatInput.trim()}
                              size="sm"
                            >
                              {sendingMessage ? (
                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Extend window object for YouTube API
declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | null
    YT: any
  }
}