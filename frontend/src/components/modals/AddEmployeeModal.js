"use client";

import { useState, useEffect } from "react";

const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
};
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Building,
  Lock,
  Users,
  Briefcase,
  Plus,
  Clock,
  MapPin,
  Info,
} from "lucide-react";
import apiService from "@/lib/api";

export function AddEmployeeModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "EMPLOYEE",
    department: "",
    password: "",
    confirmPassword: "",
    location: "",
    branch: "",
    timingId: "",
    loginTime: "",
    logoutTime: "",
    officeId: "",
    managerId: "",
    wfhAllowed: false,
    usedWFHDays: 0,
  });

  // Default departments as fallback
  const DEFAULT_DEPARTMENTS = [
    "Administration",
    "HR",
    "Engineering",
    "Design",
    "Marketing",
  ];

  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [customDepartment, setCustomDepartment] = useState("");

  const LOCATIONS = ["Bangalore", "Mysore", "Mangalore"];

  const [offices, setOffices] = useState([]);
  const [managers, setManagers] = useState([]);
  const [timingLoading, setTimingLoading] = useState(false);
  const [timingNotFound, setTimingNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEmployeeName, setCreatedEmployeeName] = useState("");
  const [createdEmployeeId, setCreatedEmployeeId] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchDependentData();
      setShowSuccess(false);
      setShowCustomDepartment(false);
      setCustomDepartment("");
      setTimingNotFound(false);
    }
  }, [isOpen]);

  const fetchDependentData = async () => {
    try {
      const [officesRes, managersRes, departmentsRes] = await Promise.all([
        apiService.office.getAll(),
        apiService.user.getAll({ role: "MANAGER" }),
        apiService.user.getDepartments(),
      ]);
      setOffices(officesRes.data || []);
      setManagers(managersRes.data?.records || []);
      if (departmentsRes.data && departmentsRes.data.length > 0) {
        setDepartments(departmentsRes.data);
      }
    } catch (err) {
      console.error("Error fetching dependent data:", err);
    }
  };

  // Auto-fetch timing when location + branch are both filled
  useEffect(() => {
    const loc = formData.location;
    const br = formData.branch?.trim();
    if (!loc || !br) {
      setFormData((prev) => ({ ...prev, timingId: "", loginTime: "", logoutTime: "" }));
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

    // Small debounce for branch typing
    const timer = setTimeout(fetchTiming, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.location, formData.branch]);

  const handleChange = (e) => {
    const { name, value } = e.target;

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
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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

    if (!formData.location) {
      newErrors.location = "Office location is required";
    }

    if (!formData.department) {
      newErrors.department = "Department is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      const response = await apiService.user.create({
        ...formData,
        email: formData.email.toLowerCase(),
      });

      // Show success state
      setCreatedEmployeeName(formData.name);
      setCreatedEmployeeId(response.data?.employeeId || "");
      setShowSuccess(true);

      // Reset form
      setFormData({
        name: "",
        email: "",
        role: "EMPLOYEE",
        department: "",
        password: "",
        confirmPassword: "",
        location: "",
        branch: "",
        timingId: "",
        loginTime: "",
        logoutTime: "",
        officeId: "",
        managerId: "",
        wfhAllowed: false,
        usedWFHDays: 0,
      });

      setErrors({});

      // Notify parent and auto-close after delay
      onSuccess?.();
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      let errorMessage = error?.message || "Failed to create employee";
      if (error?.message?.includes("already exists")) {
        if (error?.message?.includes("email")) {
          setErrors({ email: "This email is already registered" });
        } else if (error?.message?.includes("Employee ID")) {
          setErrors({ employeeId: "This Employee ID is already in use" });
        } else {
          setApiError(errorMessage);
        }
      } else {
        setApiError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      role: "EMPLOYEE",
      department: "",
      password: "",
      confirmPassword: "",
      location: "",
      branch: "",
      timingId: "",
      loginTime: "",
      logoutTime: "",
      officeId: "",
      managerId: "",
      wfhAllowed: false,
      usedWFHDays: 0,
    });

    setErrors({});
    setApiError(null);
    setShowSuccess(false);
    setShowCustomDepartment(false);
    setCustomDepartment("");
    setTimingNotFound(false);
    onClose();
  };

  // Success State View
  if (showSuccess) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Employee Added"
        size="lg"
      >
        <div className="py-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Employee Created Successfully!
          </h3>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">
                {createdEmployeeName}
              </span>{" "}
              has been added.
            </p>
            {createdEmployeeId && (
              <div className="inline-block mt-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
                <p className="text-xs font-semibold text-blue-700">
                  Employee ID:{" "}
                  <span className="text-sm tracking-wider">
                    {createdEmployeeId}
                  </span>
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-4">
            This dialog will close automatically...
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Employee"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* API Error */}
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200/60 rounded-xl flex gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        {/* Personal Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User size={16} className="text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Personal Information
            </span>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter employee's full name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@company.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Work Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Briefcase size={16} className="text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Work Information
            </span>
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              {showCustomDepartment ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={customDepartment}
                      onChange={handleCustomDepartmentChange}
                      placeholder="Enter new department name"
                      className={`flex-1 ${errors.department ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomDepartment(false);
                        setCustomDepartment("");
                        setFormData((prev) => ({ ...prev, department: "" }));
                      }}
                      className="px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Enter a custom department name
                  </p>
                </div>
              ) : (
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm ${errors.department ? "border-red-500" : "border-slate-300"}`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                  <option
                    value="__ADD_NEW__"
                    className="font-medium text-blue-600"
                  >
                    ＋ Add New Department
                  </option>
                </select>
              )}
              {errors.department && (
                <p className="text-sm text-red-600 mt-1">{errors.department}</p>
              )}
            </div>
          </div>

          {/* Location & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Office Location <span className="text-red-500">*</span>
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm ${
                  errors.location ? "border-red-500" : "border-slate-300"
                }`}
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Branch
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

          {/* Timing auto-fetch result */}
          {formData.location && formData.branch?.trim() && (
            <div>
              {timingLoading ? (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-sm text-slate-500">Fetching timing for this branch...</p>
                </div>
              ) : timingNotFound ? (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <Info size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    No timing configured for this branch. Please configure it in the{" "}
                    <span className="font-semibold">Timings</span> page first.
                  </p>
                </div>
              ) : formData.loginTime ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      Login Time
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-green-500" />
                      <span className="font-mono text-sm font-semibold text-slate-700">{formatTime(formData.loginTime)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                      Logout Time
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-red-400" />
                      <span className="font-mono text-sm font-semibold text-slate-700">{formatTime(formData.logoutTime)}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Reporting Manager */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reporting Manager
              </label>
              <select
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm"
              >
                <option value="">Select Manager (Optional)</option>
                {managers.map((mgr) => (
                  <option key={mgr._id} value={mgr._id}>
                    {mgr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* WFH Settings - Improved UI */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building size={16} className="text-blue-600" />
              <label className="text-sm font-medium text-slate-700">
                Work From Home (WFH)
              </label>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="wfhAllowed"
                checked={formData.wfhAllowed}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    wfhAllowed: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
              <span className="ml-2 text-sm text-slate-600">
                {formData.wfhAllowed ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>

          {formData.wfhAllowed && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
              <div className="bg-white rounded-xl p-3 border border-slate-100">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Days Used
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    name="usedWFHDays"
                    value={formData.usedWFHDays}
                    onChange={(e) => {
                      const val = Math.min(
                        5,
                        Math.max(0, parseInt(e.target.value) || 0),
                      );
                      setFormData((prev) => ({ ...prev, usedWFHDays: val }));
                    }}
                    min="0"
                    max="5"
                    placeholder="0"
                    className="text-center font-semibold"
                  />
                  <span className="text-sm text-slate-500">of 5</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-100">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Days Remaining
                </label>
                <div className="flex items-center justify-center h-[42px]">
                  <span
                    className={`text-2xl font-semibold ${5 - (formData.usedWFHDays || 0) > 0 ? "text-green-600" : "text-red-500"}`}
                  >
                    {5 - (formData.usedWFHDays || 0)}
                  </span>
                  <span className="text-sm text-slate-500 ml-1">days</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Lock size={16} className="text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Security
            </span>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
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
                Adding...
              </span>
            ) : (
              "Add Employee"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
