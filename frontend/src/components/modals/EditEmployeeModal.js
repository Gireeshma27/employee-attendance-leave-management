"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle } from "lucide-react";
import apiService from "@/lib/api";

export function EditEmployeeModal({ isOpen, onClose, employee, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "EMPLOYEE",
    department: "",
    isActive: true,
    officeId: "",
    managerId: "",
    wfhAllowed: false,
    usedWFHDays: 0,
  });

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
        role: employee.role || "EMPLOYEE",
        department: employee.department || "",
        isActive: employee.isActive ?? true,
        officeId: employee.officeId || "",
        managerId: employee.managerId || "",
        wfhAllowed: employee.wfhAllowed || false,
        usedWFHDays: employee.usedWFHDays || 0,
      });
      setErrors({});
      setApiError(null);
      setShowCustomDepartment(false);
      setCustomDepartment("");
      fetchDependentData();
    }
  }, [employee, isOpen]);

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
      // 1. General Info Update (including department)
      await apiService.user.update(employee._id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        isActive: formData.isActive,
        managerId: formData.managerId,
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
          <div className="p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-xs md:text-sm text-red-700">{apiError}</p>
          </div>
        )}

        {/* Employee ID (Read-only) */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
            Employee ID{" "}
            <span className="text-gray-500 text-xs">(Read-only)</span>
          </label>
          <Input
            type="text"
            value={employee.employeeId || "N/A"}
            disabled
            className="bg-gray-50 cursor-not-allowed"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
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
            <p className="text-xs md:text-sm text-red-600 mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email ID */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
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

        {/* Department */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
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
                  className="px-3 py-2 text-xs md:text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500">Enter a custom department name</p>
            </div>
          ) : (
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Role & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Office Location
            </label>
            <select
              name="officeId"
              value={formData.officeId}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Location</option>
              {offices.map((off) => (
                <option key={off._id} value={off._id}>
                  {off.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Manager & WFH Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              Reporting Manager
            </label>
            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-xs md:text-sm font-medium text-gray-700">
              WFH Settings
            </label>
            <div className="flex items-center gap-4 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="wfhAllowed"
                  checked={formData.wfhAllowed}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-xs md:text-sm text-gray-700 font-medium">
                  Allow WFH
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Status & WFH Days */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-3">
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
                <span className="text-xs md:text-sm text-gray-700">Active</span>
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
                <span className="text-xs md:text-sm text-gray-700">
                  Inactive
                </span>
              </label>
            </div>
          </div>

          {formData.wfhAllowed && (
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
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
              <p className="text-xs text-gray-400 mt-1">Remaining: {5 - (formData.usedWFHDays || 0)} days</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 md:pt-5 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 md:py-2.5 text-xs md:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
