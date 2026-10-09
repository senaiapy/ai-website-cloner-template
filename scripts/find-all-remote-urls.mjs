import fs from "fs";
import path from "path";

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const files = walk("docs/research/apostila.denderson.ai");
const allUrls = new Set();

for (const file of files) {
  if (file.endsWith(".json") || file.endsWith(".js") || file.endsWith(".html")) {
    const text = fs.readFileSync(file, "utf8");
    const matches = text.matchAll(/https:\/\/api-apostila\.denderson\.ai[^\s"'`\\]+/g);
    for (const m of matches) {
      allUrls.add(m[0]);
    }
  }
}

console.log("Total unique api-apostila URLs found:", allUrls.size);
for (const u of Array.from(allUrls).sort()) {
  console.log(u);
}

