import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import { getToken, setToken } from "./api.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Layout from "./components/Layout.jsx";
import PageTransition from "./components/ui/PageTransition.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Jobs from "./pages/Jobs.jsx";
import UploadCVs from "./pages/UploadCVs.jsx";
import Candidates from "./pages/Candidates.jsx";
import CandidateDetail from "./pages/CandidateDetail.jsx";
import InterviewQuestions from "./pages/InterviewQuestions.jsx";
import InterviewEvaluation from "./pages/InterviewEvaluation.jsx";
import Reports from "./pages/Reports.jsx";
import Ranking from "./pages/Ranking.jsx";
import Settings from "./pages/Settings.jsx";
import Tasks from "./pages/Tasks.jsx";
import PublicInterview from "./pages/PublicInterview.jsx";

const routeTitles = {
  "/": "Dashboard",
  "/jobs": "Job Descriptions",
  "/upload": "Upload CVs",
  "/candidates": "Candidate Analysis",
  "/questions": "Interview Questions",
  "/evaluation": "Interview Evaluation",
  "/reports": "Final Reports",
  "/ranking": "Candidate Ranking",
  "/settings": "Settings",
  "/tasks": "Tasks",
};

function AdminApp() {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const location = useLocation();

  useEffect(() => {
    const onLogout = () => setAuthed(false);
    window.addEventListener("recruitai:logout", onLogout);

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setToken(token);
      }
    });

    return () => {
      window.removeEventListener("recruitai:logout", onLogout);
      unsubscribe();
    };
  }, []);

  const logout = () => {
    setToken(null);
    setAuthed(false);
  };

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  const title = routeTitles[location.pathname] || "Dashboard";

  return (
    <Layout onLogout={logout} title={title}>
      <ErrorBoundary>
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/upload" element={<UploadCVs />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/questions" element={<InterviewQuestions />} />
            <Route path="/evaluation" element={<InterviewEvaluation />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ranking" element={<Ranking />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
      </ErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/interview/:token" element={<PublicInterview />} />
      <Route path="*" element={<AdminApp />} />
    </Routes>
  );
}
