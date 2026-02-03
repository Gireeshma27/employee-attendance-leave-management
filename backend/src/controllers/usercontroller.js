import User from "#models/user.model";
import { hashPassword } from "../utils/password.js";
import { sendSuccess, sendError } from "#utils/api_response_fix";

const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (role) filter.role = role.toUpperCase();
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const totalRecords = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    return sendSuccess(res, "Users retrieved successfully", {
      records: users,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve users", error.message);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return sendError(res, "User not found", "Not Found", 404);
    return sendSuccess(res, "User retrieved successfully", user);
  } catch (error) {
    return sendError(res, "Failed to retrieve user", error.message);
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return sendError(res, "User not found", "Not Found", 404);
    return sendSuccess(res, "Profile retrieved successfully", user);
  } catch (error) {
    return sendError(res, "Failed to retrieve profile", error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, department } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, department },
      { new: true, runValidators: true },
    ).select("-password");
    return sendSuccess(res, "Profile updated successfully", user);
  } catch (error) {
    return sendError(res, "Failed to update profile", error.message);
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, employeeId } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser)
      return sendError(
        res,
        "User with this email already exists",
        "Conflict",
        409,
      );

    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee)
        return sendError(res, "Employee ID already exists", "Conflict", 409);
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role ? role.toUpperCase() : "EMPLOYEE",
      employeeId,
      isActive: true,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, "User created successfully", userObj, 201);
  } catch (error) {
    return sendError(res, "Failed to create user", error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) return sendError(res, "User not found", "Not Found", 404);

    if (email && email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail)
        return sendError(res, "Email already in use", "Conflict", 409);
    }

    const updateData = {
      name,
      email: email?.toLowerCase(),
      role: role?.toUpperCase(),
      isActive,
    };
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    return sendSuccess(res, "User updated successfully", updatedUser);
  } catch (error) {
    return sendError(res, "Failed to update user", error.message);
  }
};

export {
  getAllUsers,
  getUserById,
  getProfile,
  updateProfile,
  createUser,
  updateUser,
};
