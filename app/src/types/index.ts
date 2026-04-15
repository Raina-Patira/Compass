// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  reputationScore: number;
  totalPoints: number;
  quizStreak: number;
  longestQuizStreak: number;
  questionsAsked: number;
  questionsAnswered: number;
  answersAccepted: number;
  totalUpvotesReceived: number;
  isAdmin: boolean;
  expertise: UserExpertise[];
  badges?: Badge[];
  createdAt?: string;
}

export interface UserExpertise {
  id: string;
  name: string;
  level: number;
  verifiedCount?: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
}

// Question Types
export interface Question {
  id: string;
  title: string;
  content: string;
  status: 'open' | 'answered' | 'closed' | 'archived';
  viewCount: number;
  upvotes: number;
  answerCount: number;
  createdAt: string;
  updatedAt: string;
  author?: Author;
  tags: Tag[];
  aiExtractedTags?: string[];
  userVote?: number | null;
  acceptedAnswerId?: string;
}

export interface QuestionDetail extends Question {
  answers: Answer[];
}

export interface Answer {
  id: string;
  content: string;
  upvotes: number;
  isAiGenerated: boolean;
  isAccepted: boolean;
  createdAt: string;
  author?: Author;
  userVote?: number | null;
}

export interface Author {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  jobTitle?: string;
  reputationScore?: number;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  category?: string;
  expertCount?: number;
}

// Expert Types
export interface Expert {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  jobTitle?: string;
  department?: string;
  reputationScore: number;
  totalPoints: number;
  questionsAnswered: number;
  answersAccepted: number;
  expertise: UserExpertise[];
  matchScore?: number;
  matchingExpertise?: UserExpertise[];
  reason?: string;
}

// Badge Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: 'contribution' | 'expertise' | 'engagement' | 'special';
  earnedAt?: string;
}

// Quiz Types
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimitMinutes?: number;
  category?: Tag;
  attempted: boolean;
  bestScore?: number;
  completedAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  points: number;
}

export interface QuizDetail extends Quiz {
  questions: QuizQuestion[];
  totalQuestions: number;
  totalPoints: number;
  previousAttempts?: QuizAttempt[];
}

export interface QuizAttempt {
  id: string;
  score: number;
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTakenSeconds?: number;
  completedAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  jobTitle?: string;
  department?: string;
  totalPoints: number;
  reputationScore: number;
  questionsAnswered: number;
  answersAccepted: number;
  quizStreak: number;
  totalUpvotesReceived: number;
}

// Dashboard Types
export interface DashboardStats {
  questionsAsked: number;
  questionsAnswered: number;
  answersAccepted: number;
  totalUpvotesReceived: number;
  totalPoints: number;
  reputationScore: number;
  quizStreak: number;
  longestQuizStreak: number;
  acceptanceRate: number;
}

export interface ActivityData {
  date: string;
  count: number;
  description?: string;
  createdAt?: string;
}

// Admin Types
export interface AdminStats {
  overview: {
    totalUsers: number;
    newUsersToday: number;
    totalQuestions: number;
    questionsToday: number;
    openQuestions: number;
    answeredQuestions: number;
    totalAnswers: number;
    answersToday: number;
    totalQuizzes: number;
    quizAttempts: number;
    answerRate: number;
  };
  dailyActivity: ActivityData[];
  topContributors: TopContributor[];
  knowledgeGaps: KnowledgeGap[];
}

export interface TopContributor {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  points: number;
}

export interface KnowledgeGap {
  tagName: string;
  questionCount: number;
  answerCount: number;
  coverageRate: number;
}

// AI Types
export interface ExtractedTag {
  id?: string;
  name: string;
  confidence: number;
  isNew?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
