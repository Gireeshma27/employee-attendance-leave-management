/**
 * Centralized API service for all backend calls
 * Base URL: http://localhost:5000/api/v1
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000/api/v1";

class ApiService {
  /**
   * Check if backend is reachable
   */
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      return response.ok;
    } catch (error) {
      console.warn("Health check failed:", error.message);
      return false;
    }
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Ensure cookies are sent with requests
      ...options,
    };

    // Add authorization token if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        try {
          errorData = await response.json();
          // Extract error message from standardized response format
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status message
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`API Error [${endpoint}]:`, errorMessage);
      console.error(`Request URL: ${url}`);
      console.error(`Request Config:`, config);
      console.error(`Full Error:`, error);
      throw error;
    }
  }

  /**
   * Auth Endpoints
   */
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

    logout: () =>
      this.request("/auth/logout", {
        method: "POST",
      }),

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

  /**
   * User Endpoints
   */
  user = {
    getProfile: () => this.request("/users/profile", { method: "GET" }),

    updateProfile: (data) =>
      this.request("/users/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    getAll: () =>
      this.request('/users', { method: 'GET' }),

    getById: (id) => this.request(`/users/${id}`, { method: "GET" }),

    create: (data) =>
      this.request("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id, data) =>
      this.request(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  };

  /**
   * Attendance Endpoints
   */
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

    getMyAttendance: () => this.request("/attendance/my", { method: "GET" }),

    getTeamAttendance: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      if (filters.status) params.append("status", filters.status);
      if (filters.department) params.append("department", filters.department);
      if (filters.role) params.append("role", filters.role);
      if (filters.search) params.append("search", filters.search);

      const query = params.toString();
      return this.request(`/attendance/team${query ? "?" + query : ""}`, {
        method: "GET",
      });
    },

    getReport: () => this.request("/attendance/report", { method: "GET" }),

    updateRecord: (id, data) =>
      this.request(`/attendance/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    downloadExcelReport: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      if (filters.status) params.append("status", filters.status);
      if (filters.department) params.append("department", filters.department);
      if (filters.role) params.append("role", filters.role);
      if (filters.search) params.append("search", filters.search);

      const query = params.toString();
      const response = await fetch(
        `${API_BASE_URL}/attendance/export/excel${query ? "?" + query : ""}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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

  /**
   * Leave Endpoints
   */
  leave = {
    apply: (data) =>
      this.request("/leaves/apply", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getMyLeaves: () => this.request("/leaves/my", { method: "GET" }),

    getPendingLeaves: () => this.request("/leaves/pending", { method: "GET" }),

    getAllLeavesAdmin: () =>
      this.request('/leaves/admin/all', { method: 'GET' }),

    approve: (leaveId, data) =>
      this.request(`/leaves/${leaveId}/approve`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    reject: (leaveId, data) =>
      this.request(`/leaves/${leaveId}/reject`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    cancel: (leaveId) =>
      this.request(`/leaves/${leaveId}`, { method: "DELETE" }),
  };
}

export const apiService = new ApiService();
export default apiService;
