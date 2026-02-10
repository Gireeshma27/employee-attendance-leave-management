"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle } from "lucide-react";
import apiService from "@/lib/api";

export function EditLeaveModal({ isOpen, onClose, leave, onSuccess }) {
  const [formData, setFormData] = useState({
    status: "",
    reason: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (leave && isOpen) {
      setFormData({
        status: leave.status || "",
        reason: "",
      });
      setErrors({});
      setApiError(null);
    }
  }, [leave, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    if (formData.status === "Rejected" && !formData.reason.trim()) {
      newErrors.reason = "Reason is required for rejection";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      if (formData.status === "Approved") {
        await apiService.leave.approve(leave._id);
      } else if (formData.status === "Rejected") {
        await apiService.leave.reject(leave._id, { rejectionReason: formData.reason });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating leave status:", error);
      setApiError(error.message || "Failed to update leave status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Leave Status"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Error */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <p className="text-red-700 text-sm">{apiError}</p>
            </div>
          </div>
        )}

        {/* Leave Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Leave Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Employee:</span>
              <p className="font-medium text-gray-900">{leave?.employee?.name}</p>
            </div>
            <div>
              <span className="text-gray-600">Employee ID:</span>
              <p className="font-medium text-gray-900">{leave?.employee?.employeeId}</p>
            </div>
            <div>
              <span className="text-gray-600">From:</span>
              <p className="font-medium text-gray-900">
                {leave?.startDate ? new Date(leave.startDate).toLocaleDateString() : ""}
              </p>
            </div>
            <div>
              <span className="text-gray-600">To:</span>
              <p className="font-medium text-gray-900">
                {leave?.endDate ? new Date(leave.endDate).toLocaleDateString() : ""}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Reason:</span>
              <p className="font-medium text-gray-900">{leave?.reason}</p>
            </div>
          </div>
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.status ? "border-red-300" : "border-gray-300"
            }`}
            required
          >
            <option value="">Select status</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          {errors.status && (
            <p className="text-red-600 text-sm mt-1">{errors.status}</p>
          )}
        </div>

        {/* Reason for Change */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Change {formData.status === "Rejected" && "*"}
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, status: formData.status, reason: e.target.value })}
            placeholder="Enter reason for status change..."
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
              errors.reason ? "border-red-300" : "border-gray-300"
            }`}
            rows="3"
            required={formData.status === "Rejected"}
          />
          {errors.reason && (
            <p className="text-red-600 text-sm mt-1">{errors.reason}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}