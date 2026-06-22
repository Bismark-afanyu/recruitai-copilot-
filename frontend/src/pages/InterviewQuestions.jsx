import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Select, TextArea } from "../components/ui/Form.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import showToast from "../components/ui/Toast.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import {
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const questionCategories = [
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "cultural", label: "Cultural Fit" },
  { value: "experience", label: "Experience" },
  { value: "problem-solving", label: "Problem Solving" },
];

export default function InterviewQuestions() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [questionCount, setQuestionCount] = useState(5);

  useEffect(() => {
    api.listJobs()
      .then((res) => setJobs(Array.isArray(res) ? res : res.items || []))
      .catch(() => {});
  }, []);

  const generateQuestions = async () => {
    if (!selectedJob) {
      showToast.error("Please select a job first");
      return;
    }
    setGenerating(true);
    try {
      const result = await api.generateQuestions(selectedJob, questionCount);
      setQuestions(result.questions || []);
      showToast.success(`Generated ${result.questions?.length || 0} questions`);
    } catch (err) {
      showToast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const addCustomQuestion = () => {
    if (!customQuestion.trim()) return;
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        question: customQuestion,
        category: "custom",
        isCustom: true,
      },
    ]);
    setCustomQuestion("");
    showToast.success("Question added");
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    showToast.success("Question removed");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast.success("Copied to clipboard");
  };

  const getCategoryIcon = (category) => {
    const icons = {
      technical: CodeBracketIcon,
      behavioral: ChatBubbleLeftRightIcon,
      cultural: AcademicCapIcon,
      experience: ClipboardDocumentCheckIcon,
      "problem-solving": SparklesIcon,
    };
    return icons[category] || ChatBubbleLeftRightIcon;
  };

  const getCategoryColor = (category) => {
    const colors = {
      technical: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      behavioral: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      cultural: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      experience: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
      "problem-solving": "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
      custom: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    };
    return colors[category] || colors.custom;
  };

  const filteredQuestions = activeCategory === "all"
    ? questions
    : questions.filter((q) => q.category === activeCategory);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Questions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Generate AI-powered interview questions tailored to each position
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generate Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Select Job"
            options={jobs.map((j) => ({ value: j.id, label: j.title }))}
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            placeholder="Choose a position"
          />
          <Select
            label="Number of Questions"
            options={[
              { value: 3, label: "3 Questions" },
              { value: 5, label: "5 Questions" },
              { value: 10, label: "10 Questions" },
              { value: 15, label: "15 Questions" },
            ]}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
          />
          <div className="flex items-end">
            <Button onClick={generateQuestions} disabled={generating || !selectedJob} loading={generating} className="w-full">
              <SparklesIcon className="w-4 h-4 mr-2" />
              {generating ? "Generating..." : "Generate Questions"}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Custom Question</h2>
        <div className="flex gap-3">
          <TextArea
            placeholder="Type your custom interview question..."
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button onClick={addCustomQuestion} disabled={!customQuestion.trim()}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Questions ({questions.length})
              </h2>
              <Button variant="secondary" size="sm" onClick={() => {
                const text = questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n\n");
                copyToClipboard(text);
              }}>
                <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
                Copy All
              </Button>
            </div>
          </div>

          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex gap-2 overflow-x-auto">
            {["all", ...new Set(questions.map((q) => q.category))].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
              </button>
            ))}
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {filteredQuestions.map((q, index) => {
              const Icon = getCategoryIcon(q.category);
              return (
                <div key={q.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{q.question}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(q.category)}`}>
                          {q.category?.charAt(0).toUpperCase() + q.category?.slice(1).replace("-", " ") || "Custom"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(q.question)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Copy"
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                      </button>
                      {q.isCustom && (
                        <button
                          onClick={() => removeQuestion(q.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                          title="Remove"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {questions.length === 0 && !generating && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <EmptyState
            icon={<SparklesIcon className="w-12 h-12" />}
            title="No questions yet"
            description="Select a job and generate AI-powered interview questions, or add your own custom questions."
          />
        </div>
      )}
    </div>
  );
}
