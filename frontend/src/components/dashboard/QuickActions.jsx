import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      label: "Post a Job",
      onClick: () => {
        navigate("/jobs");
        setIsOpen(false);
      },
      color: "bg-indigo-600 hover:bg-indigo-500",
    },
    {
      label: "Upload Resume",
      onClick: () => {
        navigate("/upload");
        setIsOpen(false);
      },
      color: "bg-violet-600 hover:bg-violet-500",
    },
    {
      label: "Add Candidate",
      onClick: () => {
        navigate("/candidates");
        setIsOpen(false);
      },
      color: "bg-emerald-600 hover:bg-emerald-500",
    },
    {
      label: "Schedule Interview",
      onClick: () => {
        navigate("/evaluation");
        setIsOpen(false);
      },
      color: "bg-amber-600 hover:bg-amber-500",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Quick Actions</p>
          </div>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${action.color.split(" ")[0]}`} />
              {action.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 ${
          isOpen
            ? "bg-gray-600 hover:bg-gray-500 rotate-45"
            : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-xl hover:scale-105"
        }`}
      >
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />}
      </button>
    </div>
  );
}
