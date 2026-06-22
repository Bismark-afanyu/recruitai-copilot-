import { Link } from "react-router-dom";
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

const stats = [
  {
    label: "Applicant",
    value: "158",
    trend: "+20.2%",
    trendLabel: "last month",
    trendUp: true,
    icon: UserGroupIcon,
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    chartColor: "text-emerald-500",
    link: "/candidates",
  },
  {
    label: "Interviewed",
    value: "89",
    trend: "+15.7%",
    trendLabel: "last month",
    trendUp: true,
    icon: ChatBubbleLeftRightIcon,
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    chartColor: "text-emerald-500",
    link: "/evaluation",
  },
  {
    label: "Hired",
    value: "24",
    trend: "+32.4%",
    trendLabel: "last month",
    trendUp: true,
    icon: BriefcaseIcon,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    chartColor: "text-red-500",
    link: "/ranking",
  },
];

function MiniChart({ color }) {
  const bars = [40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100];
  return (
    <div className="flex items-end gap-1 h-8">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full ${color} transition-all duration-300`}
          style={{ height: `${height * 0.3}px`, opacity: 0.6 + (i / bars.length) * 0.4 }}
        />
      ))}
    </div>
  );
}

export default function StatCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          to={stat.link}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer block"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
            <MiniChart color={stat.chartColor} />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{stat.trend}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{stat.trendLabel}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
        </Link>
      ))}
    </div>
  );
}
