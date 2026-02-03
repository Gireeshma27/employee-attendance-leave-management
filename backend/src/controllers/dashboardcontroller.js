import Attendance from "#models/attendance.model";
import User from "#models/user.model";
import Leave from "#models/leave.model";
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
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve dashboard stats", error.message);
  }
};

export { getAdminDashboardStats };
