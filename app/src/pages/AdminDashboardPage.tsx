import React, { useEffect, useState } from 'react';
import {
  Users,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Activity,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminApi } from '@/services/api';
import type { AdminStats } from '@/types';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Failed to load stats</h2>
        <p className="text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  const { overview, dailyActivity, topContributors, knowledgeGaps } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Organization-wide analytics and insights
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{overview.totalUsers}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +{overview.newUsersToday} today
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{overview.totalQuestions}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +{overview.questionsToday} today
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Answer Rate</p>
                <p className="text-2xl font-bold">{overview.answerRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.answeredQuestions} answered
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quiz Attempts</p>
                <p className="text-2xl font-bold">{overview.quizAttempts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.totalQuizzes} quizzes
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contributors">Top Contributors</TabsTrigger>
          <TabsTrigger value="gaps">Knowledge Gaps</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Daily Activity (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end gap-1">
                  {dailyActivity.map((day, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-primary/20 hover:bg-primary/30 transition-colors rounded-t"
                      style={{ height: `${(day.count / Math.max(...dailyActivity.map(d => d.count))) * 100}%` }}
                      title={`${day.date}: ${day.count} activities`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Open Questions</span>
                    <span className="font-medium">{overview.openQuestions}</span>
                  </div>
                  <Progress value={(overview.openQuestions / overview.totalQuestions) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Answered Questions</span>
                    <span className="font-medium">{overview.answeredQuestions}</span>
                  </div>
                  <Progress value={(overview.answeredQuestions / overview.totalQuestions) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total Answers</span>
                    <span className="font-medium">{overview.totalAnswers}</span>
                  </div>
                  <Progress value={100} className="bg-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contributors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top Contributors (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {topContributors.map((contributor, index) => (
                  <div
                    key={contributor.userId}
                    className="flex items-center gap-4 py-4"
                  >
                    <div className="w-8 flex justify-center font-bold text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm text-primary">
                        {contributor.firstName[0]}{contributor.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {contributor.firstName} {contributor.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">+{contributor.points}</p>
                      <p className="text-xs text-muted-foreground">points earned</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Knowledge Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Topics with many questions but few answers
              </p>
              <div className="divide-y divide-border">
                {knowledgeGaps.map((gap) => (
                  <div key={gap.tagName} className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{gap.tagName}</span>
                      <Badge variant={gap.coverageRate < 50 ? 'destructive' : 'secondary'}>
                        {gap.coverageRate}% coverage
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{gap.questionCount} questions</span>
                      <span>{gap.answerCount} answers</span>
                    </div>
                    <Progress value={gap.coverageRate} className="mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage;
