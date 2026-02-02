import Attendance from "../models/attendance.model.js";
import User from "../models/user.model.js";
import ApiResponse from "../utils/apiResponse.js";

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
      return ApiResponse.badRequest(res, "You have already checked in today.");
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

    return ApiResponse.success(res, 200, "Check-in successful.", attendance);
  } catch (error) {
    console.error("Check-in error:", error);
    return ApiResponse.serverError(res, error.message || "Check-in failed.");
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
      return ApiResponse.notFound(res, "No check-in record found for today.");
    }

    if (attendance.checkOutTime) {
      return ApiResponse.badRequest(res, "You have already checked out today.");
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

    return ApiResponse.success(
      res,
      200,
      "Check-out successful.",
      updatedAttendance,
    );
  } catch (error) {
    console.error("Check-out error:", error);
    return ApiResponse.serverError(res, error.message || "Check-out failed.");
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

    return ApiResponse.success(
      res,
      200,
      "Attendance records retrieved successfully.",
      records,
    );
  } catch (error) {
    console.error("Get my attendance error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Failed to retrieve attendance records.",
    );
  }
};

// Get team attendance (for managers)
export const getTeamAttendance = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { fromDate, toDate, employeeId } = req.query;

    // Get all employees under this manager (simplified - in real app, would need team mapping)
    const filter = {};

    if (fromDate && toDate) {
      filter.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) {
        filter.userId = user._id;
      }
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate("userId", "name email employeeId role");

    return ApiResponse.success(
      res,
      200,
      "Team attendance records retrieved successfully.",
      records,
    );
  } catch (error) {
    console.error("Get team attendance error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Failed to retrieve team attendance records.",
    );
  }
};

// Generate attendance report
export const generateReport = async (req, res) => {
  try {
    const { fromDate, toDate, employeeId } = req.query;

    const filter = {};

    if (fromDate && toDate) {
      filter.date = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) {
        filter.userId = user._id;
      }
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate("userId", "name email employeeId");

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

    return ApiResponse.success(
      res,
      200,
      "Attendance report generated successfully.",
      {
        records,
        statistics: stats,
      },
    );
  } catch (error) {
    console.error("Generate report error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Failed to generate attendance report.",
    );
  }
};

// Update attendance record (Admin/Manager)
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkInTime, checkOutTime, status, reason } = req.body;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return ApiResponse.notFound(res, "Attendance record not found.");
    }

    if (checkInTime) attendance.checkInTime = new Date(checkInTime);
    if (checkOutTime) attendance.checkOutTime = new Date(checkOutTime);
    if (status) attendance.status = status;

    // Recalculate working hours if both times exist
    if (attendance.checkInTime && attendance.checkOutTime) {
      const start = new Date(attendance.checkInTime);
      const end = new Date(attendance.checkOutTime);
      const workingMilliseconds = end - start;
      const workingHours =
        Math.round((workingMilliseconds / (1000 * 60 * 60)) * 2) / 2;
      attendance.workingHours = workingHours > 0 ? workingHours : 0;
    }

    const updatedAttendance = await attendance.save();

    return ApiResponse.success(
      res,
      200,
      "Attendance record updated successfully.",
      updatedAttendance,
    );
  } catch (error) {
    console.error("Update attendance error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Failed to update attendance record.",
    );
  }
};

export default {
  checkIn,
  checkOut,
  getMyAttendance,
  getTeamAttendance,
  generateReport,
  updateAttendance,
};
