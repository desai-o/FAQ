import { useEffect, useState } from "react";
import { fetchAdminOverview, fetchPendingQueries } from "../api/faqApi";

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [pendingQueries, setPendingQueries] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminData() {
      try {
        const overviewResponse = await fetchAdminOverview();
        const pendingResponse = await fetchPendingQueries();

        setOverview(overviewResponse.data);
        setPendingQueries(pendingResponse.data || []);
      } catch (err) {
        setError(err.message || "Failed to load admin data.");
      }
    }

    loadAdminData();
  }, []);

  return (
    <main className="page-content">
      <h1>Admin Console</h1>

      {error && <p className="error-text">{error}</p>}

      {overview && (
        <section className="stats-grid">
          <div className="stat-card">Users: {overview.users}</div>
          <div className="stat-card">FAQs: {overview.faqs}</div>
          <div className="stat-card">Queries: {overview.queries}</div>
          <div className="stat-card">Answers: {overview.answers}</div>
        </section>
      )}

      <section>
        <h2>Pending Queries</h2>

        {pendingQueries.map((query) => (
          <article key={query._id || query.id} className="question-card">
            <h3>{query.question}</h3>
            <p>{query.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
