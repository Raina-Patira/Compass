const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "knowflow",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "password",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};

// User Model
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "last_name",
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      field: "avatar_url",
    },
    jobTitle: {
      type: DataTypes.STRING(200),
      field: "job_title",
    },
    department: DataTypes.STRING(100),
    bio: DataTypes.TEXT,
    reputationScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "reputation_score",
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_points",
    },
    quizStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "quiz_streak",
    },
    longestQuizStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "longest_quiz_streak",
    },
    questionsAsked: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "questions_asked",
    },
    questionsAnswered: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "questions_answered",
    },
    answersAccepted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "answers_accepted",
    },
    totalUpvotesReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_upvotes_received",
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_admin",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      field: "last_active_at",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    updatedAt: "updated_at",
  },
);

// Expertise Tag Model
const ExpertiseTag = sequelize.define(
  "ExpertiseTag",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    category: DataTypes.STRING(100),
  },
  {
    tableName: "expertise_tags",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);

// User Expertise Model
const UserExpertise = sequelize.define(
  "UserExpertise",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    tagId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "tag_id",
      references: {
        model: ExpertiseTag,
        key: "id",
      },
    },
    proficiencyLevel: {
      type: DataTypes.INTEGER,
      validate: { min: 1, max: 5 },
      field: "proficiency_level",
    },
    verifiedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "verified_count",
    },
  },
  {
    tableName: "user_expertise",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);
const Question = sequelize.define(
  "Question",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // ✅ ADD THIS (CRITICAL FIX)
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "author_id",
    },

    status: {
      type: DataTypes.STRING(20),
      defaultValue: "open",
      validate: {
        isIn: [["open", "answered", "closed", "archived"]],
      },
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "view_count",
    },
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    aiExtractedTags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      field: "ai_extracted_tags",
    },
    suggestedExperts: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      field: "suggested_experts",
    },
    isAiGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_ai_generated",
    },
    acceptedAnswerId: {
      type: DataTypes.UUID,
      field: "accepted_answer_id",
    },
  },
  {
    tableName: "questions",
    timestamps: true,
    underscored: true,
    updatedAt: "updated_at",
  },
);

// Question Tag Model
const QuestionTag = sequelize.define(
  "QuestionTag",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "question_id",
      references: {
        model: Question,
        key: "id",
      },
    },
    tagId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "tag_id",
      references: {
        model: ExpertiseTag,
        key: "id",
      },
    },
    isAiSuggested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_ai_suggested",
    },
  },
  {
    tableName: "question_tags",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);

// Answer Model
const Answer = sequelize.define(
  "Answer",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // ✅ ADD THIS
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "question_id",
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "author_id",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isAiGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_ai_generated",
    },
    isAccepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_accepted",
    },
  },
  {
    tableName: "answers",
    timestamps: true,
    underscored: true,
    updatedAt: "updated_at",
  },
);

// Vote Model
const Vote = sequelize.define(
  "Vote",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    targetType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "target_type",
      validate: {
        isIn: [["question", "answer"]],
      },
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "target_id",
    },
    voteType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "vote_type",
      validate: {
        isIn: [[-1, 1]],
      },
    },
  },
  {
    tableName: "votes",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);

// Badge Model
const Badge = sequelize.define(
  "Badge",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    iconUrl: {
      type: DataTypes.TEXT,
      field: "icon_url",
    },
    category: {
      type: DataTypes.STRING(50),
      validate: {
        isIn: [["contribution", "expertise", "engagement", "special"]],
      },
    },
    requirementType: {
      type: DataTypes.STRING(50),
      field: "requirement_type",
    },
    requirementValue: {
      type: DataTypes.INTEGER,
      field: "requirement_value",
    },
    pointsReward: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "points_reward",
    },
  },
  {
    tableName: "badges",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);

// User Badge Model
const UserBadge = sequelize.define(
  "UserBadge",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    badgeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "badge_id",
      references: {
        model: Badge,
        key: "id",
      },
    },
    earnedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "earned_at",
    },
  },
  {
    tableName: "user_badges",
    timestamps: false,
  },
);

// Points History Model
const PointsHistory = sequelize.define(
  "PointsHistory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    actionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "action_type",
    },
    description: DataTypes.TEXT,
    referenceType: {
      type: DataTypes.STRING(50),
      field: "reference_type",
    },
    referenceId: {
      type: DataTypes.UUID,
      field: "reference_id",
    },
  },
  {
    tableName: "points_history",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);

// Quiz Model
const Quiz = sequelize.define(
  "Quiz",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    description: DataTypes.TEXT,
    difficulty: {
      type: DataTypes.STRING(20),
      validate: {
        isIn: [["easy", "medium", "hard"]],
      },
    },
    timeLimitMinutes: {
      type: DataTypes.INTEGER,
      field: "time_limit_minutes",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    tableName: "quizzes",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);

// Quiz Question Model
const QuizQuestion = sequelize.define(
  "QuizQuestion",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    questionType: {
      type: DataTypes.STRING(20),
      defaultValue: "multiple_choice",
      field: "question_type",
      validate: {
        isIn: [["multiple_choice", "true_false", "short_answer"]],
      },
    },
    options: DataTypes.JSONB,
    correctAnswer: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "correct_answer",
    },
    explanation: DataTypes.TEXT,
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      field: "order_index",
    },
  },
  {
    tableName: "quiz_questions",
    timestamps: false,
  },
);

// Quiz Attempt Model
const QuizAttempt = sequelize.define(
  "QuizAttempt",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    score: DataTypes.INTEGER,
    totalPoints: {
      type: DataTypes.INTEGER,
      field: "total_points",
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      field: "correct_answers",
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      field: "total_questions",
    },
    timeTakenSeconds: {
      type: DataTypes.INTEGER,
      field: "time_taken_seconds",
    },
    completedAt: {
      type: DataTypes.DATE,
      field: "completed_at",
    },
  },
  {
    tableName: "quiz_attempts",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);

// Notification Model
const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    message: DataTypes.TEXT,
    referenceType: {
      type: DataTypes.STRING(50),
      field: "reference_type",
    },
    referenceId: {
      type: DataTypes.UUID,
      field: "reference_id",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_read",
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);

// Expert Request Model
const ExpertRequest = sequelize.define(
  "ExpertRequest",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "accepted", "declined", "expired"]],
      },
    },
    aiMatchScore: {
      type: DataTypes.DECIMAL(5, 2),
      field: "ai_match_score",
    },
    reason: DataTypes.TEXT,
    respondedAt: {
      type: DataTypes.DATE,
      field: "responded_at",
    },
  },
  {
    tableName: "expert_requests",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);

// Activity Log Model
const ActivityLog = sequelize.define(
  "ActivityLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    actionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "action_type",
    },
    description: DataTypes.TEXT,
    metadata: DataTypes.JSONB,
  },
  {
    tableName: "activity_log",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  },
);

// Define Relationships
User.hasMany(UserExpertise, { foreignKey: "user_id" });
UserExpertise.belongsTo(User, { foreignKey: "user_id" });

ExpertiseTag.hasMany(UserExpertise, { foreignKey: "tag_id" });
UserExpertise.belongsTo(ExpertiseTag, { foreignKey: "tag_id" });

User.hasMany(Question, { foreignKey: "authorId" });
Question.belongsTo(User, { foreignKey: "authorId", as: "author" });

Question.hasMany(QuestionTag, { foreignKey: "question_id" });
QuestionTag.belongsTo(Question, { foreignKey: "question_id" });

ExpertiseTag.hasMany(QuestionTag, { foreignKey: "tag_id" });
QuestionTag.belongsTo(ExpertiseTag, { foreignKey: "tag_id" });

Question.hasMany(Answer, {
  foreignKey: "questionId",
  as: "answers",
});
Answer.belongsTo(Question, { foreignKey: "questionId", as: "question" });

User.hasMany(Answer, { foreignKey: "authorId" });
Answer.belongsTo(User, { foreignKey: "authorId", as: "author" });

User.hasMany(Vote, { foreignKey: "user_id" });
Vote.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(UserBadge, { foreignKey: "user_id" });
UserBadge.belongsTo(User, { foreignKey: "user_id" });

Badge.hasMany(UserBadge, { foreignKey: "badge_id" });
UserBadge.belongsTo(Badge, { foreignKey: "badge_id" });

User.hasMany(PointsHistory, { foreignKey: "user_id" });
PointsHistory.belongsTo(User, { foreignKey: "user_id" });

Quiz.hasMany(QuizQuestion, { foreignKey: "quiz_id" });
QuizQuestion.belongsTo(Quiz, { foreignKey: "quiz_id" });

ExpertiseTag.hasMany(Quiz, { foreignKey: "category_id" });
Quiz.belongsTo(ExpertiseTag, { foreignKey: "category_id", as: "category" });

User.hasMany(QuizAttempt, { foreignKey: "user_id" });
QuizAttempt.belongsTo(User, { foreignKey: "user_id" });

Quiz.hasMany(QuizAttempt, { foreignKey: "quiz_id" });
QuizAttempt.belongsTo(Quiz, { foreignKey: "quiz_id" });

User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

Question.hasMany(ExpertRequest, { foreignKey: "question_id" });
ExpertRequest.belongsTo(Question, { foreignKey: "question_id" });

User.hasMany(ExpertRequest, { foreignKey: "expert_id" });
ExpertRequest.belongsTo(User, { foreignKey: "expert_id", as: "expert" });

User.hasMany(ActivityLog, { foreignKey: "userId" });
ActivityLog.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  sequelize,
  testConnection,
  User,
  ExpertiseTag,
  UserExpertise,
  Question,
  QuestionTag,
  Answer,
  Vote,
  Badge,
  UserBadge,
  PointsHistory,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Notification,
  ExpertRequest,
  ActivityLog,
};
