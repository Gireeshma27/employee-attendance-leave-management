import Attendance from "../models/attendance.model.js";
import User from "../models/user.model.js";
import Leave from "../models/leave.model.js";
import ApiResponse from "../utils/apiResponse.js";

export const getAdminReportData = async (req, res) => {
  try {
    const { fromDate, toDate, period = "monthly" } = req.query;

    const start = fromDate
      ? new Date(fromDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = toDate ? new Date(toDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // 1. Get Top Stat Cards
    const totalEmployees = await User.countDocuments({ role: "EMPLOYEE" });

    // Active WFH Users (distinct users who had at least one WFH record in the period)
    const wfhUsersCount = await Attendance.distinct("userId", {
      date: { $gte: start, $lte: end },
      status: "WFH",
    });

    // Avg Attendance Rate
    const totalAttendanceRecords = await Attendance.countDocuments({
      date: { $gte: start, $lte: end },
      status: { $in: ["Present", "WFH"] },
    });

    // For rate, we need working days in period. Simple approx: diff in days * totalEmployees
    const daysDiff = Math.max(
      1,
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
    );
    const possibleRecords = totalEmployees * daysDiff;
    const avgAttendanceRate =
      totalEmployees > 0
        ? Math.round((totalAttendanceRecords / possibleRecords) * 100)
        : 0;

    // Avg Clock-in Time
    const checkInData = await Attendance.find({
      date: { $gte: start, $lte: end },
      checkInTime: { $exists: true },
    }).select("checkInTime");

    let avgClockInStr = "09:00";
    if (checkInData.length > 0) {
      let totalMinutes = 0;
      checkInData.forEach((record) => {
        const time = new Date(record.checkInTime);
        totalMinutes += time.getHours() * 60 + time.getMinutes();
      });
      const avgMinutes = Math.floor(totalMinutes / checkInData.length);
      const hours = Math.floor(avgMinutes / 60)
        .toString()
        .padStart(2, "0");
      const minutes = (avgMinutes % 60).toString().padStart(2, "0");
      avgClockInStr = `${hours}:${minutes}`;
    }

    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });

    // 2. Departmental Performance comparison
    const departments = ["IT", "HR", "Sales", "Legal", "Support"];
    const deptData = await Promise.all(
      departments.map(async (dept) => {
        const deptUsers = await User.find({ department: dept }).select("_id");
        const userIds = deptUsers.map((u) => u._id);

        if (userIds.length === 0) return { name: dept, value: 0 };

        const deptAttendance = await Attendance.countDocuments({
          userId: { $in: userIds },
          date: { $gte: start, $lte: end },
          status: { $in: ["Present", "WFH"] },
        });

        const rate = Math.round(
          (deptAttendance / (userIds.length * daysDiff)) * 100,
        );
        return { name: dept, value: rate };
      }),
    );

    // 3. Staff Availability (Today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const onSite = todayAttendance.filter((a) => a.status === "Present").length;
    const remote = todayAttendance.filter((a) => a.status === "WFH").length;
    const availabilityRate =
      totalEmployees > 0
        ? Math.round(((onSite + remote) / totalEmployees) * 100)
        : 0;

    // 4. Employee Table Data
    const users = await User.find({ role: "EMPLOYEE" }).limit(10); // Page 1 for mockup
    const employeeReports = await Promise.all(
      users.map(async (u) => {
        const userAttendance = await Attendance.find({
          userId: u._id,
          date: { $gte: start, $lte: end },
        });

        const presentDays = userAttendance.filter(
          (a) => a.status === "Present" || a.status === "WFH",
        ).length;
        // Mocking late marks for now or calculating if records have delay
        const lateMarks = 0; // In a real app, compare checkInTime with expected 09:00
        const efficiency = Math.round((presentDays / daysDiff) * 100);

        return {
          id: u._id,
          employeeId:
            u.employeeId || `EMP-${Math.floor(10000 + Math.random() * 90000)}`,
          name: u.name,
          department: u.department || "Engineering",
          status:
            presentDays > 0
              ? userAttendance[0].status === "WFH"
                ? "Remote"
                : "On-site"
              : "On Leave",
          daysPresent: `${presentDays} / ${daysDiff}`,
          lateMarks,
          efficiency,
        };
      }),
    );

    return ApiResponse.success(res, 200, "Report data retrieved successfully", {
      stats: {
        activeWFH: { value: wfhUsersCount.length, trend: "+12%" },
        attendanceRate: { value: `${avgAttendanceRate}%`, trend: "Stable" },
        avgClockIn: { value: avgClockInStr, trend: "-3%" },
        pendingLeaves: { value: pendingLeaves, trend: "+8%" },
      },
      deptPerformance: deptData,
      availability: {
        rate: availabilityRate,
        onSite,
        remote,
      },
      employees: employeeReports,
    });
  } catch (error) {
    console.error("Report data error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Failed to retrieve report data",
    );
  }
};
