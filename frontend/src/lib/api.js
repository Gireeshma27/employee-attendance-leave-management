/**
 * Centralized API service for all backend calls
 * Base URL: http://localhost:5000/api/v1
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

class ApiService {
  /**
   * Generic fetch wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status message
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
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (data) =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      this.request('/auth/logout', {
        method: 'POST',
      }),

    forgotPassword: (email) =>
      this.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token, password) =>
      this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
  };

  /**
   * User Endpoints
   */
  user = {
    getProfile: () =>
      this.request('/users/profile', { method: 'GET' }),

    updateProfile: (data) =>
      this.request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getAll: () =>
      this.request('/users', { method: 'GET' }),

    getById: (id) =>
      this.request(`/users/${id}`, { method: 'GET' }),

    create: (data) =>
      this.request('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id, data) =>
      this.request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id) =>
      this.request(`/users/${id}`, { method: 'DELETE' }),
  };

  /**
   * Attendance Endpoints
   */
  attendance = {
    checkIn: (data) =>
      this.request('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    checkOut: (data) =>
      this.request('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMyAttendance: () =>
      this.request('/attendance/my', { method: 'GET' }),

    getTeamAttendance: () =>
      this.request('/attendance/team', { method: 'GET' }),

    getReport: () =>
      this.request('/attendance/report', { method: 'GET' }),
  };

  /**
   * Leave Endpoints
   */
  leave = {
    apply: (data) =>
      this.request('/leaves/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMyLeaves: () =>
      this.request('/leaves/my', { method: 'GET' }),

    getPendingLeaves: () =>
      this.request('/leaves/pending', { method: 'GET' }),

    approve: (leaveId, data) =>
      this.request(`/leaves/${leaveId}/approve`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    reject: (leaveId, data) =>
      this.request(`/leaves/${leaveId}/reject`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    cancel: (leaveId) =>
      this.request(`/leaves/${leaveId}`, { method: 'DELETE' }),
  };
}

export const apiService = new ApiService();
export default apiService;
