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
  MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";

export function DashboardLayout({ children, role = "employee" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [wfhMode, setWfhMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle screen resize to auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state based on width
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user data");
        }
      }
      const storedWfh = localStorage.getItem("wfhMode") === "true";
      setWfhMode(storedWfh);
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
      { href: `/admin/geofencing`, label: "Geofencing", icon: MapPin },
      { href: `/admin/reports`, label: "Reports", icon: BarChart3 },
    ];

    if (role === "manager") return managerLinks;
    if (role === "admin") return adminLinks;
    return commonLinks;
  };

  const links = getSidebarLinks();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gray-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col flex-shrink-0 shadow-xl lg:shadow-none
        `}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-gray-800">
          <h1 className="font-bold text-xl tracking-tight">
            AttendEase
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group relative ${pathname === href
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
            >
              <Icon size={20} className={`flex-shrink-0 ${pathname === href ? "" : "group-hover:text-white"}`} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        {/* WFH Mode Toggle */}
        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                WFH Mode
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={mounted && wfhMode}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setWfhMode(val);
                    localStorage.setItem("wfhMode", val);
                  }}
                  disabled={!mounted}
                />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Bypass restrictions
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm z-20">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Spacer for mobile to push profile to right if no hamburger needed */}
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-md ring-2 ring-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
              </div>
              <div className="hidden md:block text-left mr-1">
                <p className="text-sm font-semibold text-gray-700 leading-none">
                  {user?.name || "Loading..."}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </p>
              </div>
            </button>

            {showProfileDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileDropdown(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
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
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4 py-8">
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
