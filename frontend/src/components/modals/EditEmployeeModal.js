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
    isActive: true,
    officeId: "",
    managerId: "",
    wfhAllowed: false,
    wfhDaysRemaining: 0,
  });

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
        isActive: employee.isActive ?? true,
        officeId: employee.officeId || "",
        managerId: employee.managerId || "",
        wfhAllowed: employee.wfhAllowed || false,
        wfhDaysRemaining: employee.wfhDaysRemaining || 0,
      });
      setErrors({});
      setApiError(null);
      fetchDependentData();
    }
  }, [employee, isOpen]);

  const fetchDependentData = async () => {
    try {
      const [officesRes, managersRes] = await Promise.all([
        apiService.office.getAll(),
        apiService.user.getAll({ role: "MANAGER" }),
      ]);
      setOffices(officesRes.data || []);
      setManagers(managersRes.data?.records || []);
    } catch (err) {
      console.error("Error fetching dependent data:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
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
      // 1. General Info Update
      await apiService.user.update(employee._id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
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
        formData.wfhDaysRemaining !== employee.wfhDaysRemaining
      ) {
        await apiService.user.updateWFHPermission(employee._id, {
          wfhAllowed: formData.wfhAllowed,
          wfhDaysRemaining: parseInt(formData.wfhDaysRemaining),
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

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
              WFH Days Remaining
            </label>
            <Input
              type="number"
              name="wfhDaysRemaining"
              value={formData.wfhDaysRemaining}
              onChange={handleChange}
              min="0"
              placeholder="0 days"
            />
          </div>
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
