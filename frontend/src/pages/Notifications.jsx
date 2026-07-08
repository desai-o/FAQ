import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AskQuestionModal from "../components/AskQuestionModal";
import NotificationCenter from "../components/notifications/NotificationCenter";

// Full-page notifications destination for the Profile → Recent Activity
// "View all" button. Reuses the existing NotificationCenter component
// (same component already shown in the Topbar dropdown) but renders it
// inside the standard Sidebar + Topbar layout used by every other page,
// so the user gets the complete activity feed on its own route.
function Notifications() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Sidebar />
      <div className="main-wrapper">
        <Topbar openModal={() => setShowModal(true)} />
        <main className="content">
          <h1 className="page-title">All Activity</h1>
          <p className="page-subtitle">
            Every mention, answer, follow, and bookmark tied to your account
          </p>
          <NotificationCenter onClose={null} />
        </main>
      </div>
      <AskQuestionModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

export default Notifications;