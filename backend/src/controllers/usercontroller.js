import User from "#models/user";
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
    const { name, email, role, isActive, officeId, managerId } = req.body;

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
      officeId,
      managerId,
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

const assignLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { officeId } = req.body;
    const requestor = req.user;

    const targetUser = await User.findById(id);
    if (!targetUser) return sendError(res, "User not found", "Not Found", 404);

    // Permission Check: Admin can do anything. Manager can only assign to reports.
    if (requestor.role !== "ADMIN") {
      if (
        requestor.role !== "MANAGER" ||
        targetUser.managerId?.toString() !== requestor.id
      ) {
        return sendError(
          res,
          "Unauthorized to assign location to this user",
          "Forbidden",
          403,
        );
      }
    }

    // Validation: Ensure office exists
    if (officeId) {
      const Office = (await import("#models/office")).default;
      const officeExists = await Office.findById(officeId);
      if (!officeExists)
        return sendError(res, "Office location not found", "Not Found", 404);
    }

    targetUser.officeId = officeId;
    await targetUser.save();

    return sendSuccess(res, "Location assigned successfully", targetUser);
  } catch (error) {
    return sendError(res, "Failed to assign location", error.message);
  }
};

const updateWFHPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { wfhAllowed, wfhDaysRemaining } = req.body;
    const requestor = req.user;

    const targetUser = await User.findById(id);
    if (!targetUser) return sendError(res, "User not found", "Not Found", 404);

    // Permission Check
    if (requestor.role !== "ADMIN") {
      if (
        requestor.role !== "MANAGER" ||
        targetUser.managerId?.toString() !== requestor.id
      ) {
        return sendError(
          res,
          "Unauthorized to update WFH permissions for this user",
          "Forbidden",
          403,
        );
      }
    }

    if (wfhAllowed !== undefined) targetUser.wfhAllowed = wfhAllowed;
    if (wfhDaysRemaining !== undefined)
      targetUser.wfhDaysRemaining = wfhDaysRemaining;

    await targetUser.save();

    return sendSuccess(res, "WFH permissions updated successfully", targetUser);
  } catch (error) {
    return sendError(res, "Failed to update WFH permissions", error.message);
  }
};

export {
  getAllUsers,
  getUserById,
  getProfile,
  updateProfile,
  createUser,
  updateUser,
  assignLocation,
  updateWFHPermission,
};
