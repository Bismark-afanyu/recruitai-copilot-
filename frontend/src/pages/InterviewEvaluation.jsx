import { useState } from "react";
import { api } from "../api.js";
import CandidatePicker from "../components/CandidatePicker.jsx";
import { TextArea } from "../components/ui/Form.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Alert from "../components/ui/Alert.jsx";
import showToast from "../components/ui/Toast.jsx";
import {
  StarIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const CATEGORIES = [
  ["technical_skills", "Technical Skills", "Knowledge and application of relevant technical concepts"],
  ["problem_solving", "Problem Solving", "Ability to analyze and solve complex problems"],
  ["communication", "Communication", "Clarity and effectiveness in conveying ideas"],
  ["relevant_experience", "Relevant Experience", "Background and experience relevant to the role"],
  ["motivation", "Motivation", "Enthusiasm and drive for the position"],
  ["team_fit", "Team Fit", "Cultural alignment and collaboration potential"],
  ["leadership_potential", "Leadership Potential", "Ability to guide and inspire others"],
  ["overall_impression", "Overall Impression", "General assessment of the candidate"],
];

function StarRating({ value, onChange, disabled }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all duration-150 ${
            value >= n
              ? "bg-amber-400 text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function InterviewEvaluation() {
  const [candidate, setCandidate] = useState(null);
  const [ratings, setRatings] = useState({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const select = async (id) => {
    setError("");
    setCandidate(null);
    if (!id) return;
    try {
      const c = await api.getCandidate(id);
      setCandidate(c);
      setRatings(c.evaluation?.ratings || {});
      setNotes(c.evaluation?.interviewer_notes || "");
    } catch (err) {
      setError(err.message);
    }
  };

  const complete = CATEGORIES.every(([key]) => ratings[key] >= 1);
  const avgScore = Object.values(ratings).length > 0
    ? Math.round((Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length) * 20)
    : 0;

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      setCandidate(await api.submitEvaluation(candidate.id, ratings, notes));
      showToast.success("Evaluation saved successfully");
    } catch (err) {
      setError(err.message);
      showToast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
    if (score >= 60) return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
    return "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Evaluation</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Rate each category and let AI generate a comprehensive evaluation summary
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

      {candidate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scorecard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.name}</p>
            </div>

            <div className="p-6 space-y-4">
              {CATEGORIES.map(([key, label, description]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
                  </div>
                  <StarRating
                    value={ratings[key] || 0}
                    onChange={(v) => setRatings({ ...ratings, [key]: v })}
                    disabled={busy}
                  />
                </div>
              ))}
            </div>

            <div className="px-6 pb-6">
              <TextArea
                label="Interviewer Notes"
                placeholder="Observations from the interview (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="px-6 pb-6 flex items-center gap-3">
              <Button disabled={busy || !complete} onClick={submit} loading={busy}>
                <SparklesIcon className="w-4 h-4 mr-2" />
                {busy ? "Saving & Summarizing..." : "Save Evaluation"}
              </Button>
              {!complete && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Rate all categories to submit
                </span>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Result</h2>
            </div>

            <div className="p-6">
              {candidate.evaluation ? (
                <div className="space-y-6">
                  <div className={`rounded-2xl border p-6 text-center ${getScoreBg(candidate.evaluation.score)}`}>
                    <div className={`text-4xl font-bold ${getScoreColor(candidate.evaluation.score)}`}>
                      {candidate.evaluation.score}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">/ 100</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">Interview Score</div>
                  </div>

                  {candidate.evaluation.ai_summary && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-indigo-500" />
                        AI Evaluation Summary
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {candidate.evaluation.ai_summary}
                        </p>
                      </div>
                    </div>
                  )}

                  {candidate.evaluation.rating_breakdown && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Rating Breakdown
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(candidate.evaluation.rating_breakdown).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-40 capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${(value / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                              {value}/5
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={<StarIcon className="w-12 h-12" />}
                  title="No evaluation submitted yet"
                  description="Complete the scorecard and submit to see the AI-generated evaluation."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {!candidate && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <EmptyState
            icon={<CheckCircleIcon className="w-12 h-12" />}
            title="Select a candidate"
            description="Choose a candidate from the dropdown above to begin the interview evaluation process."
          />
        </div>
      )}
    </div>
  );
}
