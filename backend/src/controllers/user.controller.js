import User from '../models/user.model.js';
import { hashPassword } from '../utils/password.js';
import ApiResponse from '../utils/apiResponse.js';

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (role) {
      filter.role = role.toUpperCase();
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count for pagination
    const totalRecords = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limitNum);

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 200, 'Users retrieved successfully.', {
      records: users,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to retrieve users.');
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return ApiResponse.notFound(res, 'User not found.');
    }

    return ApiResponse.success(res, 200, 'User retrieved successfully.', user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to retrieve user.');
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return ApiResponse.notFound(res, 'User not found.');
    }

    return ApiResponse.success(res, 200, 'Profile retrieved successfully.', user);
  } catch (error) {
    console.error('Get profile error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to retrieve profile.');
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, department } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    return ApiResponse.success(res, 200, 'Profile updated successfully.', user);
  } catch (error) {
    console.error('Update profile error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to update profile.');
  }
};

// Create user (Admin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, employeeId } = req.body;

    // Validation
    if (!name || !email || !password) {
      return ApiResponse.badRequest(res, 'Please provide name, email, and password.');
    }

    // Check if user already exists by email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ApiResponse.conflict(res, 'User with this email already exists.');
    }

    // Check if employeeId already exists
    if (employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return ApiResponse.conflict(res, 'Employee ID already exists.');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role ? role.toUpperCase() : 'EMPLOYEE',
      employeeId,
      isActive: true,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    return ApiResponse.created(res, 'User created successfully.', userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to create user.');
  }
};

// Update user (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found.');
    }

    // Check for duplicate email (if email is being changed)
    if (email && email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return ApiResponse.conflict(res, 'Email already in use.');
      }
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role.toUpperCase();
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    return ApiResponse.success(res, 200, 'User updated successfully.', updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to update user.');
  }
};

export default {
  getAllUsers,
  getUserById,
  getProfile,
  updateProfile,
  createUser,
  updateUser,
};
