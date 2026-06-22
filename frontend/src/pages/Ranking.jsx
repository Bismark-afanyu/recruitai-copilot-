import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, STATUSES } from "../api.js";
import { Select } from "../components/ui/Form.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import Alert from "../components/ui/Alert.jsx";
import showToast from "../components/ui/Toast.jsx";
import {
  ChartBarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";

function getScoreColor(score) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-rose-600 dark:text-rose-400";
}

function getScoreBg(score) {
  if (score >= 80) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (score >= 60) return "bg-amber-100 dark:bg-amber-900/30";
  if (score >= 40) return "bg-orange-100 dark:bg-orange-900/30";
  return "bg-rose-100 dark:bg-rose-900/30";
}

function getRecommendationStyle(rec) {
  const styles = {
    strong_hire: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    hire: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    maybe: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    no_hire: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
  };
  return styles[rec] || styles.maybe;
}

export default function Ranking() {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listJobs()
      .then((res) => setJobs(Array.isArray(res) ? res : res.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.ranking(jobId || null)
      .then((res) => setRows(Array.isArray(res) ? res : res.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const changeStatus = async (id, status) => {
    try {
      await api.updateStatus(id, status);
      const res = await api.ranking(jobId || null);
      setRows(Array.isArray(res) ? res : res.items);
      showToast.success("Status updated");
    } catch (err) {
      setError(err.message);
      showToast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Candidate Ranking</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Final score = 60% CV match + 40% interview score. Ranking is a decision aid, not a decision.
        </p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Filter by Job"
            options={[{ value: "", label: "All Jobs" }, ...jobs.map((j) => ({ value: j.id, label: j.title }))]}
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" count={5} />
      ) : rows.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <EmptyState
            icon={<ChartBarIcon className="w-12 h-12" />}
            title="No candidates to rank yet"
            description="Upload CVs and run analysis to see candidates ranked here."
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Position
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    CV Score
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Interview
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Final Score
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Recommendation
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {rows.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold ${
                        i === 0 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                        i === 1 ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300" :
                        i === 2 ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" :
                        "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/candidates/${c.id}`}
                        className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{c.job_title}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold ${getScoreBg(c.cv_score)} ${getScoreColor(c.cv_score)}`}>
                        {c.cv_score ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold ${getScoreBg(c.interview_score)} ${getScoreColor(c.interview_score)}`}>
                        {c.interview_score ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{c.final_score ?? "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRecommendationStyle(c.report_recommendation || c.cv_recommendation)}`}>
                        {(c.report_recommendation || c.cv_recommendation)?.replace(/_/g, " ") || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={c.status}
                        onChange={(e) => changeStatus(c.id, e.target.value)}
                        className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {rows.length} candidate{rows.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
