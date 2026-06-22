import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FunnelIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const tasks = [
  {
    id: 1,
    name: "Process New Hire Paperwork",
    assignee: "HR Manager",
    team: ["Lamine", "Nico", "& 2 Other"],
    status: "In Progress",
    avatars: ["Lamine", "Nico"],
  },
  {
    id: 2,
    name: "Organize and Deliver Compliance Training",
    assignee: "HR Manager",
    team: ["Lamine", "& Pedri"],
    status: "Need Review",
    avatars: ["Lamine", "Pedri"],
  },
  {
    id: 3,
    name: "Address Employee Leave Request",
    assignee: "HR Manager",
    team: ["Lamine Yamal"],
    status: "In Progress",
    avatars: ["Lamine"],
  },
  {
    id: 4,
    name: "Respond to Employee Relations Inquiry",
    assignee: "HR Manager",
    team: ["Lamine", "& Nico"],
    status: "Done",
    avatars: ["Lamine", "Nico"],
  },
  {
    id: 5,
    name: "Prepare for Upcoming Benefits Fair",
    assignee: "HR Manager",
    team: ["Lamine Yamal"],
    status: "Need Review",
    avatars: ["Lamine"],
  },
  {
    id: 6,
    name: "Review Open Positions",
    assignee: "HR Manager",
    team: ["Lamine Yamal"],
    status: "Done",
    avatars: ["Lamine"],
  },
];

const statusColors = {
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Need Review": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "Done": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const avatarColors = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

function AvatarStack({ avatars }) {
  return (
    <div className="flex -space-x-2">
      {avatars.map((name, i) => (
        <div
          key={name}
          className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800`}
          title={name}
        >
          {name.charAt(0)}
        </div>
      ))}
    </div>
  );
}

export default function DailyTaskTable() {
  const [statusFilter, setStatusFilter] = useState("All Status");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Daily Task</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>All Status</option>
              <option>In Progress</option>
              <option>Need Review</option>
              <option>Done</option>
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <Link
            to="/candidates"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-medium"
          >
            View All
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Task Name
              </th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Team
              </th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {tasks
              .filter(
                (task) =>
                  statusFilter === "All Status" || task.status === statusFilter
              )
              .map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="py-4 px-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {task.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Assigned by {task.assignee}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <AvatarStack avatars={task.avatars} />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {task.team.join(" ")}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
