"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import apiService from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/utils/formatDate";

// Fixed public holidays â€” static display only, no DB
const FIXED_PUBLIC_HOLIDAYS = [
  { title: "Republic Day", month: 1, day: 26 },
  { title: "Independence Day", month: 8, day: 15 },
  { title: "Gandhi Jayanti", month: 10, day: 2 },
];

const HOLIDAY_TYPES = [
  { value: "FESTIVAL", label: "Festival" },
  { value: "COMPANY", label: "Company" },
];

const getTypeBadgeVariant = (type) => {
  if (type === "PUBLIC_FIXED") return "success";
  if (type === "FESTIVAL") return "warning";
  if (type === "COMPANY") return "info";
  return "default";
};

const getTypeLabel = (type) => {
  if (type === "PUBLIC_FIXED") return "Public (Fixed)";
  if (type === "FESTIVAL") return "Festival";
  if (type === "COMPANY") return "Company";
  return type;
};

const getTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diff;
};

const getFixedHolidaysForCurrentYear = () => {
  const year = new Date().getFullYear();
  return FIXED_PUBLIC_HOLIDAYS.map(({ title, month, day }) => {
    const date = new Date(year, month - 1, day);
    return { title, date: date.toISOString() };
  });
};

export default function AdminHolidaysPage() {
  const [dbHolidays, setDbHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "FESTIVAL",
    startDate: "",
    endDate: "",
    isSaturdayWorking: false,
    isSundayWorking: false,
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    holiday: null,
  });

  const toast = useToast();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const holidayRes = await apiService.holiday.getAll();
      if (holidayRes.success) {
        // Filter only DB holidays for the management section
        const db = (holidayRes.data || []).filter((h) => h.source === "DB");
        setDbHolidays(db);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", type: "FESTIVAL", startDate: "", endDate: "", isSaturdayWorking: false, isSundayWorking: false });
    setFormError("");
    setEditingHoliday(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      title: holiday.title,
      type: holiday.type || "FESTIVAL",
      startDate: new Date(holiday.startDate).toISOString().split("T")[0],
      endDate: new Date(holiday.endDate).toISOString().split("T")[0],
      isSaturdayWorking: holiday.isSaturdayWorking ?? false,
      isSundayWorking: holiday.isSundayWorking ?? false,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Holiday title is required");
      return;
    }
    if (!formData.startDate) {
      setFormError("Start date is required");
      return;
    }
    if (!formData.endDate) {
      setFormError("End date is required");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError("End date must be on or after start date");
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingHoliday) {
        await apiService.holiday.update(editingHoliday._id, formData);
        toast.success("Holiday Updated", "Holiday has been updated successfully.");
      } else {
        await apiService.holiday.create(formData);
        toast.success("Holiday Created", "Holiday has been created successfully.");
      }

      setIsModalOpen(false);
      resetForm();
      await fetchAll();
    } catch (err) {
      setFormError(err.message || "Failed to save holiday");
      toast.error("Error", err.message || "Failed to save holiday");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (holiday) => {
    setDeleteConfirm({ isOpen: true, holiday });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.holiday) return;
    try {
      await apiService.holiday.delete(deleteConfirm.holiday._id);
      toast.success("Holiday Deleted", "Holiday has been deleted successfully.");
      setDeleteConfirm({ isOpen: false, holiday: null });
      await fetchAll();
    } catch (err) {
      console.error("Error deleting holiday:", err);
      toast.error("Error", err.message || "Failed to delete holiday");
    }
  };

  const fixedHolidaysThisYear = getFixedHolidaysForCurrentYear();

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading holidays...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              Holiday Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage fixed, festival, and weekend holiday settings
            </p>
          </div>
          <Button onClick={openAddModal} size="sm">
            <Plus size={16} className="mr-1.5" />
            Add Holiday
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* SECTION 1: Fixed Public Holidays */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <ShieldCheck size={16} className="text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Fixed Public Holidays</CardTitle>

              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Holiday
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Date ({new Date().getFullYear()})
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {fixedHolidaysThisYear.map((h) => (
                    <tr key={h.title} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">{h.title}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(h.date)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="success">Public (Fixed)</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Festival / Company Holidays */}
        <Card>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <CalendarDays size={16} className="text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Festival & Company Holidays</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admin-managed holidays with date range support
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {dbHolidays.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No holidays added yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Click &quot;Add Holiday&quot; to create one
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dbHolidays.map((holiday) => (
                      <tr
                        key={holiday._id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {holiday.title}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatDate(holiday.startDate)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatDate(holiday.endDate)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {getTotalDays(holiday.startDate, holiday.endDate)} day
                          {getTotalDays(holiday.startDate, holiday.endDate) > 1 ? "s" : ""}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getTypeBadgeVariant(holiday.type)}>
                            {getTypeLabel(holiday.type)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(holiday)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(holiday)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Holiday Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200/60 text-red-700 px-3 py-2 rounded-xl text-sm">
                {formError}
              </div>
            )}

            <Input
              label="Holiday Title"
              type="text"
              placeholder="e.g. Diwali"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Holiday Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              >
                {HOLIDAY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Start Date
              </label>
              <DatePicker
                value={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date })}
                placeholder="Select start date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                End Date
              </label>
              <DatePicker
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                placeholder="Select end date"
              />
              <p className="text-xs text-slate-400 mt-1">
                For single-day holiday, set start and end to the same date.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-sm font-medium text-slate-700">Weekend Settings</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isSaturdayWorking}
                  onChange={(e) => setFormData({ ...formData, isSaturdayWorking: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Saturday Working</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isSundayWorking}
                  onChange={(e) => setFormData({ ...formData, isSundayWorking: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Sunday Working</span>
              </label>
              <p className="text-xs text-slate-400">
                Unchecked = weekend holiday (default). Checked = working day.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleModalClose} size="sm">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingHoliday
                    ? "Update Holiday"
                    : "Create Holiday"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, holiday: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Holiday"
          message={`Are you sure you want to delete "${deleteConfirm.holiday?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}

