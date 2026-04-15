import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Award,
  TrendingUp,
  Calendar,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { userApi } from '@/services/api';
import type { User, Badge as BadgeType, ActivityData } from '@/types';

const ExpertProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      console.log("yes id",typeof id);
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const [profileRes, statsRes] = await Promise.all([
        userApi.getById(id!),
        userApi.getStats(id!)
      ]);
      console.log("yes called", profileRes);
      setProfile(profileRes.data.user);
      setBadges(profileRes.data.user.badges || []);
      setActivity(profileRes.data.recentActivity || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
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

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
        <Button asChild>
          <Link to="/experts">Back to Experts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatarUrl} />
              <AvatarFallback className="text-2xl">
                {profile.firstName[0]}{profile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-muted-foreground">{profile.jobTitle}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                {profile.department && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {profile.department}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(profile.createdAt || '').toLocaleDateString()}
                </span>
              </div>
              {profile.bio && (
                <p className="mt-4 text-muted-foreground">{profile.bio}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="text-center px-4 py-2 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{profile.reputationScore}</p>
                <p className="text-xs text-muted-foreground">Reputation</p>
              </div>
              <div className="text-center px-4 py-2 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{profile.totalPoints}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{profile.questionsAnswered}</p>
            <p className="text-xs text-muted-foreground">Answers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{profile.answersAccepted}</p>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{profile.totalUpvotesReceived}</p>
            <p className="text-xs text-muted-foreground">Upvotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats?.stats?.acceptanceRate || 0}%</p>
            <p className="text-xs text-muted-foreground">Acceptance Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expertise">
        <TabsList>
          <TabsTrigger value="expertise">Expertise</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="expertise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.expertise && profile.expertise.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {profile.expertise.map((exp) => (
                    <div key={exp.id} className="flex items-center gap-3">
                      <Badge variant="secondary" className="flex-1">
                        {exp.name}
                      </Badge>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= exp.level
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No expertise listed</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Earned Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="text-center p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="font-medium text-sm">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.category}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No badges earned yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length > 0 ? (
                <div className="space-y-4">
                  {activity.slice(0, 10).map((act, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="text-sm">{act.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpertProfilePage;
