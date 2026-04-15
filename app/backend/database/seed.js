const bcrypt = require('bcryptjs');
const { sequelize, User, ExpertiseTag, Badge, Quiz, QuizQuestion } = require('../src/models');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Create expertise tags
    const expertiseTags = [
      { name: 'JavaScript', description: 'JavaScript programming language', category: 'Frontend' },
      { name: 'Python', description: 'Python programming language', category: 'Backend' },
      { name: 'React', description: 'React.js framework', category: 'Frontend' },
      { name: 'Node.js', description: 'Node.js runtime', category: 'Backend' },
      { name: 'SQL', description: 'SQL databases', category: 'Database' },
      { name: 'Docker', description: 'Containerization', category: 'DevOps' },
      { name: 'Kubernetes', description: 'Container orchestration', category: 'DevOps' },
      { name: 'AWS', description: 'Amazon Web Services', category: 'Cloud' },
      { name: 'Machine Learning', description: 'ML and AI', category: 'Data Science' },
      { name: 'Data Science', description: 'Data analysis and science', category: 'Data Science' },
      { name: 'DevOps', description: 'Development operations', category: 'DevOps' },
      { name: 'Security', description: 'Cybersecurity', category: 'Security' },
      { name: 'Mobile Development', description: 'iOS and Android', category: 'Mobile' },
      { name: 'UI/UX Design', description: 'User interface and experience', category: 'Design' },
      { name: 'Product Management', description: 'Product management', category: 'Management' }
    ];

    const createdTags = await ExpertiseTag.bulkCreate(expertiseTags, { ignoreDuplicates: true });
    console.log(`Created ${createdTags.length} expertise tags`);

    // Create badges
    const badges = [
      {
        name: 'First Steps',
        description: 'Asked your first question',
        category: 'contribution',
        requirementType: 'questions_asked',
        requirementValue: 1,
        pointsReward: 10
      },
      {
        name: 'Helper',
        description: 'Answered 5 questions',
        category: 'contribution',
        requirementType: 'questions_answered',
        requirementValue: 5,
        pointsReward: 25
      },
      {
        name: 'Expert Contributor',
        description: 'Answered 25 questions',
        category: 'contribution',
        requirementType: 'questions_answered',
        requirementValue: 25,
        pointsReward: 100
      },
      {
        name: 'Top Contributor',
        description: 'Answered 100 questions',
        category: 'contribution',
        requirementType: 'questions_answered',
        requirementValue: 100,
        pointsReward: 500
      },
      {
        name: 'Accepted Answer',
        description: 'Had an answer accepted',
        category: 'contribution',
        requirementType: 'answers_accepted',
        requirementValue: 1,
        pointsReward: 25
      },
      {
        name: 'Rising Star',
        description: 'Reached 100 reputation',
        category: 'engagement',
        requirementType: 'reputation',
        requirementValue: 100,
        pointsReward: 50
      },
      {
        name: 'Respected Member',
        description: 'Reached 500 reputation',
        category: 'engagement',
        requirementType: 'reputation',
        requirementValue: 500,
        pointsReward: 150
      },
      {
        name: 'Community Leader',
        description: 'Reached 1000 reputation',
        category: 'engagement',
        requirementType: 'reputation',
        requirementValue: 1000,
        pointsReward: 500
      },
      {
        name: 'Quiz Master',
        description: 'Completed 10 quizzes',
        category: 'engagement',
        requirementType: 'quizzes_completed',
        requirementValue: 10,
        pointsReward: 100
      },
      {
        name: '7-Day Streak',
        description: 'Maintained a 7-day quiz streak',
        category: 'engagement',
        requirementType: 'quiz_streak',
        requirementValue: 7,
        pointsReward: 50
      },
      {
        name: 'JavaScript Expert',
        description: 'Verified expert in JavaScript',
        category: 'expertise',
        requirementType: 'expertise_verified',
        requirementValue: 1,
        pointsReward: 100
      },
      {
        name: 'Full Stack Developer',
        description: 'Expert in both frontend and backend',
        category: 'expertise',
        requirementType: 'multiple_expertise',
        requirementValue: 3,
        pointsReward: 200
      },
      {
        name: 'Early Adopter',
        description: 'Joined during the beta phase',
        category: 'special',
        requirementType: 'early_join',
        requirementValue: 1,
        pointsReward: 100
      }
    ];

    const createdBadges = await Badge.bulkCreate(badges, { ignoreDuplicates: true });
    console.log(`Created ${createdBadges.length} badges`);

    // Create sample users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const users = [
      {
        email: 'admin@knowflow.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        jobTitle: 'Platform Administrator',
        department: 'Engineering',
        isAdmin: true,
        reputationScore: 5000,
        totalPoints: 10000
      },
      {
        email: 'john.doe@company.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'Senior Software Engineer',
        department: 'Engineering',
        reputationScore: 2500,
        totalPoints: 5000,
        questionsAnswered: 45,
        answersAccepted: 32
      },
      {
        email: 'jane.smith@company.com',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Smith',
        jobTitle: 'Tech Lead',
        department: 'Engineering',
        reputationScore: 3200,
        totalPoints: 6500,
        questionsAnswered: 67,
        answersAccepted: 48
      },
      {
        email: 'mike.johnson@company.com',
        passwordHash,
        firstName: 'Mike',
        lastName: 'Johnson',
        jobTitle: 'DevOps Engineer',
        department: 'Infrastructure',
        reputationScore: 1800,
        totalPoints: 3500,
        questionsAnswered: 28,
        answersAccepted: 19
      },
      {
        email: 'sarah.williams@company.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Williams',
        jobTitle: 'Data Scientist',
        department: 'Data',
        reputationScore: 2100,
        totalPoints: 4200,
        questionsAnswered: 35,
        answersAccepted: 24
      },
      {
        email: 'alex.brown@company.com',
        passwordHash,
        firstName: 'Alex',
        lastName: 'Brown',
        jobTitle: 'Frontend Developer',
        department: 'Engineering',
        reputationScore: 1500,
        totalPoints: 2800,
        questionsAnswered: 22,
        answersAccepted: 15
      },
      {
        email: 'emily.davis@company.com',
        passwordHash,
        firstName: 'Emily',
        lastName: 'Davis',
        jobTitle: 'Product Manager',
        department: 'Product',
        reputationScore: 1200,
        totalPoints: 2200,
        questionsAnswered: 18,
        answersAccepted: 12
      },
      {
        email: 'david.wilson@company.com',
        passwordHash,
        firstName: 'David',
        lastName: 'Wilson',
        jobTitle: 'Security Engineer',
        department: 'Security',
        reputationScore: 2800,
        totalPoints: 5600,
        questionsAnswered: 52,
        answersAccepted: 38
      }
    ];

    const createdUsers = await User.bulkCreate(users, { ignoreDuplicates: true });
    console.log(`Created ${createdUsers.length} users`);

    // Assign expertise to users
    const userExpertiseData = [
      { email: 'john.doe@company.com', expertise: ['JavaScript', 'React', 'Node.js'] },
      { email: 'jane.smith@company.com', expertise: ['Python', 'Machine Learning', 'SQL', 'Data Science'] },
      { email: 'mike.johnson@company.com', expertise: ['Docker', 'Kubernetes', 'AWS', 'DevOps'] },
      { email: 'sarah.williams@company.com', expertise: ['Python', 'Machine Learning', 'Data Science', 'SQL'] },
      { email: 'alex.brown@company.com', expertise: ['JavaScript', 'React', 'UI/UX Design'] },
      { email: 'emily.davis@company.com', expertise: ['Product Management', 'UI/UX Design'] },
      { email: 'david.wilson@company.com', expertise: ['Security', 'AWS', 'DevOps'] }
    ];

    for (const userData of userExpertiseData) {
      const user = await User.findOne({ where: { email: userData.email } });
      if (user) {
        for (const tagName of userData.expertise) {
          const tag = await ExpertiseTag.findOne({ where: { name: tagName } });
          if (tag) {
            await sequelize.models.UserExpertise.findOrCreate({
              where: {
                userId: user.id,
                tagId: tag.id
              },
              defaults: {
                proficiencyLevel: Math.floor(Math.random() * 3) + 3 // 3-5 level
              }
            });
          }
        }
      }
    }
    console.log('Assigned expertise to users');

    // Create sample quizzes
    const quizzes = [
      {
        title: 'JavaScript Fundamentals',
        description: 'Test your knowledge of JavaScript basics',
        difficulty: 'easy',
        timeLimitMinutes: 10,
        questions: [
          {
            question: 'What is the output of typeof null in JavaScript?',
            questionType: 'multiple_choice',
            options: ['"null"', '"undefined"', '"object"', '"number"'],
            correctAnswer: '"object"',
            explanation: 'This is a known quirk in JavaScript where typeof null returns "object".',
            points: 10,
            orderIndex: 0
          },
          {
            question: 'Which method is used to add an element to the end of an array?',
            questionType: 'multiple_choice',
            options: ['push()', 'pop()', 'shift()', 'unshift()'],
            correctAnswer: 'push()',
            explanation: 'push() adds elements to the end of an array.',
            points: 10,
            orderIndex: 1
          },
          {
            question: 'What does the === operator do?',
            questionType: 'multiple_choice',
            options: [
              'Checks equality with type coercion',
              'Checks equality without type coercion',
              'Assigns a value',
              'Checks if value is null'
            ],
            correctAnswer: 'Checks equality without type coercion',
            explanation: '=== checks for strict equality without type coercion.',
            points: 15,
            orderIndex: 2
          }
        ]
      },
      {
        title: 'React Basics',
        description: 'Test your React knowledge',
        difficulty: 'medium',
        timeLimitMinutes: 15,
        questions: [
          {
            question: 'What is the purpose of useState hook?',
            questionType: 'multiple_choice',
            options: [
              'To make API calls',
              'To manage state in functional components',
              'To style components',
              'To handle routing'
            ],
            correctAnswer: 'To manage state in functional components',
            explanation: 'useState allows you to add state to functional components.',
            points: 10,
            orderIndex: 0
          },
          {
            question: 'What is JSX?',
            questionType: 'multiple_choice',
            options: [
              'A JavaScript library',
              'A syntax extension for JavaScript',
              'A CSS preprocessor',
              'A database query language'
            ],
            correctAnswer: 'A syntax extension for JavaScript',
            explanation: 'JSX is a syntax extension that allows writing HTML-like code in JavaScript.',
            points: 10,
            orderIndex: 1
          }
        ]
      },
      {
        title: 'DevOps Essentials',
        description: 'Test your DevOps knowledge',
        difficulty: 'medium',
        timeLimitMinutes: 12,
        questions: [
          {
            question: 'What is Docker used for?',
            questionType: 'multiple_choice',
            options: [
              'Version control',
              'Containerization',
              'Database management',
              'Frontend development'
            ],
            correctAnswer: 'Containerization',
            explanation: 'Docker is used to containerize applications.',
            points: 10,
            orderIndex: 0
          },
          {
            question: 'What does CI/CD stand for?',
            questionType: 'multiple_choice',
            options: [
              'Code Integration/Code Deployment',
              'Continuous Integration/Continuous Deployment',
              'Computer Infrastructure/Computer Development',
              'Cloud Integration/Cloud Deployment'
            ],
            correctAnswer: 'Continuous Integration/Continuous Deployment',
            explanation: 'CI/CD stands for Continuous Integration and Continuous Deployment.',
            points: 10,
            orderIndex: 1
          }
        ]
      }
    ];

    for (const quizData of quizzes) {
      const [quiz] = await Quiz.findOrCreate({
        where: { title: quizData.title },
        defaults: {
          description: quizData.description,
          difficulty: quizData.difficulty,
          timeLimitMinutes: quizData.timeLimitMinutes,
          isActive: true
        }
      });

      for (const questionData of quizData.questions) {
        await QuizQuestion.findOrCreate({
          where: {
            quizId: quiz.id,
            question: questionData.question
          },
          defaults: questionData
        });
      }
    }
    console.log(`Created ${quizzes.length} quizzes`);

    console.log('Database seeding completed successfully!');
    console.log('\nSample login credentials:');
    console.log('Admin: admin@knowflow.com / password123');
    console.log('User: john.doe@company.com / password123');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
