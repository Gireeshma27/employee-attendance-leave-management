import Attendance from "../models/attendance.model.js";
import User from "../models/user.model.js";
import Leave from "../models/leave.model.js";
import ApiResponse from "../utils/apiResponse.js";

export const getAdminDashboardStats = async (req, res) => {
  try {
    // 1. Get summary counts
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
    const absentToday = totalEmployees - todayAttendance.length; // Simplified: those without records are absent
    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });
    const avgAttendance =
      totalEmployees > 0
        ? Math.round((presentToday / totalEmployees) * 100)
        : 0;

    // 2. Weekly Trends (Last 7 days)
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

    // 3. Departmental Performance
    const departments = ["Engineering", "Design", "Marketing", "Sales"];
    const deptPerformance = await Promise.all(
      departments.map(async (dept) => {
        const deptUsers = await User.find({ department: dept }).select("_id");
        const userIds = deptUsers.map((u) => u._id);

        if (userIds.length === 0) return { name: dept, value: 0 };

        const deptAttendance = await Attendance.countDocuments({
          userId: { $in: userIds },
          date: { $gte: sevenDaysAgo, $lt: tomorrow },
          status: { $in: ["Present", "WFH"] },
        });

        // Calculate rate (present days / total possibilities)
        const totalPossibilities = userIds.length * 7;
        const rate = Math.round((deptAttendance / totalPossibilities) * 100);

        return { name: dept, value: rate };
      }),
    );

    // 4. Live Activity Log (Last 10 events)
    const recentAttendance = await Attendance.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("userId", "name email department");

    const recentLeaves = await Leave.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("userId", "name email department");

    // Merge and sort activities
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

    // 5. Active Sessions (Mock for now, or count users with check-ins today without check-outs)
    const activeSessions = todayAttendance
      .filter((a) => a.checkInTime && !a.checkOutTime)
      .slice(0, 3)
      .map((a) => ({
        initials: a.userId?.name
          ? a.userId.name
              .split(" ")
              .map((n) => n[0])
              .join("")
          : "??",
        name: a.userId?.name,
      }));

    return ApiResponse.success(
      res,
      200,
      "Dashboard stats retrieved successfully",
      {
        summary: {
          totalEmployees,
          presentToday,
          absentToday,
          pendingLeaves,
          avgAttendance,
        },
        trends,
        deptPerformance,
        activities,
        activeSessions,
      },
    );
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Failed to retrieve dashboard stats",
    );
  }
};
