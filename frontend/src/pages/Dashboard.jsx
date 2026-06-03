import { useState } from "react";
import TrendingQuestions from "../components/TrendingQuestions";
import StatsGrid from "../components/StatsGrid";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AskQuestionModal from "../components/AskQuestionModal";

function Dashboard() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Sidebar />

      <div className="main-wrapper">
        <Topbar
          openModal={() => setShowModal(true)}
        />

        <main className="content">
          <section className="hero">
            <h1>
              Crowd-Sourced
              <br />
              <span className="hero-accent">
                Knowledge Hub
              </span>
            </h1>

            <p>
              Ask questions, discover answers,
              and learn from your community.
            </p>
          </section>

          <StatsGrid />

          <TrendingQuestions />

        </main>
      </div>

      <AskQuestionModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

export default Dashboard;