import Leave from "#models/leave";
import User from "#models/user";
import Notification from "#models/notification";
import { sendSuccess, sendError } from "#utils/api_response_fix";
import Holiday from "#models/holiday";
import { checkFixedHolidayForDate } from "#utils/fixedPublicHolidays";
import { formatDate } from "#utils/dateFormat";

const applyLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const { leaveType, fromDate, toDate, numberOfDays, reason } = req.body;

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from > to) {
      return sendError(
        res,
        "From date cannot be greater than to date",
        "Bad Request",
        400,
      );
    }

    if (from < new Date().setHours(0, 0, 0, 0)) {
      return sendError(
        res,
        "Cannot apply for leave in the past",
        "Bad Request",
        400,
      );
    }

    // Check if any of the leave dates fall on a fixed or festival holiday
    // Fetch DB holidays that overlap the leave date range in a single query
    const overlappingDbHolidays = await Holiday.find({
      startDate: { $lte: to },
      endDate: { $gte: from },
    }).lean();

    const currentDate = new Date(from);
    while (currentDate <= to) {
      const checkDate = new Date(currentDate);
      checkDate.setHours(0, 0, 0, 0);

      // 1. Fixed public holiday check
      const fixedCheck = checkFixedHolidayForDate(checkDate);
      if (fixedCheck.isHoliday) {
        return sendError(
          res,
          "Selected date overlaps with company holiday",
          "Bad Request",
          400,
        );
      }

      // 2. Festival / Company holiday range check
      const dbHoliday = overlappingDbHolidays.find((h) => {
        const start = new Date(h.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(h.endDate);
        end.setHours(0, 0, 0, 0);
        return checkDate >= start && checkDate <= end;
      });
      if (dbHoliday) {
        return sendError(
          res,
          "Selected date overlaps with company holiday",
          "Bad Request",
          400,
        );
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const leave = await Leave.create({
      userId,
      leaveType,
      fromDate: from,
      toDate: to,
      numberOfDays,
      reason,
      status: "Pending",
    });

    const populatedLeave = await Leave.findById(leave._id).populate(
      "userId",
      "name email employeeId managerId",
    );

    // Notify all Admins and Managers
    const notificationPromises = [];
    const recipients = await User.find({
      role: { $in: ["ADMIN", "MANAGER"] },
      _id: { $ne: userId },
    });

    const notifiedIds = new Set();
    recipients.forEach((recipient) => {
      if (!notifiedIds.has(recipient._id.toString())) {
        notifiedIds.add(recipient._id.toString());
        notificationPromises.push(
          Notification.create({
            recipient: recipient._id,
            sender: userId,
            type: "LEAVE_REQUEST",
            title: "New Leave Request",
            message: `${populatedLeave.userId.name} has requested ${numberOfDays} days of leave from ${formatDate(from)} to ${formatDate(to)}.`,
            relatedId: leave._id,
          }),
        );
      }
    });

    // Also notify employee's specific manager if they have a different role
    const employee = await User.findById(userId).populate("managerId");
    if (
      employee?.managerId &&
      !notifiedIds.has(employee.managerId._id.toString())
    ) {
      notificationPromises.push(
        Notification.create({
          recipient: employee.managerId._id,
          sender: userId,
          type: "LEAVE_REQUEST",
          title: "New Leave Request",
          message: `${populatedLeave.userId.name} has requested ${numberOfDays} days of leave from ${formatDate(from)} to ${formatDate(to)}.`,
          relatedId: leave._id,
        }),
      );
    }

    await Promise.all(notificationPromises);

    return sendSuccess(
      res,
      "Leave request submitted successfully",
      populatedLeave,
      201,
    );
  } catch (error) {
    return sendError(res, "Failed to apply for leave", error.message);
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = { userId };
    if (status) filter.status = status;

    // Fetch total count for pagination
    const totalRecords = await Leave.countDocuments(filter);

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("userId", "name email employeeId")
      .populate("approvedBy", "name email");

    // Fetch ALL approved leaves to calculate correct balance regardless of current page
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

    const balances = {
      CL: Math.max(0, 12 - clUsed),
      SL: Math.max(0, 8 - slUsed),
      PL: Math.max(0, 18 - plUsed),
    };

    return sendSuccess(res, "Leave requests retrieved successfully", {
      records: leaves,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
      balances,
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve leave requests", error.message);
  }
};

const getPendingLeaves = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const filter = { status: "Pending" };

    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) filter.userId = user._id;
    }

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email employeeId department")
      .populate("approvedBy", "name email");

    return sendSuccess(
      res,
      "Pending leave requests retrieved successfully",
      leaves,
    );
  } catch (error) {
    return sendError(
      res,
      "Failed to retrieve pending leave requests",
      error.message,
    );
  }
};

const approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const approverId = req.user.id;

    const leave = await Leave.findById(leaveId);
    if (!leave)
      return sendError(res, "Leave request not found", "Not Found", 404);

    if (leave.status !== "Pending") {
      return sendError(
        res,
        `Cannot approve a ${leave.status.toLowerCase()} leave request`,
        "Bad Request",
        400,
      );
    }

    // Use findByIdAndUpdate to update only status fields without triggering full validation
    await Leave.findByIdAndUpdate(
      leaveId,
      { status: "Approved", approvedBy: approverId },
      { new: true, runValidators: false }
    );

    const approver = await User.findById(approverId, "name role");
    const approverLabel = approver?.role === "MANAGER" ? "Manager" : "Admin";

    const populatedLeave = await Leave.findById(leave._id)
      .populate("userId", "name email employeeId")
      .populate("approvedBy", "name email");

    // Notify Employee and Admins/Managers (non-critical - don't fail if notifications error)
    try {
      const notificationPromises = [
        Notification.create({
          recipient: leave.userId,
          sender: approverId,
          type: "LEAVE_RESPONSE",
          title: "Leave Request Approved",
          message: `Your leave request from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} has been approved by ${approverLabel} ${approver?.name || ""}.`,
          relatedId: leave._id,
        }),
      ];

      // Notify all Admins and Managers about the approval (except the approver)
      const recipients = await User.find({
        role: { $in: ["ADMIN", "MANAGER"] },
        _id: { $ne: approverId },
      });
      recipients.forEach((recipient) => {
        notificationPromises.push(
          Notification.create({
            recipient: recipient._id,
            sender: approverId,
            type: "LEAVE_RESPONSE",
            title: "Leave Request Approved",
            message: `${populatedLeave.userId.name}'s leave request from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} has been approved by ${approverLabel} ${approver?.name || ""}.`,
            relatedId: leave._id,
          }),
        );
      });
      await Promise.all(notificationPromises);
    } catch (notifError) {
      // Log but don't fail the request
      console.error("Failed to create approval notifications:", notifError);
    }

    return sendSuccess(
      res,
      "Leave request approved successfully",
      populatedLeave,
    );
  } catch (error) {
    return sendError(res, "Failed to approve leave request", error.message);
  }
};

const rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { rejectionReason } = req.body;
    const approverId = req.user.id;

    const leave = await Leave.findById(leaveId);
    if (!leave)
      return sendError(res, "Leave request not found", "Not Found", 404);

    if (leave.status !== "Pending") {
      return sendError(
        res,
        `Cannot reject a ${leave.status.toLowerCase()} leave request`,
        "Bad Request",
        400,
      );
    }

    // Use findByIdAndUpdate to update only status fields without triggering full validation
    await Leave.findByIdAndUpdate(
      leaveId,
      { status: "Rejected", rejectionReason, approvedBy: approverId },
      { new: true, runValidators: false }
    );

    const approver = await User.findById(approverId, "name role");
    const approverLabel = approver?.role === "MANAGER" ? "Manager" : "Admin";

    const populatedLeave = await Leave.findById(leave._id)
      .populate("userId", "name email employeeId")
      .populate("approvedBy", "name email");

    // Notify Employee and Admins/Managers (non-critical - don't fail if notifications error)
    try {
      const notificationPromises = [
        Notification.create({
          recipient: leave.userId,
          sender: approverId,
          type: "LEAVE_RESPONSE",
          title: "Leave Request Rejected",
          message: `Your leave request from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} has been rejected by ${approverLabel} ${approver?.name || ""}. Reason: ${rejectionReason}`,
          relatedId: leave._id,
        }),
      ];

      // Notify all Admins and Managers about the rejection (except the approver)
      const recipients = await User.find({
        role: { $in: ["ADMIN", "MANAGER"] },
        _id: { $ne: approverId },
      });
      recipients.forEach((recipient) => {
        notificationPromises.push(
          Notification.create({
            recipient: recipient._id,
            sender: approverId,
            type: "LEAVE_RESPONSE",
            title: "Leave Request Rejected",
            message: `${populatedLeave.userId.name}'s leave request from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} has been rejected by ${approverLabel} ${approver?.name || ""}.`,
            relatedId: leave._id,
          }),
        );
      });
      await Promise.all(notificationPromises);
    } catch (notifError) {
      // Log but don't fail the request
      console.error("Failed to create rejection notifications:", notifError);
    }

    return sendSuccess(
      res,
      "Leave request rejected successfully",
      populatedLeave,
    );
  } catch (error) {
    return sendError(res, "Failed to reject leave request", error.message);
  }
};

const cancelLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const userId = req.user.id;

    const leave = await Leave.findById(leaveId);
    if (!leave)
      return sendError(res, "Leave request not found", "Not Found", 404);

    if (leave.userId.toString() !== userId) {
      return sendError(
        res,
        "You can only cancel your own leave requests",
        "Forbidden",
        403,
      );
    }

    if (leave.status === "Approved" && new Date(leave.fromDate) < new Date()) {
      return sendError(
        res,
        "Cannot cancel an approved leave request that has already started",
        "Bad Request",
        400,
      );
    }

    await Leave.findByIdAndDelete(leaveId);
    return sendSuccess(res, "Leave request cancelled successfully");
  } catch (error) {
    return sendError(res, "Failed to cancel leave request", error.message);
  }
};

const getAllLeavesForAdmin = async (req, res) => {
  try {
    const { status, employeeId, leaveType, fromDate, toDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;
    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) filter.userId = user._id;
    }
    if (fromDate && toDate) {
      filter.fromDate = { $gte: new Date(fromDate), $lte: new Date(toDate) };
    }

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email employeeId department role")
      .populate("approvedBy", "name email");

    // Transform leaves to include employeeName, employeeId, department for frontend
    const transformedLeaves = leaves.map((leave) => ({
      _id: leave._id,
      leaveType: leave.leaveType,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      numberOfDays: leave.numberOfDays,
      reason: leave.reason,
      status: leave.status,
      appliedDate: leave.createdAt,
      employeeName: leave.userId?.name || "Unknown",
      employeeId: leave.userId?.employeeId || "-",
      department: leave.userId?.department || "-",
      approvedBy: leave.approvedBy,
      rejectionReason: leave.rejectionReason,
    }));

    // Calculate stats
    const totalPending = leaves.filter((l) => l.status === "Pending").length;
    const totalApproved = leaves.filter((l) => l.status === "Approved").length;
    const totalRejected = leaves.filter((l) => l.status === "Rejected").length;

    return sendSuccess(res, "All leave requests retrieved successfully", {
      leaves: transformedLeaves,
      totalPending,
      totalApproved,
      totalRejected,
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve leave requests", error.message);
  }
};

export {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getAllLeavesForAdmin,
};
