"use client";

import AttendanceModule from "@/components/attendance/AttendanceModule";

/**
 * Employee Attendance Page
 * Uses the shared AttendanceModule component for personal check-in/out and history.
 */
export default function AttendancePage() {
  return <AttendanceModule role="employee" />;
}
