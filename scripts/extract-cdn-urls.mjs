import fs from "fs";

const m = JSON.parse(fs.readFileSync("docs/research/apostila.denderson.ai/api-_api_manual.json", "utf8"));
const urls = new Set();
for (const [, v] of Object.entries(m.sections)) {
  const matches = v.match(/https:\/\/assets\.cdn\.filesafe\.space\/[a-zA-Z0-9_\-\.\/]+/g);
  if (matches) matches.forEach(u => urls.add(u));
}
console.log("Total unique CDN URLs in manual sections:", urls.size);
for (const u of urls) console.log("-", u);

