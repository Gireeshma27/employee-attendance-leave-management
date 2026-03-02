'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiService from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function LeaveApprovalsPage() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingLeaveId, setRejectingLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.leave.getPendingLeaves();
      setLeaveRequests(res.data || []);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError(err.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      setActionLoading(leaveId);
      await apiService.leave.approve(leaveId, {});
      // Remove from pending list after approval
      setLeaveRequests(leaveRequests.filter((req) => req._id !== leaveId));
      setApprovedCount((prev) => prev + 1);
      toast.success('Leave Approved', 'Leave request has been approved successfully.');
    } catch (err) {
      console.error('Error approving leave:', err);
      toast.error('Approval Failed', err.message || 'Failed to approve leave request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (leaveId) => {
    setRejectingLeaveId(leaveId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.warning('Reason Required', 'Please provide a reason for rejection.');
      return;
    }

    try {
      setActionLoading(rejectingLeaveId);
      await apiService.leave.reject(rejectingLeaveId, { rejectionReason });
      setLeaveRequests(leaveRequests.filter((req) => req._id !== rejectingLeaveId));
      setRejectedCount((prev) => prev + 1);
      setShowRejectModal(false);
      setRejectingLeaveId(null);
      setRejectionReason('');
      toast.success('Leave Rejected', 'Leave request has been rejected.');
    } catch (err) {
      console.error('Error rejecting leave:', err);
      toast.error('Rejection Failed', err.message || 'Failed to reject leave request.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout role="manager">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">Leave Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve team leave requests</p>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="text-center py-6 md:py-8">
                <p className="text-xs md:text-sm text-slate-500">Loading leave requests...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <p className="text-sm text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border bg-yellow-50 text-yellow-700 border-yellow-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-yellow-100">
                  <Clock size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 leading-none">Pending</p>
                  <p className="text-xl font-semibold mt-1.5 leading-none">{leaveRequests.length}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-2xl border bg-green-50 text-green-700 border-green-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-100">
                  <CheckCircle size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 leading-none">Approved</p>
                  <p className="text-xl font-semibold mt-1.5 leading-none">{approvedCount}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-2xl border bg-red-50 text-red-700 border-red-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100">
                  <XCircle size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 leading-none">Rejected</p>
                  <p className="text-xl font-semibold mt-1.5 leading-none">{rejectedCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {!loading && leaveRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="text-yellow-500 flex-shrink-0" size={18} />
                <span>Leave Requests ({leaveRequests.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {leaveRequests.map((request) => (
                  <div
                    key={request._id}
                    className="border border-slate-200/60 rounded-xl p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-slate-900 truncate">
                          {request.userId?.name || 'Unknown Employee'}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{request.leaveType}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(request.fromDate).toLocaleDateString()} to{' '}
                          {new Date(request.toDate).toLocaleDateString()} ({request.numberOfDays} days)
                        </p>
                      </div>
                      <Badge variant="warning" dot className="flex-shrink-0 self-start">Pending</Badge>
                    </div>

                    <p className="text-sm text-slate-600 mb-4">
                      <span className="font-medium">Reason: </span>
                      {request.reason}
                    </p>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(request._id)}
                        disabled={actionLoading === request._id}
                        className="text-xs md:text-sm"
                      >
                        {actionLoading === request._id ? 'Processing...' : 'Reject'}
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(request._id)}
                        disabled={actionLoading === request._id}
                        className="text-xs md:text-sm"
                      >
                        {actionLoading === request._id ? 'Processing...' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Requests */}
        {!loading && leaveRequests.length === 0 && !error && (
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="text-center py-6 md:py-8">
                <p className="text-xs md:text-sm text-slate-500">No pending leave requests</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejection Reason Modal */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectingLeaveId(null);
            setRejectionReason('');
          }}
          title="Reject Leave Request"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Please provide a reason for rejecting this leave request.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="3"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingLeaveId(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={confirmReject}
                disabled={actionLoading === rejectingLeaveId}
              >
                {actionLoading === rejectingLeaveId ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
