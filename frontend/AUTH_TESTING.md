# Authentication Testing Guide

## Overview
This guide helps you test the complete authentication flow with the MongoDB backend.

## Prerequisites
1. **Backend is running** on `http://localhost:5000`
2. **MongoDB is connected** and accessible
3. **Frontend is running** on `http://localhost:5173` (or your Vite dev server port)

## Testing Registration

### Test Case 1: Student Registration (Full Information)
```
Navigate to: http://localhost:5173/register

Fill in:
- Name: John Doe
- Email: john.doe@university.edu
- Role: Student
- Student ID: STU2024001
- Department: Computer Science
- Year: 2
- Phone: +1 234 567 8900 (optional)
- Password: TestPass123!
- Confirm Password: TestPass123!

Expected Result:
✅ User is registered
✅ Tokens are stored in localStorage
✅ Redirected to /dashboard
✅ User data is visible in MongoDB
```

### Test Case 2: Faculty Registration
```
Fill in:
- Name: Dr. Jane Smith
- Email: jane.smith@university.edu
- Role: Faculty
- Department: Computer Science
- Phone: +1 234 567 8901 (optional)
- Password: SecurePass456!
- Confirm Password: SecurePass456!

Expected Result:
✅ Faculty account created
✅ No studentId required
✅ Redirected to /dashboard
```

### Test Case 3: Duplicate Email
```
Try registering with an email that already exists

Expected Result:
❌ Error: "User with this email already exists"
```

### Test Case 4: Password Mismatch
```
Enter different passwords in password and confirm password fields

Expected Result:
❌ Error: "Passwords don't match"
```

### Test Case 5: Missing Required Fields
```
Leave name or email blank

Expected Result:
❌ Error: "Full name is required" or validation error
```

## Testing Login

### Test Case 6: Successful Login
```
Navigate to: http://localhost:5173/login

Fill in:
- Email: john.doe@university.edu
- Password: TestPass123!

Expected Result:
✅ Login successful
✅ Tokens stored in localStorage
✅ Redirected to /dashboard
✅ User data loaded
```

### Test Case 7: Wrong Password
```
Fill in:
- Email: john.doe@university.edu
- Password: WrongPassword123

Expected Result:
❌ Error: "Invalid email or password"
```

### Test Case 8: Non-existent User
```
Fill in:
- Email: nonexistent@university.edu
- Password: AnyPassword123

Expected Result:
❌ Error: "Invalid email or password"
```

### Test Case 9: Remember Me
```
Check the "Remember me" checkbox before login

Expected Result:
✅ Session persists longer
✅ User stays logged in after browser close
```

## Testing Protected Routes

### Test Case 10: Access Dashboard Without Login
```
Navigate directly to: http://localhost:5173/dashboard
(without being logged in)

Expected Result:
✅ Redirected to /login
```

### Test Case 11: Token Expiration Handling
```
1. Login successfully
2. Manually delete accessToken from localStorage (keep refreshToken)
3. Try to access a protected route

Expected Result:
✅ Token is automatically refreshed
✅ Request succeeds with new token
```

### Test Case 12: Logout
```
1. Login successfully
2. Navigate to dashboard
3. Click "Logout" button

Expected Result:
✅ Tokens removed from localStorage
✅ Redirected to login page
✅ Refresh token removed from MongoDB
```

## Testing Navigation Between Pages

### Test Case 13: Switch Between Login/Register
```
1. Go to register page
2. Fill some fields
3. Click "Sign in" to switch to login
4. Click "Create an account" to switch back

Expected Result:
✅ Form is cleared when switching
✅ Error messages are cleared
✅ Proper form fields are shown
```

## Checking MongoDB

### Verify Data in MongoDB

```bash
# Connect to MongoDB
mongosh

# Use your database
use smart-campus-connect

# Check users collection
db.users.find().pretty()

# Expected fields in user document:
{
  _id: ObjectId,
  name: "John Doe",
  email: "john.doe@university.edu",
  role: "student",
  studentId: "STU2024001",
  department: "Computer Science",
  year: 2,
  phone: "+1 234 567 8900",
  bio: "",
  profilePicture: "",
  isVerified: false,
  refreshTokens: [{
    token: "...",
    createdAt: ISODate
  }],
  preferences: {
    notifications: {
      email: true,
      push: true
    },
    theme: "light"
  },
  createdAt: ISODate,
  updatedAt: ISODate
}

# Verify password is hashed
# Password should be a bcrypt hash starting with $2a$ or $2b$

# Check refresh tokens
db.users.findOne({ email: "john.doe@university.edu" }, { refreshTokens: 1 })
```

## Browser Console Tests

### Check localStorage
```javascript
// Open browser console (F12)

// Check stored tokens
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));
console.log('User:', JSON.parse(localStorage.getItem('user')));

// Should see:
// - accessToken: JWT string
// - refreshToken: JWT string
// - user: { _id, name, email, role, ... }
```

### Check Network Requests
```
Open Network tab in DevTools

Register/Login and check:
1. POST /api/auth/register or /api/auth/login
   - Status: 200/201
   - Response: { success: true, data: { user, accessToken, refreshToken } }

2. GET /api/auth/me (when accessing protected routes)
   - Status: 200
   - Headers: Authorization: Bearer <token>
   - Response: { success: true, data: { user } }

3. POST /api/auth/refresh (if token expires)
   - Status: 200
   - Response: { success: true, data: { accessToken } }
```

## Common Issues and Solutions

### Issue 1: CORS Error
```
Error: "CORS policy blocked"

Solution:
- Check backend CORS configuration in server.js
- Ensure frontend URL is allowed
- Verify API_URL in frontend .env is correct
```

### Issue 2: Cannot Connect to Backend
```
Error: "Network Error" or "ERR_CONNECTION_REFUSED"

Solution:
- Verify backend is running on port 5000
- Check VITE_API_URL in frontend/.env
- Ensure MongoDB is connected
```

### Issue 3: Tokens Not Stored
```
Error: User logged in but tokens missing in localStorage

Solution:
- Check browser console for errors
- Verify authSlice.js handleAuthSuccess function
- Check if localStorage is enabled in browser
```

### Issue 4: Redirect Loop
```
Error: Page keeps redirecting between login and dashboard

Solution:
- Check isAuthenticated state in Redux
- Verify token is valid
- Clear localStorage and try fresh login
```

### Issue 5: Password Not Matching
```
Error: "Invalid email or password" even with correct credentials

Solution:
- Verify password hashing in User model
- Check bcrypt is installed: npm list bcrypt
- Ensure password field is selected in login query
```

## Success Indicators

### Registration Success
- ✅ Status 201 from backend
- ✅ User document created in MongoDB
- ✅ Password is hashed (bcrypt)
- ✅ Tokens stored in localStorage
- ✅ User redirected to dashboard
- ✅ No console errors

### Login Success
- ✅ Status 200 from backend
- ✅ Tokens stored in localStorage
- ✅ User data loaded in Redux store
- ✅ Dashboard shows user information
- ✅ Protected routes accessible
- ✅ No console errors

### Logout Success
- ✅ Status 200 from backend
- ✅ Tokens removed from localStorage
- ✅ Redux store cleared
- ✅ Redirected to login
- ✅ Protected routes redirect to login
- ✅ Refresh token removed from MongoDB

## API Response Examples

### Successful Registration Response
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "65abc123...",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "role": "student",
      "studentId": "STU2024001",
      "department": "Computer Science",
      "year": 2,
      "phone": "+1 234 567 8900",
      "isVerified": false,
      "createdAt": "2024-01-20T10:30:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

## Manual Database Testing

### Clean Test Data
```javascript
// In MongoDB shell
use smart-campus-connect

// Remove test user
db.users.deleteOne({ email: "john.doe@university.edu" })

// Remove all test users
db.users.deleteMany({ email: /test/ })
```

### Create Test User Directly
```javascript
// For testing purposes only
db.users.insertOne({
  name: "Test User",
  email: "test@university.edu",
  password: "$2a$10$...", // Pre-hashed password
  role: "student",
  studentId: "TEST001",
  isVerified: false,
  refreshTokens: [],
  preferences: {
    notifications: { email: true, push: true },
    theme: "light"
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Automated Testing Checklist

Before deploying, verify:
- [ ] Registration with student role works
- [ ] Registration with faculty role works
- [ ] Login with correct credentials works
- [ ] Login with wrong password fails appropriately
- [ ] Duplicate email registration fails appropriately
- [ ] Password validation works (min 8 chars, strength indicator)
- [ ] Protected routes redirect to login when not authenticated
- [ ] Token refresh works automatically
- [ ] Logout clears all authentication state
- [ ] User data persists in MongoDB correctly
- [ ] Phone and bio fields save correctly (optional fields)
- [ ] Form validation shows appropriate error messages
- [ ] Success messages display before redirect
- [ ] Navigation between login/register clears form

## Support

If you encounter issues not covered here:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify MongoDB connection and data
4. Review the network tab for failed requests
5. Check Redux DevTools for state management issues
