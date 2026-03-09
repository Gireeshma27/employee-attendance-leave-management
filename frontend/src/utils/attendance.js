/**
 * Centralized attendance duration utilities.
 * Used by Employee, Manager, and Admin dashboards for consistent calculations.
 */
import { formatTime } from "@/utils/formatDate";

export { formatTime };

/**
 * Calculate active/working duration between two timestamps.
 * If checkOut is null, uses currentTime (live counter).
 * Prevents negative durations.
 *
 * @param {Date|string|null} checkInTime
 * @param {Date|string|null} checkOutTime
 * @param {Date} [currentTime=new Date()] - fallback end time for active sessions
 * @returns {{ h: number, m: number }}
 */
export const getActiveDuration = (checkInTime, checkOutTime, currentTime = new Date()) => {
  if (!checkInTime) return { h: 0, m: 0 };

  const startTime = new Date(checkInTime);
  const endTime = checkOutTime ? new Date(checkOutTime) : currentTime;

  const diffMs = endTime - startTime;
  if (diffMs < 0) return { h: 0, m: 0 };

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  return {
    h: Math.floor(totalMinutes / 60),
    m: totalMinutes % 60,
  };
};

/**
 * Format a duration to "Xh Ym" string from workingHours (fractional) or check-in/out times.
 * Handles all edge cases:
 *  - If checkOut is null and checkIn exists → "Active"
 *  - If workingHours exists → use it directly
 *  - If both checkIn and checkOut exist → calculate from timestamps
 *  - Prevents negative durations
 *
 * @param {Object} record - Attendance record
 * @param {number} [record.workingHours] - Fractional hours from backend
 * @param {Date|string|null} [record.checkInTime]
 * @param {Date|string|null} [record.checkOutTime]
 * @returns {string} Formatted duration string
 */
export const formatDuration = (record) => {
  if (!record) return "-";

  const { workingHours, checkInTime, checkOutTime } = record;

  // Active session: checked in but not out
  if (checkInTime && !checkOutTime) return "Active";

  // Use backend's pre-calculated workingHours (enriched for legacy records)
  if (workingHours && workingHours > 0) {
    const h = Math.floor(workingHours);
    const m = Math.round((workingHours % 1) * 60);
    return `${h}h ${m}m`;
  }

  // Fallback: calculate from timestamps
  if (checkInTime && checkOutTime) {
    const diffMs = new Date(checkOutTime) - new Date(checkInTime);
    if (diffMs < 0) return "0h 0m";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  }

  return "-";
};

/**
 * Get the status badge variant for an attendance status string.
 * @param {string} status
 * @returns {string} Badge variant name
 */
export const getStatusVariant = (status) => {
  switch (status) {
    case "Present":
      return "success";
    case "Absent":
      return "danger";
    case "Late":
      return "warning";
    case "WFH":
      return "info";
    case "Half-day":
      return "warning";
    case "Leave":
      return "secondary";
    default:
      return "secondary";
  }
};
