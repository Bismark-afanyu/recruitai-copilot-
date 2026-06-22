import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, STATUSES } from "../api.js";
import { Select } from "../components/ui/Form.jsx";
import Button from "../components/ui/Button.jsx";
import showToast from "../components/ui/Toast.jsx";
import {
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  EllipsisVerticalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

const STATUS_CONFIG = {
  New: { label: "PENDING", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-300", ring: "" },
  Shortlisted: { label: "IN REVIEW", bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-600 dark:text-purple-400", ring: "" },
  "Interview Scheduled": { label: "IN REVIEW", bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-600 dark:text-purple-400", ring: "" },
  Interviewed: { label: "SELECTED", bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-600 dark:text-green-400", ring: "" },
  Recommended: { label: "SELECTED", bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-600 dark:text-green-400", ring: "" },
  Hired: { label: "SELECTED", bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-600 dark:text-green-400", ring: "" },
  Rejected: { label: "REJECTED", bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-500 dark:text-red-400", ring: "" },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.New;
}

const DUMMY_CANDIDATES = [
  { id: "d1", name: "Annette Black", job_title: "Project Manager", status: "New", email: "annetteblack@gmail.com", phone: "(229) 555-0109", experience: 9, created_at: "2023-01-17", avatar: "https://i.pravatar.cc/150?img=1" },
  { id: "d2", name: "Fatima Nuhan", job_title: "Sr. Designer", status: "Shortlisted", email: "fatimanuhan@gmail.com", phone: "(229) 555-0109", experience: 9, created_at: "2023-01-17", avatar: "https://i.pravatar.cc/150?img=5" },
  { id: "d3", name: "Kristin Watson", job_title: "Graphic Designer", status: "Interviewed", email: "kristin_watson@gmail.com", phone: "(229) 555-0109", experience: 9, created_at: "2023-01-17", avatar: "https://i.pravatar.cc/150?img=9" },
  { id: "d4", name: "Makson Abbot", job_title: "Business Analyst", status: "Rejected", email: "makson_abbot@gmail.com", phone: "(229) 555-0109", experience: 9, created_at: "2023-01-17", avatar: "https://i.pravatar.cc/150?img=11" },
  { id: "d5", name: "Andrew Niles", job_title: "Business Analyst", status: "Interviewed", email: "andrewniles@gmail.com", phone: "(229) 555-0109", experience: 9, created_at: "2023-01-17", avatar: "https://i.pravatar.cc/150?img=12" },
  { id: "d6", name: "Alberta Hussein", job_title: "Project Manager", status: "New", email: "albertahussein@gmail.com", phone: "(229) 555-0109", experience: 9, created_at: "2023-01-17", avatar: "https://i.pravatar.cc/150?img=16" },
  { id: "d7", name: "Mark Wood", job_title: "Business Analyst", status: "Shortlisted", email: "markwood@gmail.com", phone: "(229) 555-0109", experience: 9, created_at: "2023-01-17", avatar: "https://i.pravatar.cc/150?img=14" },
  { id: "d8", name: "Kirgis Nuesn", job_title: "Graphic Designer", status: "Interviewed", email: "kirgisnuesn@gmail.com", phone: "(229) 555-0109", experience: 9, created_at: "2023-01-17", avatar: "https://i.pravatar.cc/150?img=18" },
  { id: "d9", name: "Fatima Nuhan", job_title: "Sr. Designer", status: "Rejected", email: "fatimanuhan@gmail.com", phone: "(229) 555-0109", experience: 9, created_at: "2023-01-17", avatar: "https://i.pravatar.cc/150?img=23" },
  { id: "d10", name: "Ameer Hussien", job_title: "Business Analyst", status: "Interviewed", email: "ameerhussien@gmail.com", phone: "(229) 555-0109", experience: 9, created_at: "2023-01-17", avatar: "https://i.pravatar.cc/150?img=33" },
  { id: "d11", name: "Sophia Carter", job_title: "UX Researcher", status: "New", email: "sophiacarter@gmail.com", phone: "(312) 555-0234", experience: 5, created_at: "2023-03-22", avatar: "https://i.pravatar.cc/150?img=25" },
  { id: "d12", name: "James Mitchell", job_title: "Backend Developer", status: "Recommended", email: "jamesmitchell@gmail.com", phone: "(415) 555-0312", experience: 7, created_at: "2023-02-10", avatar: "https://i.pravatar.cc/150?img=53" },
  { id: "d13", name: "Olivia Bennett", job_title: "Product Manager", status: "Shortlisted", email: "oliviabennett@gmail.com", phone: "(628) 555-0456", experience: 11, created_at: "2023-04-05", avatar: "https://i.pravatar.cc/150?img=45" },
  { id: "d14", name: "Liam Foster", job_title: "DevOps Engineer", status: "Hired", email: "liamfoster@gmail.com", phone: "(510) 555-0789", experience: 6, created_at: "2023-01-30", avatar: "https://i.pravatar.cc/150?img=57" },
  { id: "d15", name: "Emma Rodriguez", job_title: "Data Scientist", status: "Interview Scheduled", email: "emmarodriguez@gmail.com", phone: "(206) 555-0567", experience: 8, created_at: "2023-05-12", avatar: "https://i.pravatar.cc/150?img=44" },
];

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-purple-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-cyan-400 to-blue-500",
  "from-violet-400 to-indigo-500",
  "from-lime-400 to-green-500",
  "from-fuchsia-400 to-purple-500",
];

function CandidateCard({ candidate, index }) {
  const statusCfg = getStatusConfig(candidate.status);
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-md transition-all duration-200 group relative">
      <button className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
        <EllipsisVerticalIcon className="w-4 h-4" />
      </button>

      <div className="pt-5 pb-2 px-4 flex flex-col items-center text-center">
        {candidate.avatar ? (
          <img src={candidate.avatar} alt={candidate.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow mb-2" />
        ) : (
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg font-bold mb-2 ring-2 ring-white dark:ring-gray-800 shadow`}>
            {candidate.name?.charAt(0) || "?"}
          </div>
        )}

        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {candidate.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {candidate.job_title || "Candidate"}
        </p>

        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${statusCfg.bg} ${statusCfg.text} tracking-wide`}>
          {statusCfg.label}
        </span>
      </div>

      <div className="px-4 pb-2 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="truncate">{candidate.email || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <PhoneIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span>{candidate.phone || "—"}</span>
        </div>
      </div>

      <div className="mx-4 mb-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Experience</span>
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            {candidate.experience ? `${candidate.experience} Years` : "—"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Applied on</span>
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            {candidate.created_at
              ? new Date(candidate.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
              : "—"}
          </span>
        </div>
      </div>

      <div className="px-4 pb-3 flex gap-2">
        <button className="flex-1 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
          Notes
        </button>
        <Link
          to={`/candidates/${candidate.id}`}
          className="flex-1 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors text-center"
        >
          View
        </Link>
      </div>
    </div>
  );
}

export default function Candidates() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listJobs().then((res) => setJobs(Array.isArray(res) ? res : res.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.listCandidates(jobId || null, status || null)
      .then((res) => {
        const data = Array.isArray(res) ? res : res.items || [];
        setCandidates(data.length > 0 ? data : DUMMY_CANDIDATES);
      })
      .catch(() => setCandidates(DUMMY_CANDIDATES))
      .finally(() => {
        setTimeout(() => setLoading(false), 400);
      });
  }, [jobId, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Candidates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {candidates.length} Total candidates
          </p>
        </div>
        <Link to="/upload">
          <Button>
            <PlusIcon className="w-4 h-4 mr-1" />
            Add New Job
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            options={[{ value: "", label: "New" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-36"
          />
          <Select
            options={[{ value: "", label: "Position" }, ...jobs.map((j) => ({ value: j.id, label: j.title }))]}
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="w-44"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg transition-colors ${
              view === "grid"
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-lg transition-colors ${
              view === "list"
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1.5" />
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/50">
          <BriefcaseIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No candidates found</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {candidates.map((c, i) => (
            <CandidateCard key={c.id} candidate={c} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c, i) => {
            const statusCfg = getStatusConfig(c.status);
            return (
              <Link
                key={c.id}
                to={`/candidates/${c.id}`}
                className="flex items-center gap-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 hover:shadow-md transition-all group"
              >
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {c.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{c.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.job_title || "Candidate"}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                  {statusCfg.label}
                </span>
                <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <EnvelopeIcon className="w-4 h-4" />
                    <span className="truncate max-w-[180px]">{c.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{c.phone || "—"}</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {c.experience ? `${c.experience} Yrs` : "—"}
                </span>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
