"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { apiService } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // First, verify backend is reachable
      const backendHealthy = await apiService.healthCheck();
      if (!backendHealthy) {
        throw new Error(
          "Backend server is not responding. Please ensure the server is running on http://localhost:5000",
        );
      }

      const response = await apiService.auth.login({
        email: formData.email,
        password: formData.password,
      });

      // Store token and user (API wraps response in data object)
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      // Redirect based on user role to dashboard pages
      const userRole = response.data?.user?.role?.toLowerCase();
      let redirectPath = "/employee/dashboard"; // default

      if (userRole === "admin") {
        redirectPath = "/admin/dashboard";
      } else if (userRole === "manager") {
        redirectPath = "/manager/dashboard";
      } else if (userRole === "employee") {
        redirectPath = "/employee/dashboard";
      }

      router.push(redirectPath);
    } catch (error) {
      const errorMessage = error?.message || "Login failed. Please try again.";
      setErrors({
        submit: errorMessage,
      });

      // Log error for debugging
      if (process.env.NODE_ENV === "development") {
        console.error("Login error details:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-emerald-50 flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow"></div>
        <div
          className="absolute bottom-0 -right-40 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              AttendEase
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle
                  className="text-red-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div>
                  <p className="font-semibold text-red-900">{errors.submit}</p>
                </div>
              </div>
            )}
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 bg-slate-50 border ${
                    errors.email
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                  } rounded-xl focus:outline-none focus:ring-2 transition-all`}
                  placeholder="you@company.com"
                  suppressHydrationWarning
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3 bg-slate-50 border ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                  } rounded-xl focus:outline-none focus:ring-2 transition-all`}
                  placeholder="••••••••"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 bg-slate-50 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              suppressHydrationWarning
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-xs font-semibold text-indigo-700 mb-2">
              Demo Credentials:
            </p>
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>Admin:</strong> admin@company.com / admin123
              </p>
              <p>
                <strong>Manager:</strong> manager@company.com / manager123
              </p>
              <p>
                <strong>Employee:</strong> employee@company.com / employee123
              </p>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-slate-600">
          Don't have an account?{" "}
          <a
            href="#"
            className="font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            Contact Admin
          </a>
        </p>
      </div>
    </div>
  );
}
