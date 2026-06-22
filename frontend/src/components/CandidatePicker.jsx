import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";

export default function CandidatePicker({ onSelect }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidates, setCandidates] = useState([]);
  const selected = searchParams.get("candidate") || "";

  useEffect(() => {
    api.listCandidates().then((res) => {
      const list = Array.isArray(res) ? res : (res.items || []);
      setCandidates(list);
      if (selected) onSelect(Number(selected));
    }).catch(() => {});
  }, []);

  const change = (e) => {
    const value = e.target.value;
    setSearchParams(value ? { candidate: value } : {});
    onSelect(value ? Number(value) : null);
  };

  return (
    <div className="mb-6">
      <select
        value={selected}
        onChange={change}
        className="block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
      >
        <option value="">Select a candidate…</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} — {c.job_title}
          </option>
        ))}
      </select>
    </div>
  );
}
