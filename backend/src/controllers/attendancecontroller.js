import Attendance from "#models/attendance";
import User from "#models/user";
import Notification from "#models/notification";
import { sendSuccess, sendError } from "#utils/api_response_fix";

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

    let attendance;
    if (existingAttendance) {
      existingAttendance.checkInTime = new Date();
      existingAttendance.status = "Present";
      attendance = await existingAttendance.save();
    } else {
      attendance = await Attendance.create({
        userId,
        date: today,
        checkInTime: new Date(),
        status: "Present",
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
      .populate("userId", "name email employeeId");

    return sendSuccess(
      res,
      "Attendance records retrieved successfully",
      records,
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
        return { ...record, userId: user };
      }
      return {
        _id: `virtual_${user._id}`,
        userId: user,
        date: searchDate,
        status: "Absent",
        checkInTime: null,
        checkOutTime: null,
        workingHours: 0,
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
      .populate("userId", "name email employeeId department role");

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

    return sendSuccess(res, "Attendance report generated successfully", {
      records,
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

export {
  checkIn,
  checkOut,
  getMyAttendance,
  getTeamAttendance,
  downloadExcelReport,
};
