import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AskQuestionModal from "../components/AskQuestionModal";
import Hashtag from "../components/Hashtag";
import { useFAQ } from "../context/FAQContext";
import { useAuth } from "../context/AuthContext";
import { deleteFaq, deleteQuery, updateAnswer, deleteAnswer, updateQuery, followResource, unfollowResource, muteFollow, fetchAnswers, fetchFaqTranslations, createFaqTranslation, createBounty, awardBounty, fetchBounties } from "../api/faqApi";
import ErrorToast from "../components/ErrorToast";

const defaultQuestion = {
  title: "Question Not Found",
  category: "General",
  description: "This question could not be found.",
  hashtags: [],
  votes: 0,
  voted: false,
  bookmarked: false,
  author: "Unknown",
  time: "N/A",
  views: 0,
  answers: [],
};

function QuestionDetail() {
  const { questions, upvoteQuestion, bookmarkQuestion, addAnswer, upvoteAnswer, loadingQuestions, refreshQuestions, deleteQuestion, restoreQuestion, removeAnswerLocally, restoreAnswerLocally, toggleAnonymity } = useFAQ();
  const { id } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [translations, setTranslations] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("original");
  const [translating, setTranslating] = useState(false);
  const [activeBounty, setActiveBounty] = useState(null);
  const [bountyAmount, setBountyAmount] = useState(50);
  const [showBountyForm, setShowBountyForm] = useState(false);
  const [bountyLoading, setBountyLoading] = useState(false);
  const [pendingQuestionDelete, setPendingQuestionDelete] = useState(null);
  const [pendingAnswerDelete, setPendingAnswerDelete] = useState(null);
  const [hasGoneBack, setHasGoneBack] = useState(false);

  const [isAnonymousReply, setIsAnonymousReply] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState({ type: "", id: "" });
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  const [followData, setFollowData] = useState({
    isFollowing: false,
    isMuted: false,
    followId: null
  });
  const [showFollowMenu, setShowFollowMenu] = useState(false);
  const followMenuRef = useRef(null);

  const { user } = useAuth();
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState([]);

  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editQuestionData, setEditQuestionData] = useState({
  title: "",
  description: "",
  category: "",
  hashtags: []
});

  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editAnswerContent, setEditAnswerContent] = useState("");

  const getQuestionId = (item) => String(item.id || item._id || item.mongo_id || "");
  const question = questions.find((item) => getQuestionId(item) === String(id)) || defaultQuestion;

  const [answersPagination, setAnswersPagination] = useState({ limit: 10, offset: 0, total: 0 });

  const loadAnswers = async (page = 0) => {
    try {
      const newOffset = page * answersPagination.limit;
      const res = await fetchAnswers(id, answersPagination.limit, newOffset);
      if (res.data) {
        const mapped = res.data.map((ans) => ({
          id: ans._id || ans.id,
          userId: ans.userId || ans.user_id,

          author: ans.author || ans.authorName || "Community Member",
          avatar: (ans.author || "C")[0].toUpperCase(),
          content: ans.content,
          createdAt: ans.createdAt,
          updatedAt: ans.updatedAt,
          votes: ans.votes || 0,
          time: ans.createdAt || ans.created_at || "Recently",
          isBest: Boolean(ans.isBest || ans.is_best)
        }));
        setAnswers(mapped);
        if (res.meta?.pagination) {
          setAnswersPagination(res.meta.pagination);
        } else if (res.pagination) {
          setAnswersPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to load answers from backend", err);
    }
  };

  const loadTranslations = async () => {
    try {
      const res = await fetchFaqTranslations(id);
      if (res && res.data) {
        setTranslations(res.data);
      }
    } catch (err) {
      console.error("Failed to load translations:", err);
    }
  };

  const loadBounties = async () => {
    try {
      const res = await fetchBounties();
      if (res && res.data) {
        const match = res.data.find(b => String(b.queryId || b.query_id) === String(id) && b.status === "open");
        setActiveBounty(match || null);
      }
    } catch (err) {
      console.error("Failed to load bounties:", err);
    }
  };

  const handleCreateBounty = async (e) => {
    e.preventDefault();
    setBountyLoading(true);
    try {
      await createBounty({
        queryId: id,
        amount: Number(bountyAmount),
        durationDays: 7
      });
      setShowBountyForm(false);
      await loadBounties();
      setError("");
    } catch (err) {
      console.error("Failed to create bounty:", err);
      setError(err.message || "Failed to create bounty. Note: You need enough reputation points.");
    } finally {
      setBountyLoading(false);
    }
  };

  const handleAwardBounty = async (answerId) => {
    if (!activeBounty) return;
    try {
      const bountyId = activeBounty.id || activeBounty._id;
      await awardBounty(bountyId, { answerId });
      setActiveBounty(null);
      await loadBounties();
      loadAnswers(0);
      setError("");
      alert("Bounty awarded successfully!");
    } catch (err) {
      console.error("Failed to award bounty:", err);
      setError(err.message || "Failed to award bounty.");
    }
  };

  const handleTranslateClick = async (lang) => {
    setTranslating(true);
    try {
      await createFaqTranslation(id, { language: lang });
      await loadTranslations();
      setSelectedLanguage(lang);
    } catch (err) {
      console.error("Translation error:", err);
      setError(err.message || "Failed to translate FAQ.");
    } finally {
      setTranslating(false);
    }
  };

useEffect(() => {
    if (loadingQuestions) return;

    if (id && id !== "test-id" && id !== "undefined") {
      loadAnswers(0);
      loadTranslations();
      loadBounties();
    } else if (question && question.answers) {
      setAnswers(question.answers);
    }
  }, [id, loadingQuestions]);

  // Scroll to top on navigation to different question
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Compute related questions from FAQContext
  const getRelatedQuestions = () => {
    if (!question || question === defaultQuestion) return [];

    // Filter out the current question
    const otherQuestions = questions.filter((q) => getQuestionId(q) !== String(id));

    const currentTags = question.hashtags || [];
    const currentTitleWords = (question.title || "").toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const scored = otherQuestions.map((q) => {
      let score = 0;

      // 1. Match category
      if (q.category === question.category) {
        score += 5;
      }

      // 2. Match tags
      const qTags = q.hashtags || [];
      const commonTags = qTags.filter((t) => currentTags.map(x => x.toLowerCase()).includes(t.toLowerCase()));
      score += commonTags.length * 3;

      // 3. Match title keywords
      const qTitleWords = (q.title || "").toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const commonWords = qTitleWords.filter((w) => currentTitleWords.includes(w));
      score += commonWords.length * 2;

      return { question: q, score };
    });

    // Sort by score descending, filter out scores <= 0, and take top 5
    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.question)
      .slice(0, 5);
  };

  const relatedQuestions = getRelatedQuestions();

  function canDelete(resource) {
    if (!user || !resource) return false;

    return (
      user.role === "admin" ||
      String(resource.userId || resource.user_id) === String(user.id)
    );
  }

  function canEdit(resource) {
  if (!user || !resource) return false;

  return (
    user.role === "admin" ||
    String(resource.userId || resource.user_id) === String(user.id)
  );
}

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (followMenuRef.current && !followMenuRef.current.contains(event.target)) {
        setShowFollowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFollowClick = async () => {
    if (!followData.isFollowing) {
      try {
        const res = await followResource("question", question.id);
        const followId = res.data?._id || res.data?.id || followData.followId;
        setFollowData({ isFollowing: true, isMuted: false, followId });
      } catch (err) {
        console.error("Failed to follow", err);
        setError(err.message || "Failed to follow.");
      }
    } else {
      setShowFollowMenu(!showFollowMenu);
    }
  };

  const handleUnfollow = async () => {
    try {
      if (followData.followId) {
        await unfollowResource(followData.followId);
      }
      setFollowData({ isFollowing: false, isMuted: false, followId: null });
      setShowFollowMenu(false);
    } catch (err) {
      console.error("Failed to unfollow", err);
      setError(err.message || "Failed to unfollow.");
    }
  };

  const handleMuteToggle = async () => {
    try {
      if (followData.followId) {
        await muteFollow(followData.followId, !followData.isMuted);
      }
      setFollowData(prev => ({ ...prev, isMuted: !prev.isMuted }));
      setShowFollowMenu(false);
    } catch (err) {
      console.error("Failed to toggle mute", err);
      setError(err.message || "Failed to toggle mute.");
    }
  };

  const toggleQVote = () => {
    if (question.id) upvoteQuestion(question.id);
  };

  const toggleBookmark = () => {
    if (question.id) bookmarkQuestion(question.id);
  };

  const toggleAnswerVote = (answerId) => {
    if (question.id) upvoteAnswer(question.id, answerId);
  };

const handleSubmitReply = async () => {
    if (replyText.trim() && question.id) {
      try {
        const newAnswer = await addAnswer(question.id, replyText, question.sourceType || "faq", isAnonymousReply);
        if (newAnswer) {
          setAnswers((prev) => [newAnswer, ...prev]);
        }
        setReplyText("");
        setIsAnonymousReply(false);
        setError("");
      } catch (err) {
        console.error("Failed to submit answer:", err);
        setError(err.message || "Failed to post your answer.");
      }
    }
  };

  const handleReportSubmit = async () => {
    if (!user) {
      setReportError("You must be logged in to report.");
      return;
    }
    setReportLoading(true);
    setReportError("");
    try {
      // Inline fetch for now, or assume we have a faqApi method
      // We will define it in faqApi.js shortly.
      const { submitReport } = await import("../api/faqApi");
      await submitReport({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason,
        details: reportDetails
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportReason("spam");
        setReportDetails("");
      }, 2000);
    } catch (err) {
      setReportError(err.message || "Failed to submit report. Please try again later.");
    } finally {
      setReportLoading(false);
    }
  };

  const generateSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError("");
      setSummary("");

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

      const response = await fetch(`${apiBaseUrl}/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: question.title || question.question,
          answers: (answers || []).map((a) => a.content)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate summary: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data.data?.summary || data.summary);
    } catch (err) {
      console.error(err);
      setSummaryError(err.message || "Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  if (pendingQuestionDelete) {
  return (
    <>
      <Sidebar />
      <div className="main-wrapper">
        <Topbar openModal={() => setShowModal(true)} />

        <main className="content">
          <div
            style={{
              padding: "40px",
              textAlign: "center"
            }}
          >
            <h2>Question deleted</h2>

            <p>
              This question will be permanently deleted in{" "}
              {pendingQuestionDelete.countdown} seconds.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginTop: "20px"
              }}
            >
              <button
                className="bookmark-btn"
                onClick={() => {
                  clearTimeout(pendingQuestionDelete.timeoutId);
                  clearInterval(pendingQuestionDelete.intervalId);
                  restoreQuestion(pendingQuestionDelete.question);
                  setPendingQuestionDelete(null);
                }}
              >
                Undo
              </button>
              <button
                className="bookmark-btn"
                onClick={() => {
                  setHasGoneBack(true);
                  window.history.back();
                }}
              >
                Go Back to questions
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

  return (
    <>
      <Sidebar />
      <div className="main-wrapper">
        <Topbar openModal={() => setShowModal(true)} />
        <main className="content">
          <ErrorToast message={error} onClose={() => setError("")} />
          <Link to="/questions" className="back-link">← Back to Questions</Link>

          <div className="detail-grid">
            <div className="detail-main">
              <div className="detail-card">
                <div className="detail-top">
                  <div className="vote-col">
                    <button className={`upvote ${question.voted ? "upvoted" : ""}`} onClick={toggleQVote}>▲</button>
                    <span className="vote-count">{question.votes}</span>
                  </div>

                  <div className="detail-body">
                    <div className="translation-controls" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontSize: "13px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Language:</span>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          backgroundColor: "var(--surface-secondary, #2d2d2d)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border)",
                          outline: "none"
                        }}
                      >
                        <option value="original">Original (English)</option>
                        <option value="spanish">Spanish</option>
                        <option value="french">French</option>
                        <option value="german">German</option>
                        <option value="chinese">Chinese</option>
                        <option value="japanese">Japanese</option>
                        <option value="hindi">Hindi</option>
                      </select>

                      {selectedLanguage !== "original" && !translations.some(t => t.language.toLowerCase() === selectedLanguage.toLowerCase()) && (
                        <button
                          onClick={() => handleTranslateClick(selectedLanguage)}
                          disabled={translating}
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            backgroundColor: "#0d9488",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "600"
                          }}
                        >
                          {translating ? "Translating..." : "✨ AI Translate"}
                        </button>
                      )}
                    </div>

                    {activeBounty ? (
                      <div style={{
                        margin: "12px 0 16px",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        color: "#f59e0b",
                        fontSize: "13.5px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span>💰 <strong>Active Bounty:</strong> Earn <strong>{activeBounty.amount} reputation points</strong> for answering this question!</span>
                        <span style={{ fontSize: "11px", opacity: 0.8 }}>
                          Expires: {new Date(activeBounty.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      user && (
                        <div style={{ margin: "12px 0 16px" }}>
                          {!showBountyForm ? (
                            <button
                              onClick={() => setShowBountyForm(true)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                borderRadius: "6px",
                                backgroundColor: "transparent",
                                border: "1px dashed var(--border)",
                                color: "var(--text-secondary)",
                                cursor: "pointer"
                              }}
                            >
                              + Sponsor Bounty
                            </button>
                          ) : (
                            <form onSubmit={handleCreateBounty} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--surface-secondary)" }}>
                              <span style={{ fontSize: "12.5px" }}>Reputation Points:</span>
                              <input
                                type="number"
                                min="10"
                                step="10"
                                value={bountyAmount}
                                onChange={(e) => setBountyAmount(e.target.value)}
                                style={{
                                  width: "70px",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid var(--border)",
                                  backgroundColor: "var(--bg-color)",
                                  color: "var(--text-primary)"
                                }}
                                required
                              />
                              <button
                                type="submit"
                                disabled={bountyLoading}
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "12px",
                                  borderRadius: "4px",
                                  backgroundColor: "#f59e0b",
                                  color: "#fff",
                                  border: "none",
                                  cursor: "pointer",
                                  fontWeight: "600"
                                }}
                              >
                                {bountyLoading ? "Creating..." : "Post Bounty"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowBountyForm(false)}
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "12px",
                                  borderRadius: "4px",
                                  backgroundColor: "transparent",
                                  color: "var(--text-secondary)",
                                  border: "none",
                                  cursor: "pointer"
                                }}
                              >
                                Cancel
                              </button>
                            </form>
                          )}
                        </div>
                      )
                    )}                

                {isEditingQuestion ? (
                  <>
                    <input
                      type="text"
                      value={editQuestionData.title}
                      onChange={(e) =>
                        setEditQuestionData({
                         ...editQuestionData,
                         title: e.target.value
                        })
                      }
                      className="detail-title-input"
                      style={{
                        width: "100%",
                        fontSize: "2rem",
                        fontWeight: "700",
                        padding: "10px",
                        marginBottom: "12px"
                      }}
                    />
                    <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                      <button
                        className="bookmark-btn"
                        onClick={async () => {
                          try {
                            await updateQuery(question.id, {
                              question: editQuestionData.title,
                              description: editQuestionData.description,
                              category: editQuestionData.category,
                              tags: editQuestionData.hashtags
                            });
                            await refreshQuestions();
                            setIsEditingQuestion(false);
                          } catch (err) {
                            console.error(err);
                            alert("Failed to update question");
                          }
                        }}
                      >
                      Save
                      </button>

                      <button
                        className="bookmark-btn"
                        onClick={() => {
                          setIsEditingQuestion(false);
                        }}
                      >
                      Cancel
                      </button>
                    </div>
                  </>
                  ) : (
                    <h1 className="detail-title">
                      {selectedLanguage !== "original" &&
                      translations.find(
                        (t) =>
                          t.language.toLowerCase() === selectedLanguage.toLowerCase()
                      )
                        ? translations.find(
                          (t) =>
                            t.language.toLowerCase() === selectedLanguage.toLowerCase()
                        ).question
                        : question.title}
                    </h1>
                  )}

                <button
                  onClick={generateSummary}
                  style={{
                    marginTop: "12px",
                    marginBottom: "12px",
                    padding: "8px 14px",
                    cursor: "pointer"
                  }}
                >
                  ✨ Generate TL;DR
                </button>

                    {summaryLoading && <p style={{ color: "#aaa", marginBottom: "12px" }}>Generating summary...</p>}
                    {summaryError && <p role="alert" style={{ color: "#f87171", marginBottom: "12px" }}>{summaryError}</p>}

                {summary && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "12px",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      background: "#1e1e1e",
                      color: "#eee"
                    }}
                  >
                    <strong>AI Summary</strong>
                    <p style={{ marginTop: "6px", fontSize: "14px", lineHeight: "1.5" }}>{summary}</p>
                  </div>
                )}



                    {selectedLanguage !== "original" && translations.find(t => t.language.toLowerCase() === selectedLanguage.toLowerCase()) ? (
                      <div style={{
                        margin: "16px 0",
                        padding: "16px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(13, 148, 136, 0.08)",
                        border: "1px solid rgba(13, 148, 136, 0.2)",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
                      }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#0d9488", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span className="chat-pulse-dot" style={{ display: "inline-block" }}></span>
                          Translated Content ({translations.find(t => t.language.toLowerCase() === selectedLanguage.toLowerCase()).translationProvenance || "AI"})
                        </div>
                        <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "var(--text-primary)" }}>
                          {translations.find(t => t.language.toLowerCase() === selectedLanguage.toLowerCase()).answer}
                        </p>
                      </div>
                    ) : (
                  isEditingQuestion ? (
                    <>
                    <select
                    value={editQuestionData.category}
                    onChange={(e) =>
                      setEditQuestionData({
                        ...editQuestionData,
                        category: e.target.value
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginTop: "12px",
                      marginBottom: "12px",
                      borderRadius: "8px"
                      }}
                      >
                      <option value="">Select a category</option>
                      <option>Programming</option>
                      <option>Artificial Intelligence</option>
                      <option>Career</option>
                      <option>Research</option>
                      <option>Scholarships</option>
                      <option>Mathematics</option>
                      </select>

                      <input
                         type="text"
                         value={editQuestionData.hashtags.join(", ")}
                         onChange={(e) =>
                           setEditQuestionData({
                             ...editQuestionData,
                             hashtags: e.target.value
                               .split(",")
                               .map(tag => tag.trim())
                               .filter(tag => tag)
                           })
                         }
                         placeholder="e.g. AI, machine-learning, python"
                         style={{
                           width: "100%",
                           padding: "12px",
                           marginTop: "12px",
                           marginBottom: "12px",
                           borderRadius: "8px"
                         }}
                       />

                    <textarea
                     value={editQuestionData.description}
                     onChange={(e) =>
                       setEditQuestionData({
                         ...editQuestionData,
                         description: e.target.value
                      })
                     }
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginTop: "12px",
                      marginBottom: "12px",
                      borderRadius: "8px"
                     }}
                  />
                  </>
                  ) : (
                        <p className="detail-description">{question.description}</p>
                      )
                )}

                    <div className="detail-hashtags">
                      {question.hashtags.map((tag) => (
                        <Hashtag key={tag} tag={tag} />
                      ))}
                    </div>

                    <div className="detail-meta">
                      <span>Asked by <strong>{question.author}</strong></span>
                      {question.updatedAt &&
                        question.createdAt &&
                        question.updatedAt !== question.createdAt && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#888",
                              fontStyle: "italic"
                          }}
                      >
                          Edited
                        </span>
                      )}
                      <span>{question.time}</span>
                      <span>👁 {question.views} views</span>
                      <button
                        className={`bookmark-btn ${question.bookmarked ? "bookmarked" : ""}`}
                        onClick={toggleBookmark}
                      >
                        {question.bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
                      </button>

                  {canEdit(question) && (
                    <button
                      className="bookmark-btn edit-button"
                      onClick={()=> {
                        setEditQuestionData({
                          title: question.title || "",
                          description: question.description || "",
                          category: question.category || "",
                          hashtags: question.hashtags || []
                      });

                      setIsEditingQuestion(true);
                    }}
                      >
                     ✎ Edit
                    </button>
                  )}

                      {canDelete(question) && (
                        <button
                          className="bookmark-btn danger-button"
                          onClick={async () => {
                            const confirmed = window.confirm(
                              "Are you sure you want to delete this question?"
                            );
                            if (!confirmed) return;
                           const deletedQuestion = question;
                           deleteQuestion(question.id);
                           let countdown = 10;
                           const intervalId = setInterval(() => {
                             countdown--;
                           setPendingQuestionDelete(prev => {
                             if (!prev) return null;
                             return {
                               ...prev,
                               countdown
                             };
                           });
                         }, 1000);
                         const timeoutId = setTimeout(async () => {
                           clearInterval(intervalId);
                           try {
                             await deleteQuery(deletedQuestion.id);
                             await refreshQuestions();
                             setPendingQuestionDelete(null);
                             if (!hasGoneBack) {
                              window.history.back();}
                           } catch (err) {
                             setError(err.message || "Failed to delete question.");
                           }
                         }, 10000);
                         setPendingQuestionDelete({
                           question: deletedQuestion,
                           countdown: 10,
                           timeoutId,
                           intervalId
                         });
                       }}
                      >
                        🗑 Delete
                      </button>
                  )}

                      <div style={{ position: "relative" }} ref={followMenuRef}>
                        <button
                          className={`bookmark-btn ${followData.isFollowing ? "bookmarked" : ""}`}
                          onClick={handleFollowClick}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          {followData.isFollowing ? (
                            followData.isMuted ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                                Muted
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                Following
                              </>
                            )
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                              Follow
                            </>
                          )}
                        </button>
                        {showFollowMenu && (
                          <div style={{
                            position: "absolute", top: "100%", right: 0, marginTop: "4px",
                            background: "#fff", border: "1px solid #e5e5e5", borderRadius: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, width: "160px",
                            display: "flex", flexDirection: "column", padding: "4px 0"
                          }}>
                            <button
                              onClick={handleMuteToggle}
                              style={{
                                background: "none", border: "none", width: "100%", textAlign: "left",
                                padding: "8px 12px", fontSize: "13px", cursor: "pointer", color: "#1a1a1a"
                              }}
                              onMouseOver={e => e.currentTarget.style.background = "#f5f5f5"}
                              onMouseOut={e => e.currentTarget.style.background = "none"}
                            >
                              {followData.isMuted ? "Unmute notifications" : "Mute notifications"}
                            </button>
                            <button
                              onClick={handleUnfollow}
                              style={{
                                background: "none", border: "none", width: "100%", textAlign: "left",
                                padding: "8px 12px", fontSize: "13px", cursor: "pointer", color: "#ef4444"
                              }}
                              onMouseOver={e => e.currentTarget.style.background = "#f5f5f5"}
                              onMouseOut={e => e.currentTarget.style.background = "none"}
                            >
                              Unfollow
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {pendingAnswerDelete && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span>
                    Answer deleted. Undo available for{" "}
                    {pendingAnswerDelete.countdown} seconds.
                  </span>

                  <button
                    className="bookmark-btn"
                    onClick={() => {
                      clearTimeout(pendingAnswerDelete.timeoutId);
                      clearInterval(pendingAnswerDelete.intervalId);

                      setAnswers((prev) => [
                        pendingAnswerDelete.answer,
                        ...prev
                      ]);
                      restoreAnswerLocally(
                        question.id,
                        pendingAnswerDelete.answer
                      );
                      setPendingAnswerDelete(null);
                    }}
                  >
                    Undo
                  </button>
                </div>
              )}

              <section className="answers-section">
                <h2 className="answers-heading">
                  {answers ? answers.length : 0} {answers && answers.length === 1 ? "Answer" : "Answers"}
                </h2>

                {answers && answers.map((answer) => (
                  <div key={answer.id} className={`answer-card ${answer.isBest ? "best-answer" : ""}`}>
                    <div className="vote-col">
                      <button
                        className={`upvote ${answer.voted ? "upvoted" : ""}`}
                        onClick={() => toggleAnswerVote(answer.id)}
                      >
                        ▲
                      </button>
                      <span className="vote-count">{answer.votes}</span>
                    </div>

                <div className="answer-body">
                  {answer.isBest && (
                    <span className="best-badge">✓ Best Answer</span>
                  )}
                  {editingAnswerId === answer.id ? (
                    <>
                    <textarea
                      value={editAnswerContent}
                      onChange={(e) => setEditAnswerContent(e.target.value)}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px"
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "10px"
                      }}
                    >
                      <button
                        className="bookmark-btn"
                        onClick={async () => {
                          if (!editAnswerContent.trim()) {
                            setError("Answer cannot be empty.");
                            return;
                          }
                          try {
                            await updateAnswer(answer.id, {
                            content: editAnswerContent
                          });
                          setAnswers((prev) =>
                            prev.map((a) =>
                              String(a.id) === String(answer.id)
                                ? { ...a, content: editAnswerContent, updatedAt: new Date().toISOString() }
                                : a
                             )
                            );
                            setEditingAnswerId(null);
                          } catch (err) {
                            setError(err.message || "Failed to update answer.");
                          }
                        }}
                      >
                        Save
                      </button>

                      <button
                        className="bookmark-btn"
                        onClick={() => {
                          setEditingAnswerId(null);
                          setEditAnswerContent("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                 ) : (
                    <p className="answer-text">{answer.content}</p>
                  )}
                  <div className="answer-meta">
                    <div className="answer-author">
                      <div className="avatar small">{answer.avatar}</div>
                      <strong>{answer.author}</strong>
                      {answer.authorId && question.authorId && String(answer.authorId) === String(question.authorId) && (
                        <span style={{ 
                          marginLeft: "6px", 
                          fontSize: "10px", 
                          fontWeight: "bold", 
                          backgroundColor: "var(--primary-color, #3b82f6)", 
                          color: "white", 
                          padding: "2px 6px", 
                          borderRadius: "4px" 
                        }}>
                          OP
                        </span>
                      )}
                    </div> 
                    <div
                        style={{
                          marginLeft: "auto",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px"
                        }}
                      >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        {answer.updatedAt &&
                        answer.createdAt &&
                        answer.updatedAt !== answer.createdAt && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#888",
                             fontStyle: "italic"
                        }}
                      >
                        Edited
                      </span>
                       )}
                         <span className="answer-time">{answer.time}</span>
                      </div>
                      <button
                        onClick={() => {
                          setReportTarget({ type: "answer", id: answer.id });
                          setShowReportModal(true);
                        }}
                        style={{
                          background: "none",
                          marginLeft: "auto",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          backgroundColor: "transparent",
                          color: "#f87171",
                          border: "1px dashed rgba(248, 113, 113, 0.4)",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "12px"
                        }}
                      >
                        🚩 Report
                      </button>
                      {canEdit(answer) && (
                        <button
                          onClick={() => {
                            toggleAnonymity("answer", answer.id);
                          }}
                          style={{
                            background: "none",
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "4px 8px",
                            borderRadius: "4px"
                          }}
                        >
                          {answer.isAnonymous ? "👁️ De-anonymize" : "🕵️ Anonymize"}
                        </button>
                      )}
                      {canEdit(answer) && (
                        <button
                          className="bookmark-btn"
                          onClick={() => {
                            setEditingAnswerId(answer.id);
                            setEditAnswerContent(answer.content);
                          }}
                      >
                        ✎ Edit
                      </button>
                    )}
                    {canDelete(answer) && (
                      <button
                        className="bookmark-btn danger-button"
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Are you sure you want to delete this answer?"
                          );

                          if (!confirmed) return;

                          const deletedAnswer = answer;

                          setAnswers((prev) =>
                            prev.filter((item) => String(item.id) !== String(answer.id))
                          );
                          removeAnswerLocally(question.id, answer.id);
                          let countdown = 10;

                          const intervalId = setInterval(() => {
                            countdown--;

                            setPendingAnswerDelete((prev) => {
                              if (!prev) return null;

                              return {
                                ...prev,
                                countdown
                              };
                            });
                          }, 1000);

                          const timeoutId = setTimeout(async () => {
                            clearInterval(intervalId);

                            try {
                              await deleteAnswer(deletedAnswer.id);
                              setPendingAnswerDelete(null);
                              await loadAnswers(0);
                            } catch (err) {
                              setError(err.message || "Failed to delete answer.");
                            }
                          }, 10000);

                          setPendingAnswerDelete({
                            answer: deletedAnswer,
                            countdown: 10,
                            timeoutId,
                            intervalId
                          });
                        }}
                      >
                        🗑 Delete
                      </button>
                    )}
                    </div>
                    {activeBounty && (String(activeBounty.createdBy) === String(user?.id) || user?.role === "admin") && (
                      <button
                        onClick={() => handleAwardBounty(answer.id)}
                        className="bounty-award-btn"
                        style={{
                          marginLeft: canDelete(answer) ? "10px" : "auto",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          backgroundColor: "#f59e0b",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "12px"
                        }}
                      >
                        🏆 Award Bounty ({activeBounty.amount} pts)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {answersPagination.total > answersPagination.limit && (
              <div className="pagination-controls" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "15px", marginBottom: "15px" }}>
                <button
                  disabled={answersPagination.offset === 0}
                  onClick={() => loadAnswers(Math.floor(answersPagination.offset / answersPagination.limit) - 1)}
                  className="pagination-btn btn-secondary"
                  style={{ padding: "6px 12px", cursor: answersPagination.offset === 0 ? "not-allowed" : "pointer" }}
                >
                  Previous
                </button>
                <span className="pagination-info" style={{ color: "#eee" }}>
                  Page {Math.floor(answersPagination.offset / answersPagination.limit) + 1} of {Math.ceil(answersPagination.total / answersPagination.limit)}
                </span>
                <button
                  disabled={answersPagination.offset + answersPagination.limit >= answersPagination.total}
                  onClick={() => loadAnswers(Math.floor(answersPagination.offset / answersPagination.limit) + 1)}
                  className="pagination-btn btn-secondary"
                  style={{ padding: "6px 12px", cursor: (answersPagination.offset + answersPagination.limit >= answersPagination.total) ? "not-allowed" : "pointer" }}
                >
                  Next
                </button>
              </div>
            )}
          </section>

              <section className="reply-section">
                <h2 className="answers-heading">Your Answer</h2>
                <textarea
                  className="reply-textarea"
                  placeholder="Write your answer here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="anon-reply-checkbox"
                      checked={isAnonymousReply}
                      onChange={(e) => setIsAnonymousReply(e.target.checked)}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <label htmlFor="anon-reply-checkbox" style={{ fontSize: "14px", cursor: "pointer", color: "var(--text-primary)", userSelect: "none" }}>
                      Answer anonymously
                    </label>
                  </div>
                  <button className="reply-submit" onClick={handleSubmitReply} style={{ margin: 0 }}>Post Your Answer</button>
                </div>
              </section>
            </div>

            <aside className="detail-sidebar">
              <div className="related-widget">
                <h4 className="widget-title">Related Questions</h4>
                {relatedQuestions.length === 0 ? (
                  <div className="related-empty">No related questions found.</div>
                ) : (
                  <div className="related-list">
                    {relatedQuestions.map((q) => (
                      <div key={getQuestionId(q)} className="related-item">
                        <span className="related-item-category">{q.category}</span>
                        <h5 className="related-item-title">
                          <Link to={`/questions/${getQuestionId(q)}`}>{q.title}</Link>
                        </h5>
                        <div className="related-item-meta">
                          <span>▲ {q.votes} votes</span>
                          <span>💬 {q.answers ? q.answers.length : 0} answers</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
      <AskQuestionModal open={showModal} onClose={() => setShowModal(false)} />

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay active" onClick={() => !reportLoading && setShowReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Report {reportTarget.type === "question" ? "Question" : "Answer"}</h2>
              <button className="modal-close" onClick={() => !reportLoading && setShowReportModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {reportSuccess ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#10b981" }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>✅</div>
                  <h3 style={{ margin: 0 }}>Report Submitted</h3>
                  <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>Thank you for helping keep our community safe.</p>
                </div>
              ) : (
                <>
                  {reportError && (
                    <div style={{ color: "#ef4444", marginBottom: "16px", fontSize: "14px", backgroundColor: "rgba(239,68,68,0.1)", padding: "10px", borderRadius: "6px" }}>
                      ⚠️ {reportError}
                    </div>
                  )}
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Reason for reporting</label>
                  <select 
                    className="modal-input" 
                    value={reportReason} 
                    onChange={(e) => setReportReason(e.target.value)}
                    disabled={reportLoading}
                    style={{ marginBottom: "16px" }}
                  >
                    <option value="spam">Spam or Unsolicited Promotion</option>
                    <option value="harassment">Harassment or Hate Speech</option>
                    <option value="inappropriate">Inappropriate Content</option>
                    <option value="off-topic">Off-topic</option>
                    <option value="other">Other</option>
                  </select>
                  
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Additional Details (Optional)</label>
                  <textarea 
                    className="modal-input" 
                    placeholder="Provide any additional context..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    disabled={reportLoading}
                    rows={4}
                    style={{ resize: "vertical" }}
                  />
                  <div className="modal-footer" style={{ marginTop: "24px" }}>
                    <button className="modal-cancel" onClick={() => setShowReportModal(false)} disabled={reportLoading}>Cancel</button>
                    <button 
                      className="modal-submit" 
                      onClick={handleReportSubmit} 
                      disabled={reportLoading}
                      style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}
                    >
                      {reportLoading ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QuestionDetail;
