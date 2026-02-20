# 🚀 Quick Start - Testing Authentication

## Start Services

### 1. Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
**Expected Output:**
```
✅ Server running on port 5000
✅ MongoDB connected successfully
```

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
**Expected Output:**
```
✅ Local: http://localhost:5173/
```

## Test Registration (2 minutes)

### Step 1: Open Browser
Navigate to: **http://localhost:5173/register**

### Step 2: Fill Registration Form

**For Student:**
```
Name:              John Doe
Email:             john.doe@test.edu
Role:              Student (click the student button)
Student ID:        STU2024001
Department:        Computer Science
Year:              2
Phone:             +1 234 567 8900  (optional)
Password:          TestPass123!
Confirm Password:  TestPass123!
```

**For Faculty:**
```
Name:              Dr. Jane Smith
Email:             jane.smith@test.edu
Role:              Faculty (click the faculty button)
Department:        Mathematics
Phone:             +1 234 567 8901  (optional)
Password:          SecurePass456!
Confirm Password:  SecurePass456!
```

### Step 3: Submit
Click **"Create Account"**

### Step 4: Verify Success
✅ Success message appears
✅ Automatically redirected to `/dashboard`
✅ Dashboard shows your name and information

## Test Login (1 minute)

### Step 1: Logout
Click **"Logout"** button in dashboard

### Step 2: Login
Navigate to: **http://localhost:5173/login**

Fill in:
```
Email:     john.doe@test.edu
Password:  TestPass123!
```

Optional: Check **"Remember me"**

### Step 3: Submit
Click **"Sign In"**

### Step 4: Verify Success
✅ Success message appears
✅ Redirected to dashboard
✅ User information displays correctly

## Verify in MongoDB (30 seconds)

```bash
# Open MongoDB shell
mongosh

# Switch to database
use smart-campus-connect

# View users
db.users.find().pretty()
```

**You should see:**
```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john.doe@test.edu",
  password: "$2a$10$...",  // Hashed
  role: "student",
  studentId: "STU2024001",
  department: "Computer Science",
  year: 2,
  phone: "+1 234 567 8900",
  bio: "",
  refreshTokens: [
    {
      token: "eyJhbGc...",
      createdAt: ISODate("...")
    }
  ],
  isVerified: false,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## Check Browser Storage (30 seconds)

### Open Browser DevTools
Press **F12** → Go to **Application** tab → **Local Storage**

**You should see:**
```
accessToken:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
refreshToken:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
user:          {"_id":"...","name":"John Doe",...}
```

## Test Error Cases (2 minutes)

### 1. Duplicate Email
Try registering with **john.doe@test.edu** again
```
Expected: ❌ "User with this email already exists"
```

### 2. Wrong Password
Try logging in with wrong password
```
Expected: ❌ "Invalid email or password"
```

### 3. Password Mismatch
Register with different passwords in password fields
```
Expected: ❌ "Passwords don't match"
```

### 4. Missing Required Fields
Try submitting without name or email
```
Expected: ❌ "Full name is required" or validation error
```

## Test Protected Routes (30 seconds)

### 1. Logout
Click logout button

### 2. Try Accessing Dashboard
Type in URL: **http://localhost:5173/dashboard**

```
Expected: ✅ Redirected to login page
```

### 3. Login and Access
Login again, should redirect to dashboard automatically
```
Expected: ✅ Dashboard accessible
```

## Common Issues & Quick Fixes

### Issue: "Network Error"
```bash
# Check if backend is running
curl http://localhost:5000

# Restart backend
cd backend
npm run dev
```

### Issue: "Cannot connect to MongoDB"
```bash
# Check MongoDB status
mongosh

# If connection refused, start MongoDB
# Windows: net start MongoDB
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Issue: "CORS Error"
```bash
# Verify backend CORS is configured
# Check backend/src/server.js has:
# app.use(cors({ origin: 'http://localhost:5173' }))
```

### Issue: Tokens not storing
```javascript
// Open browser console
console.log('Storage available:', typeof Storage !== 'undefined');

// Clear and try again
localStorage.clear();
// Then register/login again
```

## Success Checklist ✅

After testing, you should have:
- [x] Successfully registered a student account
- [x] Successfully registered a faculty account
- [x] Successfully logged in
- [x] Verified user data in MongoDB
- [x] Verified tokens in localStorage
- [x] Tested logout functionality
- [x] Verified protected route access control
- [x] Tested error handling
- [x] Seen success messages and smooth redirects

## What's Working Now 🎉

✅ **Registration**
- Students with Student ID
- Faculty without Student ID
- Optional phone and bio fields
- Password strength indicator
- Real-time validation

✅ **Login**
- Email and password authentication
- Remember me functionality
- Error handling for invalid credentials
- Automatic redirect after success

✅ **Security**
- Password hashing with bcrypt
- JWT token authentication
- Automatic token refresh
- Protected routes
- Secure logout

✅ **User Experience**
- Success messages
- Error messages
- Loading states
- Form validation
- Smooth animations
- Professional UI

## Next Steps 🚀

Your authentication is **fully functional**! You can now:

1. **Test different user roles** (student vs faculty)
2. **Create multiple users** for testing groups/chat
3. **Explore protected features** (Groups, Dashboard, etc.)
4. **Customize user profiles**
5. **Build additional features** on top of auth

## Need Help?

- 📖 See `AUTH_FIXES_SUMMARY.md` for detailed fixes
- 🧪 See `AUTH_TESTING.md` for comprehensive tests
- 🐛 Check browser console for error details
- 📊 Use Redux DevTools for state inspection
- 🔍 Monitor Network tab for API calls

## Quick Commands Reference

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Check MongoDB
mongosh
use smart-campus-connect
db.users.find().pretty()

# Clear test data
db.users.deleteMany({ email: /test\.edu/ })

# Check backend logs
# (View terminal where backend is running)

# Clear browser cache
# DevTools → Application → Clear storage
```

## Support

If something doesn't work:
1. ✅ Check both terminals for errors
2. ✅ Verify MongoDB is connected
3. ✅ Check browser console for errors
4. ✅ Clear localStorage and try again
5. ✅ Restart both backend and frontend
6. ✅ Verify .env files are configured correctly

---

**🎊 Congratulations!** Your authentication system is working perfectly with MongoDB! 

Happy developing! 💻✨
