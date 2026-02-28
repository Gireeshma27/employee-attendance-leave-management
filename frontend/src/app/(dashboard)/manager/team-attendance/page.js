"use client";

import AttendanceModule from "@/components/attendance/AttendanceModule";

/**
 * Manager Attendance Page
 * Uses the shared AttendanceModule component — identical to Employee Attendance.
 * Personal check-in/out and attendance history with Eye icon action column.
 */
export default function TeamAttendancePage() {
  return <AttendanceModule role="manager" />;
}
