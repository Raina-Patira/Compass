import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Award,
  Flame,
  ArrowRight,
  Plus,
  Users,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { questionsApi, quizApi } from '@/services/api';
import type { Question, Quiz } from '@/types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [dailyQuiz, setDailyQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questionsRes, quizRes] = await Promise.all([
          questionsApi.getAll({ limit: 5, sortBy: 'newest' }),
          quizApi.getDaily()
        ]);
        setRecentQuestions(questionsRes.data.questions);
        setDailyQuiz(quizRes.data.quiz);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: 'Questions Asked',
      value: user?.questionsAsked || 0,
      icon: MessageSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Answers Given',
      value: user?.questionsAnswered || 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Reputation',
      value: user?.reputationScore || 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Total Points',
      value: user?.totalPoints || 0,
      icon: Award,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    }
  ];

  const nextBadgeProgress = Math.min(((user?.totalPoints || 0) / 1000) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your knowledge community
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/questions">
              Browse Questions
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild>
            <Link to="/ask">
              <Plus className="w-4 h-4 mr-2" />
              Ask Question
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Questions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Questions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/questions">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : recentQuestions.length > 0 ? (
                <div className="space-y-4">
                  {recentQuestions.map((question) => (
                    <Link
                      key={question.id}
                      to={`/questions/${question.id}`}
                      className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors"
                    >
                      <h3 className="font-medium line-clamp-1">{question.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{question.answerCount} answers</span>
                        <span>{question.upvotes} upvotes</span>
                        <span>{question.viewCount} views</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {question.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No questions yet. Be the first to ask!</p>
                  <Button className="mt-4" asChild>
                    <Link to="/ask">Ask a Question</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
                  <Link to="/experts">
                    <Users className="w-6 h-6" />
                    <span>Find Experts</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
                  <Link to="/leaderboard">
                    <Target className="w-6 h-6" />
                    <span>Leaderboard</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
                  <Link to="/quiz">
                    <Award className="w-6 h-6" />
                    <span>Take Quiz</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Daily Streak */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{user?.quizStreak || 0} days</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Longest streak</span>
                  <span className="font-medium">{user?.longestQuizStreak || 0} days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Quiz */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Quiz</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyQuiz ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">{dailyQuiz.title}</h3>
                    <p className="text-sm text-muted-foreground">{dailyQuiz.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      dailyQuiz.difficulty === 'easy' ? 'bg-green-500/10 text-green-600' :
                      dailyQuiz.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-red-500/10 text-red-600'
                    }`}>
                      {dailyQuiz.difficulty}
                    </span>
                    <span className="text-muted-foreground">
                      {dailyQuiz.timeLimitMinutes} minutes
                    </span>
                  </div>
                  <Button className="w-full" asChild>
                    <Link to={`/quiz/${dailyQuiz.id}`}>
                      {dailyQuiz.attempted ? 'Retake Quiz' : 'Start Quiz'}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No daily quiz available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Badge Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Badge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Community Leader</p>
                    <p className="text-sm text-muted-foreground">Reach 1000 reputation</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{user?.reputationScore || 0} / 1000</span>
                  </div>
                  <Progress value={nextBadgeProgress} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expertise Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.expertise && user.expertise.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.expertise.map((exp) => (
                    <span
                      key={exp.id}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {exp.name}
                      <span className="ml-1 text-xs opacity-70">L{exp.level}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No expertise tags yet</p>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/profile">Add expertise</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
