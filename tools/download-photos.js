// Downloads the Wikimedia Commons photos listed in data/*.json (1280px wide) into photos/
// and records each saved file as photos.<angle>.local so the site shows it.
// Usage: node tools/download-photos.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const photoDir = path.join(root, "photos");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(title, dest) {
  const name = title.replace(/^File:/, "").replace(/ /g, "_");
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=1280`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "IndianCarEngineHub/1.0 (personal site)" } });
    if (res.ok) {
      const type = res.headers.get("content-type") || "";
      if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return;
    }
    if (res.status === 429) { await sleep(3000 * attempt); continue; }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error("rate-limited");
}

(async () => {
  let saved = 0, failed = 0;
  // Optional: node tools/download-photos.js ev-luxury luxury-3  (only those data files)
  const only = process.argv.slice(2).map((a) => a.replace(/\.json$/, ""));
  for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith(".json") && (!only.length || only.includes(f.replace(/\.json$/, ""))))) {
    const full = path.join(dataDir, file);
    const data = JSON.parse(fs.readFileSync(full, "utf8"));
    for (const car of data.cars ?? []) {
      for (const angle of ["front", "rear"]) {
        const p = car.photos?.[angle];
        if (!p?.file) continue;
        const local = `photos/${car.id}-${angle}.jpg`;
        // Already on disk (also covers a run that was stopped before it could save the data file).
        if (fs.existsSync(path.join(root, local)) && (p.local === local || p.local === undefined)) { p.local = local; continue; }
        try {
          await download(p.file, path.join(root, local));
          p.local = local;
          saved++;
          console.log(`saved ${local}`);
        } catch (err) {
          delete p.local;
          failed++;
          console.log(`FAILED ${car.id}-${angle} (${p.file}): ${err.message}`);
        }
        await sleep(400); // stay well under Commons' rate limit
      }
    }
    fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n");
  }
  console.log(`\n${saved} saved, ${failed} failed.`);
})();
