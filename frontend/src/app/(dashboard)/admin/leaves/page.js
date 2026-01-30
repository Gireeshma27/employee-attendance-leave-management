'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import apiService from '@/lib/api';

export default function LeavesPage() {
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
      setLeaveRequests(leaveRequests.filter((req) => req._id !== leaveId));
    } catch (err) {
      console.error('Error rejecting leave:', err);
      alert('Failed to reject leave: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = leaveRequests.length;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all leave requests across the organization
          </p>
        </div>

        {/* Summary Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600 text-sm">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

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

        {/* Leave Requests Table */}
        {!loading && leaveRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests ({leaveRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="text-left py-3 px-4">Employee</th>
                      <th className="text-left py-3 px-4">Leave Type</th>
                      <th className="text-left py-3 px-4">From</th>
                      <th className="text-left py-3 px-4">To</th>
                      <th className="text-center py-3 px-4">Days</th>
                      <th className="text-left py-3 px-4">Reason</th>
                      <th className="text-center py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((request) => (
                      <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">
                          {request.userId?.name || 'Unknown'}
                        </td>
                        <td className="py-4 px-4 text-gray-600">{request.leaveType}</td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(request.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(request.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-center font-medium">
                          {request.days}
                        </td>
                        <td className="py-4 px-4 text-gray-600">{request.reason}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReject(request._id)}
                              disabled={actionLoading === request._id}
                            >
                              {actionLoading === request._id ? '...' : 'Reject'}
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleApprove(request._id)}
                              disabled={actionLoading === request._id}
                            >
                              {actionLoading === request._id ? '...' : 'Approve'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
