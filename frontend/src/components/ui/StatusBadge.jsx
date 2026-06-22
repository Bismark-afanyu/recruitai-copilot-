const statusStyles = {
  New: "bg-gray-100 text-gray-700 ring-gray-300",
  Shortlisted: "bg-indigo-50 text-indigo-700 ring-indigo-300",
  "Interview Scheduled": "bg-amber-50 text-amber-700 ring-amber-300",
  Interviewed: "bg-amber-50 text-amber-700 ring-amber-300",
  Recommended: "bg-emerald-50 text-emerald-700 ring-emerald-300",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-300",
  Hired: "bg-emerald-50 text-emerald-700 ring-emerald-300",
};

const matchStyles = {
  "Strong Match": "bg-emerald-50 text-emerald-700 ring-emerald-300",
  "Good Match": "bg-indigo-50 text-indigo-700 ring-indigo-300",
  "Average Match": "bg-amber-50 text-amber-700 ring-amber-300",
  "Weak Match": "bg-rose-50 text-rose-700 ring-rose-300",
  "Highly Recommended": "bg-emerald-50 text-emerald-700 ring-emerald-300",
  Recommended: "bg-indigo-50 text-indigo-700 ring-indigo-300",
  "Consider with Caution": "bg-amber-50 text-amber-700 ring-amber-300",
  "Not Recommended": "bg-rose-50 text-rose-700 ring-rose-300",
};

export function StatusBadge({ status }) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-700 ring-gray-300";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style}`}>
      {status}
    </span>
  );
}

export function MatchBadge({ value }) {
  if (!value) return <span className="text-gray-400">—</span>;
  const style = matchStyles[value] || "bg-gray-100 text-gray-700 ring-gray-300";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style}`}>
      {value}
    </span>
  );
}

export function ScoreBadge({ value }) {
  if (value === null || value === undefined) return <span className="text-gray-400">—</span>;
  const color =
    value >= 80 ? "text-emerald-600" :
    value >= 65 ? "text-indigo-600" :
    value >= 50 ? "text-amber-600" :
    "text-rose-600";
  return <span className={`font-bold text-sm ${color}`}>{value}</span>;
}
