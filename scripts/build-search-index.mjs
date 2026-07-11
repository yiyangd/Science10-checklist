import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "data");
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(dataDir, relativePath), "utf8"));
const course = readJson("course-index.json");
const entries = [];

for (const unitSummary of course.units) {
  const unit = readJson(`units/${unitSummary.id}.json`);
  entries.push({
    type: "unit",
    id: unit.id,
    title: unit.title,
    route: `#/unit/${unit.number}`,
    searchText: unit.title.toLowerCase()
  });

  for (const chapter of unit.chapters) {
    const chapterRoute = `#/unit/${unit.number}/chapter/${chapter.number}`;
    entries.push({
      type: "chapter",
      id: chapter.id,
      title: chapter.title,
      route: chapterRoute,
      searchText: chapter.title.toLowerCase()
    });

    for (const concept of chapter.concepts) {
      entries.push({
        type: "concept",
        id: concept.id,
        title: concept.title,
        route: `${chapterRoute}/concept/${concept.id}`,
        searchText: concept.title.toLowerCase()
      });

      for (const kp of concept.kps) {
        entries.push({
          type: "kp",
          id: kp.id,
          title: kp.title,
          route: `${chapterRoute}/kp/${kp.number}`,
          searchText: `${kp.title} ${kp.core} ${kp.application}`.toLowerCase()
        });
      }
    }
  }
}

fs.writeFileSync(path.join(dataDir, "search-index.json"), `${JSON.stringify(entries)}\n`, "utf8");
console.log(JSON.stringify({ entries: entries.length, bytes: fs.statSync(path.join(dataDir, "search-index.json")).size }, null, 2));
