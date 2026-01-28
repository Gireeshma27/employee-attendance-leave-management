# 👤 Creating Admin & Test Users

## Quick Start - Create Admin User

Run this command from the backend directory:

```bash
npm run create-admin
```

This will create a default admin user with:
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: ADMIN

## Create All Test Users (Recommended)

To create test users for all roles (Admin, Manager, Employee):

```bash
npm run create-test-users
```

This creates three test users:

### Admin User
```
Email: admin@example.com
Password: admin123
Role: ADMIN
```

### Manager User
```
Email: manager@example.com
Password: manager123
Role: MANAGER
```

### Employee User
```
Email: employee@example.com
Password: employee123
Role: EMPLOYEE
```

---

## 🔒 Security Note

⚠️ **These are default test credentials for development only!**

- Change all passwords after first login
- Never use these credentials in production
- Delete test users before deploying to production

---

## How It Works

### Admin Creation Script (`scripts/createAdmin.js`)
- Connects to MongoDB
- Checks if admin user already exists
- Creates admin user with hashed password
- Displays credentials on success

### Test Users Script (`scripts/createTestUsers.js`)
- Creates admin, manager, and employee users
- Skips creation if users already exist
- Displays all credentials

---

## Manual User Creation

You can also create users manually via the API:

### Register New User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "email": "your@email.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

The new user will have the `EMPLOYEE` role by default.

### Change User Role (Admin Only)
To change a user's role to MANAGER or ADMIN, use MongoDB directly or the admin update endpoint.

---

## Testing Users

Once users are created, you can login:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Response will include a JWT token for API requests.

---

## File Location

- Admin creation script: `scripts/createAdmin.js`
- Test users script: `scripts/createTestUsers.js`

---

## Troubleshooting

### "Cannot find module" error
Make sure you're running the script from the backend directory:
```bash
cd backend
npm run create-admin
```

### "MongoDB connection failed"
Ensure:
- MongoDB is running
- `MONGODB_URI` in `.env` is correct
- Network connection to MongoDB is available

### User already exists
The scripts check if users exist before creating them. If you want to recreate users, delete them from MongoDB first.

---

## Next Steps

1. Run `npm run create-test-users`
2. Start the server: `npm run dev`
3. Test login with provided credentials
4. Change passwords for production use

Happy testing! 🎉
