"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle, Clock, Info, Phone } from "lucide-react";
import apiService from "@/lib/api";
import { formatHHmm } from "@/utils/formatDate";

const LOCATIONS = ["Bangalore", "Mysore", "Mangalore"];

const formatTime = (time) => formatHHmm(time);

export function EditEmployeeModal({ isOpen, onClose, employee, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "EMPLOYEE",
    department: "",
    isActive: true,
    officeId: "",
    managerId: "",
    location: "",
    branch: "",
    timingId: "",
    loginTime: "",
    logoutTime: "",
    wfhAllowed: false,
    usedWFHDays: 0,
  });

  const [timingLoading, setTimingLoading] = useState(false);
  const [timingNotFound, setTimingNotFound] = useState(false);

  // Default departments as fallback
  const DEFAULT_DEPARTMENTS = ["Administration", "HR", "Engineering", "Design", "Marketing"];
  
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [customDepartment, setCustomDepartment] = useState("");

  const [offices, setOffices] = useState([]);
  const [managers, setManagers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        role: employee.role || "EMPLOYEE",
        department: employee.department || "",
        isActive: employee.isActive ?? true,
        officeId: employee.officeId || "",
        managerId: employee.managerId || "",
        location: employee.location || "",
        branch: employee.branch || "",
        timingId: employee.timingId?._id || employee.timingId || "",
        loginTime: employee.timingId?.loginTime || "",
        logoutTime: employee.timingId?.logoutTime || "",
        wfhAllowed: employee.wfhAllowed || false,
        usedWFHDays: employee.usedWFHDays || 0,
      });
      setErrors({});
      setApiError(null);
      setShowCustomDepartment(false);
      setCustomDepartment("");
      setTimingNotFound(false);
      fetchDependentData();
    }
  }, [employee, isOpen]);

  // Auto-fetch timing when location + branch are both filled
  useEffect(() => {
    const loc = formData.location;
    const br = formData.branch?.trim();
    if (!loc || !br) {
      setTimingNotFound(false);
      return;
    }

    let cancelled = false;
    const fetchTiming = async () => {
      setTimingLoading(true);
      setTimingNotFound(false);
      try {
        const res = await apiService.timing.getByLocationBranch(loc, br);
        if (cancelled) return;
        if (res.data) {
          setFormData((prev) => ({
            ...prev,
            timingId: res.data._id,
            loginTime: res.data.loginTime,
            logoutTime: res.data.logoutTime,
          }));
          setTimingNotFound(false);
        } else {
          setFormData((prev) => ({ ...prev, timingId: "", loginTime: "", logoutTime: "" }));
          setTimingNotFound(true);
        }
      } catch {
        if (!cancelled) setTimingNotFound(true);
      } finally {
        if (!cancelled) setTimingLoading(false);
      }
    };

    const timer = setTimeout(fetchTiming, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.location, formData.branch]);

  const fetchDependentData = async () => {
    try {
      const [officesRes, managersRes, departmentsRes] = await Promise.all([
        apiService.office.getAll(),
        apiService.user.getAll({ role: "MANAGER" }),
        apiService.user.getDepartments(),
      ]);
      setOffices(officesRes.data || []);
      setManagers(managersRes.data?.records || []);
      // Use fetched departments or fall back to defaults
      if (departmentsRes.data && departmentsRes.data.length > 0) {
        setDepartments(departmentsRes.data);
      }
    } catch (err) {
      console.error("Error fetching dependent data:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle department selection
    if (name === "department") {
      if (value === "__ADD_NEW__") {
        setShowCustomDepartment(true);
        setFormData((prev) => ({ ...prev, department: "" }));
      } else {
        setShowCustomDepartment(false);
        setCustomDepartment("");
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleCustomDepartmentChange = (e) => {
    const value = e.target.value;
    setCustomDepartment(value);
    setFormData((prev) => ({ ...prev, department: value }));
    if (errors.department) {
      setErrors((prev) => ({ ...prev, department: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
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
      // 1. General Info Update (including all editable fields)
      await apiService.user.update(employee._id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        isActive: formData.isActive,
        managerId: formData.managerId,
        location: formData.location,
        branch: formData.branch,
        timingId: formData.timingId || undefined,
      });

      // 2. Location Assignment
      if (formData.officeId !== employee.officeId) {
        await apiService.user.assignLocation(employee._id, formData.officeId);
      }

      // 3. WFH Permissions
      if (
        formData.wfhAllowed !== employee.wfhAllowed ||
        formData.usedWFHDays !== employee.usedWFHDays
      ) {
        await apiService.user.updateWFHPermission(employee._id, {
          wfhAllowed: formData.wfhAllowed,
          usedWFHDays: parseInt(formData.usedWFHDays),
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = error?.message || "Failed to update employee";
      if (errorMessage.includes("email")) {
        setErrors({ email: "This email is already in use" });
      } else {
        setApiError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setApiError(null);
    onClose();
  };

  if (!employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Employee"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        {/* API Error */}
        {apiError && (
          <div className="p-3 md:p-4 bg-red-50 border border-red-200/60 rounded-xl flex gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-xs md:text-sm text-red-700">{apiError}</p>
          </div>
        )}

        {/* Employee ID (Read-only) */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
            Employee ID{" "}
            <span className="text-slate-500 text-xs">(Read-only)</span>
          </label>
          <Input
            type="text"
            value={employee.employeeId || "N/A"}
            disabled
            className="bg-slate-50 cursor-not-allowed"
          />
        </div>

        {/* Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter employee name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs md:text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {/* Email ID */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
            Email ID <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-xs md:text-sm text-red-600 mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Office Location & Sub-Office */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
              Office Location
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="">Select Location</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
              Sub-Office / Building
            </label>
            <Input
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              placeholder="e.g., Main Office, IT Park"
              disabled={!formData.location}
            />
          </div>
        </div>

        {/* Assigned Timing (auto-fetched) */}
        {formData.location && formData.branch?.trim() && (
          <div>
            {timingLoading ? (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                <p className="text-xs md:text-sm text-slate-500">Fetching assigned timing...</p>
              </div>
            ) : timingNotFound ? (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <Info size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm text-yellow-700">
                  No timing configured for this branch. Configure it in the <span className="font-semibold">Timings</span> page.
                </p>
              </div>
            ) : formData.loginTime ? (
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Login Time</label>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-green-500" />
                    <span className="font-mono text-xs md:text-sm font-semibold text-slate-700">{formatTime(formData.loginTime)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Logout Time</label>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-red-400" />
                    <span className="font-mono text-xs md:text-sm font-semibold text-slate-700">{formatTime(formData.logoutTime)}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Department */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
            Department
          </label>
          {showCustomDepartment ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={customDepartment}
                  onChange={handleCustomDepartmentChange}
                  placeholder="Enter new department name"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomDepartment(false);
                    setCustomDepartment("");
                    setFormData((prev) => ({ ...prev, department: employee?.department || "" }));
                  }}
                  className="px-3 py-2 text-xs md:text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-slate-500">Enter a custom department name</p>
            </div>
          ) : (
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
              <option value="__ADD_NEW__" className="font-medium text-blue-600">
                ＋ Add New Department
              </option>
            </select>
          )}
        </div>

        {/* Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {/* Manager & WFH Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
              Reporting Manager
            </label>
            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="">Select Manager</option>
              {managers.map((mgr) => (
                <option key={mgr._id} value={mgr._id}>
                  {mgr.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-medium text-slate-700">
              WFH Settings
            </label>
            <div className="flex items-center gap-4 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="wfhAllowed"
                  checked={formData.wfhAllowed}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-slate-900/10 border-slate-300"
                />
                <span className="text-xs md:text-sm text-slate-700 font-medium">
                  Allow WFH
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Status & WFH Days */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-slate-700 mb-3">
              Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.isActive === true}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, isActive: true }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-xs md:text-sm text-slate-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.isActive === false}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, isActive: false }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-xs md:text-sm text-slate-700">
                  Inactive
                </span>
              </label>
            </div>
          </div>

          {formData.wfhAllowed && (
            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                WFH Days Used (of 5)
              </label>
              <Input
                type="number"
                name="usedWFHDays"
                value={formData.usedWFHDays}
                onChange={(e) => {
                  const val = Math.min(5, Math.max(0, parseInt(e.target.value) || 0));
                  setFormData((prev) => ({ ...prev, usedWFHDays: val }));
                }}
                min="0"
                max="5"
                placeholder="0"
              />
              <p className="text-xs text-slate-400 mt-1">Remaining: {5 - (formData.usedWFHDays || 0)} days</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 md:pt-5 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 md:py-2.5 text-xs md:text-sm border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
