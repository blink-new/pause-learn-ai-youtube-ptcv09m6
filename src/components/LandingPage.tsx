import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Play, Brain, BookOpen, MessageCircle, Clock, Target } from 'lucide-react'
import { blink } from '../blink/client'

export function LandingPage() {
  const handleSignIn = () => {
    blink.auth.login()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
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
            <Button onClick={handleSignIn} className="bg-primary hover:bg-primary/90">
              Sign In with Google
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
            Transform YouTube into
            <span className="text-primary block mt-2">Active Learning</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered summaries, flashcards, and quizzes generated at every pause. 
            Turn passive watching into productive studying.
          </p>
          <Button 
            onClick={handleSignIn}
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 h-auto"
          >
            Start Learning Smarter
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Pause Learn Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Watch Any YouTube Video</h3>
                <p className="text-muted-foreground">
                  Paste any YouTube URL and start watching. Our player tracks your progress automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Pause Insights</h3>
                <p className="text-muted-foreground">
                  Every time you pause, get instant summaries, key points, and generated flashcards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Interactive Quizzes</h3>
                <p className="text-muted-foreground">
                  Test your understanding with AI-generated quizzes based on what you've watched.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Tutor Chat</h3>
                <p className="text-muted-foreground">
                  Ask questions about the content and get instant explanations from your AI tutor.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Resume Anywhere</h3>
                <p className="text-muted-foreground">
                  Your progress is saved automatically. Pick up exactly where you left off.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Study Mode</h3>
                <p className="text-muted-foreground">
                  Switch to focused study sessions with spaced repetition and review materials.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Learn Smarter?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of students who've transformed their YouTube learning experience.
          </p>
          <Button 
            onClick={handleSignIn}
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 h-auto"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Pause Learn. Transform your YouTube learning experience.</p>
        </div>
      </footer>
    </div>
  )
}