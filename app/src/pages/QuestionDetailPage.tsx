import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { questionsApi, answersApi } from '@/services/api';
import type { QuestionDetail as QuestionDetailType } from '@/types';
import { toast } from 'sonner';

const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState<QuestionDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relatedQuestions, setRelatedQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchQuestion();
      fetchRelatedQuestions();
    }
  }, [id]);

  const fetchQuestion = async () => {
    setIsLoading(true);
    try {
      const response = await questionsApi.getById(id!);
      setQuestion(response.data.question);
      console.log("yes",response.data )
    } catch (error) {
      console.error('Failed to fetch question:', error);
      toast.error('Failed to load question');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedQuestions = async () => {
    try {
      const response = await questionsApi.getRelated(id!);
      setRelatedQuestions(response.data.relatedQuestions);
    } catch (error) {
      console.error('Failed to fetch related questions:', error);
    }
  };

  const handleVote = async (type: 'question' | 'answer', targetId: string, voteType: number) => {
    try {
      if (type === 'question') {
        await questionsApi.vote(targetId, voteType);
      } else {
        await answersApi.vote(targetId, voteType);
      }
      fetchQuestion();
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    setIsSubmitting(true);
    try {
      await answersApi.create({
        questionId: id!,
        content: answerContent
      });
      toast.success('Answer posted successfully!');
      setAnswerContent('');
      fetchQuestion();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to post answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await answersApi.accept(answerId);
      toast.success('Answer accepted!');
      fetchQuestion();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept answer');
    }
  };

  const handleDeleteQuestion = async () => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await questionsApi.delete(id!);
      toast.success('Question deleted');
      navigate('/questions');
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Question not found</h2>
        <Button asChild>
          <Link to="/questions">Back to Questions</Link>
        </Button>
      </div>
    );
  }

  const isAuthor = user?.id === question.author?.id;
  const hasAcceptedAnswer = question.answers.some(a => a.isAccepted);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Question */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Voting */}
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleVote('question', question.id, 1)}
                    className={question.userVote === 1 ? 'text-primary' : ''}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </Button>
                  <span className="text-lg font-bold">{question.upvotes}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleVote('question', question.id, -1)}
                    className={question.userVote === -1 ? 'text-destructive' : ''}
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(question.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {question.viewCount} views
                    </span>
                    <Badge variant={question.status === 'answered' ? 'default' : 'secondary'}>
                      {question.status}
                    </Badge>
                  </div>
                  <div className="prose dark:prose-invert max-w-none mb-4">
                    {question.content}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={question.author?.avatarUrl} />
                        <AvatarFallback>
                          {question.author?.firstName?.[0]}{question.author?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {question.author?.firstName} {question.author?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {question.author?.reputationScore} reputation
                        </p>
                      </div>
                    </div>
                    {isAuthor && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDeleteQuestion} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Answers */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {question.answers.length} {question.answers.length === 1 ? 'Answer' : 'Answers'}
            </h2>
            <div className="space-y-4">
              {question.answers.map((answer) => (
                <Card key={answer.id} className={answer.isAccepted ? 'border-green-500' : ''}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Voting */}
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVote('answer', answer.id, 1)}
                          className={answer.userVote === 1 ? 'text-primary' : ''}
                        >
                          <ThumbsUp className="w-5 h-5" />
                        </Button>
                        <span className="text-lg font-bold">{answer.upvotes}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVote('answer', answer.id, -1)}
                          className={answer.userVote === -1 ? 'text-destructive' : ''}
                        >
                          <ThumbsDown className="w-5 h-5" />
                        </Button>
                        {answer.isAccepted && (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="prose dark:prose-invert max-w-none mb-4">
                          {answer.content}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={answer.author?.avatarUrl} />
                              <AvatarFallback>
                                {answer.author?.firstName?.[0]}{answer.author?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {answer.author?.firstName} {answer.author?.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {answer.author?.reputationScore} reputation
                              </p>
                            </div>
                          </div>
                          {isAuthor && !hasAcceptedAnswer && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcceptAnswer(answer.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Post Answer */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Answer</h3>
              <form onSubmit={handleSubmitAnswer}>
                <Textarea
                  placeholder="Write your answer here..."
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  rows={6}
                  className="mb-4"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !answerContent.trim()}
                >
                  {isSubmitting ? 'Posting...' : 'Post Answer'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Related Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedQuestions.length > 0 ? (
                <div className="space-y-3">
                  {relatedQuestions.map((q) => (
                    <Link
                      key={q.id}
                      to={`/questions/${q.id}`}
                      className="block text-sm hover:text-primary line-clamp-2"
                    >
                      {q.title}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No related questions</p>
              )}
            </CardContent>
          </Card>

          {/* Question Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Question Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asked</span>
                  <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span>{question.viewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Answers</span>
                  <span>{question.answers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upvotes</span>
                  <span>{question.upvotes}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Import missing components
import { CardHeader, CardTitle } from '@/components/ui/card';

export default QuestionDetailPage;
