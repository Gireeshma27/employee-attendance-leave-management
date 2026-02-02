'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';
import apiService from '@/lib/api';

export function EditEmployeeModal({ isOpen, onClose, employee, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        role: employee.role || 'EMPLOYEE',
        isActive: employee.isActive ?? true,
      });
      setErrors({});
      setApiError(null);
    }
  }, [employee, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
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
      await apiService.user.update(employee._id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = error?.message || 'Failed to update employee';

      // Handle specific backend errors and map to fields
      if (errorMessage.includes('email')) {
        setErrors({ email: 'This email is already in use' });
      } else {
        // Generic API error
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Employee" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* API Error */}
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        {/* Employee ID (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee ID <span className="text-gray-500 text-xs">(Read-only)</span>
          </label>
          <Input
            type="text"
            value={employee.employeeId || 'N/A'}
            disabled
            className="bg-gray-50 cursor-not-allowed"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter employee name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email ID <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Status
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="active"
                checked={formData.isActive === true}
                onChange={() => setFormData((prev) => ({ ...prev, isActive: true }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={formData.isActive === false}
                onChange={() => setFormData((prev) => ({ ...prev, isActive: false }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Inactive</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Edit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
