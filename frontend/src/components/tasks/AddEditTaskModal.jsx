import { useState, useEffect } from "react";
import Modal from "../ui/Modal.jsx";
import { Input, TextArea, Select } from "../ui/Form.jsx";
import Button from "../ui/Button.jsx";

const statusOptions = [
  { value: "Todo", label: "Todo" },
  { value: "In Progress", label: "In Progress" },
  { value: "Review", label: "Review" },
  { value: "Done", label: "Done" },
];

export default function AddEditTaskModal({ isOpen, onClose, task, initialStatus = "Todo", onSave }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Todo",
    assignee_name: "",
    related_job_id: "",
    related_candidate_id: "",
    due_at: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "Todo",
        assignee_name: task.assignee_name || "",
        related_job_id: task.related_job_id || "",
        related_candidate_id: task.related_candidate_id || "",
        due_at: task.due_at ? task.due_at.split("T")[0] : "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: initialStatus,
        assignee_name: "",
        related_job_id: "",
        related_candidate_id: "",
        due_at: "",
      });
    }
  }, [task, isOpen, initialStatus]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        due_at: formData.due_at ? new Date(formData.due_at).toISOString() : "",
      };
      await onSave(submitData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? "Edit Task" : "Create Task"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !formData.title.trim()} loading={saving}>
            {task ? "Save Changes" : "Create Task"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Task Title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter task title..."
          required
        />

        <TextArea
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Add a description..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
          />

          <Input
            label="Due Date"
            type="date"
            value={formData.due_at}
            onChange={(e) => handleChange("due_at", e.target.value)}
          />
        </div>

        <Input
          label="Assignee"
          value={formData.assignee_name}
          onChange={(e) => handleChange("assignee_name", e.target.value)}
          placeholder="Enter assignee name..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Related Job ID"
            value={formData.related_job_id}
            onChange={(e) => handleChange("related_job_id", e.target.value)}
            placeholder="Optional job ID..."
          />

          <Input
            label="Related Candidate ID"
            value={formData.related_candidate_id}
            onChange={(e) => handleChange("related_candidate_id", e.target.value)}
            placeholder="Optional candidate ID..."
          />
        </div>
      </form>
    </Modal>
  );
}
