import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import DataTable from "../components/ui/DataTable.jsx";
import Modal, { ConfirmModal } from "../components/ui/Modal.jsx";
import { Input, TextArea, Select } from "../components/ui/Form.jsx";
import Button from "../components/ui/Button.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import showToast from "../components/ui/Toast.jsx";
import DropdownMenu from "../components/ui/DropdownMenu.jsx";
import {
  BriefcaseIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
  UserGroupIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "draft", label: "Draft" },
];

const departmentOptions = [
  { value: "", label: "All Departments" },
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "Human Resources" },
];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, job: null });
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    salary: "",
    type: "full-time",
    description: "",
    requirements: "",
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await api.listJobs();
      setJobs(Array.isArray(res) ? res : res.items || []);
    } catch (e) {
      showToast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createJob(formData.description);
      showToast.success("Job created successfully!");
      setShowCreateModal(false);
      setFormData({ title: "", department: "", location: "", salary: "", type: "full-time", description: "", requirements: "" });
      loadJobs();
    } catch (err) {
      showToast.error(err.message);
    }
  };

  const handleDelete = async (job) => {
    try {
      await api.deleteJob(job.id);
      showToast.success("Job deleted successfully");
      loadJobs();
    } catch (err) {
      showToast.error(err.message);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter && job.status !== statusFilter) return false;
    if (departmentFilter && job.department !== departmentFilter) return false;
    return true;
  });

  const columns = [
    {
      key: "title",
      header: "Job Title",
      render: (job) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <BriefcaseIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{job.department || "General"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "candidates",
      header: "Candidates",
      render: (job) => (
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 dark:text-white">{job.candidate_count || 0}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (job) => {
        const status = job.status || "active";
        const colors = {
          active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
          closed: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
          draft: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
        };
        return (
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      key: "posted",
      header: "Posted",
      render: (job) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {job.created_at ? new Date(job.created_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your job postings and track applicants
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Post New Job
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={departmentOptions}
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredJobs}
        loading={loading}
        searchable
        searchPlaceholder="Search jobs..."
        emptyMessage="No jobs found"
        onRowClick={(job) => {
          setSelectedJob(job);
          setShowDetailModal(true);
        }}
        actions={(job) => (
          <DropdownMenu
            items={[
              { label: "View Details", icon: <EyeIcon className="w-4 h-4" />, onClick: () => { setSelectedJob(job); setShowDetailModal(true); } },
              { label: "Edit", icon: <PencilIcon className="w-4 h-4" />, onClick: () => showToast.info("Edit coming soon") },
              { divider: true },
              { label: "Delete", icon: <TrashIcon className="w-4 h-4" />, danger: true, onClick: () => setDeleteConfirm({ open: true, job }) },
            ]}
          />
        )}
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Post New Job" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Job Title"
            placeholder="e.g. Senior Frontend Developer"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              options={departmentOptions.slice(1)}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Select department"
            />
            <Input
              label="Location"
              placeholder="e.g. San Francisco, CA"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Salary Range"
              placeholder="e.g. $80,000 - $120,000"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            />
            <Select
              label="Job Type"
              options={[
                { value: "full-time", label: "Full-time" },
                { value: "part-time", label: "Part-time" },
                { value: "contract", label: "Contract" },
                { value: "internship", label: "Internship" },
              ]}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>
          <TextArea
            label="Job Description"
            placeholder="Paste the full job description here..."
            rows={8}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            hint="Minimum 30 characters. AI will extract requirements automatically."
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={formData.description.length < 30}>
              Post Job
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={selectedJob?.title} size="lg">
        {selectedJob && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedJob.department || "General"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedJob.location || "Remote"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <UserGroupIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Applicants</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedJob.candidate_count || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Posted</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            </div>

            {selectedJob.extracted?.required_skills?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.extracted.required_skills.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedJob.extracted?.preferred_skills?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Preferred Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.extracted.preferred_skills.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link to={`/candidates?job=${selectedJob.id}`}>
                <Button variant="secondary">
                  <UserGroupIcon className="w-4 h-4 mr-2" />
                  View Candidates
                </Button>
              </Link>
              <Link to="/upload">
                <Button>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Upload Resumes
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, job: null })}
        onConfirm={() => handleDelete(deleteConfirm.job)}
        title="Delete Job"
        message={`Are you sure you want to delete "${deleteConfirm.job?.title}"? This will also delete all associated candidates.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
