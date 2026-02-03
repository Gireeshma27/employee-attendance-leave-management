import Attendance from "../models/attendance.model.js";
import User from "../models/user.model.js";

// Check In
export const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      userId,
      date: today,
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "You have already checked in today.",
      });
    }

    let attendance;

    if (existingAttendance) {
      // Update existing record
      existingAttendance.checkInTime = new Date();
      existingAttendance.status = "Present";
      attendance = await existingAttendance.save();
    } else {
      // Create new record
      attendance = await Attendance.create({
        userId,
        date: today,
        checkInTime: new Date(),
        status: "Present",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Check-in successful.",
      data: attendance,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Check-in failed.",
    });
  }
};

// Check Out
export const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No check-in record found for today.",
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "You have already checked out today.",
      });
    }

    // Calculate working hours
    const checkInTime = new Date(attendance.checkInTime);
    const checkOutTime = new Date();
    const workingMilliseconds = checkOutTime - checkInTime;
    const workingHours =
      Math.round((workingMilliseconds / (1000 * 60 * 60)) * 2) / 2; // Round to nearest 0.5

    attendance.checkOutTime = checkOutTime;
    attendance.workingHours = workingHours;

    const updatedAttendance = await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out successful.",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Check-out failed.",
    });
  }
};

// Get my attendance records
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fromDate, toDate } = req.query;

    const filter = { userId };

    if (fromDate && toDate) {
      filter.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate("userId", "name email employeeId");

    return res.status(200).json({
      success: true,
      message: "Attendance records retrieved successfully.",
      data: records,
    });
  } catch (error) {
    console.error("Get my attendance error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve attendance records.",
    });
  }
};

// Get team attendance (for managers/admins)
export const getTeamAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      fromDate,
      toDate,
      status,
      department,
      role,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};

    // Date filtering
    if (fromDate && toDate) {
      filter.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    } else if (fromDate) {
      filter.date = { $gte: new Date(fromDate) };
    } else if (toDate) {
      filter.date = { $lte: new Date(toDate) };
    }

    // Attendance status filtering
    if (status) {
      filter.status = status;
    }

    // Employee related filtering (search, department, role)
    const userFilter = {};
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }
    if (department) {
      userFilter.department = department;
    }
    if (role) {
      userFilter.role = role;
    }

    // If we have user filters, find matching users first
    if (Object.keys(userFilter).length > 0) {
      const users = await User.find(userFilter).select("_id");
      const userIds = users.map((u) => u._id);
      filter.userId = { $in: userIds };
    }

    // Execute query with pagination
    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate("userId", "name email employeeId role");

    return res.status(200).json({
      success: true,
      message: "Team attendance records retrieved successfully.",
      data: records,
    });
  } catch (error) {
    console.error("Get team attendance error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve team attendance records.",
    });
  }
};

// Download Excel Report
export const downloadExcelReport = async (req, res) => {
  try {
    const { fromDate, toDate, status, department, role, search } = req.query;

    const filter = {};

    // Date filtering
    if (fromDate && toDate) {
      filter.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    } else if (fromDate) {
      filter.date = { $gte: new Date(fromDate) };
    } else if (toDate) {
      filter.date = { $lte: new Date(toDate) };
    }

    if (status) {
      filter.status = status;
    }

    const userFilter = {};
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }
    if (department) {
      userFilter.department = department;
    }
    if (role) {
      userFilter.role = role;
    }

    if (Object.keys(userFilter).length > 0) {
      const users = await User.find(userFilter).select("_id");
      const userIds = users.map((u) => u._id);
      filter.userId = { $in: userIds };
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate("userId", "name email employeeId department role");

    // Calculate statistics
    const stats = {
      totalDays: records.length,
      presentDays: records.filter((r) => r.status === "Present").length,
      absentDays: records.filter((r) => r.status === "Absent").length,
      halfDays: records.filter((r) => r.status === "Half-day").length,
      wfhDays: records.filter((r) => r.status === "WFH").length,
      leaveDays: records.filter((r) => r.status === "Leave").length,
      totalWorkingHours: records.reduce(
        (sum, r) => sum + (r.workingHours || 0),
        0,
      ),
    };

    return res.status(200).json({
      success: true,
      message: "Attendance report generated successfully.",
      data: {
        records,
        statistics: stats,
      },
    });
  } catch (error) {
    console.error("Generate report error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate attendance report.",
    });
  }
};

export default {
  checkIn,
  checkOut,
  getMyAttendance,
  getTeamAttendance,
  downloadExcelReport,
};
