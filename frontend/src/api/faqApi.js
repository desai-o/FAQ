import { apiRequest } from "./client";

export async function fetchFaqs() {
  return apiRequest("/faqs");
}

export async function fetchQueries() {
  return apiRequest("/queries");
}

export async function searchFaq(keyword) {
  return apiRequest("/search", {
    method: "POST",
    body: JSON.stringify({ keyword })
  });
}

export async function submitQuery(payload) {
  return apiRequest("/queries", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createFaq(payload) {
  return apiRequest("/faqs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function submitAnswer(payload) {
  return apiRequest("/answers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchAnswers(questionId) {
  return apiRequest(`/answers/${questionId}`);
}

export async function toggleVote(payload) {
  return apiRequest("/votes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function toggleBookmarkApi(payload) {
  return apiRequest("/bookmarks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchBookmarks(userId = "anonymous") {
  return apiRequest(`/bookmarks/${userId}`);
}

export async function fetchActivityStats(range = "week") {
  return apiRequest(`/stats/activity?range=${range}`);
}

export async function fetchHeatmapStats(range = "week") {
  return apiRequest(`/stats/heatmap?range=${range}`);
}