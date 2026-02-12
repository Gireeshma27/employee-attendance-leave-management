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
  Search,
  Bell,
  Settings,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";

/**
 * @description Master layout for all dashboard pages, including Sidebar and Topbar.
 */
const DashboardLayout = ({ children, role = "employee" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wfhMode, setWfhMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiService.notification.getAll();
      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [mounted, user, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await apiService.notification.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

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

  const handleLogout = useCallback(async () => {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [router]);

  const getSidebarLinks = useCallback(() => {
    const commonLinks = [
      {
        href: `/employee/dashboard`,
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      { href: `/employee/attendance`, label: "Attendance", icon: Clock },
      { href: `/employee/leave`, label: "Leaves", icon: Calendar },
      { href: `/employee/profile`, label: "Profile", icon: Users },
    ];

    const managerLinks = [
      { href: `/manager/dashboard`, label: "Dashboard", icon: LayoutDashboard },
      { href: `/manager/team-attendance`, label: "Attendance", icon: Clock },
      { href: `/manager/leave-approvals`, label: "Leaves", icon: Calendar },
    ];

    const adminLinks = [
      { href: `/admin/dashboard`, label: "Dashboard", icon: LayoutDashboard },
      { href: `/admin/employees`, label: "Employees", icon: Users },
      { href: `/admin/attendance`, label: "Attendance", icon: Clock },
      { href: `/admin/leaves`, label: "Leaves", icon: Calendar },
      // GEOFENCING TEMPORARILY DISABLED
      // { href: `/admin/geofencing`, label: "Geofencing", icon: MapPin },
      { href: `/admin/reports`, label: "Reports", icon: BarChart3 },
    ];

    const lowerRole = role?.toLowerCase();
    if (lowerRole === "manager") return managerLinks;
    if (lowerRole === "admin") return adminLinks;
    return commonLinks;
  }, [role]);

  const links = getSidebarLinks();

  return (
    <div
      className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans"
      suppressHydrationWarning
    >
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 lg:hidden z-30 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 bg-[#0F172A] text-white
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col flex-shrink-0 shadow-2xl lg:shadow-none
        `}
      >
        <div className="h-20 px-8 flex items-center mb-4">
          <h1 className="font-black text-2xl tracking-tighter text-white">
            AttendEase
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                pathname === href
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Icon
                size={22}
                className={`flex-shrink-0 transition-colors ${
                  pathname === href
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span
                className={`text-[15px] font-semibold tracking-tight ${pathname === href ? "font-bold" : ""}`}
              >
                {label}
              </span>
              {pathname === href && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white opacity-40 shadow-sm" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">
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
                <div className="w-10 h-5.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm"></div>
              </label>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal font-medium">
              Restrict IP access for remote employees
            </p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-6 flex-1">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors focus:outline-none"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="hidden sm:block">
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {links.find((l) => l.href === pathname)?.label || "Dashboard"}
              </h2>
              <p className="text-xs text-slate-400 font-medium tracking-wide truncate max-w-[300px]">
                {pathname === "/admin/dashboard"
                  ? "System-wide attendance and leave management"
                  : "Manage your portal activities"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 ml-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-full transition-all relative ${showNotifications ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
              >
                <Bell size={20} strokeWidth={2.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                    <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {unreadCount} NEW
                        </span>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        <div className="p-2">
                          {notifications.slice(0, 5).map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => {
                                handleMarkAsRead(notif._id);
                                setShowNotifications(false);
                                if (notif.type.includes("LEAVE")) {
                                  router.push(
                                    role === "admin"
                                      ? "/admin/leaves"
                                      : "/employee/leave",
                                  );
                                } else if (notif.type.includes("ATTENDANCE")) {
                                  router.push(
                                    role === "admin"
                                      ? "/admin/attendance"
                                      : "/employee/attendance",
                                  );
                                }
                              }}
                              className={`p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-slate-100 ${!notif.isRead ? "bg-blue-50/30" : ""}`}
                            >
                              <div className="flex gap-3">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    notif.type === "LEAVE_REQUEST"
                                      ? "bg-amber-50 text-amber-600"
                                      : notif.type === "LEAVE_RESPONSE"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : notif.type === "ATTENDANCE_UPDATE"
                                          ? "bg-blue-50 text-blue-600"
                                          : "bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  {notif.type === "LEAVE_REQUEST" ? (
                                    <Users size={18} />
                                  ) : notif.type === "LEAVE_RESPONSE" ? (
                                    <Calendar size={18} />
                                  ) : (
                                    <Bell size={18} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm mb-0.5 ${!notif.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}
                                  >
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                    {notif.message}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                    {new Date(
                                      notif.createdAt,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <Bell
                            size={40}
                            className="mx-auto text-slate-200 mb-3"
                          />
                          <p className="text-sm text-slate-400 font-medium">
                            No notifications yet
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          router.push("/notifications");
                        }}
                        className="w-full py-2.5 text-[11px] font-black text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest leading-none pointer-events-auto"
                      >
                        View All Notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3.5 pl-1.5 pr-5 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 hover:bg-slate-100 transition-all group shadow-sm hover:shadow-md h-fit self-center"
              >
                <div className="w-10 h-10 bg-[#0F172A] rounded-full flex items-center justify-center text-white text-sm font-black shadow-sm group-hover:scale-105 transition-transform border-2 border-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="hidden md:block text-left mr-1">
                  <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
                    {role === "admin" ? "Administrator" : role}
                  </p>
                </div>
              </button>

              {showProfileDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                    <div className="px-4 py-4 border-b border-slate-50 mb-2 bg-slate-50/50 rounded-xl">
                      <p className="text-sm font-black text-slate-900 truncate mb-0.5">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium truncate italic">
                        {user?.email}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-semibold leading-none">
                        <Users size={18} className="text-slate-400" />
                        My Profile
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-semibold leading-none">
                        <Settings size={18} className="text-slate-400" />
                        Settings
                      </button>
                      <div className="h-px bg-slate-50 my-1 mx-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold uppercase tracking-widest text-[11px]"
                      >
                        <LogOut size={16} />
                        Logout Session
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar">
          <div className="p-6 sm:p-8 lg:p-10 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

/**
 * @description Layout for authentication pages (Login, Forgot Password, etc.).
 */
const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 py-8 font-sans overflow-hidden relative">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

    <div className="w-full max-w-md relative z-10">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-600/30 rotate-12">
          <LayoutDashboard size={40} className="text-white -rotate-12" />
        </div>
        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter">
          AttendEase
        </h1>
        <p className="text-slate-400 font-medium tracking-wide">
          Next-Gen Attendance & Leave Management
        </p>
      </div>
      <div className="bg-white p-8 rounded-[32px] shadow-2xl shadow-black/50 border border-slate-800/10">
        {children}
      </div>
    </div>
  </div>
);

export { DashboardLayout, AuthLayout };
export default DashboardLayout;
