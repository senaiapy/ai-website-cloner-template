import fs from "fs";
import path from "path";

const manualPath = path.join(process.cwd(), "docs/research/apostila.denderson.ai/api-_api_manual.json");
const manualData = JSON.parse(fs.readFileSync(manualPath, "utf8"));

console.log("Views found:", Object.keys(manualData.views));
for (const [viewKey, groups] of Object.entries(manualData.views)) {
  const totalItems = groups.reduce((acc, g) => acc + (g.items ? g.items.length : 0), 0);
  console.log(`- View [${viewKey}]: ${groups.length} groups, ${totalItems} items`);
}

// Check how many sections exist
console.log("Total sections in manualData.sections:", Object.keys(manualData.sections).length);

