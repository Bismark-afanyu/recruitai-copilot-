import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import {
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  LinkIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import Button from "../ui/Button.jsx";
import showToast from "../ui/Toast.jsx";
import { ConfirmModal } from "../ui/Modal.jsx";

const statusOptions = [
  { value: "Todo", color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" },
  { value: "In Progress", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  { value: "Review", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  { value: "Done", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
];

function formatDate(dateStr) {
  if (!dateStr) return "Not set";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TaskDetailPanel({ task, onClose, onEdit, onDelete, onStatusChange }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(task.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(task.id);
    setShowDeleteConfirm(false);
  };

  const currentStatus = statusOptions.find((s) => s.value === task.status) || statusOptions[0];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 h-full flex flex-col slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <h2 className={`text-xl font-bold ${
              task.status === "Done"
                ? "text-gray-400 dark:text-gray-500 line-through"
                : "text-gray-900 dark:text-white"
            }`}>
              {task.title}
            </h2>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isUpdating}
                  className={`px-3 py-1.5 text-sm font-medium rounded-xl transition-all press-scale ${
                    task.status === option.value
                      ? `${option.color} ring-2 ring-offset-1 ring-current`
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {option.value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Description
            </label>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {task.description || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <UserIcon className="w-3 h-3" />
                Assignee
              </label>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {task.assignee_name || "Unassigned"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <CalendarDaysIcon className="w-3 h-3" />
                Due Date
              </label>
              <p className={`mt-2 text-sm ${
                task.due_at && new Date(task.due_at) < new Date()
                  ? "text-rose-600 dark:text-rose-400 font-medium"
                  : "text-gray-700 dark:text-gray-300"
              }`}>
                {formatDate(task.due_at)}
              </p>
            </div>
          </div>

          {(task.related_job_id || task.related_candidate_id) && (
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                Related
              </label>
              <div className="mt-2 space-y-2">
                {task.related_job_id && (
                  <Link
                    to="/jobs"
                    className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    View related job
                  </Link>
                )}
                {task.related_candidate_id && (
                  <Link
                    to={`/candidates/${task.related_candidate_id}`}
                    className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <UserIcon className="w-4 h-4" />
                    View related candidate
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                Created {formatDate(task.created_at)}
              </span>
              {task.updated_at && task.updated_at !== task.created_at && (
                <span className="flex items-center gap-1">
                  <ArrowPathIcon className="w-3 h-3" />
                  Updated {formatDate(task.updated_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
