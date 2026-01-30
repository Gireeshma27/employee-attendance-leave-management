'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiService from '@/lib/api';

export default function LeaveApprovalsPage() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

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
      await apiService.leave.approve(leaveId, { status: 'approved' });
      // Remove from pending list after approval
      setLeaveRequests(leaveRequests.filter((req) => req._id !== leaveId));
    } catch (err) {
      console.error('Error approving leave:', err);
      alert('Failed to approve leave: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (leaveId) => {
    try {
      setActionLoading(leaveId);
      await apiService.leave.reject(leaveId, { status: 'rejected' });
      // Remove from pending list after rejection
      setLeaveRequests(leaveRequests.filter((req) => req._id !== leaveId));
    } catch (err) {
      console.error('Error rejecting leave:', err);
      alert('Failed to reject leave: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout role="manager">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve team leave requests</p>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600">Loading leave requests...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Pending Requests</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{leaveRequests.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Requests */}
        {!loading && leaveRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="text-yellow-600" size={24} />
                Leave Requests for Approval ({leaveRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {request.userId?.name || 'Unknown Employee'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{request.leaveType}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.startDate).toLocaleDateString()} to{' '}
                          {new Date(request.endDate).toLocaleDateString()} ({request.days} days)
                        </p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>

                    <p className="text-sm text-gray-700 mb-4">
                      <span className="font-semibold">Reason: </span>
                      {request.reason}
                    </p>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(request._id)}
                        disabled={actionLoading === request._id}
                      >
                        {actionLoading === request._id ? 'Processing...' : 'Reject'}
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(request._id)}
                        disabled={actionLoading === request._id}
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
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600">No pending leave requests</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
