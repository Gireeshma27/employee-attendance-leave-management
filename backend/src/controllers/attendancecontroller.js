import Attendance from "#models/attendance";
import User from "#models/user";
import Notification from "#models/notification";
import { sendSuccess, sendError } from "#utils/api_response_fix";

/**
 * Helper: Calculate working duration from checkIn and checkOut times
 * Returns { workingHours (fractional), workingMinutes (total) } or null if cannot calculate
 * workingHours is fractional (e.g., 6.08 for 6h 5m) for frontend compatibility
 * workingMinutes is the total minutes (e.g., 365 for 6h 5m)
 */
const calculateWorkingDuration = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) return null;
  
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);
  const workingMilliseconds = checkOut - checkIn;
  
  if (workingMilliseconds < 0) return null;
  
  const totalMinutes = Math.floor(workingMilliseconds / (1000 * 60));
  const fractionalHours = Number((totalMinutes / 60).toFixed(2));
  
  return { workingHours: fractionalHours, workingMinutes: totalMinutes };
};

/**
 * Helper: Enrich attendance record with recalculated duration if missing
 * Fixes legacy records where workingHours/workingMinutes were not saved
 */
const enrichAttendanceRecord = (record) => {
  // If checkOutTime exists but workingHours is 0 or missing, recalculate
  if (record.checkOutTime && (!record.workingHours || record.workingHours === 0)) {
    const duration = calculateWorkingDuration(record.checkInTime, record.checkOutTime);
    if (duration) {
      record.workingHours = duration.workingHours;
      record.workingMinutes = duration.workingMinutes;
    }
  }
  return record;
};

const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      userId,
      date: today,
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return sendError(
        res,
        "You have already checked in today",
        "Bad Request",
        400,
      );
    }

    const { isWFH } = req.body;

    let attendance;
    if (existingAttendance) {
      existingAttendance.checkInTime = new Date();
      existingAttendance.status = isWFH ? "WFH" : "Present";
      attendance = await existingAttendance.save();
    } else {
      const user = await User.findById(userId);

      // WFH Validation
      if (isWFH) {
        if (!user.wfhAllowed) {
          return sendError(
            res,
            "WFH is not enabled for your account",
            "Forbidden",
            403,
          );
        }
        // Check if remaining days based on total - used is positive
        const remainingDays = (user.totalWFHDays || 5) - (user.usedWFHDays || 0);
        if (remainingDays <= 0) {
          return sendError(res, "No WFH days remaining", "Bad Request", 400);
        }

        // Increment usedWFHDays (pre-save hook will recalculate wfhDaysRemaining)
        user.usedWFHDays = (user.usedWFHDays || 0) + 1;
        await user.save();
      }

      attendance = await Attendance.create({
        userId,
        date: today,
        checkInTime: new Date(),
        status: isWFH ? "WFH" : "Present",
      });
    }

    // Notify Admins about check-in
    try {
      const user = await User.findById(userId);
      const admins = await User.find({ role: "ADMIN" });
      const notificationPromises = admins.map((admin) =>
        Notification.create({
          recipient: admin._id,
          sender: userId,
          type: "ATTENDANCE_UPDATE",
          title: "New Check-in",
          message: `${user.name} has checked in at ${new Date().toLocaleTimeString()}.`,
          relatedId: attendance._id,
        }),
      );
      await Promise.all(notificationPromises);
    } catch (notifError) {
      console.error("Failed to create check-in notification:", notifError);
    }

    return sendSuccess(res, "Check-in successful", attendance);
  } catch (error) {
    return sendError(res, "Check-in failed", error.message);
  }
};

const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ userId, date: today });

    if (!attendance) {
      return sendError(
        res,
        "No check-in record found for today",
        "Not Found",
        404,
      );
    }

    if (attendance.checkOutTime) {
      return sendError(
        res,
        "You have already checked out today",
        "Bad Request",
        400,
      );
    }

    const checkInTime = new Date(attendance.checkInTime);
    const checkOutTime = new Date();
    const workingMilliseconds = checkOutTime - checkInTime;

    const totalMinutes = Math.max(
      0,
      Math.floor(workingMilliseconds / (1000 * 60)),
    );
    const fractionalHours = Number((totalMinutes / 60).toFixed(2));

    attendance.checkOutTime = checkOutTime;
    attendance.workingMinutes = totalMinutes;
    attendance.workingHours = fractionalHours;

    const updatedAttendance = await attendance.save();

    return sendSuccess(res, "Check-out successful", updatedAttendance);
  } catch (error) {
    return sendError(res, "Check-out failed", error.message);
  }
};

const getMyAttendance = async (req, res) => {
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
      .populate("userId", "name email employeeId")
      .lean();

    // Enrich records with recalculated duration for legacy data
    const enrichedRecords = records.map(enrichAttendanceRecord);

    return sendSuccess(
      res,
      "Attendance records retrieved successfully",
      enrichedRecords,
    );
  } catch (error) {
    return sendError(
      res,
      "Failed to retrieve attendance records",
      error.message,
    );
  }
};

const getTeamAttendance = async (req, res) => {
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

    const skip = (page - 1) * limit;

    // 1. Build User Filter
    const userFilter = {};
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }
    if (department) userFilter.department = department;

    // If admin, allow seeing both Managers and Employees
    if (role) {
      userFilter.role = role;
    } else {
      userFilter.role = { $in: ["MANAGER", "EMPLOYEE"] };
    }

    // 2. Find all matching users first
    const users = await User.find(userFilter).select(
      "name employeeId role department",
    );
    const userIds = users.map((u) => u._id);

    // 3. Build Attendance Filter
    const filter = { userId: { $in: userIds } };
    const searchDate = fromDate ? new Date(fromDate) : new Date();
    searchDate.setHours(0, 0, 0, 0);

    const endDate = toDate ? new Date(toDate) : new Date(searchDate);
    endDate.setHours(23, 59, 59, 999);

    filter.date = { $gte: searchDate, $lte: endDate };

    // 4. Get Actual Attendance Records
    const attendanceRecords = await Attendance.find(filter).lean();

    // 5. Merge Records (Virtual Absent for users without records)
    const records = users.map((user) => {
      const record = attendanceRecords.find(
        (r) => r.userId.toString() === user._id.toString(),
      );
      if (record) {
        // Enrich with recalculated duration for legacy data
        const enrichedRecord = enrichAttendanceRecord({ ...record });
        return { ...enrichedRecord, userId: user };
      }
      return {
        _id: `virtual_${user._id}`,
        userId: user,
        date: searchDate,
        status: "Absent",
        checkInTime: null,
        checkOutTime: null,
        workingHours: 0,
        workingMinutes: 0,
      };
    });

    // 6. Apply filters on merged records (if status filter exists)
    let filteredRecords = records;
    if (status) {
      filteredRecords = records.filter(
        (r) => r.status.toLowerCase() === status.toLowerCase(),
      );
    }

    // 7. Calculate Statistics
    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === "Present").length,
      absent: records.filter((r) => r.status === "Absent").length,
      late: records.filter((r) => r.status === "Late").length,
    };

    // 8. Pagination
    const total = filteredRecords.length;
    const paginatedRecords = filteredRecords.slice(
      skip,
      skip + parseInt(limit),
    );

    return sendSuccess(res, "Team attendance records retrieved successfully", {
      records: paginatedRecords,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendError(
      res,
      "Failed to retrieve team attendance records",
      error.message,
    );
  }
};

const downloadExcelReport = async (req, res) => {
  try {
    const { fromDate, toDate, status, department, role, search } = req.query;
    const filter = {};

    if (fromDate && toDate) {
      filter.date = { $gte: new Date(fromDate), $lte: new Date(toDate) };
    }

    if (status) filter.status = status;

    const userFilter = {};
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }
    if (department) userFilter.department = department;
    if (role) userFilter.role = role;

    if (Object.keys(userFilter).length > 0) {
      const users = await User.find(userFilter).select("_id");
      filter.userId = { $in: users.map((u) => u._id) };
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate("userId", "name email employeeId department role")
      .lean();

    // Enrich records with recalculated duration for legacy data
    const enrichedRecords = records.map(enrichAttendanceRecord);

    const stats = {
      totalDays: enrichedRecords.length,
      presentDays: enrichedRecords.filter((r) => r.status === "Present").length,
      absentDays: enrichedRecords.filter((r) => r.status === "Absent").length,
      halfDays: enrichedRecords.filter((r) => r.status === "Half-day").length,
      wfhDays: enrichedRecords.filter((r) => r.status === "WFH").length,
      leaveDays: enrichedRecords.filter((r) => r.status === "Leave").length,
      totalWorkingHours: enrichedRecords.reduce(
        (sum, r) => sum + (r.workingHours || 0),
        0,
      ),
    };

    return sendSuccess(res, "Attendance report generated successfully", {
      records: enrichedRecords,
      statistics: stats,
    });
  } catch (error) {
    return sendError(
      res,
      "Failed to generate attendance report",
      error.message,
    );
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalHours, status, reason } = req.body;

    if (!id) {
      return sendError(
        res,
        "Attendance ID is required",
        "Bad Request",
        400,
      );
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return sendError(
        res,
        "Attendance record not found",
        "Not Found",
        404,
      );
    }

    // Update allowed fields
    if (totalHours !== undefined) {
      const parsedHours = parseFloat(totalHours);
      if (isNaN(parsedHours) || parsedHours < 0) {
        return sendError(
          res,
          "Invalid total hours value",
          "Bad Request",
          400,
        );
      }
      attendance.workingHours = parsedHours;
      // Also calculate workingMinutes from hours for consistency
      attendance.workingMinutes = Math.round(parsedHours * 60);
    }

    if (status !== undefined) {
      if (!["Present", "Absent", "Half-day", "WFH", "Leave"].includes(status)) {
        return sendError(
          res,
          "Invalid status value",
          "Bad Request",
          400,
        );
      }
      attendance.status = status;
    }

    if (reason !== undefined) {
      attendance.remarks = reason;
    }

    const updatedAttendance = await attendance.save();

    // Enrich with recalculated duration for consistency
    const enrichedRecord = enrichAttendanceRecord({ ...updatedAttendance.toObject() });

    return sendSuccess(
      res,
      "Attendance record updated successfully",
      enrichedRecord,
    );
  } catch (error) {
    return sendError(
      res,
      "Failed to update attendance record",
      error.message,
    );
  }
};

export {
  checkIn,
  checkOut,
  getMyAttendance,
  getTeamAttendance,
  downloadExcelReport,
  updateAttendance,
};
