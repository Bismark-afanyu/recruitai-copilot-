import { useState } from "react";
import AddEditTaskModal from "../components/tasks/AddEditTaskModal.jsx";
import { ConfirmModal } from "../components/ui/Modal.jsx";
import showToast from "../components/ui/Toast.jsx";
import {
  PlusIcon,
  EllipsisVerticalIcon,
  ChatBubbleLeftIcon,
  HandThumbUpIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

const DUMMY_TASKS = [
  {
    id: "1",
    title: "Search inspirations for upcoming project",
    description: "Note: They like our behance project Mise",
    status: "Todo",
    assignee_name: "Sarah",
    due_at: "2026-06-25",
    tags: ["website", "client"],
    progress: 40,
  },
  {
    id: "2",
    title: "Ginko mobile app design",
    description: "Create user flow, Make wireframe, Design onboarding screens, Make prototype",
    status: "Todo",
    assignee_name: "Lamine",
    due_at: "2026-06-28",
    tags: ["mobileapp", "client"],
    progress: 15,
    checklist: [
      { text: "Create user flow", done: true },
      { text: "Make wireframe", done: true },
      { text: "Design onboarding screens", done: false },
      { text: "Make prototype", done: false },
    ],
  },
  {
    id: "3",
    title: "Make user flow of akua mobile banking app",
    description: "Mobile banking app user flow and wireframes",
    status: "Todo",
    assignee_name: "Nico",
    due_at: "2026-06-30",
    tags: ["mobileapp", "client"],
    progress: 30,
  },
  {
    id: "4",
    title: "Wehiu product task and the task process pages",
    description: "Product page design and task workflow",
    status: "In Progress",
    assignee_name: "Pedri",
    due_at: "2026-06-22",
    tags: ["dribbble", "product"],
    progress: 90,
    hasImage: true,
  },
  {
    id: "5",
    title: "Design CRM shop product page responsive website",
    description: "Have to finish this before weekend",
    status: "In Progress",
    assignee_name: "Sarah",
    due_at: "2026-06-20",
    tags: ["products", "client"],
    progress: 40,
  },
  {
    id: "6",
    title: "Krypto product landing page create in webflow",
    description: "Landing page development in Webflow",
    status: "Review",
    assignee_name: "Marcus",
    due_at: "2026-06-21",
    tags: ["development", "client"],
    progress: 85,
  },
  {
    id: "7",
    title: "Natverk video platform web app design and develop",
    description: "Full stack video platform development",
    status: "Review",
    assignee_name: "Lamine",
    due_at: "2026-06-23",
    tags: ["product", "client"],
    progress: 80,
  },
  {
    id: "8",
    title: "Redesign grab website landing and login pages",
    description: "Note: We have a meeting 3:12 AM",
    status: "Review",
    assignee_name: "Nico",
    due_at: "2026-06-24",
    tags: ["website", "client"],
    progress: 75,
  },
  {
    id: "9",
    title: "Create Odyah app prototype for Get notification in figma",
    description: "Figma prototype for notification system",
    status: "Review",
    assignee_name: "Pedri",
    due_at: "2026-06-25",
    tags: ["mobileapp", "client"],
    progress: 88,
  },
];

const COLUMNS = [
  { id: "Todo", title: "Todo list", dot: "bg-blue-500" },
  { id: "In Progress", title: "In Progress", dot: "bg-orange-500" },
  { id: "Review", title: "In Review", dot: "bg-pink-500" },
  { id: "Done", title: "Done", dot: "bg-emerald-500" },
];

const CARD_COLORS = [
  "bg-gradient-to-br from-blue-50 to-indigo-100/60 border border-blue-200/70 dark:from-blue-950/40 dark:to-indigo-950/40 dark:border-blue-800/50",
  "bg-gradient-to-br from-pink-50 to-rose-100/60 border border-pink-200/70 dark:from-pink-950/40 dark:to-rose-950/40 dark:border-pink-800/50",
  "bg-gradient-to-br from-emerald-50 to-green-100/60 border border-emerald-200/70 dark:from-emerald-950/40 dark:to-green-950/40 dark:border-emerald-800/50",
  "bg-gradient-to-br from-amber-50 to-yellow-100/60 border border-amber-200/70 dark:from-amber-950/40 dark:to-yellow-950/40 dark:border-amber-800/50",
  "bg-gradient-to-br from-purple-50 to-violet-100/60 border border-purple-200/70 dark:from-purple-950/40 dark:to-violet-950/40 dark:border-purple-800/50",
  "bg-gradient-to-br from-cyan-50 to-sky-100/60 border border-cyan-200/70 dark:from-cyan-950/40 dark:to-sky-950/40 dark:border-cyan-800/50",
];

const COLUMN_GRADIENTS = {
  "Todo": "bg-gradient-to-b from-blue-50/80 to-indigo-50/50 border border-blue-200/60 dark:from-blue-950/30 dark:to-indigo-950/20 dark:border-blue-800/40",
  "In Progress": "bg-gradient-to-b from-orange-50/80 to-amber-50/50 border border-orange-200/60 dark:from-orange-950/30 dark:to-amber-950/20 dark:border-orange-800/40",
  "Review": "bg-gradient-to-b from-pink-50/80 to-rose-50/50 border border-pink-200/60 dark:from-pink-950/30 dark:to-rose-950/20 dark:border-pink-800/40",
  "Done": "bg-gradient-to-b from-emerald-50/80 to-green-50/50 border border-emerald-200/60 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-800/40",
};

const TAG_STYLES = {
  website: "bg-blue-100/80 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
  client: "bg-purple-100/80 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300",
  mobileapp: "bg-pink-100/80 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300",
  product: "bg-amber-100/80 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
  dribbble: "bg-rose-100/80 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300",
  development: "bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300",
  products: "bg-teal-100/80 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300",
};

function KanbanCard({ task, colorIndex }) {
  const [showMenu, setShowMenu] = useState(false);
  const cardColor = CARD_COLORS[colorIndex % CARD_COLORS.length];
  const progress = task.progress || 0;

  return (
    <div className={`${cardColor} border rounded-2xl p-4 mb-3 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          {(task.tags || []).map((tag) => (
            <span key={tag} className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${TAG_STYLES[tag] || "bg-gray-100 text-gray-600"}`}>
              #{tag}
            </span>
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60 opacity-0 group-hover:opacity-100 transition-all"
        >
          <EllipsisVerticalIcon className="w-4 h-4" />
        </button>
      </div>

      <h4 className="text-[13px] font-bold text-gray-800 dark:text-gray-100 mb-1.5 leading-snug">{task.title}</h4>

      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {task.checklist && (
        <div className="space-y-1.5 mb-3">
          {task.checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                item.done ? "bg-emerald-500 text-white" : "border-2 border-gray-300"
              }`}>
                {item.done && <CheckCircleIcon className="w-3 h-3" />}
              </div>
              <span className={`text-xs ${item.done ? "text-gray-400 line-through" : "text-gray-600 dark:text-gray-300"}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {task.hasImage && (
        <div className="mb-3 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 h-24 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-1 p-2 w-full h-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/60 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Progress</span>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{progress}%</span>
        </div>
        <div className="flex gap-1">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                i < Math.floor(progress / 10)
                  ? progress >= 80 ? "bg-emerald-400" : progress >= 50 ? "bg-orange-400" : "bg-blue-400"
                  : "bg-gray-200/80"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {[0, 1, 2].slice(0, Math.min(3, Math.floor(Math.random() * 2) + 1)).map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold border-2 border-white dark:border-gray-800"
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
            {task.comments || Math.floor(Math.random() * 12) + 1}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <HandThumbUpIcon className="w-3.5 h-3.5" />
            {task.likes || Math.floor(Math.random() * 8) + 1}
          </span>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks }) {
  return (
    <div className="flex-1 min-w-[300px] max-w-[360px] h-full">
      <div className={`${COLUMN_GRADIENTS[column.id]} rounded-2xl p-3 h-full flex flex-col`}>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{column.title}</h3>
            <span className="text-xs font-semibold text-gray-400 bg-white/70 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-colors">
              <PlusIcon className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-colors">
              <EllipsisVerticalIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-0 flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-1">
          {tasks.map((task, i) => (
            <KanbanCard key={task.id} task={task} colorIndex={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const today = new Date();
  const monthStr = today.toLocaleDateString("en-US", { month: "long" });
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    showToast.success(editingTask ? "Task updated" : "Task created");
    setIsModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{monthStr}</div>
            <div className="text-xs text-gray-400">Today is {dateStr}</div>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Board</h2>
            <span className="text-gray-300 dark:text-gray-600">-</span>
            <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Daily Tasks
              <ChevronDownIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[
              { name: "S", color: "from-orange-400 to-red-500" },
              { name: "L", color: "from-blue-400 to-indigo-500" },
              { name: "N", color: "from-emerald-400 to-teal-500" },
              { name: "P", color: "from-purple-400 to-pink-500" },
            ].map((user, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xs font-bold border-[2.5px] border-white dark:border-gray-900 shadow-sm cursor-pointer hover:scale-110 transition-transform`}
                title={user.name}
              >
                {user.name}
              </div>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FunnelIcon className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={handleAddTask}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30"
          >
            <PlusIcon className="w-4 h-4" />
            Create task
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = DUMMY_TASKS.filter((t) => t.status === col.id);
          return (
            <KanbanColumn key={col.id} column={col} tasks={colTasks} />
          );
        })}
      </div>

      <AddEditTaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        task={editingTask}
        onSave={handleSaveTask}
      />
    </div>
  );
}
