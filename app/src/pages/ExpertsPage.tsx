import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Star,
  Award,
  MessageSquare,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { expertsApi } from '@/services/api';
import type { Expert, Tag } from '@/types';

const ExpertsPage: React.FC = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [, setSortBy] = useState('reputation');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchTags();
    fetchExperts();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await expertsApi.getTags();
      setTags(response.data.tags);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchExperts = async (params?: any) => {
    setIsLoading(true);
    try {
      const response = await expertsApi.getAll({
        page: 1,
        limit: 20,
        ...params
      });
      setExperts(response.data.experts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch experts:', error);
    } finally {
      setIsLoading(false);
    }
  };
console.log("yes Experts", experts);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExperts({ search: searchQuery });
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    fetchExperts({ tag });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    fetchExperts({ sortBy: sort });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Expert Directory</h1>
        <p className="text-muted-foreground">
          Find and connect with experts in your organization
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search experts by name or title..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Sort by
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleSortChange('reputation')}>
              Reputation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('answers')}>
              Most Answers
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('points')}>
              Total Points
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedTag === '' ? 'default' : 'secondary'}
          className="cursor-pointer"
          onClick={() => handleTagSelect('')}
        >
          All Experts
        </Badge>
        {tags.slice(0, 15).map((tag) => (
          <Badge
            key={tag.id}
            variant={selectedTag === tag.name ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => handleTagSelect(tag.name)}
          >
            {tag.name}
          </Badge>
        ))}
      </div>

      {/* Experts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : experts.length > 0 ? (
          experts.map((expert) => (
            <Link key={expert.id} to={`/experts/${expert.id}`}>
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={expert.avatarUrl} />
                      <AvatarFallback className="text-lg">
                        {expert.firstName[0]}{expert.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {expert.firstName} {expert.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {expert.jobTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expert.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">{expert.reputationScore}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{expert.questionsAnswered}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{expert.answersAccepted}</span>
                    </div>
                  </div>

                  {expert.expertise && expert.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {expert.expertise.slice(0, 4).map((exp) => (
                        <Badge key={exp.id} variant="secondary" className="text-xs">
                          {exp.name}
                        </Badge>
                      ))}
                      {expert.expertise.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{expert.expertise.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No experts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => fetchExperts({ page: pagination.page - 1 })}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchExperts({ page: pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExpertsPage;
