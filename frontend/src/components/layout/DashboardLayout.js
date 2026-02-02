"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";

export function DashboardLayout({ children, role = "employee" }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user data");
        }
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  const getSidebarLinks = () => {
    const commonLinks = [
      {
        href: `/employee/dashboard`,
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      { href: `/employee/attendance`, label: "Attendance", icon: Clock },
      { href: `/employee/leave`, label: "Leave", icon: Calendar },
      { href: `/employee/profile`, label: "Profile", icon: Users },
    ];

    const managerLinks = [
      { href: `/manager/dashboard`, label: "Dashboard", icon: LayoutDashboard },
      {
        href: `/manager/team-attendance`,
        label: "Team Attendance",
        icon: Clock,
      },
      {
        href: `/manager/leave-approvals`,
        label: "Leave Approvals",
        icon: Calendar,
      },
    ];

    const adminLinks = [
      { href: `/admin/dashboard`, label: "Dashboard", icon: LayoutDashboard },
      { href: `/admin/employees`, label: "Employees", icon: Users },
      { href: `/admin/attendance`, label: "Attendance", icon: Clock },
      { href: `/admin/leaves`, label: "Leaves", icon: Calendar },
      { href: `/admin/reports`, label: "Reports", icon: BarChart3 },
    ];

    if (role === "manager") return managerLinks;
    if (role === "admin") return adminLinks;
    return commonLinks;
  };

  const links = getSidebarLinks();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="px-6 py-8 border-b border-gray-800">
          <h1 className={`font-bold text-xl ${!sidebarOpen && "hidden"}`}>
            AttendEase
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                pathname === href
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="ml-4">{label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout removed from sidebar */}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-end">
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-4 hover:bg-gray-50 p-2 rounded-xl transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">
                  {user?.name || "Loading..."}
                </p>
                <p className="text-[11px] text-gray-500 font-medium capitalize">
                  {user?.role || "User"}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
                {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
              </div>
            </button>

            {showProfileDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileDropdown(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-bold text-gray-900">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AttendEase</h1>
          <p className="text-blue-100">
            Employee Attendance & Leave Management
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
