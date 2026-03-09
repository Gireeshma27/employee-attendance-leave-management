import Holiday from "#models/holiday";
import Notification from "#models/notification";
import User from "#models/user";
import { sendSuccess, sendError } from "#utils/api_response_fix";
import {
  getFixedHolidaysForYear,
  checkFixedHolidayForDate,
} from "#utils/fixedPublicHolidays";
import { formatDateRange } from "#utils/dateFormat";

/**
 * Format a date range string for notification messages.
 */
const fmtRange = (start, end) => formatDateRange(start, end);

/**
 * Send a SYSTEM notification to all employees and managers.
 */
const notifyStaff = async (senderId, title, message, relatedId) => {
  try {
    const recipients = await User.find(
      { role: { $in: ["EMPLOYEE", "MANAGER"] } },
      "_id",
    ).lean();
    if (!recipients.length) return;
    await Notification.insertMany(
      recipients.map((r) => ({
        recipient: r._id,
        sender: senderId,
        type: "SYSTEM",
        title,
        message,
        relatedId,
      })),
    );
  } catch (err) {
    console.error("notifyStaff error:", err.message);
  }
};

/**
 * @description Holiday controller for CRUD operations and holiday checking.
 * Merges:
 *   1) Fixed public holidays   (utility, no DB)
 *   2) Festival/Company holidays (DB, admin-managed)
 *   3) Weekend config           (stored on most recent Holiday document)
 * @module controllers/holidaycontroller
 */

const getHolidays = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const fixedHolidays = getFixedHolidaysForYear(year);

    const dbHolidays = await Holiday.find()
      .sort({ startDate: 1 })
      .populate("createdBy", "name email")
      .lean();

    // Tag DB holidays with source
    const taggedDbHolidays = dbHolidays.map((h) => ({ ...h, source: "DB" }));

    // Merge: fixed first (sorted by startDate), then DB
    const allHolidays = [...fixedHolidays, ...taggedDbHolidays].sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate),
    );

    return sendSuccess(res, "Holidays retrieved successfully", allHolidays);
  } catch (error) {
    return sendError(res, "Failed to retrieve holidays", error.message);
  }
};

const createHoliday = async (req, res) => {
  try {
    const { title, type, startDate, endDate, isSaturdayWorking, isSundayWorking } = req.body;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      return sendError(
        res,
        "End date must be on or after start date",
        "Bad Request",
        400,
      );
    }

    const holiday = await Holiday.create({
      title,
      type: type || "FESTIVAL",
      startDate: start,
      endDate: end,
      isSaturdayWorking: isSaturdayWorking ?? false,
      isSundayWorking: isSundayWorking ?? false,
      createdBy: req.user.id,
    });

    const populatedHoliday = await Holiday.findById(holiday._id)
      .populate("createdBy", "name email")
      .lean();

    // Build notification message
    const typeLabel = holiday.type === "FESTIVAL" ? "Festival" : "Company";
    const weekendParts = [];
    if (isSaturdayWorking) weekendParts.push("Saturday marked as Working Day");
    if (isSundayWorking) weekendParts.push("Sunday marked as Working Day");
    const notifMsg = weekendParts.length
      ? `New ${typeLabel} Holiday: ${title} (${fmtRange(start, end)}). ${weekendParts.join(", ")}`
      : `New ${typeLabel} Holiday: ${title} (${fmtRange(start, end)})`;
    await notifyStaff(req.user.id, "Holiday Added", notifMsg, holiday._id);

    return sendSuccess(
      res,
      "Holiday created successfully",
      { ...populatedHoliday, source: "DB" },
      201,
    );
  } catch (error) {
    return sendError(res, "Failed to create holiday", error.message);
  }
};

const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, startDate, endDate, isSaturdayWorking, isSundayWorking } = req.body;

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return sendError(res, "Holiday not found", "Not Found", 404);
    }

    if (title !== undefined) holiday.title = title;
    if (type !== undefined) holiday.type = type;
    if (isSaturdayWorking !== undefined) holiday.isSaturdayWorking = isSaturdayWorking;
    if (isSundayWorking !== undefined) holiday.isSundayWorking = isSundayWorking;

    if (startDate !== undefined) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      holiday.startDate = start;
    }

    if (endDate !== undefined) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      holiday.endDate = end;
    }

    if (holiday.endDate < holiday.startDate) {
      return sendError(
        res,
        "End date must be on or after start date",
        "Bad Request",
        400,
      );
    }

    const updatedHoliday = await holiday.save();

    const populatedHoliday = await Holiday.findById(updatedHoliday._id)
      .populate("createdBy", "name email")
      .lean();

    // Build notification message
    const weekendParts = [];
    if (updatedHoliday.isSaturdayWorking) weekendParts.push("Saturday marked as Working Day");
    if (updatedHoliday.isSundayWorking) weekendParts.push("Sunday marked as Working Day");
    const notifMsg = weekendParts.length
      ? `Holiday Updated: ${updatedHoliday.title} (${fmtRange(updatedHoliday.startDate, updatedHoliday.endDate)}). ${weekendParts.join(", ")}`
      : `Holiday Updated: ${updatedHoliday.title} (${fmtRange(updatedHoliday.startDate, updatedHoliday.endDate)})`;
    await notifyStaff(req.user.id, "Holiday Updated", notifMsg, updatedHoliday._id);

    return sendSuccess(res, "Holiday updated successfully", {
      ...populatedHoliday,
      source: "DB",
    });
  } catch (error) {
    return sendError(res, "Failed to update holiday", error.message);
  }
};

const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return sendError(res, "Holiday not found", "Not Found", 404);
    }

    await Holiday.findByIdAndDelete(id);

    return sendSuccess(res, "Holiday deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete holiday", error.message);
  }
};

/**
 * Check if a given date is blocked (holiday or non-working weekend).
 * Priority:
 *   1. Fixed public holiday (utility)
 *   2. Festival/Company holiday range (DB)
 *   3. Weekend config (most-recently created Holiday document's settings)
 *
 * @param {Date} dateToCheck
 * @returns {{ isBlocked: boolean, message: string|null }}
 */
const checkHolidayForDate = async (dateToCheck) => {
  const checkDate = new Date(dateToCheck);
  checkDate.setHours(0, 0, 0, 0);

  // 1. Fixed public holiday check
  const fixedCheck = checkFixedHolidayForDate(checkDate);
  if (fixedCheck.isHoliday) {
    return {
      isBlocked: true,
      message: `Today is ${fixedCheck.title} (Public Holiday)`,
    };
  }

  // 2. Festival / Company holiday range check
  const dbHoliday = await Holiday.findOne({
    startDate: { $lte: checkDate },
    endDate: { $gte: checkDate },
  }).lean();

  if (dbHoliday) {
    return {
      isBlocked: true,
      message: `Today is ${dbHoliday.title}${dbHoliday.type === "FESTIVAL" ? " Festival" : " Holiday"}`,
    };
  }

  // 3. Weekend check using most-recently created holiday document's settings
  const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const latestHoliday = await Holiday.findOne().sort({ createdAt: -1 }).lean();
    const satWorking = latestHoliday?.isSaturdayWorking ?? false;
    const sunWorking = latestHoliday?.isSundayWorking ?? false;
    if (dayOfWeek === 6 && !satWorking) {
      return { isBlocked: true, message: "Today is Weekend (Saturday)" };
    }
    if (dayOfWeek === 0 && !sunWorking) {
      return { isBlocked: true, message: "Today is Weekend (Sunday)" };
    }
  }

  return { isBlocked: false, message: null };
};

export {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  checkHolidayForDate,
};

