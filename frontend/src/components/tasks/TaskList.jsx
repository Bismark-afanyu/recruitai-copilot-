import { Link } from "react-router-dom";
import {
  EllipsisVerticalIcon,
  CalendarDaysIcon,
  UserIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import LoadingSkeleton from "../ui/LoadingSkeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";

const statusConfig = {
  Todo: {
    color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    dot: "bg-gray-400",
    icon: DocumentCheckIcon,
  },
  "In Progress": {
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    icon: ArrowPathIcon,
  },
  Review: {
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    icon: ClockIcon,
  },
  Done: {
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    icon: CheckCircleIcon,
  },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays <= 7) return `${diffDays}d left`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function TaskCard({ task, isSelected, onSelect, onEdit, onDelete, onStatusChange }) {
  const config = statusConfig[task.status] || statusConfig.Todo;
  const StatusIcon = config.icon;
  const overdue = isOverdue(task.due_at);

  return (
    <div
      onClick={() => onSelect(task)}
      className={`group bg-white dark:bg-gray-800 rounded-xl border p-4 cursor-pointer transition-all duration-200 hover-lift ${
        isSelected
          ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20"
          : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const nextStatus = task.status === "Done" ? "Todo" :
              task.status === "Todo" ? "In Progress" :
              task.status === "In Progress" ? "Review" : "Done";
            onStatusChange(task.id, nextStatus);
          }}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            task.status === "Done"
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400"
          }`}
        >
          {task.status === "Done" && (
            <CheckCircleIcon className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium ${
              task.status === "Done"
                ? "text-gray-400 dark:text-gray-500 line-through"
                : "text-gray-900 dark:text-white"
            }`}>
              {task.title}
            </h4>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {task.status}
            </span>

            {task.due_at && (
              <span className={`inline-flex items-center gap-1 text-xs ${
                overdue ? "text-rose-600 dark:text-rose-400 font-medium" : "text-gray-500 dark:text-gray-400"
              }`}>
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                {formatDate(task.due_at)}
              </span>
            )}

            {task.assignee_name && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">{task.assignee_name.charAt(0)}</span>
                </div>
                {task.assignee_name}
              </span>
            )}
          </div>

          {(task.related_job_id || task.related_candidate_id) && (
            <div className="flex items-center gap-2 mt-2">
              {task.related_job_id && (
                <Link
                  to={`/jobs`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View Job
                </Link>
              )}
              {task.related_candidate_id && (
                <Link
                  to={`/candidates/${task.related_candidate_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View Candidate
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskList({
  tasks,
  loading,
  selectedTask,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  viewMode,
}) {
  if (loading) {
    return <LoadingSkeleton type="card" count={5} />;
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 h-full">
        <EmptyState
          icon={<DocumentCheckIcon className="w-12 h-12" />}
          title="No tasks found"
          description="Create your first task to get started with task management."
        />
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto scrollbar-thin pr-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedTask?.id === task.id}
            onSelect={onSelectTask}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 h-full overflow-y-auto scrollbar-thin">
      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        {tasks.map((task) => (
          <div key={task.id} className="p-4">
            <TaskCard
              task={task}
              isSelected={selectedTask?.id === task.id}
              onSelect={onSelectTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
