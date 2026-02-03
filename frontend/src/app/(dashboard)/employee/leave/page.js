'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

export default function LeavePage() {
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      // Get user's leave applications
      const leaveData = await apiService.leave.getMyLeaves();
      setLeaveApplications(leaveData.data || []);
      
      // Calculate balance from applications
      const approved = leaveData.data?.filter(l => l.status === 'approved') || [];
      setLeaveBalance({
        casual: 12 - (approved.filter(l => l.leaveType === 'casual').length || 0),
        sick: 8 - (approved.filter(l => l.leaveType === 'sick').length || 0),
        paid: 18 - (approved.filter(l => l.leaveType === 'paid').length || 0),
      });
    } catch (err) {
      console.error('Error fetching leave data:', err);
      setError(err.message);
      // Set default values on error
      setLeaveBalance({ casual: 12, sick: 8, paid: 18 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason) {
      setFormError('All fields are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiService.leave.apply({
        leaveType: formData.leaveType,
        startDate: formData.fromDate,
        endDate: formData.toDate,
        reason: formData.reason,
      });

      setFormData({ leaveType: '', fromDate: '', toDate: '', reason: '' });
      setShowForm(false);
      await fetchLeaveData();
    } catch (err) {
      setFormError(err.message || 'Failed to apply for leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leave data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-xs sm:text-sm md:text-sm text-gray-600 mt-1">Apply and track your leaves</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm md:text-base"
          >
            <Plus size={16} className="md:w-5 md:h-5" />
            Apply Leave
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
            <p className="text-red-600 text-xs md:text-sm">{error}</p>
          </div>
        )}

        {/* Leave Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Casual Leave</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-1 md:mt-2">{leaveBalance.casual || 12}</p>
                <p className="text-xs text-gray-500 mt-1">days remaining</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Sick Leave</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1 md:mt-2">{leaveBalance.sick || 8}</p>
                <p className="text-xs text-gray-500 mt-1">days remaining</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Paid Leave</p>
                <p className="text-2xl md:text-3xl font-bold text-orange-600 mt-1 md:mt-2">{leaveBalance.paid || 18}</p>
                <p className="text-xs text-gray-500 mt-1">days remaining</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Application Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Apply for Leave</CardTitle>
            </CardHeader>
            <CardContent>
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-xs md:text-sm">{formError}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Leave Type *
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select leave type</option>
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="paid">Paid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <Input
                    label="From Date"
                    type="date"
                    value={formData.fromDate}
                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                    required
                  />
                  <Input
                    label="To Date"
                    type="date"
                    value={formData.toDate}
                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Reason for Leave *
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Please provide a reason for your leave request"
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="4"
                    required
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2 md:pt-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setShowForm(false);
                      setFormError('');
                    }}
                    className="text-xs md:text-base"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={isSubmitting}
                    className="text-xs md:text-base"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Leave Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Your Leave Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {leaveApplications.length > 0 ? (
                leaveApplications.map((leave) => (
                  <div
                    key={leave._id}
                    className="border border-gray-200 rounded-lg p-3 md:p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-xs md:text-sm text-gray-900 capitalize">
                            {leave.leaveType} Leave
                          </h3>
                          <Badge
                            variant={{
                              approved: 'success',
                              pending: 'secondary',
                              rejected: 'danger',
                            }[leave.status] || 'secondary'}
                            className="text-xs w-fit"
                          >
                            {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600">
                          {new Date(leave.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          to{' '}
                          {new Date(leave.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          ({leave.numberOfDays} days)
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 md:py-8">
                  <p className="text-xs md:text-sm text-gray-500">No leave applications found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
