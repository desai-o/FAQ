function AskQuestionModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Ask a Question</h2>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <label>Title</label>
          <input
            className="modal-input"
            placeholder="What's your question?"
          />

          <label>Category</label>
          <select className="modal-input">
            <option>Artificial Intelligence</option>
            <option>Programming</option>
            <option>Career</option>
          </select>

          <label>Details</label>
          <textarea
            className="modal-input modal-textarea"
          />

          <label>Tags</label>
          <input
            className="modal-input"
            placeholder="#AI, #ML"
          />
        </div>

        <div className="modal-footer">
          <button
            className="modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button className="modal-submit">
            Post Question
          </button>
        </div>
      </div>
    </div>
  );
}

export default AskQuestionModal;