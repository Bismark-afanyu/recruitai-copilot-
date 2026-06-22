import { Link } from "react-router-dom";
import {
  UserPlusIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const activities = [
  {
    id: 1,
    type: "application",
    icon: UserPlusIcon,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    message: "New application received",
    detail: "Sarah Chen applied for Senior Frontend Developer",
    time: "2 min ago",
    link: "/candidates",
  },
  {
    id: 2,
    type: "interview",
    icon: CalendarIcon,
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
    message: "Interview scheduled",
    detail: "Marcus Johnson - Technical interview at 3:00 PM",
    time: "15 min ago",
    link: "/evaluation",
  },
  {
    id: 3,
    type: "evaluation",
    icon: DocumentCheckIcon,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    message: "Evaluation completed",
    detail: "Emily Park scored 4.5/5 in culture fit assessment",
    time: "1 hour ago",
    link: "/evaluation",
  },
  {
    id: 4,
    type: "hired",
    icon: CheckCircleIcon,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    message: "Candidate hired",
    detail: "Alex Rivera accepted the offer for Product Manager",
    time: "2 hours ago",
    link: "/ranking",
  },
  {
    id: 5,
    type: "message",
    icon: ChatBubbleLeftRightIcon,
    iconBg: "bg-sky-100 dark:bg-sky-900/30",
    iconColor: "text-sky-600 dark:text-sky-400",
    message: "New message",
    detail: "David Kim replied to your interview feedback",
    time: "3 hours ago",
    link: "/candidates",
  },
];

export default function ActivityFeed() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <Link
          to="/candidates"
          className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
        >
          View All
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={activity.link}
            className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors block"
          >
            <div className={`w-9 h-9 rounded-xl ${activity.iconBg} flex items-center justify-center flex-shrink-0`}>
              <activity.icon className={`w-4.5 h-4.5 ${activity.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{activity.detail}</p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">{activity.time}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
