import Attendance from "#models/attendance";
import User from "#models/user";
import Leave from "#models/leave";
import { sendSuccess, sendError } from "#utils/api_response_fix";
import ExcelJS from "exceljs";

const getAdminReportData = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const start = fromDate
      ? new Date(fromDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = toDate ? new Date(toDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const totalEmployees = await User.countDocuments({ role: "EMPLOYEE" });

    const wfhUsersCount = await Attendance.distinct("userId", {
      date: { $gte: start, $lte: end },
      status: "WFH",
    });

    const totalAttendanceRecords = await Attendance.countDocuments({
      date: { $gte: start, $lte: end },
      status: { $in: ["Present", "WFH"] },
    });

    const daysDiff = Math.max(
      1,
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
    );
    const possibleRecords = totalEmployees * daysDiff;
    const avgAttendanceRate =
      totalEmployees > 0
        ? Math.round((totalAttendanceRecords / possibleRecords) * 100)
        : 0;

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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendanceCount = await Attendance.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ["Present", "WFH"] },
    });

    const availabilityRate =
      totalEmployees > 0
        ? Math.round((todayAttendanceCount / totalEmployees) * 100)
        : 0;

    const users = await User.find({ role: "EMPLOYEE" }).limit(10);
    const employeeReports = await Promise.all(
      users.map(async (u) => {
        const userAttendance = await Attendance.find({
          userId: u._id,
          date: { $gte: start, $lte: end },
        });

        const presentDays = userAttendance.filter(
          (a) => a.status === "Present" || a.status === "WFH",
        ).length;
        const efficiency = Math.round((presentDays / daysDiff) * 100);

        return {
          id: u._id,
          employeeId: u.employeeId || "N/A",
          name: u.name,
          department: u.department || "Engineering",
          status:
            presentDays > 0
              ? userAttendance[0].status === "WFH"
                ? "Remote"
                : "On-site"
              : "On Leave",
          daysPresent: `${presentDays} / ${daysDiff}`,
          efficiency,
        };
      }),
    );

    return sendSuccess(res, "Report data retrieved successfully", {
      stats: {
        activeWFH: { value: wfhUsersCount.length, trend: "+12%" },
        attendanceRate: { value: `${avgAttendanceRate}%`, trend: "Stable" },
        avgClockIn: { value: avgClockInStr, trend: "-3%" },
        pendingLeaves: { value: pendingLeaves, trend: "+8%" },
      },
      deptPerformance: deptData,
      availability: {
        rate: availabilityRate,
      },
      employees: employeeReports,
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve report data", error.message);
  }
};

const exportToExcel = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const start = fromDate
      ? new Date(fromDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = toDate ? new Date(toDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end },
    })
      .populate("userId", "name email department")
      .sort({ date: -1, checkInTime: -1 });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    // Define columns
    worksheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Employee Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Department", key: "department", width: 15 },
      { header: "Check-in", key: "checkInTime", width: 12 },
      { header: "Check-out", key: "checkOutTime", width: 12 },
      { header: "Working Hours", key: "workingHours", width: 14 },
      { header: "Status", key: "status", width: 12 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };

    // Add data rows
    attendanceRecords.forEach((record) => {
      worksheet.addRow({
        date: record.date ? new Date(record.date).toLocaleDateString() : "-",
        name: record.userId?.name || "-",
        email: record.userId?.email || "-",
        department: record.userId?.department || "-",
        checkInTime: record.checkInTime
          ? new Date(record.checkInTime).toLocaleTimeString()
          : "-",
        checkOutTime: record.checkOutTime
          ? new Date(record.checkOutTime).toLocaleTimeString()
          : "-",
        workingHours: record.workingHours || "-",
        status: record.status || "-",
      });
    });

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Attendance_Report_${new Date().toISOString().split("T")[0]}.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
  } catch (error) {
    console.error("Export to Excel error:", error);
    return sendError(res, "Failed to export report", error.message);
  }
};

export { getAdminReportData, exportToExcel };
