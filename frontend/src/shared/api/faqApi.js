const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}, attempt = 0) {
  const token = localStorage.getItem("crowdfaq-token");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(payload.message || payload.error || `Request failed: ${response.status}`);
    }

    return payload;
  } catch (error) {
    const retryable =
      error.name === "AbortError" ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError");

    if (retryable && attempt < MAX_RETRIES) {
      await sleep(300 * 2 ** attempt);
      return request(path, options, attempt + 1);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchFaqs(limit = 20, offset = 0) {
  return request(`/faqs?limit=${limit}&offset=${offset}`);
}

export async function fetchQueries(limit = 20, offset = 0) {
  return request(`/queries?limit=${limit}&offset=${offset}`);
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

export async function fetchAnswers(questionId, limit = 20, offset = 0) {
  return request(`/answers/${questionId}?limit=${limit}&offset=${offset}`);
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

export async function followResource(followableType, followableId) {
  return request("/follows", {
    method: "POST",
    body: JSON.stringify({ followableType, followableId })
  });
}

export async function unfollowResource(followId) {
  return request(`/follows/${followId}`, {
    method: "DELETE"
  });
}

export async function muteFollow(followId, isMuted) {
  return request(`/follows/${followId}/mute`, {
    method: "PATCH",
    body: JSON.stringify({ isMuted })
  });
}

export async function fetchNotifications() {
  return request("/notifications");
}

export async function markNotificationsAsRead() {
  return request("/notifications/read", {
    method: "PATCH"
  });
}

export function markNotificationAsRead(notificationId) {
  return request(`/notifications/${notificationId}/read`, {
    method: "PATCH"
  });
}

export function deleteNotification(notificationId) {
  return request(`/notifications/${notificationId}`, {
    method: "DELETE"
  });
}

export async function checkDuplicatesApi(question) {
  return request("/duplicates/check", {
    method: "POST",
    body: JSON.stringify({ question })
  });
}

export async function sendChatMessage(message, history = []) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message, history })
  });
}

export async function createFaqTranslation(faqId, payload) {
  return request(`/faqs/${faqId}/translations`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchFaqTranslations(faqId) {
  return request(`/faqs/${faqId}/translations`);
}

export async function createBounty(payload) {
  return request("/bounties", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function awardBounty(bountyId, payload) {
  return request(`/bounties/${bountyId}/award`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchBounties() {
  return request("/bounties");
}

export async function fetchNotificationPreferences() {
  return request("/notifications/preferences");
}

export async function updateNotificationPreferences(preferences) {
  return request("/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences)
  });
}

export async function fetchModerationQueue() {
  return request("/admin/moderation-queue");
}

export async function fetchModerationExplanation(id) {
  return request(`/admin/moderation/${id}/explanation`);
}

export async function actOnModeration(id, payload) {
  return request(`/admin/moderation/${id}/action`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function fetchKnowledgeGaps() {
  return request("/admin/knowledge-gaps");
}

export async function previewFaqImport(fileName, fileContent) {
  return request("/faqs/import/preview", {
    method: "POST",
    body: JSON.stringify({ fileName, fileContent })
  });
}

export async function confirmFaqImport(faqs) {
  return request("/faqs/import/confirm", {
    method: "POST",
    body: JSON.stringify({ faqs })
  });
}

export async function downloadFaqExport(format, mode = "raw") {
  const token = localStorage.getItem("crowdfaq-token");
  const response = await fetch(`${API_BASE_URL}/export?format=${encodeURIComponent(format)}&mode=${encodeURIComponent(mode)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  return blob;
}

export async function queryGraphQL(query, variables = {}) {
  return request("/graphql", {
    method: "POST",
    body: JSON.stringify({ query, variables })
  });
}


