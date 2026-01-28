'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, Plus } from 'lucide-react';
import { useState } from 'react';

export default function LeavePage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form will be submitted to backend
    setFormData({ leaveType: '', fromDate: '', toDate: '', reason: '' });
    setShowForm(false);
  };

  return (
    <DashboardLayout role="employee">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600 mt-1">Apply and track your leaves</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Apply Leave
          </Button>
        </div>

        {/* Leave Balance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-gray-600 text-sm">Casual Leave</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
                <p className="text-xs text-gray-500 mt-1">days remaining</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-gray-600 text-sm">Sick Leave</p>
                <p className="text-3xl font-bold text-green-600 mt-2">8</p>
                <p className="text-xs text-gray-500 mt-1">days remaining</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-gray-600 text-sm">Paid Leave</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">18</p>
                <p className="text-xs text-gray-500 mt-1">days remaining</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Application Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Apply for Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Type *
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select leave type</option>
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="paid">Paid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Leave *
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Please provide a reason for your leave request"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="4"
                    required
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <Button variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Submit Application
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Leave Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Your Leave Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 1, type: 'Casual Leave', from: 'Jan 25, 2026', to: 'Jan 26, 2026', days: 2, status: 'Pending' },
                { id: 2, type: 'Sick Leave', from: 'Jan 10, 2026', to: 'Jan 10, 2026', days: 1, status: 'Approved' },
                { id: 3, type: 'Paid Leave', from: 'Jan 5, 2026', to: 'Jan 8, 2026', days: 4, status: 'Approved' },
                { id: 4, type: 'Casual Leave', from: 'Dec 20, 2025', to: 'Dec 22, 2025', days: 3, status: 'Rejected' },
              ].map((leave) => (
                <div
                  key={leave.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{leave.type}</h3>
                        <Badge
                          variant={
                            leave.status === 'Approved'
                              ? 'success'
                              : leave.status === 'Pending'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {leave.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {leave.from} to {leave.to} ({leave.days} days)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
