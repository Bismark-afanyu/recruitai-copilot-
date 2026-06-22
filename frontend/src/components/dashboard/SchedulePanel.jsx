import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";

const days = [
  { day: "07", name: "Sat", date: 7 },
  { day: "08", name: "Sun", date: 8 },
  { day: "09", name: "Mon", date: 9, highlighted: true },
  { day: "10", name: "Tue", date: 10 },
];

const interviews = [
  {
    id: 1,
    time: "08:00",
    name: "Paulo Dybala",
    role: "UI Designer",
    description: "Highly motivated and results-oriented UI/UX designer with a passion for crafting user-friendl...",
    status: "Go to Meeting",
    statusColor: "bg-indigo-600 text-white",
    avatar: "PD",
    avatarBg: "bg-rose-500",
  },
  {
    id: 2,
    time: "12:00",
    name: "Rodrigo de Paul",
    role: "Project Manager",
    description: "Driven and organized Project Manager with a proven track record of delivering projects on tim...",
    status: "Go to Meeting",
    statusColor: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
    avatar: "RD",
    avatarBg: "bg-blue-500",
  },
  {
    id: 3,
    time: "14:00",
    name: "Lautaro Martinez",
    role: "Motion Designer",
    description: "Creative and innovative Motion Designer with a passion for bringing ideas to life through captiva...",
    status: "Go to Meeting",
    statusColor: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
    avatar: "LM",
    avatarBg: "bg-emerald-500",
  },
  {
    id: 4,
    time: "15:00",
    name: "Enzo Fernandez",
    role: "3D Artist",
    description: "Creative and innovative Motion Designer with a passion for bringing ideas to life through captiva...",
    status: "Go to Meeting",
    statusColor: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
    avatar: "EF",
    avatarBg: "bg-violet-500",
  },
];

export default function SchedulePanel() {
  const [activeTab, setActiveTab] = useState("interview");
  const [selectedDay, setSelectedDay] = useState(9);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Schedule</h3>
        <Link
          to="/evaluation"
          className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          See All
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">July 2023</span>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <div className="flex-1 flex justify-between">
          {days.map((d) => (
            <button
              key={d.date}
              onClick={() => setSelectedDay(d.date)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                selectedDay === d.date
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span className="text-lg font-bold">{d.day}</span>
              <span className="text-xs">{d.name}</span>
            </button>
          ))}
        </div>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("interview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "interview"
              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          Interview
          <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-full">
            3
          </span>
        </button>
        <button
          onClick={() => setActiveTab("meeting")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "meeting"
              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          Meeting
          <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
            3
          </span>
        </button>
      </div>

      <div className="space-y-4">
        {interviews.map((item) => (
          <div key={item.id} className="relative">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              {item.time}
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div
                className={`w-10 h-10 rounded-full ${item.avatarBg} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
              >
                {item.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.role}</div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                    <EllipsisVerticalIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {item.description}
                </p>
                <Link
                  to="/evaluation"
                  className={`mt-2 inline-block px-3 py-1.5 text-xs font-semibold rounded-lg ${item.statusColor} hover:opacity-90 transition-opacity`}
                >
                  {item.status}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
