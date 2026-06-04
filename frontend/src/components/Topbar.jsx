import { useFAQ } from "../context/FAQContext";
import { useNavigate } from "react-router-dom";

function Topbar({ openModal }) {
  const { searchQuery, setSearchQuery } = useFAQ();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      navigate("/questions");
    }
  };

  return (
    <header className="topbar">
      <div className="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Search questions, topics, contributors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      <div className="topbar-actions">
        <button className="notif-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span className="notif-dot"></span>
        </button>

        <button className="ask-btn" onClick={openModal}>
          + Ask Question
        </button>

        <div className="avatar">S</div>
      </div>
    </header>
  );
}

export default Topbar;