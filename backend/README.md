# Employee Attendance & Leave Management System - Backend API

A production-ready Node.js + Express.js backend API for managing employee attendance and leave management.

## 🚀 Features

- **Authentication & Authorization**
  - User registration and login with JWT
  - Password hashing with bcryptjs
  - Role-based access control (ADMIN, MANAGER, EMPLOYEE)
  - Password reset functionality
  - Email notifications

- **Attendance Management**
  - Check-in and check-out functionality
  - Automatic working hours calculation
  - Attendance reports and analytics
  - Team attendance tracking (Manager/Admin)

- **Leave Management**
  - Apply for different types of leaves (CL, SL, PL, UL)
  - Leave approval workflow
  - Leave rejection with reasons
  - Leave cancellation

- **User Management**
  - User profile management
  - Admin panel for user management
  - Employee information tracking

- **Best Practices**
  - RESTful API design with versioning (`/api/v1`)
  - Centralized error handling
  - MongoDB with Mongoose
  - Environment variable configuration
  - Production-ready security measures

## 📋 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer
- **Validation**: express-validator
- **CORS**: cors middleware
- **Environment**: dotenv

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── env.js             # Environment variables
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── attendance.controller.js
│   │   └── leave.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── attendance.routes.js
│   │   └── leave.routes.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── attendance.model.js
│   │   └── leave.model.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   └── error.middleware.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   └── mailer.js
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── .env                       # Environment variables (create this)
├── package.json
└── README.md
```

## 🔧 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm

### Setup Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env` file** in the root of backend directory
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/attendance-leave-db
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=7d
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=noreply@attendanceleave.com
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start MongoDB**
   ```bash
   mongod
   ```

4. **Run the server**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

The API will be available at: `http://localhost:5000/api/v1`

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Health Check
```
GET /api/v1/health
```

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### User Endpoints

#### Get Profile
```http
GET /api/v1/users/profile
Authorization: Bearer {token}
```

#### Update Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "department": "Engineering"
}
```

#### Get All Users (Admin only)
```http
GET /api/v1/users
Authorization: Bearer {token}
```

#### Create User (Admin only)
```http
POST /api/v1/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "EMPLOYEE",
  "employeeId": "EMP001",
  "department": "HR"
}
```

#### Update User (Admin only)
```http
PUT /api/v1/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Smith",
  "role": "MANAGER",
  "isActive": true
}
```

#### Delete User (Admin only)
```http
DELETE /api/v1/users/{userId}
Authorization: Bearer {token}
```

### Attendance Endpoints

#### Check-in
```http
POST /api/v1/attendance/check-in
Authorization: Bearer {token}
```

#### Check-out
```http
POST /api/v1/attendance/check-out
Authorization: Bearer {token}
```

#### Get My Attendance
```http
GET /api/v1/attendance/my
Authorization: Bearer {token}

Query Parameters:
- fromDate: yyyy-MM-dd
- toDate: yyyy-MM-dd
```

#### Get Team Attendance (Manager/Admin)
```http
GET /api/v1/attendance/team
Authorization: Bearer {token}

Query Parameters:
- fromDate: yyyy-MM-dd
- toDate: yyyy-MM-dd
- employeeId: employee_id
```

#### Generate Attendance Report (Manager/Admin)
```http
GET /api/v1/attendance/report
Authorization: Bearer {token}

Query Parameters:
- fromDate: yyyy-MM-dd
- toDate: yyyy-MM-dd
- employeeId: employee_id
```

### Leave Endpoints

#### Apply for Leave
```http
POST /api/v1/leaves/apply
Authorization: Bearer {token}
Content-Type: application/json

{
  "leaveType": "CL",
  "fromDate": "2024-02-15",
  "toDate": "2024-02-17",
  "numberOfDays": 3,
  "reason": "Personal work"
}

Leave Types: CL (Casual Leave), SL (Sick Leave), PL (Paid Leave), UL (Unpaid Leave)
```

#### Get My Leaves
```http
GET /api/v1/leaves/my
Authorization: Bearer {token}

Query Parameters:
- status: Pending/Approved/Rejected
```

#### Get Pending Leaves (Manager/Admin)
```http
GET /api/v1/leaves/pending
Authorization: Bearer {token}

Query Parameters:
- employeeId: employee_id
```

#### Approve Leave (Manager/Admin)
```http
PUT /api/v1/leaves/{leaveId}/approve
Authorization: Bearer {token}
```

#### Reject Leave (Manager/Admin)
```http
PUT /api/v1/leaves/{leaveId}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "rejectionReason": "Insufficient notice period"
}
```

#### Cancel Leave
```http
DELETE /api/v1/leaves/{leaveId}
Authorization: Bearer {token}
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### How it works:
1. User logs in with email and password
2. Server returns a JWT token
3. Include the token in the `Authorization` header for protected routes:
   ```
   Authorization: Bearer {your_token_here}
   ```

### Roles & Permissions:
- **ADMIN**: Full access to all features
- **MANAGER**: Can manage team attendance and approve/reject leaves
- **EMPLOYEE**: Can manage own attendance and apply for leaves

## 📝 Error Handling

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## 🚀 Production Deployment

### Before deploying:
1. Change `JWT_SECRET` to a strong random string
2. Update `FRONTEND_URL` to your production frontend URL
3. Set `NODE_ENV=production`
4. Configure production MongoDB URI
5. Set up email credentials for production
6. Use environment variables, never hardcode secrets

### Deployment steps:
```bash
# Install dependencies
npm install

# Run the server
npm start
```

## 📦 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **nodemailer**: Email service
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **express-validator**: Input validation

## 🤝 Contributing

This is a production-ready backend for the Employee Attendance & Leave Management System.

## 📄 License

ISC

## 📞 Support

For issues and questions, please check the documentation or contact the development team.

---

**Built with ❤️ using Node.js and Express.js**
