import Attendance from "#models/attendance";
import User from "#models/user";
import Leave from "#models/leave";
import Timing from "#models/timing";
import { sendSuccess, sendError } from "#utils/api_response_fix";
import ExcelJS from "exceljs";
import { formatDate, formatTime, formatDateRange } from "#utils/dateFormat";

const getAdminReportData = async (req, res) => {
  try {
    const { fromDate, toDate, period = "monthly" } = req.query;

    let start, end;
    
    // Support both explicit date range and period-based filtering
    if (fromDate && toDate) {
      start = new Date(fromDate);
      end = new Date(toDate);
    } else {
      // Calculate date range based on period (Weekly/Monthly/Yearly)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate();
      
      if (period.toLowerCase() === "weekly") {
        const day = now.getDay();
        start = new Date(now);
        start.setDate(date - day); // Start of week (Sunday)
        end = new Date(now);
      } else if (period.toLowerCase() === "yearly") {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
      } else {
        // Default to monthly
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
      }
    }
    
    start.setHours(0, 0, 0, 0);
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

    // Fetch ALL employees (not limited to 10)
    const users = await User.find({ role: "EMPLOYEE" });
    
    // Fetch all active timings for department matching
    const allTimings = await Timing.find({ isActive: true });
    
    const employeeReports = await Promise.all(
      users.map(async (u) => {
        const userAttendance = await Attendance.find({
          userId: u._id,
          date: { $gte: start, $lte: end },
        }).sort({ date: -1 });

        // Check for approved leaves during this period
        const userLeaves = await Leave.find({
          userId: u._id,
          fromDate: { $lte: end },
          toDate: { $gte: start },
          status: "Approved",
        });
        
        const hasApprovedLeave = userLeaves.length > 0;
        const presentDays = userAttendance.filter(
          (a) => a.status === "Present" || a.status === "WFH",
        ).length;
        const efficiency = daysDiff > 0 ? Math.round((presentDays / daysDiff) * 100) : 0;
        
        // Determine status: if approved leave exists, show "On Leave"
        let status = "Absent";
        if (hasApprovedLeave) {
          status = "On Leave";
        } else if (userAttendance.length > 0) {
          const latestRecord = userAttendance[0];
          status = latestRecord.status === "WFH" ? "Remote" : "On-site";
        }

        // Get expected login time from timing configuration
        let expectedLogin = null;
        const matchingTiming = allTimings.find(t => t.departments.includes(u.department));
        if (matchingTiming) {
          expectedLogin = matchingTiming.loginTime;
        }

        // Get actual average login time
        let actualLogin = null;
        const checkedInRecords = userAttendance.filter(a => a.checkInTime);
        if (checkedInRecords.length > 0) {
          let totalMinutes = 0;
          checkedInRecords.forEach(r => {
            const time = new Date(r.checkInTime);
            totalMinutes += time.getHours() * 60 + time.getMinutes();
          });
          const avgMinutes = Math.floor(totalMinutes / checkedInRecords.length);
          const hours = Math.floor(avgMinutes / 60).toString().padStart(2, "0");
          const minutes = (avgMinutes % 60).toString().padStart(2, "0");
          actualLogin = `${hours}:${minutes}`;
        }

        return {
          id: u._id,
          employeeId: u.employeeId || "N/A",
          name: u.name,
          department: u.department || "Engineering",
          status,
          daysPresent: `${presentDays} / ${daysDiff}`,
          efficiency,
          expectedLogin,
          actualLogin,
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
    const { fromDate, toDate, period = "monthly" } = req.query;

    let start, end;
    
    // Support both explicit date range and period-based filtering
    if (fromDate && toDate) {
      start = new Date(fromDate);
      end = new Date(toDate);
    } else {
      // Calculate date range based on period
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const date = now.getDate();
      
      if (period.toLowerCase() === "weekly") {
        const day = now.getDay();
        start = new Date(now);
        start.setDate(date - day);
        end = new Date(now);
      } else if (period.toLowerCase() === "yearly") {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
      } else {
        // Default to monthly
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
      }
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // FETCH ALL EMPLOYEES to ensure complete coverage
    const allEmployees = await User.find({ role: "EMPLOYEE" }).select("_id name email department");
    const employeeMap = new Map(allEmployees.map(e => [e._id.toString(), e]));
    
    // Get all attendance records in date range
    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end },
    })
      .populate("userId", "name email department")
      .sort({ date: -1, checkInTime: -1 });
    
    // Get all approved leaves in date range
    const approvedLeaves = await Leave.find({
      fromDate: { $lte: end },
      toDate: { $gte: start },
      status: "Approved",
    }).select("userId fromDate toDate leaveType");
    
    // Create map of employees with leave for quick lookup
    const employeeLeaveMap = new Map();
    approvedLeaves.forEach(leave => {
      if (!employeeLeaveMap.has(leave.userId.toString())) {
        employeeLeaveMap.set(leave.userId.toString(), []);
      }
      employeeLeaveMap.get(leave.userId.toString()).push(leave);
    });

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

    // Create a set to track which employees have records in the date range
    const employeesWithRecords = new Set(attendanceRecords.map(r => r.userId?._id?.toString()));
    
    // Add data rows from attendance records
    attendanceRecords.forEach((record) => {
      worksheet.addRow({
        date: record.date ? formatDate(record.date) : "-",
        name: record.userId?.name || "-",
        email: record.userId?.email || "-",
        department: record.userId?.department || "-",
        checkInTime: record.checkInTime
          ? formatTime(record.checkInTime)
          : "-",
        checkOutTime: record.checkOutTime
          ? formatTime(record.checkOutTime)
          : "-",
        workingHours: record.workingHours || "-",
        status: record.status || "-",
      });
    });
    
    // Add rows for employees on approved leave but without attendance records
    const leavingEmployees = new Set();
    approvedLeaves.forEach(leave => {
      leavingEmployees.add(leave.userId.toString());
    });
    
    // For each employee on leave, add a row showing their leave status
    leavingEmployees.forEach(employeeId => {
      const employee = employeeMap.get(employeeId);
      const leaves = employeeLeaveMap.get(employeeId) || [];
      if (employee && !employeesWithRecords.has(employeeId)) {
        // Generate one row per day in the leave period
        leaves.forEach(leave => {
          let currentDate = new Date(leave.fromDate);
          const endLeaveDate = new Date(leave.toDate);
          while (currentDate <= endLeaveDate) {
            if (currentDate >= start && currentDate <= end) {
              worksheet.addRow({
                date: formatDate(currentDate),
                name: employee.name || "-",
                email: employee.email || "-",
                department: employee.department || "-",
                checkInTime: "-",
                checkOutTime: "-",
                workingHours: "-",
                status: "Leave (" + leave.leaveType + ")",
              });
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });
      }
    });

    // Add rows for absent employees (no attendance and no approved leave)
    // These are employees who don't appear in either attendance records or approved leaves
    allEmployees.forEach(employee => {
      const employeeId = employee._id.toString();
      if (!employeesWithRecords.has(employeeId) && !leavingEmployees.has(employeeId)) {
        // This employee has no attendance and no approved leave - mark as Absent
        // Add one summary row for the period
        worksheet.addRow({
          date: formatDateRange(start, end),
          name: employee.name || "-",
          email: employee.email || "-",
          department: employee.department || "-",
          checkInTime: "-",
          checkOutTime: "-",
          workingHours: "-",
          status: "Absent",
        });
      }
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
