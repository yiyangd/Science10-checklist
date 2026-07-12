function findChapterForKp(course, kpNumber) {
  for (const unit of course.units) {
    const chapter = unit.chapters.find(candidate => kpNumber >= candidate.kpStart && kpNumber <= candidate.kpEnd);
    if (chapter) return { unit, chapter };
  }
  return null;
}

export function parseRoute(hash, course) {
  const raw = hash || "#";
  if (raw === "#" || raw === "#/" || raw === "") return { name: "home", canonical: "#/" };
  if (raw === "#full-course-summary") return { name: "summary", canonical: "#/summary" };

  let match = raw.match(/^#unit-(\d+)$/);
  if (match) return { name: "unit", unitNumber: Number(match[1]), canonical: `#/unit/${match[1]}` };

  match = raw.match(/^#chapter-(\d+)-(\d+)$/);
  if (match) {
    const chapterNumber = `${match[1]}-${match[2]}`;
    return {
      name: "chapter",
      unitNumber: Number(match[1]),
      chapterNumber,
      canonical: `#/unit/${match[1]}/chapter/${chapterNumber}`
    };
  }

  match = raw.match(/^#kp-(\d+)$/);
  if (match) {
    const kpNumber = Number(match[1]);
    const location = findChapterForKp(course, kpNumber);
    if (location) {
      const canonical = `#/unit/${location.unit.number}/chapter/${location.chapter.number}/kp/${kpNumber}`;
      return { name: "chapter", unitNumber: location.unit.number, chapterNumber: location.chapter.number, kpNumber, canonical };
    }
  }

  const path = raw.startsWith("#/") ? raw.slice(2).split("/").filter(Boolean).map(decodeURIComponent) : [];
  if (path[0] === "summary") return { name: "summary", canonical: "#/summary" };
  if (path[0] === "review" && path.length === 1) return { name: "review", canonical: "#/review" };
  if (path[0] !== "unit") return { name: "not-found", canonical: raw };

  const unitNumber = Number(path[1]);
  if (!Number.isInteger(unitNumber)) return { name: "not-found", canonical: raw };
  if (!path[2]) return { name: "unit", unitNumber, canonical: `#/unit/${unitNumber}` };
  if (path[2] !== "chapter" || !path[3]) return { name: "not-found", canonical: raw };

  const chapterNumber = path[3];
  const route = { name: "chapter", unitNumber, chapterNumber, canonical: `#/unit/${unitNumber}/chapter/${chapterNumber}` };
  if (path[4] === "kp" && /^\d+$/.test(path[5] || "")) {
    route.kpNumber = Number(path[5]);
    route.canonical += `/kp/${route.kpNumber}`;
  } else if (path[4] === "concept" && path[5]) {
    route.conceptId = path.slice(5).join("/");
    route.canonical += `/concept/${route.conceptId}`;
  }
  return route;
}

export function replaceHash(hash) {
  history.replaceState(null, "", hash);
}

export function startRouter(onRoute) {
  const handler = () => onRoute(window.location.hash);
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}
