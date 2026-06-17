const API_BASE_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export async function fetchFaqs() {
  return request("/faqs");
}

export async function fetchQueries() {
  return request("/queries");
}

export async function searchFaq(keyword) {
  return request("/search", {
    method: "POST",
    body: JSON.stringify({ keyword })
  });
}

export async function submitQuery(payload) {
  return request("/queries", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createFaq(payload) {
  return request("/faqs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function submitAnswer(payload) {
  return request("/answers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchAnswers(questionId) {
  return request(`/answers/${questionId}`);
}

export async function toggleVote(payload) {
  return request("/votes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function toggleBookmarkApi(payload) {
  return request("/bookmarks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchBookmarks(userId = "anonymous") {
  return request(`/bookmarks/${userId}`);
}

export async function fetchActivityStats(range = "week") {
  return request(`/stats/activity?range=${range}`);
}

export async function fetchHeatmapStats(range = "week") {
  return request(`/stats/heatmap?range=${range}`);
}

export async function fetchAdminOverview() {
  return request("/admin/overview");
}

export async function fetchPendingQueries() {
  return request("/admin/pending-queries");
}

export async function deleteFaq(id) {
  return request(`/faqs/${id}`, {
    method: "DELETE"
  });
}

export async function deleteQuery(id) {
  return request(`/queries/${id}`, {
    method: "DELETE"
  });
}

export async function deleteAnswer(id) {
  return request(`/answers/${id}`, {
    method: "DELETE"
  });
}

