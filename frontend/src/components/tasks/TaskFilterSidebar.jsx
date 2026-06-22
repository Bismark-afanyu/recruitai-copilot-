import {
  FunnelIcon,
  UserIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";

const statusOptions = [
  { value: "", label: "All Tasks", icon: DocumentCheckIcon },
  { value: "Todo", label: "Todo", icon: ClipboardIcon },
  { value: "In Progress", label: "In Progress", icon: ArrowPathIcon },
  { value: "Review", label: "Review", icon: ClockIcon },
  { value: "Done", label: "Done", icon: CheckCircleIcon },
];

function ClipboardIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

const dueDateOptions = [
  { value: "", label: "Any Time" },
  { value: "overdue", label: "Overdue", icon: ExclamationCircleIcon },
  { value: "today", label: "Due Today" },
  { value: "week", label: "Due This Week" },
  { value: "none", label: "No Due Date" },
];

export default function TaskFilterSidebar({ filters, onFilterChange, taskCounts, assignees }) {
  const handleStatusChange = (status) => {
    onFilterChange({ ...filters, status });
  };

  const handleAssigneeChange = (assignee) => {
    onFilterChange({ ...filters, assignee });
  };

  const handleDueDateChange = (dueDate) => {
    onFilterChange({ ...filters, dueDate });
  };

  const clearFilters = () => {
    onFilterChange({ status: "", assignee: "", dueDate: "" });
  };

  const hasActiveFilters = filters.status || filters.assignee || filters.dueDate;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FunnelIcon className="w-4 h-4" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Status
        </h4>
        <div className="space-y-1">
          {statusOptions.map((option) => {
            const count = option.value === "" ? taskCounts.all :
              option.value === "Todo" ? taskCounts.todo :
              option.value === "In Progress" ? taskCounts.inProgress :
              option.value === "Review" ? taskCounts.review :
              taskCounts.done;

            return (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  filters.status === option.value
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span className="flex-1 text-left">{option.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filters.status === option.value
                    ? "bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Assignee
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => handleAssigneeChange("")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              !filters.assignee
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span className="flex-1 text-left">All Assignees</span>
          </button>
          {assignees.map((assignee) => (
            <button
              key={assignee}
              onClick={() => handleAssigneeChange(assignee)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                filters.assignee === assignee
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{assignee.charAt(0)}</span>
              </div>
              <span className="flex-1 text-left truncate">{assignee}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Due Date
        </h4>
        <div className="space-y-1">
          {dueDateOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleDueDateChange(option.value)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                filters.dueDate === option.value
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              <span className="flex-1 text-left">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-700/50">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{taskCounts.overdue}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{taskCounts.done}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
