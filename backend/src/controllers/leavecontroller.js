import Leave from "#models/leave";
import User from "#models/user";
import Notification from "#models/notification";
import { sendSuccess, sendError } from "#utils/api_response_fix";

const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { leaveType, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validation: startDate must be before endDate
    if (start >= end) {
      return sendError(
        res,
        "Start date must be before end date",
        "Bad Request",
        400,
      );
    }

    // Validation: cannot apply leave for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return sendError(
        res,
        "Cannot apply leave for past dates",
        "Bad Request",
        400,
      );
    }

    // Validation: prevent overlapping leaves for same employee
    const overlappingLeave = await Leave.findOne({
      employee: employeeId,
      status: { $in: ["Pending", "Approved"] },
      $or: [
        { startDate: { $lte: start }, endDate: { $gte: start } },
        { startDate: { $lte: end }, endDate: { $gte: end } },
        { startDate: { $gte: start }, endDate: { $lte: end } },
      ],
    });

    if (overlappingLeave) {
      return sendError(
        res,
        "You already have a leave application for these dates",
        "Bad Request",
        400,
      );
    }

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      status: "Pending",
      appliedAt: new Date(),
    });

    const populatedLeave = await Leave.findById(leave._id).populate(
      "employee",
      "name email employeeId",
    );

    // Notify Admins and Managers
    const adminsAndManagers = await User.find({ 
      role: { $in: ["ADMIN", "MANAGER"] } 
    });
    const notificationPromises = adminsAndManagers.map((user) =>
      Notification.create({
        recipient: user._id,
        sender: employeeId,
        type: "LEAVE_REQUEST",
        title: "New Leave Request",
        message: `${populatedLeave.employee.name} has requested leave from ${startDate} to ${endDate}.`,
        relatedId: leave._id,
      }),
    );
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
    const employeeId = req.user.id;
    const { status } = req.query;

    const filter = { employee: employeeId };
    if (status) filter.status = status;

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate("employee", "name email employeeId")
      .populate("approvedBy", "name email");

    return sendSuccess(res, "Leave requests retrieved successfully", leaves);
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
      if (user) filter.employee = user._id;
    }

    // Role-based filtering
    if (req.user.role === 'MANAGER') {
      filter.managerApproved = false; // Managers see leaves not approved by manager
    }
    // Admins can see all pending leaves

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate("employee", "name email employeeId department")
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
    const approverRole = req.user.role;

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

    if (approverRole === 'MANAGER') {
      // Manager approves: set managerApproved to true
      leave.managerApproved = true;
      leave.approvedBy = approverId;
      await leave.save();

      const populatedLeave = await Leave.findById(leave._id)
        .populate("employee", "name email employeeId")
        .populate("approvedBy", "name email");

      // Notify Employee and Admins
      await Notification.create({
        recipient: leave.employee,
        sender: approverId,
        type: "LEAVE_RESPONSE",
        title: "Leave Request Approved by Manager",
        message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been approved by your manager and is now pending admin approval.`,
        relatedId: leave._id,
      });

      const admins = await User.find({ role: "ADMIN" });
      const adminNotifications = admins.map((admin) =>
        Notification.create({
          recipient: admin._id,
          sender: approverId,
          type: "LEAVE_REQUEST",
          title: "Leave Request Approved by Manager",
          message: `${populatedLeave.employee.name}'s leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been approved by manager and awaits your approval.`,
          relatedId: leave._id,
        }),
      );
      await Promise.all(adminNotifications);

      return sendSuccess(
        res,
        "Leave request approved by manager successfully",
        populatedLeave,
      );
    } else if (approverRole === 'ADMIN') {
      // Admin can approve directly (bypass manager approval if needed)
      leave.status = "Approved";
      leave.managerApproved = true; // Mark as approved
      leave.approvedBy = approverId;
      await leave.save();

      const populatedLeave = await Leave.findById(leave._id)
        .populate("employee", "name email employeeId")
        .populate("approvedBy", "name email");

      // Notify Employee
      await Notification.create({
        recipient: leave.employee,
        sender: approverId,
        type: "LEAVE_RESPONSE",
        title: "Leave Request Approved",
        message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been approved.`,
        relatedId: leave._id,
      });

      return sendSuccess(
        res,
        "Leave request approved successfully",
        populatedLeave,
      );
    } else {
      return sendError(res, "Unauthorized to approve leave", "Forbidden", 403);
    }
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

    leave.status = "Rejected";
    leave.rejectionReason = rejectionReason;
    leave.approvedBy = approverId;
    await leave.save();

    const populatedLeave = await Leave.findById(leave._id)
      .populate("employee", "name email employeeId")
      .populate("approvedBy", "name email");

    // Notify Employee
    await Notification.create({
      recipient: leave.employee,
      sender: approverId,
      type: "LEAVE_RESPONSE",
      title: "Leave Request Rejected",
      message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been rejected. Reason: ${rejectionReason}`,
      relatedId: leave._id,
    });

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

    if (leave.employee.toString() !== userId) {
      return sendError(
        res,
        "You can only cancel your own leave requests",
        "Forbidden",
        403,
      );
    }

    if (leave.status === "Approved" && new Date(leave.startDate) < new Date()) {
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

const getAllLeaves = async (req, res) => {
  try {
    const { status, employeeId, leaveType, startDate, endDate, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;
    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) filter.employee = user._id;
    }
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Role-based filtering for approval workflow
    if (req.user.role === 'MANAGER') {
      filter.status = 'Pending';
      filter.managerApproved = false; // Managers see pending leaves not approved by manager
    }
    // Admins can see all pending leaves for final approval

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("employee", "name email employeeId department role")
      .populate("approvedBy", "name email");

    const total = await Leave.countDocuments(filter);
    const totalPending = await Leave.countDocuments({ ...filter, status: "Pending" });
    const totalApproved = await Leave.countDocuments({ ...filter, status: "Approved" });
    const totalRejected = await Leave.countDocuments({ ...filter, status: "Rejected" });

    return sendSuccess(
      res,
      "All leave requests retrieved successfully",
      {
        leaves,
        totalPending,
        totalApproved,
        totalRejected,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalLeaves: total,
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      },
    );
  } catch (error) {
    return sendError(res, "Failed to retrieve leave requests", error.message);
  }
};

const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const leave = await Leave.findById(id);
    if (!leave) {
      return sendError(res, "Leave request not found", "Not Found", 404);
    }

    // Only admin can delete leaves, or employee can delete their own pending leaves
    if (userRole !== "ADMIN" && (leave.employee.toString() !== userId || leave.status !== "Pending")) {
      return sendError(
        res,
        "You don't have permission to delete this leave request",
        "Forbidden",
        403,
      );
    }

    await Leave.findByIdAndDelete(id);
    return sendSuccess(res, "Leave request deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete leave request", error.message);
  }
};

export {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  deleteLeave,
};
