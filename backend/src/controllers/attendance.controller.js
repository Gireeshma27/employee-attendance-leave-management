import Attendance from "../models/attendance.model.js";
import User from "../models/user.model.js";
import ApiResponse from "../utils/apiResponse.js";
import ExcelJS from "exceljs";

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
      .populate("userId", "name email employeeId role department")
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate global stats for current department/search (excluding status filter)
    const { status: _, ...statsFilter } = filter;
    const allFilteredResults =
      await Attendance.find(statsFilter).select("status");
    const stats = {
      total: allFilteredResults.length,
      present: allFilteredResults.filter((r) => r.status === "Present").length,
      late: allFilteredResults.filter((r) => r.status === "Late").length,
      absent: allFilteredResults.filter((r) => r.status === "Absent").length,
    };

    return ApiResponse.success(
      res,
      200,
      "Team attendance records retrieved successfully.",
      {
        records,
        stats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    );
  } catch (error) {
    console.error("Get team attendance error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Failed to retrieve team attendance records.",
    );
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

    // Initialize Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    // Define Columns
    worksheet.columns = [
      { header: "Employee ID", key: "employeeId", width: 15 },
      { header: "Employee Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Department", key: "department", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Check-in", key: "checkIn", width: 15 },
      { header: "Check-out", key: "checkOut", width: 15 },
      { header: "Total Hours", key: "hours", width: 15 },
      { header: "Status", key: "status", width: 12 },
    ];

    // Styling Header
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" }, // blue-600
    };
    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    const calculateHours = (checkIn, checkOut) => {
      if (!checkIn || !checkOut) return "0h";
      const diffMs = new Date(checkOut) - new Date(checkIn);
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}h ${m}m`;
    };

    // Add Rows
    records.forEach((record) => {
      const user = record.userId || {};
      const row = worksheet.addRow({
        employeeId: user.employeeId || "N/A",
        name: user.name || "N/A",
        email: user.email || "N/A",
        department: user.department || "N/A",
        date: new Date(record.date).toLocaleDateString(),
        checkIn: record.checkInTime
          ? new Date(record.checkInTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        checkOut: record.checkOutTime
          ? new Date(record.checkOutTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        hours: calculateHours(record.checkInTime, record.checkOutTime),
        status: record.status,
      });

      // Status Badge Color Mockup (Conditional Styling)
      const statusCell = row.getCell("status");
      if (record.status === "Present") {
        statusCell.font = { color: { argb: "FF059669" }, bold: true }; // green-600
      } else if (record.status === "Late") {
        statusCell.font = { color: { argb: "FFD97706" }, bold: true }; // orange-600
      } else if (record.status === "Absent") {
        statusCell.font = { color: { argb: "FFDC2626" }, bold: true }; // red-600
      }
    });

    // Auto-filter and freeze top row
    worksheet.autoFilter = "A1:I1";
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Prepare response
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Attendance_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel download error:", error);
    return ApiResponse.serverError(res, "Failed to generate Excel report.");
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
  downloadExcelReport,
  updateAttendance,
};
