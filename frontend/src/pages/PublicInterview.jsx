import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import Button from "../components/ui/Button.jsx";

export default function PublicInterview() {
  const { token } = useParams();
  const [session, setSession] = useState(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fatal, setFatal] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    api.getPublicInterview(token)
      .then(setSession)
      .catch((e) => setFatal(e.message));
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.transcript?.length, busy]);

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      setSession(await api.startPublicInterview(token));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    setSession((s) => ({ ...s, transcript: [...s.transcript, { role: "candidate", text }] }));
    setInput("");
    try {
      setSession(await api.sendPublicInterviewMessage(token, text));
    } catch (err) {
      setError(err.message);
      setSession((s) => ({ ...s, transcript: s.transcript.slice(0, -1) }));
      setInput(text);
    } finally {
      setBusy(false);
    }
  };

  if (fatal) {
    return (
      <div className="min-h-screen flex items-start justify-center p-6 bg-gradient-to-br from-gray-950 via-indigo-950 to-indigo-900">
        <div className="w-full max-w-xl bg-white rounded-2xl p-8 shadow-2xl mt-12">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Interview unavailable</h1>
          <p className="text-sm text-gray-500">{fatal}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-start justify-center p-6 bg-gradient-to-br from-gray-950 via-indigo-950 to-indigo-900">
        <div className="w-full max-w-xl bg-white rounded-2xl p-8 shadow-2xl mt-12">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  const completed = session.status === "completed";

  return (
    <div className="min-h-screen flex items-start justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-950 via-indigo-950 to-indigo-900">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl mt-8 sm:mt-12 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Interview — {session.job_title}</h1>
          </div>
          <p className="text-sm text-gray-500">
            Hello {session.candidate_name}. This is a structured text interview conducted by an
            AI assistant on behalf of the hiring team. Your answers are recorded and reviewed by
            a human recruiter — no hiring decision is made by the AI.
          </p>
        </div>

        <div className="px-6 py-4">
          {session.status === "pending" ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-600 mb-4">
                The interview takes about 15–25 minutes (roughly 8–12 questions). Answer in your
                own words; you can take your time. Ready when you are.
              </p>
              <Button onClick={start} disabled={busy}>
                {busy ? "Starting…" : "Start interview"}
              </Button>
            </div>
          ) : (
            <>
              <div className="h-[55vh] overflow-y-auto space-y-3 pr-1 scrollbar-thin mb-3">
                {session.transcript.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.role === "interviewer" ? "chat-bubble-interviewer" : "chat-bubble-candidate"}`}>
                    <div className="text-[11px] font-bold text-gray-400 mb-0.5">
                      {m.role === "interviewer" ? "Interviewer" : "You"}
                    </div>
                    <div className="text-sm text-gray-800">{m.text}</div>
                  </div>
                ))}
                {busy && (
                  <div className="chat-bubble-interviewer">
                    <div className="text-[11px] font-bold text-gray-400 mb-0.5">Interviewer</div>
                    <div className="text-sm text-gray-400 animate-pulse">typing…</div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {error && (
                <div className="mb-3 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {completed ? (
                <div className="px-4 py-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 text-center">
                  ✅ The interview is complete. Thank you, {session.candidate_name}! The hiring
                  team will review your answers and contact you about the next steps.
                </div>
              ) : (
                <form className="flex gap-2 items-end" onSubmit={send}>
                  <textarea
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(e);
                      }
                    }}
                    placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
                    disabled={busy}
                    className="flex-1 block rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none"
                  />
                  <Button disabled={busy || !input.trim()}>Send</Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
