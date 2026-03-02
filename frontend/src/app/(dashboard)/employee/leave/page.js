"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const LEAVE_TYPE_MAP = {
  CL: "Casual Leave",
  SL: "Sick Leave",
  PL: "Paid Leave",
  UL: "Unpaid Leave",
};

export default function LeavePage() {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 5,
  });
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [formError, setFormError] = useState("");
  const toast = useToast();

  useEffect(() => {
    fetchLeaveData(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchLeaveData = async (page = 1) => {
    try {
      setLoading(true);

      const [profileRes, leaveRes] = await Promise.all([
        apiService.user.getProfile(),
        apiService.leave.getMyLeaves({ page, limit: pagination.limit }),
      ]);

      if (profileRes.success) setUser(profileRes.data);

      const {
        records = [],
        pagination: pagData = {},
        balances = {},
      } = leaveRes.data || {};
      setLeaveApplications(records);
      setPagination((prev) => ({
        ...prev,
        ...pagData,
      }));

      setLeaveBalance({
        casual: balances.CL ?? 12,
        sick: balances.SL ?? 8,
        paid: balances.PL ?? 18,
      });
    } catch (err) {
      console.error("Error fetching leave data:", err);
      setError(err.message);
      setLeaveBalance({ casual: 12, sick: 8, paid: 18 });
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !formData.leaveType ||
      !formData.fromDate ||
      !formData.toDate ||
      !formData.reason
    ) {
      setFormError("All fields are required");
      return;
    }

    const numberOfDays = calculateDays(formData.fromDate, formData.toDate);
    if (numberOfDays <= 0) {
      setFormError("To date must be after or equal to from date");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiService.leave.apply({
        leaveType: formData.leaveType,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        numberOfDays,
        reason: formData.reason,
      });

      setFormData({ leaveType: "", fromDate: "", toDate: "", reason: "" });
      setShowModal(false);
      toast.success("Leave Applied", "Your leave request has been submitted successfully.");
      await fetchLeaveData(1); // Refresh to first page
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    } catch (err) {
      setFormError(err.message || "Failed to apply for leave");
      toast.error("Application Failed", err.message || "Failed to apply for leave");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError("");
    setFormData({ leaveType: "", fromDate: "", toDate: "", reason: "" });
  };

  const getStatusBadgeVariant = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "approved") return "success";
    if (statusLower === "rejected") return "danger";
    return "warning"; // Pending
  };

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading leave data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              Leave Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Apply and track your leaves
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus size={18} />
            Apply Leave
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-slate-500">Casual Leave</p>
              <p className="text-3xl font-semibold text-blue-600 mt-2">
                {leaveBalance.casual}
              </p>
              <p className="text-xs text-slate-400 mt-1">days remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-slate-500">Sick Leave</p>
              <p className="text-3xl font-semibold text-blue-600 mt-2">
                {leaveBalance.sick}
              </p>
              <p className="text-xs text-slate-400 mt-1">days remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-slate-500">Paid Leave</p>
              <p className="text-3xl font-semibold text-blue-600 mt-2">
                {leaveBalance.paid}
              </p>
              <p className="text-xs text-slate-400 mt-1">days remaining</p>
            </CardContent>
          </Card>
        </div>

        {/* Leave History Table */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-slate-500" />
              Leave History
            </CardTitle>
            <span className="text-xs text-slate-400">
              Showing {leaveApplications.length} of {pagination.totalRecords}{" "}
              records
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 bg-slate-50/30 uppercase text-[10px] font-semibold tracking-widest">
                    <th className="text-left px-5 py-3.5">Leave Type</th>
                    <th className="text-left px-5 py-3.5 hidden md:table-cell">
                      From
                    </th>
                    <th className="text-left px-5 py-3.5 hidden md:table-cell">
                      To
                    </th>
                    <th className="text-left px-5 py-3.5 hidden lg:table-cell">
                      Reason
                    </th>
                    <th className="text-left px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveApplications.length > 0 ? (
                    leaveApplications.map((leave) => (
                      <tr
                        key={leave._id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-slate-700">
                          {LEAVE_TYPE_MAP[leave.leaveType] || leave.leaveType}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">
                          {new Date(leave.fromDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">
                          {new Date(leave.toDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td
                          className="px-5 py-3.5 text-slate-500 hidden lg:table-cell max-w-[200px] truncate"
                          title={leave.reason}
                        >
                          {leave.reason}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={getStatusBadgeVariant(leave.status)}
                            dot
                          >
                            {leave.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        No leave applications found. Click "Apply Leave" to
                        submit a new request.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-slate-900">
                    {pagination.currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {pagination.totalPages}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="h-8 px-3 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="h-8 px-3 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply Leave Modal */}
        <Modal isOpen={showModal} onClose={closeModal} title="Apply for Leave">
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) =>
                  setFormData({ ...formData, leaveType: e.target.value })
                }
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select leave type</option>
                <option value="CL">Casual Leave</option>
                <option value="SL">Sick Leave</option>
                <option value="PL">Paid Leave</option>
                <option value="UL">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="From Date"
                type="date"
                value={formData.fromDate}
                onChange={(e) =>
                  setFormData({ ...formData, fromDate: e.target.value })
                }
                required
              />
              <Input
                label="To Date"
                type="date"
                value={formData.toDate}
                onChange={(e) =>
                  setFormData({ ...formData, toDate: e.target.value })
                }
                required
              />
            </div>

            {formData.fromDate && formData.toDate && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-sm text-blue-700">
                  Duration:{" "}
                  <span className="font-semibold">
                    {calculateDays(formData.fromDate, formData.toDate)} day(s)
                  </span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Please provide a reason for your leave request"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="4"
                required
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
