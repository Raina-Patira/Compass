import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { leaderboardApi } from '@/services/api';
import type { LeaderboardEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState('points');

  useEffect(() => {
    fetchLeaderboard();
    fetchDepartments();
  }, [category]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await leaderboardApi.getAll({ category });
      setLeaderboard(response.data.leaderboard);
      setUserRank(response.data.userRank);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await leaderboardApi.getDepartments();
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top contributors and achievers in your organization
        </p>
      </div>

      {/* User's Rank */}
      {userRank && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-2xl font-bold">#{userRank}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Your Points</p>
                <p className="text-2xl font-bold">{user?.totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="individuals">
        <TabsList>
          <TabsTrigger value="individuals">Top Contributors</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="individuals" className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2">
            {[
              { value: 'points', label: 'Total Points', icon: Trophy },
              { value: 'reputation', label: 'Reputation', icon: Star },
              { value: 'answers', label: 'Most Answers', icon: TrendingUp }
            ].map((cat) => (
              <Badge
                key={cat.value}
                variant={category === cat.value ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setCategory(cat.value)}
              >
                <cat.icon className="w-3 h-3 mr-1" />
                {cat.label}
              </Badge>
            ))}
          </div>

          {/* Leaderboard Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {leaderboard.map((entry) => (
                    <Link
                      key={entry.id}
                      to={`/profile/${entry.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-accent transition-colors"
                    >
                      <div className="w-8 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={entry.avatarUrl} />
                        <AvatarFallback>
                          {entry.firstName[0]}{entry.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {entry.firstName} {entry.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {entry.jobTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center hidden sm:block">
                          <p className="font-medium">{entry.totalPoints}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="font-medium">{entry.reputationScore}</p>
                          <p className="text-xs text-muted-foreground">reputation</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{entry.answersAccepted}</p>
                          <p className="text-xs text-muted-foreground">accepted</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {departments.map((dept) => (
                  <div
                    key={dept.name}
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="w-8 flex justify-center">
                      {getRankIcon(dept.rank)}
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dept.memberCount} members
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{dept.totalPoints}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{dept.totalAnswers}</p>
                        <p className="text-xs text-muted-foreground">answers</p>
                      </div>
                    </div>
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

export default LeaderboardPage;
