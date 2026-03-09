"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Send, Bot, User, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Route map keyed by role
// ---------------------------------------------------------------------------
const ROUTE_MAP = {
  admin: [
    {
      keywords: ["add employee", "new employee", "create employee", "employees", "employee list", "staff"],
      label: "Employees",
      route: "/admin/employees",
      quickAction: true,
    },
    {
      keywords: ["attendance"],
      label: "Attendance",
      route: "/admin/attendance",
      quickAction: true,
    },
    {
      keywords: ["leave", "leaves", "leave management"],
      label: "Leaves",
      route: "/admin/leaves",
      quickAction: true,
    },
    {
      keywords: ["holiday", "holidays", "public holiday"],
      label: "Holidays",
      route: "/admin/holidays",
      quickAction: false,
    },
    {
      keywords: ["timing", "timings", "shift", "shifts", "work hour"],
      label: "Timings",
      route: "/admin/timings",
      quickAction: false,
    },
    {
      keywords: ["report", "reports", "analytics"],
      label: "Reports",
      route: "/admin/reports",
      quickAction: false,
    },
    {
      keywords: ["setting", "settings", "configuration", "config"],
      label: "Settings",
      route: "/admin/settings",
      quickAction: false,
    },
    {
      keywords: ["dashboard", "home", "overview"],
      label: "Dashboard",
      route: "/admin/dashboard",
      quickAction: false,
    },
  ],
  manager: [
    {
      keywords: ["dashboard", "home", "overview"],
      label: "Dashboard",
      route: "/manager/dashboard",
      quickAction: false,
    },
    {
      keywords: ["attendance", "team attendance"],
      label: "Team Attendance",
      route: "/manager/team-attendance",
      quickAction: true,
    },
    {
      keywords: ["leave", "leaves", "leave approval", "approvals"],
      label: "Leave Approvals",
      route: "/manager/leave-approvals",
      quickAction: true,
    },
    {
      keywords: ["employee", "employees", "team", "my team"],
      label: "My Team",
      route: "/manager/employees",
      quickAction: true,
    },
    {
      keywords: ["holiday", "holidays"],
      label: "Holidays",
      route: "/manager/holidays",
      quickAction: true,
    },
  ],
  employee: [
    {
      keywords: ["dashboard", "home", "overview"],
      label: "Dashboard",
      route: "/employee/dashboard",
      quickAction: false,
    },
    {
      keywords: ["attendance", "check in", "check out", "clock"],
      label: "Attendance",
      route: "/employee/attendance",
      quickAction: true,
    },
    {
      keywords: [
        "apply leave",
        "leave",
        "leaves",
        "leave request",
        "request leave",
      ],
      label: "Apply Leave",
      route: "/employee/leave",
      quickAction: true,
    },
    {
      keywords: ["holiday", "holidays", "public holiday"],
      label: "Holidays",
      route: "/employee/holidays",
      quickAction: true,
    },
    {
      keywords: ["profile", "account", "my profile"],
      label: "My Profile",
      route: "/employee/profile",
      quickAction: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helper: match a text input to a route entry
// ---------------------------------------------------------------------------
function matchRoute(input, routes) {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;
  for (const entry of routes) {
    for (const kw of entry.keywords) {
      if (normalized.includes(kw) || kw.includes(normalized)) {
        return entry;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Initial bot greeting
// ---------------------------------------------------------------------------
function getGreeting(role) {
  const roleLabel =
    role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Employee";
  return `Hi there! 👋 I'm your HRMS assistant. I can help you navigate the **${roleLabel}** portal. Type a command or tap a quick action below.`;
}

// ---------------------------------------------------------------------------
// ChatBot Component
// ---------------------------------------------------------------------------
export default function ChatBot({ role = "employee" }) {
  const router = useRouter();
  const routes = ROUTE_MAP[role] ?? ROUTE_MAP.employee;
  const quickActions = routes.filter((r) => r.quickAction);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: getGreeting(role) },
  ]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to newest message
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const addMessage = useCallback((from, text) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), from, text },
    ]);
  }, []);

  const handleCommand = useCallback(
    (text) => {
      if (!text.trim()) return;
      addMessage("user", text);

      const match = matchRoute(text, routes);
      if (match) {
        addMessage(
          "bot",
          `Navigating you to **${match.label}**… ✅`,
        );
        setTimeout(() => {
          router.push(match.route);
          setOpen(false);
        }, 600);
      } else {
        const options = routes
          .slice(0, 6)
          .map((r) => r.label)
          .join(", ");
        addMessage(
          "bot",
          `Sorry, I didn't understand that. Try commands like: ${options}. Or tap a quick action below.`,
        );
      }
    },
    [addMessage, router, routes],
  );

  const handleSend = () => {
    const text = input.trim();
    setInput("");
    handleCommand(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render bold markdown (**text**)
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Floating toggle button                                              */}
      {/* ------------------------------------------------------------------ */}
      <button
        type="button"
        aria-label={open ? "Close chatbot" : "Open chatbot"}
        onClick={() => setOpen((v) => !v)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-xl
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          ${
            open
              ? "bg-slate-700 hover:bg-slate-600 rotate-0 scale-100"
              : "bg-blue-600 hover:bg-blue-700 scale-100 hover:scale-110"
          }
        `}
      >
        <span
          className={`absolute transition-all duration-200 ${open ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}
        >
          <X size={22} className="text-white" />
        </span>
        <span
          className={`absolute transition-all duration-200 ${open ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`}
        >
          <MessageCircle size={24} className="text-white" />
        </span>
      </button>

      {/* ------------------------------------------------------------------ */}
      {/* Chat window                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`
          fixed bottom-24 right-6 z-50
          w-[340px] sm:w-[380px]
          flex flex-col
          bg-white rounded-2xl shadow-2xl border border-slate-200/80
          transition-all duration-300 ease-in-out origin-bottom-right
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none"}
        `}
        style={{ maxHeight: "520px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-t-2xl flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Bot size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-none">
              HRMS Assistant
            </p>
            <p className="text-[10px] text-blue-100 font-medium mt-0.5">
              Navigation helper
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-white/80" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 items-end ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ${
                  msg.from === "bot"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {msg.from === "bot" ? (
                  <Bot size={13} />
                ) : (
                  <User size={13} />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`
                  max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${
                    msg.from === "bot"
                      ? "bg-slate-100 text-slate-800 rounded-tl-sm"
                      : "bg-blue-600 text-white rounded-tr-sm"
                  }
                `}
              >
                {renderText(msg.text)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0 border-t border-slate-100 pt-2">
            {quickActions.map((action) => (
              <button
                key={action.route}
                type="button"
                onClick={() => handleCommand(action.label)}
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100"
              >
                <ChevronRight size={10} />
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command…"
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send"
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
      </div>
    </>
  );
}
