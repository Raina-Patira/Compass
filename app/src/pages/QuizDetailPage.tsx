import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trophy,
  Flame,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { quizApi } from '@/services/api';
import type { QuizDetail as QuizDetailType } from '@/types';
import { toast } from 'sonner';

const QuizDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizDetailType | null>(null);
  const [attemptId, setAttemptId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchQuiz();
    }
  }, [id]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isStarted && timeLeft > 0 && !isCompleted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft, isCompleted]);

  const fetchQuiz = async () => {
    try {
      const response = await quizApi.getById(id!);
      setQuiz(response.data.quiz);
      setTimeLeft((response.data.quiz.timeLimitMinutes || 10) * 60);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
      toast.error('Failed to load quiz');
      navigate('/quiz');
    }
  };

  const handleStart = async () => {
    try {
      const response = await quizApi.start(id!);
      setAttemptId(response.data.attempt.id);
      setIsStarted(true);
    } catch (error) {
      toast.error('Failed to start quiz');
    }
  };

  const handleAnswer = (answer: string) => {
    const question = quiz?.questions[currentQuestion];
    if (question) {
      setAnswers((prev) => ({ ...prev, [question.id]: answer }));
    }
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isCompleted) return;
    
    try {
      const timeTaken = ((quiz?.timeLimitMinutes || 10) * 60) - timeLeft;
      const response = await quizApi.submit(id!, {
        attemptId,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer
        })),
        timeTakenSeconds: timeTaken
      });
      setResult(response.data.result);
      setIsCompleted(true);
      toast.success('Quiz completed!');
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quiz) return null;

  // Start Screen
  if (!isStarted && !isCompleted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/quiz')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
            <p className="text-muted-foreground mb-6">{quiz.description}</p>
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-2xl font-bold">{quiz.questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{quiz.timeLimitMinutes}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{quiz.totalPoints}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
            </div>
            <Button size="lg" onClick={handleStart}>
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Result Screen
  if (isCompleted && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Quiz Completed!</h1>
            <p className="text-muted-foreground mb-6">
              Great job! Here's how you performed
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{result.score}%</p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{result.correctAnswers}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">+{result.earnedPoints}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
            </div>

            {result.streakBonus > 0 && (
              <div className="flex items-center justify-center gap-2 mb-6 text-orange-600">
                <Flame className="w-5 h-5" />
                <span>Streak bonus: +{result.streakBonus} points!</span>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/quiz')}>
                Back to Quizzes
              </Button>
              <Button onClick={() => window.location.reload()}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz Screen
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/quiz')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Exit
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className={`font-mono ${timeLeft < 60 ? 'text-red-500' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-medium mb-6">{question.question}</h2>

          <RadioGroup
            value={answers[question.id] || ''}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-accent cursor-pointer"
                onClick={() => handleAnswer(option)}
              >
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentQuestion === quiz.questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={answeredCount < quiz.questions.length}
          >
            Submit Quiz
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizDetailPage;
