import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { Select } from "../components/ui/Form.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import showToast from "../components/ui/Toast.jsx";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function UploadCVs() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [results, setResults] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.listJobs()
      .then((res) => setJobs(Array.isArray(res) ? res : res.items || []))
      .catch(() => {});
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    if (droppedFiles.length === 0) {
      showToast.error("Only PDF files are allowed");
      return;
    }
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!selectedJob) {
      showToast.error("Please select a job first");
      return;
    }
    if (files.length === 0) {
      showToast.error("Please select at least one file");
      return;
    }

    setUploading(true);
    setResults(null);
    const progress = {};

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        progress[file.name] = 0;
        setUploadProgress({ ...progress });

        try {
          await api.uploadCV(selectedJob, file);
          progress[file.name] = 100;
        } catch (err) {
          progress[file.name] = -1;
        }
        setUploadProgress({ ...progress });
      }

      const successCount = Object.values(progress).filter((v) => v === 100).length;
      const failCount = Object.values(progress).filter((v) => v === -1).length;

      setResults({ success: successCount, failed: failCount, total: files.length });
      showToast.success(`Uploaded ${successCount} of ${files.length} files`);
      setFiles([]);
    } catch (err) {
      showToast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload CVs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload resumes for AI-powered analysis and scoring
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Job</h2>
        <Select
          label="Target Position"
          options={jobs.map((j) => ({ value: j.id, label: j.title }))}
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          placeholder="Choose a job to upload resumes for"
        />
      </div>

      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
            isDragging ? "bg-indigo-100 dark:bg-indigo-800" : "bg-gray-100 dark:bg-gray-700"
          }`}>
            <CloudArrowUpIcon className={`w-8 h-8 ${isDragging ? "text-indigo-600" : "text-gray-400"}`} />
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {isDragging ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            or click to browse from your computer
          </p>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Supports PDF files only
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Selected Files ({files.length})
            </h2>
            <Button
              onClick={uploadFiles}
              disabled={uploading || !selectedJob}
              loading={uploading}
            >
              {uploading ? "Uploading..." : "Upload All"}
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
              >
                <DocumentIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {uploading && (
                  <div className="w-24">
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          uploadProgress[file.name] === -1
                            ? "bg-rose-500"
                            : uploadProgress[file.name] === 100
                            ? "bg-emerald-500"
                            : "bg-indigo-500"
                        }`}
                        style={{ width: `${Math.abs(uploadProgress[file.name] || 0)}%` }}
                      />
                    </div>
                  </div>
                )}
                {!uploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Results</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <CheckCircleIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{results.success}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Successful</p>
            </div>
            <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
              <ExclamationCircleIcon className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{results.failed}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Link to="/candidates">
              <Button variant="secondary">
                <UserGroupIcon className="w-4 h-4 mr-2" />
                View Candidates
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
