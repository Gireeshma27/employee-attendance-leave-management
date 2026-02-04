import Leave from '../models/leave.model.js';
import User from '../models/user.model.js';
import ApiResponse from '../utils/apiResponse.js';

// Apply for leave
export const applyLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const { leaveType, fromDate, toDate, numberOfDays, reason } = req.body;

    // Validation
    if (!leaveType || !fromDate || !toDate || !numberOfDays || !reason) {
      return ApiResponse.badRequest(res, 'Please provide all required fields.');
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from > to) {
      return ApiResponse.badRequest(res, 'From date cannot be greater than to date.');
    }

    if (from < new Date()) {
      return ApiResponse.badRequest(res, 'Cannot apply for leave in the past.');
    }

    // Create leave request
    const leave = await Leave.create({
      userId,
      leaveType,
      fromDate: from,
      toDate: to,
      numberOfDays: parseInt(numberOfDays),
      reason,
      status: 'Pending',
    });

    const populatedLeave = await Leave.findById(leave._id).populate(
      'userId',
      'name email employeeId'
    );

    return ApiResponse.created(res, 'Leave request submitted successfully.', populatedLeave);
  } catch (error) {
    console.error('Apply leave error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to apply for leave.');
  }
};

// Get my leave requests
export const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const filter = { userId };

    if (status) {
      filter.status = status;
    }

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email employeeId')
      .populate('approvedBy', 'name email');

    return ApiResponse.success(res, 200, 'Leave requests retrieved successfully.', leaves);
  } catch (error) {
    console.error('Get my leaves error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to retrieve leave requests.');
  }
};

// Get pending leave requests (for managers/admins)
export const getPendingLeaves = async (req, res) => {
  try {
    const { employeeId } = req.query;

    const filter = { status: 'Pending' };

    if (employeeId) {
      const user = await User.findOne({ employeeId });
      if (user) {
        filter.userId = user._id;
      }
    }

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email employeeId department')
      .populate('approvedBy', 'name email');

    return ApiResponse.success(res, 200, 'Pending leave requests retrieved successfully.', leaves);
  } catch (error) {
    console.error('Get pending leaves error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to retrieve pending leave requests.');
  }
};

// Approve leave (manager/admin)
export const approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const approverId = req.user.id;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return ApiResponse.notFound(res, 'Leave request not found.');
    }

    if (leave.status !== 'Pending') {
      return ApiResponse.badRequest(res, `Cannot approve a ${leave.status.toLowerCase()} leave request.`);
    }

    leave.status = 'Approved';
    leave.approvedBy = approverId;

    const updatedLeave = await leave.save();

    const populatedLeave = await Leave.findById(updatedLeave._id)
      .populate('userId', 'name email employeeId')
      .populate('approvedBy', 'name email');

    return ApiResponse.success(res, 200, 'Leave request approved successfully.', populatedLeave);
  } catch (error) {
    console.error('Approve leave error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to approve leave request.');
  }
};

// Reject leave (manager/admin)
export const rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { rejectionReason } = req.body;
    const approverId = req.user.id;

    if (!rejectionReason) {
      return ApiResponse.badRequest(res, 'Please provide a rejection reason.');
    }

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return ApiResponse.notFound(res, 'Leave request not found.');
    }

    if (leave.status !== 'Pending') {
      return ApiResponse.badRequest(res, `Cannot reject a ${leave.status.toLowerCase()} leave request.`);
    }

    leave.status = 'Rejected';
    leave.rejectionReason = rejectionReason;
    leave.approvedBy = approverId;

    const updatedLeave = await leave.save();

    const populatedLeave = await Leave.findById(updatedLeave._id)
      .populate('userId', 'name email employeeId')
      .populate('approvedBy', 'name email');

    return ApiResponse.success(res, 200, 'Leave request rejected successfully.', populatedLeave);
  } catch (error) {
    console.error('Reject leave error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to reject leave request.');
  }
};

// Cancel leave request (employee)
export const cancelLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const userId = req.user.id;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return ApiResponse.notFound(res, 'Leave request not found.');
    }

    if (leave.userId.toString() !== userId) {
      return ApiResponse.forbidden(res, 'You can only cancel your own leave requests.');
    }

    if (leave.status === 'Approved' && new Date(leave.fromDate) < new Date()) {
      return ApiResponse.badRequest(res, 'Cannot cancel an approved leave request that has already started.');
    }

    await Leave.findByIdAndDelete(leaveId);

    return ApiResponse.success(res, 200, 'Leave request cancelled successfully.');
  } catch (error) {
    console.error('Cancel leave error:', error);
    return ApiResponse.serverError(res, error.message || 'Failed to cancel leave request.');
  }
};

export default {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
};
