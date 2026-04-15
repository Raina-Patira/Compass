import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Clock,
  Trophy,
  Flame,
  ChevronRight,
  History,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { quizApi } from '@/services/api';
import type { Quiz, QuizAttempt } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const QuizPage: React.FC = () => {
  const { user } = useAuth();
  const [dailyQuiz, setDailyQuiz] = useState<Quiz | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dailyRes, quizzesRes, historyRes] = await Promise.all([
        quizApi.getDaily(),
        quizApi.getAll(),
        quizApi.getHistory()
      ]);
      setDailyQuiz(dailyRes.data.quiz);
      setQuizzes(quizzesRes.data.quizzes);
      setHistory(historyRes.data.attempts);
    } catch (error) {
      console.error('Failed to fetch quiz data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-600';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'hard':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daily Quiz</h1>
          <p className="text-muted-foreground">
            Test your knowledge and maintain your streak
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-lg">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold">{user?.quizStreak || 0} day streak</span>
          </div>
        </div>
      </div>

      {/* Daily Quiz Card */}
      {dailyQuiz && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Daily Challenge</Badge>
                  <Badge className={getDifficultyColor(dailyQuiz.difficulty)}>
                    {dailyQuiz.difficulty}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold">{dailyQuiz.title}</h2>
                <p className="text-muted-foreground">{dailyQuiz.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {dailyQuiz.timeLimitMinutes} minutes
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Multiple choice
                  </span>
                </div>
              </div>
              <Button size="lg" asChild>
                <Link to={`/quiz/${dailyQuiz.id}`}>
                  {dailyQuiz.attempted ? 'Retake Quiz' : 'Start Quiz'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="quizzes">
        <TabsList>
          <TabsTrigger value="quizzes">All Quizzes</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.filter(q => q.id !== dailyQuiz?.id).map((quiz) => (
              <Card key={quiz.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {quiz.difficulty}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-2">{quiz.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {quiz.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {quiz.timeLimitMinutes} min
                    </div>
                    {quiz.attempted && (
                      <Badge variant="outline" className="text-green-600">
                        <Trophy className="w-3 h-3 mr-1" />
                        {quiz.bestScore}%
                      </Badge>
                    )}
                  </div>
                  <Button className="w-full mt-4" variant="outline" asChild>
                    <Link to={`/quiz/${quiz.id}`}>
                      {quiz.attempted ? 'Retake' : 'Start'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="divide-y divide-border">
                  {history.slice(0, 10).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{(attempt as any).quiz?.title || 'Quiz'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(attempt.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{attempt.score}%</p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.correctAnswers}/{attempt.totalQuestions} correct
                          </p>
                        </div>
                        <div className="w-12 h-12">
                          <Progress value={attempt.score} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No quiz attempts yet</p>
                  <p className="text-sm">Start taking quizzes to see your history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizPage;
