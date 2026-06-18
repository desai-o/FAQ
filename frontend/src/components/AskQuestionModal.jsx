import { useEffect, useState } from "react";
import { useFAQ } from "../context/FAQContext";

function AskQuestionModal({ open, onClose }) {
  const { addQuestion } = useFAQ();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Question title is required.");
      return;
    }

    if (!category) {
      setError("Please select a topic category.");
      return;
    }

    if (!description.trim()) {
      setError("Question details are required.");
      return;
    }

    try {
      await addQuestion(title, category, description, hashtags || "");
      setTitle("");
      setCategory("");
      setDescription("");
      setHashtags("");
      setError("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit question.");
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ask a Question</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ color: "var(--accent-red)", marginBottom: "16px", fontWeight: "600", fontSize: "14px" }}>
              ⚠️ {error}
            </div>
          )}

          <label>Title</label>
          <input
            className="modal-input"
            placeholder="What's your question?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label>Category</label>
          <select
            className="modal-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category</option>
            <option>Programming</option>
            <option>Artificial Intelligence</option>
            <option>Career</option>
            <option>Research</option>
            <option>Scholarships</option>
            <option>Mathematics</option>
          </select>

          <label>Details</label>
          <textarea
            className="modal-input modal-textarea"
            placeholder="Describe your question in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label>Hashtags</label>
          <input
            className="modal-input"
            placeholder="e.g. AI, machine-learning, python (comma-separated)"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-submit" onClick={handleSubmit}>Post Question</button>
        </div>
      </div>
    </div>
  );
}

export default AskQuestionModal;