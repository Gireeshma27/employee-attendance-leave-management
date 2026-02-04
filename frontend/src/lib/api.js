/**
 * @description Centralized API service for all backend calls.
 * @module lib/api
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * Enhanced API Service with standardized response handling.
 */
class ApiService {
  /**
   * Generic fetch wrapper with standardized error and response handling.
   * @param {string} endpoint - API endpoint.
   * @param {Object} options - Fetch options.
   * @returns {Promise<any>} - Decoupled data from backend response.
   */
  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);
      const result = await response.json();

      if (!response.ok) {
        const error = new Error(
          result.message || result.error || `HTTP Error: ${response.status}`,
        );
        error.status = response.status;
        error.data = result;
        throw error;
      }

      // Automatically return .data if it exists (standard shape), otherwise return the result
      return result;
    } catch (error) {
      // Retry logic for connection failures
      if (error.message === "Failed to fetch" && retryCount < 1) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[API RETRY] Retrying ${endpoint} due to connection failure...`,
          );
        }
        // Wait 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.request(endpoint, options, retryCount + 1);
      }

      if (error.message === "Failed to fetch") {
        error.message =
          "Unable to connect to the server. Please check your internet connection or backend status.";
      }

      if (process.env.NODE_ENV === "development") {
        console.error(
          `[API ERROR] ${options.method || "GET"} ${endpoint}:`,
          error.message,
        );
      }

      throw error;
    }
  }

  // --- Auth Endpoints ---
  auth = {
    login: (credentials) =>
      this.request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    register: (data) =>
      this.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    logout: () => this.request("/auth/logout", { method: "POST" }),
    forgotPassword: (email) =>
      this.request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token, password) =>
      this.request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
  };

  // --- User Endpoints ---
  user = {
    getProfile: () => this.request("/users/profile"),
    updateProfile: (data) =>
      this.request("/users/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    getAll: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return this.request(`/users${params ? "?" + params : ""}`);
    },
    getById: (id) => this.request(`/users/${id}`),
    create: (data) =>
      this.request("/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      this.request(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    assignLocation: (id, officeId) =>
      this.request(`/users/${id}/assign-location`, {
        method: "PATCH",
        body: JSON.stringify({ officeId }),
      }),
    updateWFHPermission: (id, data) =>
      this.request(`/users/${id}/wfh-permission`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  };

  // --- Attendance Endpoints ---
  attendance = {
    checkIn: (data) =>
      this.request("/attendance/check-in", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    checkOut: (data) =>
      this.request("/attendance/check-out", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getMyAttendance: () => this.request("/attendance/my-attendance"),
    getTeamAttendance: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return this.request(`/attendance/team${params ? "?" + params : ""}`);
    },
    getReport: () => this.request("/attendance/export/excel"),
    updateRecord: (id, data) =>
      this.request(`/attendance/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    downloadExcelReport: async (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/attendance/export/excel${params ? "?" + params : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Excel download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attendance_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
  };

  // --- Leave Endpoints ---
  leave = {
    apply: (data) =>
      this.request("/leaves/apply", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getMyLeaves: () => this.request("/leaves/my-leaves"),
    getPendingLeaves: () => this.request("/leaves/pending"),
    getAllLeavesAdmin: () => this.request("/leaves/all"),
    approve: (leaveId, data) =>
      this.request(`/leaves/${leaveId}/approve`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    reject: (leaveId, data) =>
      this.request(`/leaves/${leaveId}/reject`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    cancel: (leaveId) =>
      this.request(`/leaves/${leaveId}`, { method: "DELETE" }),
  };

  // --- Office Endpoints ---
  office = {
    getAll: () => this.request("/offices"),
    create: (data) =>
      this.request("/offices", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      this.request(`/offices/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id) => this.request(`/offices/${id}`, { method: "DELETE" }),
  };

  // --- Dashboard Endpoints ---
  dashboard = {
    getAdminStats: () => this.request("/dashboard/admin"),
  };

  // --- Report Endpoints ---
  report = {
    getAdminData: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return this.request(`/reports/admin${qs ? "?" + qs : ""}`);
    },
  };

  // --- Notification Endpoints ---
  notification = {
    getAll: () => this.request("/notifications"),
    markAsRead: (id) =>
      this.request(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllAsRead: () =>
      this.request("/notifications/read-all", { method: "PATCH" }),
    clearAll: () =>
      this.request("/notifications/clear-all", { method: "DELETE" }),
  };

  /**
   * Check if backend is reachable.
   */
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

const apiService = new ApiService();

export { apiService };
export default apiService;
