# Smart Campus Companion (SCC)

A comprehensive platform for managing campus life, featuring AI-powered tools, real-time collaboration, and seamless integrations.

## 🚀 Features

### Phase 1 (Current Implementation)
- ✅ **Authentication System**: Secure JWT-based authentication with refresh tokens
- ✅ **User Management**: Role-based access control (Student, Teacher, Admin)
- ✅ **Real-time Communication**: Socket.io integration for instant updates
- ✅ **Responsive Dashboard**: Modern UI with React and Redux Toolkit

### Upcoming Features
- 📚 Academic Schedule & Attendance Tracking
- 📝 Assignment & Deadline Management
- 🤖 AI-Powered Timetable Generator
- 👥 Study Groups & Chat System
- 🗳️ Meetings & Polling Engine
- 📄 Notes Sharing (OneDrive Integration)
- 📅 Google Calendar Integration
- 📖 Notebook LM Exam Mode
- 🔔 Real-time Notification System

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React.js, Redux Toolkit, Socket.io Client
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Access + Refresh Tokens)
- **Styling**: Modern CSS with responsive design

### Project Structure
```
SCC/
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── controllers/  # Route controllers
│   │   ├── middlewares/  # Auth & validation middlewares
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── utils/        # Helper functions
│   │   └── server.js     # Entry point
│   ├── .env              # Environment variables
│   └── package.json
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── features/     # Redux slices
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── socket/       # Socket.io client
│   │   ├── store/        # Redux store
│   │   ├── App.jsx       # Main component
│   │   └── main.jsx      # Entry point
│   ├── .env              # Environment variables
│   └── package.json
│
└── README.md
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB Atlas** account (or local MongoDB)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd SCC
```

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Configure Environment Variables
Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Connection
MONGO_URI=your_mongodb_connection_string
# If you see querySrv ECONNREFUSED on Windows, uncomment:
# MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Email Configuration (for future features)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# API Keys (for future features)
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ONEDRIVE_CLIENT_ID=your_onedrive_client_id
ONEDRIVE_CLIENT_SECRET=your_onedrive_client_secret
```

#### Start Backend Server
```bash
npm run dev
```
Server will run on http://localhost:5000

### 3. Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
```

#### Configure Environment Variables
Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

#### Start Frontend Development Server
```bash
npm run dev
```
Frontend will run on http://localhost:5173

## 🎯 Usage

1. Open http://localhost:5173 in your browser
2. Click "Get Started" or "Register" to create a new account
3. Fill in your details:
   - **Students**: Provide student ID, department, and year
   - **Teachers**: Select teacher role
4. Login with your credentials
5. Access your personalized dashboard

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile (Protected)
- `PUT /api/auth/profile` - Update user profile (Protected)

## 🔐 Security Features

- Password hashing with bcrypt
- JWT access tokens (15 minutes expiry)
- JWT refresh tokens (7 days expiry)
- HTTP-only cookie support (ready)
- Role-based access control
- Input validation
- Environment variable protection

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment (Render/Railway)
1. Create account on Render or Railway
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel)
1. Create account on Vercel
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables
6. Deploy

### Database (MongoDB Atlas)
- Already cloud-hosted
- No additional setup needed

## 🛣️ Roadmap

### Phase 1: ✅ Authentication & Dashboard (Completed)
- User authentication system
- Basic dashboard
- Real-time socket connection

### Phase 2: Groups & Chat (Next)
- Study group creation
- Real-time chat system
- File sharing in groups

### Phase 3: AI Scheduler
- OpenAI integration
- Timetable generation
- Smart scheduling

### Phase 4: Google Calendar Integration
- OAuth2 setup
- Calendar sync
- Event management

### Phase 5: Notes Sharing & Polling
- OneDrive integration
- Meeting scheduler
- Polling system

### Phase 6: Notifications & Optimization
- Push notifications
- Email notifications
- Performance optimization
- Caching implementation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

Your Name - Initial work

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- MongoDB for database
- Socket.io for real-time features
- React community for excellent tools

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

## 🔧 Troubleshooting

### Common Issues

**Backend won't start:**
- Check if MongoDB URI is correct
- Ensure port 5000 is not in use
- Verify all dependencies are installed

**Frontend won't connect:**
- Check if backend is running
- Verify API URLs in .env
- Clear browser cache

**Socket connection fails:**
- Ensure backend Socket.io is running
- Check CORS settings
- Verify socket URL in frontend

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Socket.io Documentation](https://socket.io/docs)
