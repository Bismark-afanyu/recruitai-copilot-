import { ArrowRightIcon } from "@heroicons/react/24/outline";

const teamMembers = [
  {
    id: 1,
    name: "Lamine Yamal",
    role: "HR Manager",
    hired: 12,
    interviews: 28,
    avatar: "LY",
    color: "bg-indigo-500",
  },
  {
    id: 2,
    name: "Nico Williams",
    role: "Recruiter",
    hired: 8,
    interviews: 22,
    avatar: "NW",
    color: "bg-violet-500",
  },
  {
    id: 3,
    name: "Pedri Garcia",
    role: "Technical Lead",
    hired: 6,
    interviews: 18,
    avatar: "PG",
    color: "bg-emerald-500",
  },
  {
    id: 4,
    name: "Gavi Lopez",
    role: "Recruiter",
    hired: 5,
    interviews: 15,
    avatar: "GL",
    color: "bg-amber-500",
  },
];

function ProgressBar({ value, max }) {
  const percentage = (value / max) * 100;
  return (
    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function TeamPerformance() {
  const maxHired = Math.max(...teamMembers.map((m) => m.hired));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Team Performance</h3>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
          Details
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
              {member.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{member.hired} hired</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.interviews} interviews</p>
                </div>
              </div>
              <ProgressBar value={member.hired} max={maxHired} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
