"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle, CheckCircle2, Clock, MapPin, Building, Users } from "lucide-react";
import apiService from "@/lib/api";

const LOCATIONS = ["Mysore", "Bangalore", "Mangalore"];
const ALL_DEPARTMENTS = ["IT", "HR", "Sales", "Legal", "Support", "Engineering", "Marketing", "Finance"];
const MAX_DEPARTMENT_GROUPS = 3;

export function AddTimingModal({ isOpen, onClose, onSuccess, editingTiming = null }) {
  const isEditMode = !!editingTiming;

  const [formData, setFormData] = useState({
    location: "",
    branch: "",
    loginTime: "",
    logoutTime: "",
    departments: [],
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTimingName, setCreatedTimingName] = useState("");

  // Track existing timings to check location+branch conflicts per-department
  const [existingTimings, setExistingTimings] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      setApiError(null);
      setErrors({});

      if (editingTiming) {
        setFormData({
          location: editingTiming.location || "",
          branch: editingTiming.branch || "",
          loginTime: editingTiming.loginTime || "",
          logoutTime: editingTiming.logoutTime || "",
          departments: editingTiming.departments || [],
        });
      } else {
        setFormData({
          location: "",
          branch: "",
          loginTime: "",
          logoutTime: "",
          departments: [],
        });
      }

      fetchExistingTimings();
    }
  }, [isOpen, editingTiming]);

  const fetchExistingTimings = async () => {
    try {
      const response = await apiService.timing.getAll({ isActive: true });
      if (response.success && response.data) {
        setExistingTimings(response.data);
      }
    } catch (err) {
      console.error("Error fetching existing timings:", err);
    }
  };

  // Returns true if `dept` is already used by another timing with the same location + branch
  const isConflictingDept = (dept) => {
    if (!formData.location || !formData.branch?.trim()) return false;
    const normBranch = formData.branch.trim().toLowerCase();
    return existingTimings.some((timing) => {
      if (editingTiming && timing._id === editingTiming._id) return false;
      return (
        timing.location === formData.location &&
        timing.branch?.trim().toLowerCase() === normBranch &&
        timing.departments.includes(dept)
      );
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDepartmentToggle = (dept) => {
    setFormData((prev) => {
      const isSelected = prev.departments.includes(dept);
      let newDepartments;

      if (isSelected) {
        newDepartments = prev.departments.filter((d) => d !== dept);
      } else {
        // Check if max groups reached (but allow adding to current selection)
        newDepartments = [...prev.departments, dept];
      }

      return { ...prev, departments: newDepartments };
    });

    if (errors.departments) {
      setErrors((prev) => ({ ...prev, departments: "" }));
    }
  };

  // Calculate remaining department slots
  const getRemainingDepartmentSlots = () => {
    const currentCount = formData.departments.length;
    const maxDepts = ALL_DEPARTMENTS.length - MAX_DEPARTMENT_GROUPS;
    return Math.max(0, maxDepts - currentCount);
  };

  // Check if a department should be disabled
  const isDepartmentDisabled = (dept) => {
    // If already selected in this form, don't disable (allow deselect)
    if (formData.departments.includes(dept)) return false;

    // Disable if already assigned to another timing with same location + branch
    if (isConflictingDept(dept)) return true;

    // Disable if max 5 departments already selected in current form
    if (formData.departments.length >= (ALL_DEPARTMENTS.length - MAX_DEPARTMENT_GROUPS)) {
      return true;
    }

    return false;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.location) {
      newErrors.location = "Location is required";
    }

    if (!formData.branch.trim()) {
      newErrors.branch = "Branch is required";
    }

    if (!formData.loginTime) {
      newErrors.loginTime = "Login time is required";
    }

    if (!formData.logoutTime) {
      newErrors.logoutTime = "Logout time is required";
    }

    if (formData.departments.length === 0) {
      newErrors.departments = "At least one department must be selected";
    }

    // Frontend duplicate check: prevent submitting a dept already used at same location+branch
    if (formData.location && formData.branch?.trim()) {
      const conflicting = formData.departments.filter((d) => isConflictingDept(d));
      if (conflicting.length > 0) {
        newErrors.departments = `These departments are already assigned to ${formData.location} / ${formData.branch}: ${conflicting.join(", ")}`;
      }
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (formData.loginTime && !timeRegex.test(formData.loginTime)) {
      newErrors.loginTime = "Invalid time format (use HH:mm)";
    }
    if (formData.logoutTime && !timeRegex.test(formData.logoutTime)) {
      newErrors.logoutTime = "Invalid time format (use HH:mm)";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode) {
        await apiService.timing.update(editingTiming._id, formData);
        setCreatedTimingName(`${formData.branch} — ${formData.location}`);
      } else {
        await apiService.timing.create(formData);
        setCreatedTimingName(`${formData.branch} — ${formData.location}`);
      }

      setShowSuccess(true);

      // Reset form
      setFormData({
        location: "",
        branch: "",
        loginTime: "",
        logoutTime: "",
        departments: [],
      });
      setErrors({});

      onSuccess?.();
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      let errorMessage = error?.message || `Failed to ${isEditMode ? "update" : "create"} timing`;
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      location: "",
      branch: "",
      loginTime: "",
      logoutTime: "",
      departments: [],
    });
    setErrors({});
    setApiError(null);
    setShowSuccess(false);
    onClose();
  };

  // Success State View
  if (showSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={isEditMode ? "Timing Updated" : "Timing Added"} size="lg">
        <div className="py-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {isEditMode ? "Timing Updated Successfully!" : "Timing Created Successfully!"}
          </h3>
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{createdTimingName}</span> has been {isEditMode ? "updated" : "added"}.
          </p>
          <p className="text-xs text-slate-400 mt-4">
            This dialog will close automatically...
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditMode ? "Edit Timing" : "Add New Timing"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* API Error */}
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200/60 rounded-xl flex gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        {/* Location & Branch Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <MapPin size={16} className="text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Location Details</span>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm ${errors.location ? "border-red-500" : "border-slate-300"}`}
            >
              <option value="">Select Location</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            {errors.location && (
              <p className="text-sm text-red-600 mt-1">{errors.location}</p>
            )}
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Branch <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              placeholder="e.g., Main Office, IT Park"
              className={errors.branch ? "border-red-500" : ""}
            />
            {errors.branch && (
              <p className="text-sm text-red-600 mt-1">{errors.branch}</p>
            )}
          </div>
        </div>

        {/* Timing Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock size={16} className="text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Work Schedule</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Login Time <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                name="loginTime"
                value={formData.loginTime}
                onChange={handleChange}
                className={errors.loginTime ? "border-red-500" : ""}
              />
              {errors.loginTime && (
                <p className="text-sm text-red-600 mt-1">{errors.loginTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Logout Time <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                name="logoutTime"
                value={formData.logoutTime}
                onChange={handleChange}
                className={errors.logoutTime ? "border-red-500" : ""}
              />
              {errors.logoutTime && (
                <p className="text-sm text-red-600 mt-1">{errors.logoutTime}</p>
              )}
            </div>
          </div>
        </div>

        {/* Departments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Departments</span>
            </div>
            <span className="text-xs text-slate-500">
              Selected: {formData.departments.length} / {ALL_DEPARTMENTS.length - MAX_DEPARTMENT_GROUPS}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-3">
              Select departments for this timing. Maximum {ALL_DEPARTMENTS.length - MAX_DEPARTMENT_GROUPS} departments per group.
              {formData.location && formData.branch?.trim() && (
                <span className="text-yellow-600"> Grayed out departments are already assigned to <strong>{formData.location} / {formData.branch}</strong> in another timing.</span>
              )}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_DEPARTMENTS.map((dept) => {
                const isSelected = formData.departments.includes(dept);
                const isDisabled = isDepartmentDisabled(dept);
                const isConflicting = isConflictingDept(dept);

                return (
                  <label
                    key={dept}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                      ${isSelected
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : isDisabled
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50/50"
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !isDisabled && handleDepartmentToggle(dept)}
                      disabled={isDisabled}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-slate-900/10 disabled:opacity-50"
                    />
                    <span className="text-sm font-medium truncate">
                      {dept}
                      {isConflicting && !isSelected && " ✗"}
                    </span>
                  </label>
                );
              })}
            </div>

            {errors.departments && (
              <p className="text-sm text-red-600 mt-3">{errors.departments}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-5 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {isEditMode ? "Updating..." : "Adding..."}
              </span>
            ) : (
              isEditMode ? "Update Timing" : "Add Timing"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
