const rootUrl = new URL("../", import.meta.url);
const cache = new Map();

async function fetchJson(relativePath) {
  if (!cache.has(relativePath)) {
    cache.set(relativePath, fetch(new URL(relativePath, rootUrl)).then(response => {
      if (!response.ok) throw new Error(`Could not load ${relativePath} (${response.status}).`);
      return response.json();
    }).catch(error => {
      cache.delete(relativePath);
      throw error;
    }));
  }
  return cache.get(relativePath);
}

export const loadCourseIndex = () => fetchJson("data/course-index.json");
export const loadUnit = unitNumber => fetchJson(`data/units/unit-${unitNumber}.json`);
export const loadQuizUnit = unitNumber => fetchJson(`data/quizzes/unit-${unitNumber}.json`);
export const loadSearchIndex = () => fetchJson("data/search-index.json");
