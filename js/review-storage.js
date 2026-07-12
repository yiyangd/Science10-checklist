export const REVIEW_STORAGE_KEY = "BCScienceConnections10_Review_v1";
export const REVIEW_SCHEMA_VERSION = 1;
export const REVIEW_STATUS = Object.freeze({
  NEEDS_PRACTICE: "needs-practice",
  REVIEW_RECOMMENDED: "review-recommended",
  RECENTLY_PASSED: "recently-passed"
});

let memoryState = null;
let persistenceBlocked = false;

function emptyState() {
  return {
    schemaVersion: REVIEW_SCHEMA_VERSION,
    updatedAt: null,
    records: {}
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isKpId(value) {
  const match = /^kp-(\d+)$/.exec(value);
  if (!match) return false;
  const number = Number(match[1]);
  return number >= 1 && number <= 572;
}

function isTimestamp(value) {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function isNullableTimestamp(value) {
  return value === null || isTimestamp(value);
}

function sanitizeRecord(record) {
  if (!isObject(record)) return null;
  const {
    totalAttempts,
    nonPassingAttempts,
    lastScore,
    lastResult,
    lastAttemptAt,
    firstPassedAt,
    lastPassedAt
  } = record;
  if (!Number.isInteger(totalAttempts) || totalAttempts < 1) return null;
  if (!Number.isInteger(nonPassingAttempts) || nonPassingAttempts < 0 || nonPassingAttempts > totalAttempts) return null;
  if (!Number.isInteger(lastScore) || lastScore < 0 || lastScore > 3) return null;
  if (!isTimestamp(lastAttemptAt) || !isNullableTimestamp(firstPassedAt) || !isNullableTimestamp(lastPassedAt)) return null;
  if (lastResult === "passed") {
    if (lastScore !== 3 || !firstPassedAt || !lastPassedAt) return null;
  } else if (lastResult === "needs-practice") {
    if (lastScore >= 3) return null;
  } else {
    return null;
  }
  if ((firstPassedAt === null) !== (lastPassedAt === null)) return null;
  return {
    totalAttempts,
    nonPassingAttempts,
    lastScore,
    lastResult,
    lastAttemptAt,
    firstPassedAt,
    lastPassedAt
  };
}

function sanitizeState(value) {
  if (!isObject(value) || value.schemaVersion !== REVIEW_SCHEMA_VERSION || !isObject(value.records)) {
    return emptyState();
  }
  const records = {};
  for (const [kpId, record] of Object.entries(value.records)) {
    if (!isKpId(kpId)) continue;
    const sanitized = sanitizeRecord(record);
    if (sanitized) records[kpId] = sanitized;
  }
  return {
    schemaVersion: REVIEW_SCHEMA_VERSION,
    updatedAt: isNullableTimestamp(value.updatedAt) ? value.updatedAt : null,
    records
  };
}

function persist(state) {
  memoryState = clone(state);
  if (persistenceBlocked) return false;
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    persistenceBlocked = true;
    return false;
  }
}

export function loadReviewState() {
  if (persistenceBlocked && memoryState) return clone(memoryState);
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    const state = raw ? sanitizeState(JSON.parse(raw)) : emptyState();
    memoryState = clone(state);
    return state;
  } catch {
    const state = memoryState || emptyState();
    memoryState = clone(state);
    return clone(state);
  }
}

export function reviewStatusFor(record, passed) {
  if (!record) return null;
  if (record.lastResult === "needs-practice") {
    return passed ? REVIEW_STATUS.REVIEW_RECOMMENDED : REVIEW_STATUS.NEEDS_PRACTICE;
  }
  if (passed && record.lastResult === "passed" && record.nonPassingAttempts > 0) {
    return REVIEW_STATUS.RECENTLY_PASSED;
  }
  return null;
}

export function actionableReviewCount(state = loadReviewState()) {
  return Object.values(state.records).filter(record => record.lastResult === "needs-practice").length;
}

export function recordQuizAttempt({ kpId, score, questionCount }) {
  if (!isKpId(kpId) || questionCount !== 3 || !Number.isInteger(score) || score < 0 || score > questionCount) {
    return { state: loadReviewState(), persisted: false };
  }
  const state = loadReviewState();
  const previous = state.records[kpId];
  const passed = score === questionCount;
  const timestamp = new Date().toISOString();
  const firstPassedAt = passed ? previous?.firstPassedAt || timestamp : previous?.firstPassedAt || null;
  const lastPassedAt = passed ? timestamp : previous?.lastPassedAt || null;

  state.records[kpId] = {
    totalAttempts: (previous?.totalAttempts || 0) + 1,
    nonPassingAttempts: (previous?.nonPassingAttempts || 0) + (passed ? 0 : 1),
    lastScore: score,
    lastResult: passed ? "passed" : "needs-practice",
    lastAttemptAt: timestamp,
    firstPassedAt,
    lastPassedAt
  };
  state.updatedAt = timestamp;
  return { state: clone(state), persisted: persist(state) };
}

export function clearReviewHistory() {
  const state = emptyState();
  memoryState = clone(state);
  try {
    localStorage.removeItem(REVIEW_STORAGE_KEY);
    persistenceBlocked = false;
    return true;
  } catch {
    persistenceBlocked = true;
    return false;
  }
}
