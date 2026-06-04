import { createContext, useContext, useState, useEffect } from "react";

const FAQContext = createContext();

const initialQuestions = [
  {
    id: 1,
    title: "Best roadmap for AI/ML in 2026?",
    category: "Artificial Intelligence",
    excerpt: "I'm a sophomore CS student and want to break into AI/ML. What's the best structured roadmap to follow in 2026?",
    description: "I'm a sophomore CS student and want to break into AI/ML. I've taken basic courses in Python and statistics, but I'm unsure about the best path forward. Should I focus on deep learning frameworks first, or build a stronger math foundation? What projects should I work on? What are the must-read papers? I'd appreciate any structured roadmap or advice from people who've made this transition successfully.",
    hashtags: ["AI", "machine-learning", "roadmap", "career"],
    votes: 142,
    voted: false,
    bookmarked: false,
    author: "Alex Chen",
    time: "2 days ago",
    views: 1240,
    answers: [
      {
        id: 1,
        author: "Dr. Sarah Kim",
        avatar: "S",
        content: "Great question! Here's the roadmap I recommend: 1) Start with Andrew Ng's ML course on Coursera. 2) Learn PyTorch — it's the industry standard now. 3) Build 3-4 projects: image classification, NLP sentiment analysis, a recommendation system. 4) Read the 'Attention Is All You Need' paper. 5) Start contributing to open-source ML projects. The key is consistency — spend 2-3 hours daily and you'll see progress within 6 months.",
        votes: 89,
        time: "2 days ago",
        isBest: true,
        voted: false
      },
      {
        id: 2,
        author: "Marcus Wei",
        avatar: "M",
        content: "I'd add that math foundations are crucial. Make sure you're solid on linear algebra, probability, and calculus before diving deep. Fast.ai is also an excellent resource that takes a top-down approach to learning ML.",
        votes: 45,
        time: "1 day ago",
        isBest: false,
        voted: false
      },
      {
        id: 3,
        author: "Priya Sharma",
        avatar: "P",
        content: "Don't forget about Kaggle competitions! They're a great way to build practical experience and your portfolio. Many employers look at Kaggle profiles during hiring.",
        votes: 32,
        time: "1 day ago",
        isBest: false,
        voted: false
      }
    ]
  },
  {
    id: 2,
    title: "How does virtual memory work at the OS level?",
    category: "Programming",
    excerpt: "I understand the concept of virtual memory, but I want to dig deeper into the kernel-level mechanism.",
    description: "I understand the concept of virtual memory abstractly — it gives each process its own address space. But I want to understand the actual kernel-level mechanism. How does page table walking work? What's the TLB? How do page faults trigger disk reads? And how does the OS decide which pages to evict when memory is full?",
    hashtags: ["operating-systems", "memory", "low-level", "kernel"],
    votes: 118,
    voted: false,
    bookmarked: false,
    author: "Jordan Lee",
    time: "4 days ago",
    views: 890,
    answers: [
      {
        id: 1,
        author: "Prof. David Müller",
        avatar: "D",
        content: "Virtual memory works through a combination of hardware (MMU) and software (OS kernel). When a process accesses memory, the CPU's MMU translates virtual addresses to physical addresses using page tables. The TLB (Translation Lookaside Buffer) caches recent translations for speed. On a page fault, the OS handler loads the page from disk, updates the page table, and restarts the instruction. For eviction, Linux uses a modified LRU algorithm called the 'two-list strategy' with active and inactive lists.",
        votes: 67,
        time: "3 days ago",
        isBest: true,
        voted: false
      },
      {
        id: 2,
        author: "Nina Patel",
        avatar: "N",
        content: "I'd recommend reading the xv6 source code — it's a simple teaching OS that implements virtual memory clearly. Chapter 3 of the xv6 book explains page tables beautifully.",
        votes: 28,
        time: "2 days ago",
        isBest: false,
        voted: false
      }
    ]
  },
  {
    id: 3,
    title: "How to prepare for FAANG system design interviews?",
    category: "Career",
    excerpt: "I've been grinding LeetCode but system design still feels overwhelming. What's the best approach?",
    description: "I've been grinding LeetCode for months and feel decent at algorithm problems, but system design interviews are a completely different beast. I don't have experience building large-scale distributed systems. How should I prepare? What resources are best? How much time should I dedicate?",
    hashtags: ["interviews", "system-design", "FAANG", "career"],
    votes: 97,
    voted: false,
    bookmarked: false,
    author: "Taylor Brooks",
    time: "1 day ago",
    views: 2100,
    answers: []
  },
  {
    id: 4,
    title: "Top conferences to publish ML research in 2026?",
    category: "Research",
    excerpt: "I'm working on a paper about transformer architectures. Which conferences should I target?",
    description: "I'm working on a paper about transformer architectures and need to choose target venues. Which are the top-tier conferences (NeurIPS, ICML, ICLR)? Are there any emerging conferences worth considering? What's the typical review timeline?",
    hashtags: ["research", "conferences", "ML", "publishing"],
    votes: 85,
    voted: false,
    bookmarked: false,
    author: "Emma Rodriguez",
    time: "5 days ago",
    views: 650,
    answers: [
      {
        id: 1,
        author: "Dr. Sarah Kim",
        avatar: "S",
        content: "The top three remain NeurIPS, ICML, and ICLR. For more specialized work, consider AAAI, CVPR (for vision), ACL/EMNLP (for NLP). Emerging venues like TMLR (Transactions on ML Research) offer rolling review which can be faster. Typical review cycles are 3-4 months for major conferences.",
        votes: 41,
        time: "4 days ago",
        isBest: true,
        voted: false
      }
    ]
  },
  {
    id: 5,
    title: "Best fully-funded CS PhD programs in Europe?",
    category: "Scholarships",
    excerpt: "Looking for universities with strong AI research groups that offer full funding for international students.",
    description: "Looking for universities with strong AI research groups that offer full funding for international students. I'm particularly interested in natural language processing and reinforcement learning.",
    hashtags: ["scholarships", "PhD", "europe", "funding"],
    votes: 73,
    voted: false,
    bookmarked: false,
    author: "Ryan Park",
    time: "3 days ago",
    views: 1800,
    answers: []
  },
  {
    id: 6,
    title: "Intuition behind eigenvalues in PCA?",
    category: "Mathematics",
    excerpt: "I get the math, but what's the geometric intuition behind why we use eigenvalues in principal component analysis?",
    description: "I get the math behind PCA — compute the covariance matrix, find its eigenvalues and eigenvectors. But what's the geometric intuition? Why do eigenvalues tell us about variance? And why do eigenvectors point in the directions of maximum variance?",
    hashtags: ["linear-algebra", "PCA", "math", "intuition"],
    votes: 64,
    voted: false,
    bookmarked: false,
    author: "Nina Patel",
    time: "6 days ago",
    views: 420,
    answers: [
      {
        id: 1,
        author: "Marcus Wei",
        avatar: "M",
        content: "Think of your data as a cloud of points. The covariance matrix describes the shape of that cloud. Eigenvectors point in the directions where the cloud is stretched the most, and eigenvalues tell you how much stretching there is. PCA finds the axes of the ellipsoid that best fits your data cloud. The largest eigenvalue = the longest axis = the direction of most variance.",
        votes: 38,
        time: "5 days ago",
        isBest: true,
        voted: false
      }
    ]
  },
  {
    id: 7,
    title: "Rust vs Go for backend microservices in 2026?",
    category: "Programming",
    excerpt: "My team is debating between Rust and Go for our new microservices architecture. What are the tradeoffs?",
    description: "My team is debating between Rust and Go for our new microservices architecture. What are the engineering tradeoffs, performance difference, developer velocity, and ecosystem support in 2026?",
    hashtags: ["rust", "golang", "microservices"],
    votes: 56,
    voted: false,
    bookmarked: false,
    author: "Taylor Brooks",
    time: "12 hours ago",
    views: 310,
    answers: []
  },
  {
    id: 8,
    title: "Fine-tuning LLMs with limited compute budget?",
    category: "Artificial Intelligence",
    excerpt: "I only have access to a single A100 GPU. What are practical strategies for fine-tuning large language models?",
    description: "I only have access to a single A100 GPU. What are practical strategies for fine-tuning large language models? Is LoRA, QLoRA, or parameter-efficient fine-tuning standard? What batch sizes and sequence lengths should I use?",
    hashtags: ["LLM", "fine-tuning", "GPU"],
    votes: 45,
    voted: false,
    bookmarked: false,
    author: "Alex Chen",
    time: "1 week ago",
    views: 520,
    answers: []
  }
];

const initialCategories = [
  { name: "Programming", icon: "💻", color: "blue", description: "Languages, frameworks, and software engineering" },
  { name: "Artificial Intelligence", icon: "🤖", color: "orange", description: "ML, deep learning, NLP, and computer vision" },
  { name: "Career", icon: "🎯", color: "green", description: "Job search, interviews, and career growth" },
  { name: "Research", icon: "🔬", color: "yellow", description: "Academic research, papers, and publications" },
  { name: "Scholarships", icon: "🎓", color: "red", description: "Funding, grants, and financial aid" },
  { name: "Mathematics", icon: "📐", color: "purple", description: "Pure and applied mathematics topics" }
];

const initialContributors = [
  { rank: 1, name: "Dr. Sarah Kim", avatar: "S", answers: 342, questions: 28, reputation: 15420, tier: "gold", medal: "🥇" },
  { rank: 2, name: "Marcus Wei", avatar: "M", answers: 289, questions: 45, reputation: 12890, tier: "gold", medal: "🥈" },
  { rank: 3, name: "Priya Sharma", avatar: "P", answers: 256, questions: 32, reputation: 11240, tier: "gold", medal: "🥉" },
  { rank: 4, name: "Alex Chen", avatar: "A", answers: 198, questions: 67, reputation: 8950, tier: "silver", medal: "" },
  { rank: 5, name: "Jordan Lee", avatar: "J", answers: 176, questions: 23, reputation: 7820, tier: "silver", medal: "" },
  { rank: 6, name: "Nina Patel", avatar: "N", answers: 154, questions: 41, reputation: 6540, tier: "silver", medal: "" },
  { rank: 7, name: "Taylor Brooks", avatar: "T", answers: 132, questions: 12, reputation: 5210, tier: "silver", medal: "" },
  { rank: 8, name: "David Müller", avatar: "D", answers: 118, questions: 9, reputation: 4890, tier: "bronze", medal: "" },
  { rank: 9, name: "Emma Rodriguez", avatar: "E", answers: 95, questions: 14, reputation: 3750, tier: "bronze", medal: "" },
  { rank: 10, name: "Ryan Park", avatar: "R", answers: 78, questions: 8, reputation: 2980, tier: "bronze", medal: "" }
];

export function FAQProvider({ children }) {
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem("crowdfaq_questions");
    return saved ? JSON.parse(saved) : initialQuestions;
  });

  const [contributors, setContributors] = useState(() => {
    const saved = localStorage.getItem("crowdfaq_contributors");
    return saved ? JSON.parse(saved) : initialContributors;
  });

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    localStorage.setItem("crowdfaq_questions", JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem("crowdfaq_contributors", JSON.stringify(contributors));
  }, [contributors]);

  // Sync with Backend database on mount
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/faqs");
        if (response.ok) {
          const resData = await response.json();
          // If there are FAQs in the database, merge them into our local questions list
          if (resData.data && resData.data.length > 0) {
            setQuestions((prevQuestions) => {
              const updated = [...prevQuestions];
              resData.data.forEach((backendFaq) => {
                const exists = updated.some(
                  (q) => q.title.toLowerCase() === backendFaq.question.toLowerCase()
                );
                if (!exists) {
                  updated.push({
                    id: `be-${backendFaq.id || backendFaq._id}`,
                    title: backendFaq.question,
                    excerpt: backendFaq.answer.substring(0, 120) + (backendFaq.answer.length > 120 ? "..." : ""),
                    description: backendFaq.answer,
                    category: "General",
                    hashtags: backendFaq.keywords ? (Array.isArray(backendFaq.keywords) ? backendFaq.keywords : backendFaq.keywords.split(",")) : [],
                    votes: 1,
                    voted: false,
                    bookmarked: false,
                    author: "Community Member",
                    time: "Just now",
                    views: 45,
                    answers: []
                  });
                }
              });
              return updated;
            });
          } else {
            // Backend is empty. Let's seed it with our initialQuestions to make sure it has data!
            for (const q of initialQuestions) {
              await fetch("http://localhost:5000/api/faqs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  question: q.title,
                  answer: q.description || q.excerpt
                })
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn("Backend API not reachable. Operating in standalone localStorage mode:", err);
      }
    };

    syncWithBackend();
  }, []);

  const addQuestion = async (title, category, description, hashtagsString) => {
    const tags = hashtagsString
      ? hashtagsString.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean)
      : [];

    const newQuestion = {
      id: Date.now(),
      title: title.trim(),
      category: category || "Programming",
      excerpt: description.substring(0, 120) + (description.length > 120 ? "..." : ""),
      description: description.trim(),
      hashtags: tags,
      votes: 1,
      voted: false,
      bookmarked: false,
      author: "Sarthak (You)",
      time: "Just now",
      views: 1,
      answers: []
    };

    setQuestions((prev) => [newQuestion, ...prev]);

    // Also update our own contributor profile questions count
    setContributors((prev) =>
      prev.map((c) =>
        c.name === "Alex Chen" // representing current user / mock user avatar profile
          ? { ...c, questions: c.questions + 1 }
          : c
      )
    );

    // Save to backend
    try {
      await fetch("http://localhost:5000/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: title.trim(),
          answer: description.trim()
        })
      });
    } catch (err) {
      console.warn("Could not post new question to backend database server:", err);
    }
  };

  const upvoteQuestion = (id) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const newVoted = !q.voted;
          return {
            ...q,
            votes: newVoted ? q.votes + 1 : q.votes - 1,
            voted: newVoted
          };
        }
        return q;
      })
    );
  };

  const bookmarkQuestion = (id) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            bookmarked: !q.bookmarked
          };
        }
        return q;
      })
    );
  };

  const addAnswer = async (questionId, content, author = "Sarthak (You)") => {
    const newAnswer = {
      id: Date.now(),
      author,
      avatar: author.charAt(0).toUpperCase(),
      content: content.trim(),
      votes: 1,
      time: "Just now",
      isBest: false,
      voted: false
    };

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === Number(questionId) || q.id === questionId) {
          return {
            ...q,
            views: q.views + 5,
            answers: [...q.answers, newAnswer]
          };
        }
        return q;
      })
    );

    // Reward reputation and answers count
    setContributors((prev) => {
      const exists = prev.some((c) => c.name === author);
      if (exists) {
        return prev
          .map((c) =>
            c.name === author
              ? { ...c, answers: c.answers + 1, reputation: c.reputation + 15 }
              : c
          )
          .sort((a, b) => b.reputation - a.reputation)
          .map((c, i) => ({ ...c, rank: i + 1 }));
      } else {
        const list = [
          ...prev,
          { rank: 99, name: author, avatar: author.charAt(0).toUpperCase(), answers: 1, questions: 0, reputation: 15, tier: "bronze" }
        ];
        return list
          .sort((a, b) => b.reputation - a.reputation)
          .map((c, i) => ({ ...c, rank: i + 1 }));
      }
    });

    // Post resolution to backend if it's a backend question
    if (String(questionId).startsWith("be-")) {
      const rawId = String(questionId).replace("be-", "");
      try {
        await fetch(`http://localhost:5000/api/queries/${rawId}/resolve`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: content })
        });
      } catch (e) {
        console.warn("Could not patch resolve on backend:", e);
      }
    }
  };

  const upvoteAnswer = (questionId, answerId) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === Number(questionId) || q.id === questionId) {
          return {
            ...q,
            answers: q.answers.map((ans) => {
              if (ans.id === answerId) {
                const newVoted = !ans.voted;
                // Reward or deduct author's reputation
                setContributors((prevContribs) =>
                  prevContribs
                    .map((c) =>
                      c.name === ans.author
                        ? { ...c, reputation: newVoted ? c.reputation + 10 : c.reputation - 10 }
                        : c
                    )
                    .sort((a, b) => b.reputation - a.reputation)
                    .map((c, i) => ({ ...c, rank: i + 1 }))
                );
                return {
                  ...ans,
                  votes: newVoted ? ans.votes + 1 : ans.votes - 1,
                  voted: newVoted
                };
              }
              return ans;
            })
          };
        }
        return q;
      })
    );
  };

  // Get dynamic categories list with correct question count
  const getDynamicCategories = () => {
    return initialCategories.map((cat) => {
      const count = questions.filter((q) => q.category === cat.name).length;
      // Merge with initial offset counts to make it feel populated
      const offset = cat.name === "Programming" ? 1238
        : cat.name === "Artificial Intelligence" ? 888
        : cat.name === "Career" ? 561
        : cat.name === "Research" ? 339
        : cat.name === "Scholarships" ? 214
        : 177; // Mathematics
      return {
        ...cat,
        questions: count + offset
      };
    });
  };

  return (
    <FAQContext.Provider
      value={{
        questions,
        contributors,
        categories: getDynamicCategories(),
        searchQuery,
        setSearchQuery,
        addQuestion,
        upvoteQuestion,
        bookmarkQuestion,
        addAnswer,
        upvoteAnswer
      }}
    >
      {children}
    </FAQContext.Provider>
  );
}

export function useFAQ() {
  return useContext(FAQContext);
}
