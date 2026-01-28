import Leave from '../models/leave.model.js';
import User from '../models/user.model.js';

// Apply for leave
export const applyLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const { leaveType, fromDate, toDate, numberOfDays, reason } = req.body;

    // Validation
    if (!leaveType || !fromDate || !toDate || !numberOfDays || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
      });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from > to) {
      return res.status(400).json({
        success: false,
        message: 'From date cannot be greater than to date.',
      });
    }

    if (from < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply for leave in the past.',
      });
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

    return res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully.',
      data: populatedLeave,
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply for leave.',
    });
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

    return res.status(200).json({
      success: true,
      message: 'Leave requests retrieved successfully.',
      data: leaves,
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve leave requests.',
    });
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

    return res.status(200).json({
      success: true,
      message: 'Pending leave requests retrieved successfully.',
      data: leaves,
    });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve pending leave requests.',
    });
  }
};

// Approve leave (manager/admin)
export const approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const approverId = req.user.id;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a ${leave.status.toLowerCase()} leave request.`,
      });
    }

    leave.status = 'Approved';
    leave.approvedBy = approverId;

    const updatedLeave = await leave.save();

    const populatedLeave = await Leave.findById(updatedLeave._id)
      .populate('userId', 'name email employeeId')
      .populate('approvedBy', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Leave request approved successfully.',
      data: populatedLeave,
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve leave request.',
    });
  }
};

// Reject leave (manager/admin)
export const rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { rejectionReason } = req.body;
    const approverId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason.',
      });
    }

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${leave.status.toLowerCase()} leave request.`,
      });
    }

    leave.status = 'Rejected';
    leave.rejectionReason = rejectionReason;
    leave.approvedBy = approverId;

    const updatedLeave = await leave.save();

    const populatedLeave = await Leave.findById(updatedLeave._id)
      .populate('userId', 'name email employeeId')
      .populate('approvedBy', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Leave request rejected successfully.',
      data: populatedLeave,
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject leave request.',
    });
  }
};

// Cancel leave request (employee)
export const cancelLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const userId = req.user.id;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }

    if (leave.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests.',
      });
    }

    if (leave.status === 'Approved' && new Date(leave.fromDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an approved leave request that has already started.',
      });
    }

    await Leave.findByIdAndDelete(leaveId);

    return res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully.',
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel leave request.',
    });
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
