export const STORAGE_KEY = "BCScienceConnections10_Checklist_v2";
export const LEGACY_STORAGE_KEYS = ["BCScienceConnections10_Checklist_v1"];
export const QUIZ_STORAGE_KEY = "BCScienceConnections10_QuizGate_v1";
export const LAST_ROUTE_KEY = "BCScienceConnections10_LastRoute_v1";

function readJson(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* Progress remains usable for the current session when storage is blocked. */ }
}

export function loadProgress() {
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    const state = readJson(key);
    if (state && typeof state === "object") return state;
  }
  return {};
}

export function loadQuizPassState() {
  const state = readJson(QUIZ_STORAGE_KEY);
  return state && typeof state === "object" ? state : {};
}

export function migrateLegacyProgress(kpIds) {
  const progress = loadProgress();
  const passed = loadQuizPassState();
  let changed = false;

  // The monolithic version treated previously checked KPs as passed when Quiz Gate was introduced.
  for (const kpId of kpIds) {
    if (progress[kpId] && !passed[kpId]) {
      passed[kpId] = true;
      changed = true;
    }
    progress[kpId] = Boolean(passed[kpId]);
  }

  if (changed) writeJson(QUIZ_STORAGE_KEY, passed);
  writeJson(STORAGE_KEY, progress);
  return { progress, passed };
}

export function markPassed(kpId) {
  const progress = loadProgress();
  const passed = loadQuizPassState();
  progress[kpId] = true;
  passed[kpId] = true;
  writeJson(STORAGE_KEY, progress);
  writeJson(QUIZ_STORAGE_KEY, passed);
}

export function resetProgress() {
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS, QUIZ_STORAGE_KEY]) {
    try { localStorage.removeItem(key); }
    catch { /* Ignore unavailable storage. */ }
  }
}

export function saveLastRoute(route) {
  try { localStorage.setItem(LAST_ROUTE_KEY, route); }
  catch { /* Ignore unavailable storage. */ }
}

export function loadLastRoute() {
  try { return localStorage.getItem(LAST_ROUTE_KEY) || ""; }
  catch { return ""; }
}
