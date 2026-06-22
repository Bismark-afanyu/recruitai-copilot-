import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FunnelIcon } from "@heroicons/react/24/outline";

const data = [
  { name: "Jan", applicants: 80, hired: 20 },
  { name: "Feb", applicants: 95, hired: 25 },
  { name: "Mar", applicants: 110, hired: 30 },
  { name: "Apr", applicants: 130, hired: 45 },
  { name: "May", applicants: 100, hired: 35 },
  { name: "Jun", applicants: 120, hired: 40 },
  { name: "Jul", applicants: 140, hired: 50 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-900 dark:text-white">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs text-gray-600 dark:text-gray-300">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function OverviewChart() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Overviews</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">1,121</span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">+30.2%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">last year</span>
          </div>
        </div>
        <Link
          to="/reports"
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <FunnelIcon className="w-4 h-4" />
          View Reports
        </Link>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="applicants"
              fill="#E5E7EB"
              radius={[4, 4, 0, 0]}
              barSize={32}
              name="Applicants"
            />
            <Line
              type="monotone"
              dataKey="hired"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ fill: "#6366F1", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Hired"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">+ 242 Applicant</span>
        </div>
      </div>
    </div>
  );
}
