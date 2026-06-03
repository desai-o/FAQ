function Topbar({ openModal }) {
  return (
    <header className="topbar">
      <div className="search-box">
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search questions, topics, contributors..."
        />
      </div>

      <div className="topbar-actions">
        <button className="notif-btn">🔔</button>

        <button className="ask-btn" onClick={openModal}>
          + Ask Question
        </button>

        <div className="avatar">Y</div>
      </div>
    </header>
  );
}

export default Topbar;