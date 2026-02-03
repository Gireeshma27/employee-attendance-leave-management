import Leave from "#models/leave.model";
import User from "#models/user.model";
import { sendSuccess, sendError } from "#utils/api_response_fix";

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
      "name email employeeId",
    );

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
    const { status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email employeeId")
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

    leave.status = "Approved";
    leave.approvedBy = approverId;
    await leave.save();

    const populatedLeave = await Leave.findById(leave._id)
      .populate("userId", "name email employeeId")
      .populate("approvedBy", "name email");

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

    leave.status = "Rejected";
    leave.rejectionReason = rejectionReason;
    leave.approvedBy = approverId;
    await leave.save();

    const populatedLeave = await Leave.findById(leave._id)
      .populate("userId", "name email employeeId")
      .populate("approvedBy", "name email");

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

    return sendSuccess(
      res,
      "All leave requests retrieved successfully",
      leaves,
    );
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
