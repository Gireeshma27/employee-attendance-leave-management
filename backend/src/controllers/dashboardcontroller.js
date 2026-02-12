import Attendance from "#models/attendance";
import User from "#models/user";
import Leave from "#models/leave";
import Office from "#models/office";
import { sendSuccess, sendError } from "#utils/api_response_fix";

const getAdminDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: "EMPLOYEE" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
    });

    const presentToday = todayAttendance.filter(
      (a) => a.status === "Present" || a.status === "WFH",
    ).length;
    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });
    const avgAttendance =
      totalEmployees > 0
        ? Math.round((presentToday / totalEmployees) * 100)
        : 0;

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyAttendance = await Attendance.find({
      date: { $gte: sevenDaysAgo, $lt: tomorrow },
    }).sort({ date: 1 });

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trends = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dStr = d.toISOString().split("T")[0];
      const dayRecords = weeklyAttendance.filter(
        (a) => new Date(a.date).toISOString().split("T")[0] === dStr,
      );

      trends.push({
        day: days[d.getDay()],
        date: dStr,
        office: dayRecords.filter((a) => a.status === "Present").length,
        wfh: dayRecords.filter((a) => a.status === "WFH").length,
      });
    }

    const recentAttendance = await Attendance.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("userId", "name email department");
    const recentLeaves = await Leave.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("userId", "name email department");

    const activities = [
      ...recentAttendance.map((a) => ({
        user: a.userId?.name || "Unknown",
        action:
          a.status === "Present"
            ? "checked in from"
            : a.status === "WFH"
              ? "started"
              : "updated",
        location:
          a.status === "Present"
            ? "Office"
            : a.status === "WFH"
              ? "WFH Session"
              : a.status,
        time: a.updatedAt,
        status:
          a.status === "Present"
            ? "On-Time"
            : a.status === "WFH"
              ? "Remote"
              : a.status,
        type: a.status === "WFH" ? "wfh" : "office",
      })),
      ...recentLeaves
        .filter((l) => l.status === "Pending")
        .map((l) => ({
          user: l.userId?.name || "Unknown",
          action: "requested",
          location: l.leaveType + " Leave",
          time: l.createdAt,
          status: "Pending",
          type: "leave",
        })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    // Calculate Department Performance
    const departments = [
      "IT",
      "HR",
      "Sales",
      "Marketing",
      "Finance",
      "Operations",
    ];
    const deptPerformance = await Promise.all(
      departments.map(async (dept) => {
        const deptTotal = await User.countDocuments({
          department: dept,
          role: "EMPLOYEE",
        });
        if (deptTotal === 0) return { name: dept, value: 0 };

        const deptPresent = await Attendance.countDocuments({
          date: { $gte: today, $lt: tomorrow },
          status: { $in: ["Present", "WFH"] },
          userId: {
            $in: await User.find({ department: dept }).distinct("_id"),
          },
        });

        return {
          name: dept,
          value: Math.round((deptPresent / deptTotal) * 100) || 0,
        };
      }),
    );

    // Get Active Sessions (Users checked in today)
    const activeSessions = (
      await Attendance.find({
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ["Present", "WFH"] },
      })
        .limit(5)
        .populate("userId", "name initials")
    ).map((a) => ({
      name: a.userId?.name || "User",
      initials:
        a.userId?.initials ||
        a.userId?.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) ||
        "??",
    }));

    return sendSuccess(res, "Dashboard stats retrieved successfully", {
      summary: {
        totalEmployees,
        presentToday,
        absentToday: totalEmployees - presentToday,
        pendingLeaves,
        avgAttendance,
      },
      trends,
      activities,
      deptPerformance: deptPerformance.sort((a, b) => b.value - a.value),
      activeSessions,
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve dashboard stats", error.message);
  }
};

const getEmployeeDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Fetch Today's Attendance
    const todayAttendance = await Attendance.findOne({
      userId,
      date: { $gte: today, $lt: tomorrow },
    });

    // 2. Fetch Leave Balance & Pending Count
    const allApprovedLeaves = await Leave.find({ userId, status: "Approved" });
    const clUsed = allApprovedLeaves
      .filter((l) => l.leaveType === "CL")
      .reduce((sum, l) => sum + (l.numberOfDays || 1), 0);
    const slUsed = allApprovedLeaves
      .filter((l) => l.leaveType === "SL")
      .reduce((sum, l) => sum + (l.numberOfDays || 1), 0);
    const plUsed = allApprovedLeaves
      .filter((l) => l.leaveType === "PL")
      .reduce((sum, l) => sum + (l.numberOfDays || 1), 0);

    const pendingLeavesCount = await Leave.countDocuments({
      userId,
      status: "Pending",
    });

    // 3. Get Recent Attendance (Last 5)
    const recentAttendance = await Attendance.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // 4. Enrich recent attendance (calculate working hours if missing)
    const enrichedAttendance = recentAttendance.map((record) => {
      if (
        record.checkOutTime &&
        (!record.workingHours || record.workingHours === 0)
      ) {
        const checkIn = new Date(record.checkInTime);
        const checkOut = new Date(record.checkOutTime);
        const workingMilliseconds = checkOut - checkIn;
        if (workingMilliseconds > 0) {
          const totalMinutes = Math.floor(workingMilliseconds / (1000 * 60));
          record.workingHours = Number((totalMinutes / 60).toFixed(2));
          record.workingMinutes = totalMinutes;
        }
      }
      return record;
    });

    return sendSuccess(res, "Employee dashboard stats retrieved successfully", {
      todayStatus: todayAttendance || null,
      stats: {
        pendingRequests: pendingLeavesCount,
        leaveBalance: {
          CL: Math.max(0, 12 - clUsed),
          SL: Math.max(0, 8 - slUsed),
          PL: Math.max(0, 18 - plUsed),
          total:
            Math.max(0, 12 - clUsed) +
            Math.max(0, 8 - slUsed) +
            Math.max(0, 18 - plUsed),
        },
      },
      recentAttendance: enrichedAttendance,
    });
  } catch (error) {
    return sendError(
      res,
      "Failed to retrieve employee dashboard stats",
      error.message,
    );
  }
};

const getManagerDashboardStats = async (req, res) => {
  try {
    const managerId = req.user.id;

    // 1. Get Team Members
    const teamMembers = await User.find({ managerId }).select(
      "_id name employeeId role department",
    );
    const teamUserIds = teamMembers.map((user) => user._id);
    const teamSize = teamMembers.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 2. Today's Team Attendance
    const todayAttendance = await Attendance.find({
      userId: { $in: teamUserIds },
      date: { $gte: today, $lt: tomorrow },
    });

    const presentToday = todayAttendance.filter(
      (a) => a.status === "Present" || a.status === "WFH",
    ).length;

    // 3. Pending Leave Approvals (Direct Reports)
    const pendingLeaves = await Leave.find({
      userId: { $in: teamUserIds },
      status: "Pending",
    }).populate("userId", "name employeeId department");

    return sendSuccess(res, "Manager dashboard stats retrieved successfully", {
      stats: {
        teamSize,
        presentToday,
        absentToday: Math.max(0, teamSize - presentToday),
        pendingApprovals: pendingLeaves.length,
      },
      pendingRequests: pendingLeaves,
      teamMembers: teamMembers.slice(0, 5), // Recent team slice
    });
  } catch (error) {
    return sendError(
      res,
      "Failed to retrieve manager dashboard stats",
      error.message,
    );
  }
};

export {
  getAdminDashboardStats,
  getEmployeeDashboardStats,
  getManagerDashboardStats,
};
