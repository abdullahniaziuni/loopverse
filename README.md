# SkillSphere - Real-Time Microlearning & Mentorship Platform

A comprehensive web-based microlearning platform that connects learners with mentors for focused 1-on-1 learning sessions with AI-powered recommendations.

## 🚀 Features

### Core Functionality

- **Multi-Role Authentication**: Learners, Mentors, and Admins with role-based access
- **Real-Time Session Booking**: Interactive calendar with timezone-aware scheduling
- **Live Mentoring Sessions**: Video/audio calls with real-time chat
- **AI-Powered Recommendations**: Personalized mentor matching and learning paths
- **Comprehensive Feedback System**: 5-star ratings with detailed reviews
- **Admin Dashboard**: Platform analytics, mentor approval, and content moderation

### AI Integration

- **Session Summaries**: Automatic AI-generated session notes
- **Smart Recommendations**: Personalized mentor and topic suggestions
- **Learning Path Generation**: AI-created structured learning plans
- **Mentor Matching**: Intelligent mentor-learner pairing

### Real-Time Features

- **WebSocket Integration**: Live chat, notifications, and session updates
- **Instant Notifications**: Booking requests, confirmations, and reminders
- **Live Session Management**: Real-time session status updates

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)

- **RESTful API**: Comprehensive endpoints for all platform features
- **MongoDB Database**: Scalable document-based data storage
- **JWT Authentication**: Secure token-based authentication
- **WebSocket Server**: Real-time communication using Socket.IO
- **AI Integration**: Google Gemini API for intelligent features
- **File Upload**: Multer-based file handling for avatars and resources

### Frontend (React + TypeScript + Tailwind CSS)

- **Modern React**: TypeScript for type safety and better development experience
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **State Management**: Zustand for efficient state management
- **Real-Time UI**: WebSocket integration for live updates
- **Component Architecture**: Reusable, well-structured components

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/abdullahniaziuni/loopverse.git
   cd loopverse
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   cd backend/LoopVerse
   npm install

   # Install frontend dependencies
   cd ../../frontend
   npm install
   cd ..
   ```

3. **Configure environment variables**

   Backend (`backend/LoopVerse/.env`):

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   PORT=4001
   FRONTEND_URL=http://localhost:5174
   ```

   Frontend (`frontend/.env` is already configured):

   ```env
   VITE_API_URL=http://localhost:4001/api
   VITE_WEBSOCKET_URL=ws://localhost:4001
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Seed the database**

   ```bash
   cd backend/LoopVerse
   npm run seed
   ```

5. **Start the development servers**

   **Option 1: Use startup scripts**

   ```bash
   # Windows
   start.bat

   # Linux/Mac
   chmod +x start.sh
   ./start.sh
   ```

   **Option 2: Manual start**

   ```bash
   # Terminal 1 - Backend
   cd backend/LoopVerse
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

   Backend runs on port 4001, Frontend on port 5174.

### Manual Setup

If you prefer to run servers separately:

**Backend:**

```bash
cd backend/LoopVerse
npm install
npm start
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Mentors

- `GET /api/mentors` - Get all verified mentors
- `GET /api/mentors/:id` - Get mentor by ID
- `GET /api/mentors/:id/availability` - Get mentor availability
- `PUT /api/mentors/availability` - Update mentor availability

### Sessions & Bookings

- `POST /api/bookings` - Create booking request
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id/respond` - Accept/reject booking
- `GET /api/sessions` - Get user sessions
- `POST /api/sessions/:id/feedback` - Submit session feedback

### AI Features

- `POST /api/ai/sessions/:id/summary` - Generate session summary
- `POST /api/ai/recommendations` - Get AI recommendations
- `POST /api/ai/learning-path` - Generate learning path

### Admin

- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/mentor-applications` - Pending mentor applications
- `PUT /api/admin/mentors/:id/verify` - Approve/reject mentors

### File Upload

- `POST /api/upload` - Upload files (avatars, portfolios, resources)

### Search

- `GET /api/search/mentors` - Advanced mentor search
- `GET /api/search/sessions` - Search sessions

## 🎯 User Roles & Journeys

### Learner Journey

1. **Registration** → Profile setup with interests and goals
2. **Browse Mentors** → Search and filter by skills, rating, availability
3. **Book Sessions** → Select time slots and send booking requests
4. **Attend Sessions** → Join video/audio calls with real-time chat
5. **Provide Feedback** → Rate mentors and leave reviews
6. **Track Progress** → View learning history and AI-generated insights

### Mentor Journey

1. **Application** → Submit mentor application with portfolio
2. **Approval** → Admin reviews and approves mentor status
3. **Set Availability** → Configure weekly schedule and time slots
4. **Manage Bookings** → Accept/decline session requests
5. **Conduct Sessions** → Lead mentoring sessions with tools and resources
6. **View Analytics** → Track ratings, feedback, and performance metrics

### Admin Journey

1. **Platform Monitoring** → Real-time dashboard with key metrics
2. **Mentor Management** → Review and approve mentor applications
3. **Content Moderation** → Monitor feedback and handle reports
4. **Analytics & Reports** → Generate platform usage and performance reports

## 🔧 Configuration

### Environment Variables

**Backend Configuration:**

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `GEMINI_API_KEY`: Google Gemini API key for AI features
- `PORT`: Server port (default: 4000)
- `FRONTEND_URL`: Frontend URL for CORS

**Frontend Configuration:**

- `VITE_API_URL`: Backend API URL
- `VITE_WEBSOCKET_URL`: WebSocket server URL
- `VITE_GEMINI_API_KEY`: Gemini API key for client-side AI features

## 🧪 Testing

### Backend Testing

```bash
cd backend/LoopVerse
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Integration Testing

```bash
npm run test:integration
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Setup

1. Update environment variables for production
2. Configure MongoDB Atlas or production database
3. Set up file storage (AWS S3, Cloudinary, etc.)
4. Configure domain and SSL certificates

## 📊 Database Schema

### Collections

- **Learners**: User profiles, interests, goals, progress tracking
- **Mentors**: Professional profiles, skills, availability, ratings
- **Admins**: Administrative accounts with permissions
- **Sessions**: Booking details, status, feedback, meeting links
- **Notifications**: In-app notification system

## 🤖 AI Features

### Gemini AI Integration

- **Session Summaries**: Automatic note generation after sessions
- **Mentor Recommendations**: AI-powered matching based on learner profile
- **Learning Paths**: Personalized curriculum suggestions
- **Smart Questions**: Context-aware question generation

## 🔐 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Express-validator for request validation
- **CORS Protection**: Configured for specific origins
- **File Upload Security**: Type and size validation

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Desktop Support**: Full desktop functionality
- **Tablet Compatibility**: Responsive design for all screen sizes
- **Accessibility**: WCAG compliant design

## 🔄 Real-Time Features

### WebSocket Events

- `booking_request`: New booking notifications
- `booking_response`: Booking confirmations/rejections
- `session_update`: Session status changes
- `new_message`: Real-time chat messages
- `notification`: General notifications

## 📈 Performance

- **Database Indexing**: Optimized queries for common operations
- **Caching**: API response caching for improved performance
- **Lazy Loading**: Component-based code splitting
- **Image Optimization**: Automatic image compression and optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:

- Email: support@skillsphere.com
- Documentation: Check the `/docs` folder
- Issues: GitHub Issues page

## 🎯 Competition Submission

This project is submitted for the LoopVerse Web Development Challenge, showcasing:

- Full-stack development skills
- Real-time communication implementation
- AI integration capabilities
- Scalable architecture design
- Superior UI/UX design
- Comprehensive testing and documentation
