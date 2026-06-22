import { useState } from "react";
import { api, downloadReportPdf, HUMAN_REVIEW_REMINDER } from "../api.js";
import CandidatePicker from "../components/CandidatePicker.jsx";
import { Input, TextArea } from "../components/ui/Form.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Alert from "../components/ui/Alert.jsx";
import showToast from "../components/ui/Toast.jsx";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

function StatBox({ label, value, suffix = "/100", color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400",
  };
  return (
    <div className={`rounded-2xl border p-5 text-center ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-70 mt-1">{suffix}</div>
      <div className="text-xs opacity-50 mt-2">{label}</div>
    </div>
  );
}

export default function Reports() {
  const [candidate, setCandidate] = useState(null);
  const [salaryRange, setSalaryRange] = useState("");
  const [hrNotes, setHrNotes] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const select = async (id) => {
    setError("");
    setCandidate(null);
    if (!id) return;
    try {
      const c = await api.getCandidate(id);
      setCandidate(c);
      setSalaryRange(c.final_report?.salary_range || "");
      setHrNotes(c.final_report?.hr_notes || "");
    } catch (err) {
      setError(err.message);
    }
  };

  const run = async (label, fn) => {
    setBusy(label);
    setError("");
    try {
      setCandidate(await fn());
      showToast.success(label === "generate" ? "Report generated successfully" : "Saved successfully");
    } catch (err) {
      setError(err.message);
      showToast.error(err.message);
    } finally {
      setBusy("");
    }
  };

  const report = candidate?.final_report;
  const content = report?.content || {};

  const getRecommendationStyle = (rec) => {
    const styles = {
      strong_hire: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      hire: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      maybe: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      no_hire: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    };
    return styles[rec] || styles.maybe;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Final Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Combine CV screening and interview evaluation into a comprehensive recruitment report
        </p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <CandidatePicker onSelect={select} />
      </div>

      {candidate ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{candidate.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.job_title}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={!!busy}
                  onClick={() => run("generate", () => api.generateReport(candidate.id))}
                  loading={busy === "generate"}
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  {busy === "generate" ? "Generating..." : report ? "Regenerate Report" : "Generate Report"}
                </Button>
                {report && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadReportPdf(candidate.id, candidate.name)}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                )}
              </div>
            </div>
          </div>

          {(!candidate.analysis || !candidate.evaluation) && (
            <Alert variant="warning">
              The final report requires a completed CV analysis and interview evaluation.
            </Alert>
          )}

          {report ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatBox label="CV Match Score" value={candidate.cv_score} color="indigo" />
                <StatBox label="Interview Score" value={candidate.interview_score} color="emerald" />
                <div className={`rounded-2xl border p-5 text-center ${getRecommendationStyle(report.recommendation)}`}>
                  <div className="text-xl font-bold capitalize">
                    {report.recommendation?.replace(/_/g, " ")}
                  </div>
                  <div className="text-xs opacity-70 mt-2">Hiring Recommendation</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Executive Summary</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {content.executive_summary}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {(content.strengths || []).map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <ArrowTrendingDownIcon className="w-4 h-4 text-rose-500" />
                      Weaknesses
                    </h3>
                    <ul className="space-y-2">
                      {(content.weaknesses || []).map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <ExclamationCircleIcon className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <ExclamationCircleIcon className="w-4 h-4 text-amber-500" />
                      Concerns
                    </h3>
                    <ul className="space-y-2">
                      {(content.concerns || []).map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <ExclamationCircleIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">HR Fields</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <Input
                    label="Suggested Salary Range"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g. 450,000 - 600,000 FCFA / month"
                  />
                  <div className="md:col-span-2">
                    <TextArea
                      label="Final HR Notes"
                      value={hrNotes}
                      onChange={(e) => setHrNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!!busy}
                    onClick={() => run("save", () => api.updateReport(candidate.id, { salary_range: salaryRange, hr_notes: hrNotes }))}
                    loading={busy === "save"}
                  >
                    {busy === "save" ? "Saving..." : "Save HR Fields"}
                  </Button>
                </div>
              </div>

              <Alert variant="info">
                {HUMAN_REVIEW_REMINDER}
              </Alert>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <EmptyState
                icon={<DocumentTextIcon className="w-12 h-12" />}
                title="No report generated yet"
                description="Click 'Generate Report' to create a comprehensive recruitment report for this candidate."
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <EmptyState
            icon={<DocumentTextIcon className="w-12 h-12" />}
            title="Select a candidate"
            description="Choose a candidate from the dropdown above to view or generate their final report."
          />
        </div>
      )}
    </div>
  );
}
