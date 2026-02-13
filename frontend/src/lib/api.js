/**
 * Centralized API service for all backend calls
 * Base URL: http://localhost:5000/api/v1
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

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
        let errorData = null;

        try {
          errorData = await response.json();
          // Extract error message from standardized response format
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status message
          errorMessage = response.statusText || errorMessage;
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return await response.json();
    } catch (error) {
      // Handle network errors more explicitly
      let errorMessage = error instanceof Error ? error.message : String(error);

      // Distinguish between network errors and other fetch errors
      if (error.message === "Failed to fetch") {
        // This usually indicates CORS issue, network connectivity, or backend not running
        const backendUrl = new URL(API_BASE_URL).origin;
        errorMessage = `Cannot connect to server (${backendUrl}). Ensure the backend is running and CORS is configured correctly.`;
      }

      // Log detailed errors in development mode
      if (process.env.NODE_ENV === "development") {
        console.error(`API Error [${endpoint}]:`, errorMessage);
        console.error(`Request URL: ${url}`);
        console.error(`API Base URL: ${API_BASE_URL}`);
        console.error(`Request Method: ${config.method || "GET"}`);
        console.error(`Request Headers:`, config.headers);
        console.error(`Full Error:`, error);
      }

      // Re-throw the error so callers can handle it
      throw error;
    }
  }

  /**
   * HTTP Method Wrappers
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
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

    getAll: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.role) params.append("role", filters.role);
      if (filters.isActive !== undefined)
        params.append("isActive", filters.isActive);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      const query = params.toString();
      return this.request(`/users${query ? "?" + query : ""}`, {
        method: "GET",
      });
    },

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

    changePassword: (data) =>
      this.request("/users/profile/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getDepartments: () =>
      this.request("/users/departments", { method: "GET" }),
  };

  /**
   * Dashboard Endpoints
   */
  dashboard = {
    getAdminStats: () => this.request("/dashboard/admin", { method: "GET" }),

    getManagerStats: () =>
      this.request("/dashboard/manager", { method: "GET" }),

    getEmployeeStats: () =>
      this.request("/dashboard/employee", { method: "GET" }),
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

    getMyLeaves: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.status) params.append("status", filters.status);
      const query = params.toString();
      return this.request(`/leaves/my${query ? "?" + query : ""}`, {
        method: "GET",
      });
    },

    getPendingLeaves: () => this.request("/leaves/pending", { method: "GET" }),

    getAllLeavesAdmin: () =>
      this.request("/leaves/admin/all", { method: "GET" }),

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

  /**
   * Notification Endpoints
   */
  notification = {
    getAll: () => this.request("/notifications", { method: "GET" }),

    markAsRead: (id) =>
      this.request(`/notifications/${id}/read`, {
        method: "PATCH",
      }),

    markAllAsRead: () =>
      this.request("/notifications/read-all", {
        method: "PATCH",
      }),

    clearAll: () =>
      this.request("/notifications/clear-all", {
        method: "DELETE",
      }),
  };

  /**
   * Office/Geofencing Endpoints - TEMPORARILY DISABLED
   *
   * Geofencing feature is temporarily disabled. These endpoints return
   * empty/disabled responses to prevent errors while the backend routes
   * are commented out. To re-enable, restore the original API calls below.
   */
  office = {
    // GEOFENCING DISABLED - Return empty data instead of making API calls
    getAll: () => Promise.resolve({ success: true, data: [] }),
    getById: (id) =>
      Promise.resolve({
        success: false,
        message: "Geofencing temporarily disabled",
      }),
    create: (data) =>
      Promise.resolve({
        success: false,
        message: "Geofencing temporarily disabled",
      }),
    update: (id, data) =>
      Promise.resolve({
        success: false,
        message: "Geofencing temporarily disabled",
      }),
    delete: (id) =>
      Promise.resolve({
        success: false,
        message: "Geofencing temporarily disabled",
      }),

    /* ORIGINAL OFFICE ENDPOINTS - Uncomment to re-enable geofencing
    getAll: () =>
      this.request("/offices", { method: "GET" }),

    getById: (id) =>
      this.request(`/offices/${id}`, { method: "GET" }),

    create: (data) =>
      this.request("/offices", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id, data) =>
      this.request(`/offices/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id) =>
      this.request(`/offices/${id}`, { method: "DELETE" }),
    */
  };

  /**
   * Report Endpoints
   */
  report = {
    getAdminData: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period);

      const query = params.toString();
      return this.request(`/reports/admin${query ? "?" + query : ""}`, {
        method: "GET",
      });
    },

    exportToExcel: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period);

      const query = params.toString();
      const url = `${API_BASE_URL}/reports/export/excel${query ? "?" + query : ""}`;

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Excel export failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `Report_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        throw new Error(error.message || "Failed to export to Excel");
      }
    },
  };
}

export const apiService = new ApiService();
export default apiService;
