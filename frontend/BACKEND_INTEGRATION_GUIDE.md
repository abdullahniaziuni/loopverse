# Backend Integration Guide for SkillSphere Frontend

This guide outlines the frontend architecture and requirements for seamless backend integration.

## 🏗️ Frontend Architecture Overview

### State Management
- **Zustand** for global state management
- **React Query/SWR-like** custom hooks for server state
- **Local Storage** for persistence
- **Cache Management** for offline support

### API Layer
- **Centralized API Service** (`src/services/api.ts`)
- **Type-safe interfaces** for all API calls
- **Automatic data transformation** between frontend and backend formats
- **Error handling** with user-friendly messages
- **Retry logic** and timeout handling

### Data Flow
```
UI Components → Custom Hooks → API Service → Backend
                     ↓
              Zustand Store ← Data Transformation
```

## 📡 API Endpoints Required

### Authentication Endpoints
```typescript
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

### User Management
```typescript
GET    /api/users/profile
PUT    /api/users/profile
POST   /api/users/avatar
DELETE /api/users/account
```

### Mentor Management
```typescript
GET    /api/mentors?page=1&limit=10&skills[]=react&rating=4
GET    /api/mentors/:id
GET    /api/mentors/:id/availability?date=2024-01-15
POST   /api/mentors/apply
PUT    /api/mentors/availability
GET    /api/mentors/:id/reviews
```

### Session Management
```typescript
GET    /api/sessions?status=scheduled&page=1&limit=10
GET    /api/sessions/:id
POST   /api/sessions
PUT    /api/sessions/:id
DELETE /api/sessions/:id
POST   /api/sessions/:id/cancel
POST   /api/sessions/:id/feedback
GET    /api/sessions/:id/feedback
```

### Booking Management
```typescript
GET    /api/bookings?status=pending
POST   /api/bookings
PUT    /api/bookings/:id/respond
```

### AI Integration
```typescript
POST   /api/ai/recommendations
POST   /api/ai/sessions/:id/summary
POST   /api/ai/learning-path
POST   /api/ai/mentor-match
```

### Admin Endpoints
```typescript
GET    /api/admin/stats
GET    /api/admin/users?role=mentor&page=1
GET    /api/admin/mentor-applications
PUT    /api/admin/mentor-applications/:id
```

## 🔄 Data Transformation

### Frontend to Backend
The `DataManager` class handles all data transformations:

```typescript
// Frontend User object
const frontendUser = {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
  role: "learner",
  timezone: "UTC"
};

// Transformed to backend format
const backendUser = DataManager.toApiUser(frontendUser);
// Result: { name: "John Doe", email: "john@example.com", role: "learner", timezone: "UTC" }
```

### Backend to Frontend
```typescript
// Backend response
const backendResponse = {
  _id: "507f1f77bcf86cd799439011",
  fullName: "John Doe",
  email: "john@example.com",
  role: "learner",
  created_at: "2024-01-01T00:00:00Z"
};

// Transformed to frontend format
const frontendUser = DataManager.transformUser(backendResponse);
// Result: { id: "507f1f77bcf86cd799439011", name: "John Doe", ... }
```

## 📊 Expected API Response Formats

### Success Response
```typescript
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```typescript
{
  "success": false,
  "error": "Error message",
  "errors": {
    "field1": ["Validation error 1"],
    "field2": ["Validation error 2"]
  }
}
```

### Paginated Response
```typescript
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔐 Authentication Flow

### JWT Token Management
- **Access Token**: Stored in memory and localStorage
- **Refresh Token**: Stored in httpOnly cookie (recommended) or localStorage
- **Auto-refresh**: Handled by API service before token expiry
- **Logout**: Clears all tokens and redirects to login

### Protected Routes
```typescript
// Frontend automatically handles route protection
<ProtectedRoute allowedRoles={["learner", "mentor"]}>
  <VideoCall />
</ProtectedRoute>
```

## 🎯 Real-time Features

### WebSocket Integration
```typescript
// Frontend expects these WebSocket events
{
  "type": "session_update",
  "data": { sessionId: "123", status: "started" }
}

{
  "type": "chat_message",
  "data": { sessionId: "123", message: "Hello", sender: "user123" }
}

{
  "type": "booking_request",
  "data": { requestId: "456", mentorId: "789" }
}
```

## 🤖 AI Integration Requirements

### Gemini AI Integration
- **API Key**: Configured in environment variables
- **Rate Limiting**: Frontend handles retry logic
- **Error Handling**: Graceful fallbacks for AI failures

### AI Features
1. **Learning Path Generation**: Based on user skills and goals
2. **Mentor Recommendations**: AI-powered matching algorithm
3. **Session Summaries**: Automatic note generation
4. **Smart Questions**: Context-aware question suggestions

## 📁 File Upload

### Upload Endpoints
```typescript
POST /api/upload
Content-Type: multipart/form-data

{
  file: File,
  type: "avatar" | "resource" | "portfolio"
}
```

### Response Format
```typescript
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/uploads/file.jpg",
    "filename": "file.jpg",
    "size": 1024000
  }
}
```

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_WEBSOCKET_URL=ws://localhost:3000

# AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_REAL_TIME_CHAT=true
VITE_ENABLE_VIDEO_CALLS=true
```

## 🚀 Deployment Considerations

### Production Setup
1. **API URL**: Update to production backend URL
2. **WebSocket URL**: Update to production WebSocket server
3. **CDN**: Configure for file uploads and static assets
4. **SSL**: Ensure HTTPS for all API calls
5. **CORS**: Configure backend to allow frontend domain

### Performance Optimizations
- **Caching**: API responses cached for 5 minutes by default
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Automatic image compression
- **Bundle Splitting**: Separate chunks for different routes

## 🧪 Testing Integration

### API Mocking
```typescript
// Enable mock data for development
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_API_MOCKING=true
```

### Test Data
The frontend includes comprehensive mock data for all features:
- User profiles (learner, mentor, admin)
- Sessions and bookings
- AI recommendations
- Dashboard statistics

## 📋 Backend Implementation Checklist

### Core Features
- [ ] User authentication (JWT)
- [ ] User profile management
- [ ] Mentor application system
- [ ] Session booking and management
- [ ] Real-time chat (WebSocket)
- [ ] File upload handling
- [ ] Email notifications

### AI Features
- [ ] Gemini AI integration
- [ ] Learning path generation
- [ ] Mentor recommendation algorithm
- [ ] Session summary generation
- [ ] Smart question suggestions

### Admin Features
- [ ] Dashboard analytics
- [ ] User management
- [ ] Mentor approval system
- [ ] Platform statistics
- [ ] Feedback management

### Advanced Features
- [ ] Video call integration (WebRTC)
- [ ] Payment processing
- [ ] Calendar integration
- [ ] Mobile app API support
- [ ] Advanced search and filtering

## 🔗 Integration Steps

1. **Set up backend API** with the required endpoints
2. **Update environment variables** to point to your backend
3. **Test authentication flow** with real JWT tokens
4. **Implement WebSocket server** for real-time features
5. **Configure file upload** handling and storage
6. **Set up AI integration** with Gemini API
7. **Test all CRUD operations** with real data
8. **Implement admin features** for platform management

## 📞 Support

For questions about frontend integration:
- Review the `src/services/api.ts` file for API expectations
- Check `src/types/index.ts` for data structure requirements
- Examine `src/store/index.ts` for state management patterns
- Look at component implementations for UI behavior expectations

The frontend is designed to be backend-agnostic and will work with any REST API that follows the documented patterns.
