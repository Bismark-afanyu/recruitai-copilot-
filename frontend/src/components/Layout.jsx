import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "./ThemeContext.jsx";
import {
  HomeIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RocketLaunchIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

const generalLinks = [
  { to: "/", label: "Dashboard", icon: HomeIcon, end: true },
  { to: "/tasks", label: "Task", icon: CheckCircleIcon },
  { to: "/candidates", label: "Candidate", icon: UserGroupIcon },
  { to: "/reports", label: "Performances", icon: ChartBarIcon },
  { to: "/evaluation", label: "Schedule", icon: CalendarIcon },
  { to: "/upload", label: "Notes", icon: DocumentTextIcon },
];

const otherLinks = [
  { to: "/settings", label: "Setting", icon: CogIcon },
  { to: "/help", label: "Need Help", icon: QuestionMarkCircleIcon },
];

function Sidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col transition-all duration-300
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          lg:sticky lg:top-0 lg:z-auto
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-5 py-5 border-b border-gray-200 dark:border-gray-700`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">Recruit<span className="text-indigo-600 dark:text-indigo-400">AI</span></span>
            )}
          </div>
          {collapsed ? (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1 mt-4 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Expand sidebar"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">ES</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400">Elix Space</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">HR Team</div>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        )}

        <div className={`px-5 mb-2 ${collapsed ? "hidden" : ""}`}>
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">General</div>
        </div>

        <nav className={`flex-1 space-y-1 ${collapsed ? "px-3 py-4" : "px-3"}`}>
          {generalLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              title={collapsed ? link.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }`
              }
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && link.label}
            </NavLink>
          ))}
        </nav>

        <div className={`px-5 mt-4 mb-2 ${collapsed ? "hidden" : ""}`}>
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Others</div>
        </div>

        <nav className={`space-y-1 ${collapsed ? "px-3 py-4" : "px-3"}`}>
          {otherLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              title={collapsed ? link.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }`
              }
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && link.label}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="px-3 py-4 mt-auto">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-700/50">
              <div className="flex items-center gap-2 mb-2">
                <RocketLaunchIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                Unlock full feature and elevate your work without cutting edge.
              </p>
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="px-3 py-4 mt-auto">
            <button
              title="Upgrade to Pro"
              className="w-full flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl transition-all"
            >
              <RocketLaunchIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default function Layout({ children, onLogout, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileOpen(true);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>

          {title && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">{title}</h1>
          )}

          <div className="flex-1 max-w-md ml-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? (
                <MoonIcon className="w-5 h-5" />
              ) : (
                <SunIcon className="w-5 h-5" />
              )}
            </button>
            <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
              <ChatBubbleLeftIcon className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-600">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lamine"
                alt="User"
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600"
              />
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Lamine Yamal</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">HR Manager</div>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
