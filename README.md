# KnowFlow - AI-Powered Knowledge Sharing Platform

KnowFlow is a modern, full-stack web application designed for organizations to facilitate internal knowledge sharing. It connects employees with the right information and experts using AI, while encouraging participation through gamification and continuous learning.

## 🎯 Featuress

### Core Features
- **AI-Powered Q&A System**: Smart question routing and tag extraction
- **Expert Discovery**: Find experts based on skills and contributions
- **Gamification**: Points, badges, and leaderboards
- **Daily Quiz Module**: Test knowledge and maintain streaks
- **Smart Dashboard**: Personalized insights and analytics
- **Notifications**: Real-time updates on activities

### Additional Features
- Dark/Light mode support
- Responsive design
- Real-time notifications (WebSockets ready)
- Admin analytics dashboard
- Knowledge gap identification

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context
- **Routing**: React Router DOM
- **HTTP Client**: Axios

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **Real-time**: Socket.io

#### AI Integration
- Tag extraction from questions
- Expert matching algorithm
- Similar question suggestions
- Quiz generation

## 📁 Project Structure

```
knowflow/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Auth middleware
│   │   └── server.js       # Entry point
│   ├── database/
│   │   ├── schema.sql      # Database schema
│   │   └── seed.js         # Sample data
│   └── package.json
├── src/                     # React frontend
│   ├── pages/              # Page components
│   ├── components/         # Reusable components
│   ├── contexts/           # React contexts
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   └── App.tsx             # Main app
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/knowflow.git
cd knowflow
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
```

4. **Set up environment variables**

Frontend (`.env`):
```
VITE_API_URL=http://localhost:3001/api
```

Backend (`.env`):
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=knowflow
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
PORT=3001
```

5. **Set up database**
```bash
cd backend
# Create database
createdb knowflow
# Run schema
psql -d knowflow -f database/schema.sql
# Seed data
npm run seed
```

6. **Start the development servers**

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Demo Credentials
- **Admin**: admin@knowflow.com / password123
- **User**: john.doe@company.com / password123

## 📖 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Questions
- `GET /api/questions` - List questions
- `GET /api/questions/:id` - Get question details
- `POST /api/questions` - Create question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/vote` - Vote on question

### Answers
- `POST /api/answers` - Create answer
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer
- `POST /api/answers/:id/vote` - Vote on answer
- `POST /api/answers/:id/accept` - Accept answer

### Experts
- `GET /api/experts` - List experts
- `GET /api/experts/:id` - Get expert profile
- `GET /api/experts/tags/all` - List expertise tags
- `POST /api/experts/match` - Find matching experts

### Quizzes
- `GET /api/quizzes` - List quizzes
- `GET /api/quizzes/:id` - Get quiz details
- `POST /api/quizzes/:id/start` - Start quiz attempt
- `POST /api/quizzes/:id/submit` - Submit quiz answers
- `GET /api/quizzes/daily/today` - Get daily quiz

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/leaderboard/my-rank` - Get user's rank
- `GET /api/leaderboard/departments` - Get department rankings

### Admin
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/status` - Update user status

## 🎨 UI/UX Design

The application follows a modern SaaS design language:
- Clean, minimal interface
- Card-based layouts
- Consistent color scheme
- Responsive design for all devices
- Dark/Light mode support

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- SQL injection protection via Sequelize
- XSS protection

## 🚢 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
cd backend
npm start
```

### Docker (Optional)
```bash
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons
