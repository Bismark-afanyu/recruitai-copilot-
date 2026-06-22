import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, downloadReportPdf, STATUSES } from "../api.js";
import { MatchBadge, Score, StatusBadge } from "../components/Badges.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import LoadingSkeleton from "../components/ui/LoadingSkeleton.jsx";
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

const SCORE_LABELS = {
  required_skills_match: "Required skills match (30)",
  relevant_experience: "Relevant experience (25)",
  education_certifications: "Education & certifications (15)",
  achievements_projects: "Achievements & projects (15)",
  soft_skills_communication: "Soft skills & communication (10)",
  overall_role_fit: "Overall role fit (5)",
};

function AiInterviewCard({ candidate, run, busy }) {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const session = candidate.interview_session;
  const link = session ? `${window.location.origin}/interview/${session.token}` : null;
  const assessment = session?.ai_assessment;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const statusLabel = {
    pending: "Link created — waiting for the candidate",
    in_progress: "Interview in progress",
    completed: "Interview completed",
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-base font-semibold text-gray-900">AI-conducted interview</h2>
        <Button
          size="sm"
          variant="secondary"
          disabled={!!busy}
          onClick={() => {
            if (session && !confirm("Regenerating invalidates the current link and resets the interview. Continue?")) return;
            run("link", () => api.createInterviewLink(candidate.id).then(() => api.getCandidate(candidate.id)));
          }}
        >
          {busy === "link" ? "Generating…" : session ? "Regenerate link" : "Generate interview link"}
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        The assistant interviews the candidate through a private link (no login needed) and
        suggests a scorecard for your review. It never makes the hiring decision.
      </p>

      {session && (
        <div className="space-y-4">
          <StatusBadge status={session.status === "completed" ? "Recommended" : session.status === "in_progress" ? "Interview Scheduled" : session.status} />

          {session.status !== "completed" && (
            <div className="link-box">
              <code className="text-xs text-gray-600">{link}</code>
              <Button size="sm" variant="secondary" onClick={copy}>
                {copied ? "Copied ✓" : "Copy link"}
              </Button>
            </div>
          )}

          {session.expires_at && session.status !== "completed" && (
            <p className="text-xs text-gray-400">Link valid until {new Date(session.expires_at).toLocaleDateString()}.</p>
          )}

          {session.transcript?.length > 0 && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setShowTranscript(!showTranscript)}>
                {showTranscript ? "Hide transcript" : `View transcript (${session.transcript.length} messages)`}
              </Button>
              {showTranscript && (
                <div className="transcript-view">
                  {session.transcript.map((m, i) => (
                    <div key={i} className="transcript-line">
                      <div className="who">{m.role === "interviewer" ? "AI Interviewer" : candidate.name}</div>
                      <div className="text-sm text-gray-700">{m.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {session.status === "completed" && (
            assessment ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">AI-suggested scorecard (pending human review)</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{assessment.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Strengths observed</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                      {(assessment.strengths || []).map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Concerns to verify</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                      {(assessment.concerns || []).map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  The suggested ratings pre-fill the <Link to={`/evaluation?candidate=${candidate.id}`} className="font-medium">Interview Evaluation</Link> scorecard.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-2">The assessment hasn't been generated yet.</p>
                <Button size="sm" disabled={!!busy} onClick={() => run("assess", () => api.rerunAssessment(candidate.id))}>
                  {busy === "assess" ? "Assessing…" : "Generate AI assessment"}
                </Button>
              </div>
            )
          )}
        </div>
      )}
    </Card>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = () => api.getCandidate(id).then(setC).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]);

  const run = async (label, fn) => {
    setBusy(label);
    setError("");
    try {
      setC(await fn());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  if (error && !c) {
    return (
      <div className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
    );
  }
  if (!c) return <LoadingSkeleton count={3} />;

  const cv = c.parsed_cv || {};
  const analysis = c.analysis;
  const summary = analysis?.summary;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{c.name}</h1>
            <StatusBadge status={c.status} />
          </div>
          <p className="text-sm text-gray-500">
            {c.job_title} {c.email ? `· ${c.email}` : ""} {c.phone ? `· ${c.phone}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={c.status}
            onChange={(e) => run("status", () => api.updateStatus(c.id, e.target.value).then(() => api.getCandidate(id)))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      <div className="space-y-6">
        <AiInterviewCard candidate={c} run={run} busy={busy} />

        <Card>
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-base font-semibold text-gray-900">CV screening</h2>
            <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => run("analyze", () => api.analyze(c.id))}>
              {busy === "analyze" ? "Analyzing…" : analysis ? "Re-run analysis" : "Run AI analysis"}
            </Button>
          </div>

          {analysis ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900"><Score value={analysis.total_score} />/100</div>
                  <div className="text-xs text-gray-500 mt-1">CV match score</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{analysis.match_percentage}%</div>
                  <div className="text-xs text-gray-500 mt-1">Match percentage</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold"><MatchBadge value={analysis.recommendation} /></div>
                  <div className="text-xs text-gray-500 mt-1">Recommendation</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Score breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(SCORE_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-gray-50">
                        <span className="text-sm text-gray-600">{label}</span>
                        <span className="text-sm font-semibold text-gray-900">{analysis.scores?.[key] ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Key strengths</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                      {(analysis.key_strengths || []).map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Missing skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(analysis.missing_skills || []).length > 0 ? (
                        analysis.missing_skills.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">{s}</span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">None identified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Risk factors</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                      {(analysis.risk_factors || []).length > 0 ? (
                        analysis.risk_factors.map((s) => <li key={s}>{s}</li>)
                      ) : (
                        <span className="text-sm text-gray-400">None identified</span>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {summary && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Candidate summary</h3>
                  <p className="text-sm text-gray-600">{summary.overview}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Best matching experience:</span> {summary.best_matching_experience}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Top strengths</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                        {(summary.top_strengths || []).map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Possible concerns</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                        {(summary.possible_concerns || []).map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600"><span className="font-medium">Suggested next step:</span> {summary.suggested_next_step}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Not analyzed yet — run the AI analysis to score this CV against the job.</p>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Parsed CV</h2>
            <div className="space-y-4">
              {cv.skills?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cv.skills.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {cv.work_experience?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Work experience</h3>
                  <div className="space-y-3">
                    {cv.work_experience.map((w, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium text-gray-900">{w.title} — {w.company}</p>
                        <p className="text-xs text-gray-500">{w.period}</p>
                        {w.description && <p className="text-gray-600 mt-0.5">{w.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {cv.education?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Education</h3>
                  <div className="space-y-2">
                    {cv.education.map((e, i) => (
                      <p key={i} className="text-sm"><span className="font-medium text-gray-900">{e.degree}</span> — {e.institution} <span className="text-gray-500">({e.period})</span></p>
                    ))}
                  </div>
                </div>
              )}
              {cv.certifications?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Certifications</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                    {cv.certifications.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
              )}
              {cv.projects?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Projects</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                    {cv.projects.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
              )}
              {cv.achievements?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Achievements</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                    {cv.achievements.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
              )}
              {cv.languages?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cv.languages.map((x) => (
                      <span key={x} className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">{x}</span>
                    ))}
                  </div>
                </div>
              )}
              {cv.career_timeline?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Career timeline</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                    {cv.career_timeline.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
              )}
              {(!cv.skills && !cv.work_experience) && (
                <p className="text-sm text-gray-400">CV not yet parsed.</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Next steps</h2>
            <p className="text-sm text-gray-500 mb-4">Continue this candidate's process:</p>
            <div className="space-y-2">
              <Link to={`/questions?candidate=${c.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 flex-1">Interview questions</span>
                {c.has_questions && <span className="text-emerald-600 text-xs font-semibold">✓</span>}
              </Link>
              <Link to={`/evaluation?candidate=${c.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                <StarIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 flex-1">Interview evaluation</span>
                {c.interview_score !== null && <span className="text-emerald-600 text-xs font-semibold">✓ ({c.interview_score}/100)</span>}
              </Link>
              <Link to={`/reports?candidate=${c.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                <DocumentTextIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 flex-1">Final report</span>
                {c.has_report && <span className="text-emerald-600 text-xs font-semibold">✓</span>}
              </Link>
              {c.has_report && (
                <button
                  onClick={() => downloadReportPdf(c.id, c.name)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 transition-all group"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-medium text-indigo-700 flex-1">Export report as PDF</span>
                </button>
              )}
            </div>

            {c.evaluation && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Interview evaluation summary</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.evaluation.ai_summary}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
