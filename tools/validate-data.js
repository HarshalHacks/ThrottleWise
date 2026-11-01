// Checks the researched car data files before they go on the site.
// Usage: node tools/validate-data.js            (checks every data/*.json)
//        node tools/validate-data.js --photos   (also lists the photos to download)
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const FUELS = ["Petrol", "Diesel", "CNG", "Hybrid", "Electric"];
const ASPIRATIONS = ["Naturally aspirated", "Turbocharged", "Turbocharged diesel", "Electric"];
const showPhotos = process.argv.includes("--photos");

let problems = 0;
const problem = (where, msg) => { problems++; console.log(`  ✗ ${where}: ${msg}`); };
const photoList = [];

for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith(".json")).sort()) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
  } catch (err) {
    console.log(`\n${file}: INVALID JSON (${err.message})`);
    problems++;
    continue;
  }
  console.log(`\n${file}`);
  for (const car of data.cars ?? []) {
    const where = car.id ?? "(no id)";
    for (const key of ["id", "brand", "model", "bodyType", "trims", "variants", "engines"]) {
      if (car[key] == null) problem(where, `missing ${key}`);
    }
    const trims = new Set((car.trims ?? []).map((t) => t.trim));
    const prices = [];
    let noPrice = 0, noMileage = 0;
    for (const v of car.variants ?? []) {
      const vw = `${where} / ${v.trim} ${v.power}`;
      if (!trims.has(v.trim)) problem(vw, `trim "${v.trim}" is not in trims`);
      if (!car.engines?.[v.engine]) problem(vw, `engine key "${v.engine}" not found`);
      if (!FUELS.includes(v.fuel)) problem(vw, `fuel "${v.fuel}" is not one of ${FUELS.join("/")}`);
      if (!v.power) problem(vw, "missing power label");
      if (v.priceInr == null) noPrice++;
      else if (typeof v.priceInr !== "number" || v.priceInr < 100000 || v.priceInr > 50000000) problem(vw, `odd price ${v.priceInr}`);
      else prices.push(v.priceInr);
      const ev = v.ev ?? car.engines?.[v.engine]?.ev ?? null;
      if (v.fuel === "Electric") {
        if (!ev) problem(vw, "electric variant has no ev block (battery/range)");
        else {
          if (ev.batteryKwh != null && (ev.batteryKwh < 10 || ev.batteryKwh > 200)) problem(vw, `odd battery ${ev.batteryKwh} kWh`);
          if (ev.rangeKm != null && (ev.rangeKm < 100 || ev.rangeKm > 1000)) problem(vw, `odd range ${ev.rangeKm} km`);
          if (ev.rangeKm != null && !ev.rangeStandard) problem(vw, "range given without a standard (ARAI/MIDC/WLTP)");
        }
        if (v.mileage != null) problem(vw, "electric variant should have mileage null");
      } else if (ev) problem(vw, "non-electric variant has an ev block");
      if (v.mileage == null) { if (v.fuel !== "Electric") noMileage++; }
      else if (typeof v.mileage !== "string") problem(vw, "mileage should be a string like \"17.4 kmpl\"");
    }
    for (const [key, e] of Object.entries(car.engines ?? {})) {
      if (e.aspiration && !ASPIRATIONS.includes(e.aspiration)) problem(`${where} / engine ${key}`, `aspiration "${e.aspiration}"`);
      if (e.maxPowerBhp != null && (e.maxPowerBhp < 30 || e.maxPowerBhp > 800)) problem(`${where} / engine ${key}`, `odd power ${e.maxPowerBhp}`);
    }
    // A duplicate trim+power pair would make two identical buttons.
    const pairs = (car.variants ?? []).map((v) => `${v.trim}|${v.power}`);
    const dupes = pairs.filter((p, i) => pairs.indexOf(p) !== i);
    if (dupes.length) problem(where, `duplicate trim/power: ${[...new Set(dupes)].join(", ")}`);

    const range = prices.length ? `₹${(Math.min(...prices) / 1e5).toFixed(2)}–${(Math.max(...prices) / 1e5).toFixed(2)} lakh` : "no prices";
    const photos = ["front", "rear"].filter((a) => car.photos?.[a]?.file);
    console.log(`  ${where.padEnd(26)} ${String(car.variants?.length ?? 0).padStart(2)} variants, ${trims.size} trims, ${range}` +
      `${noPrice ? `, ${noPrice} no price` : ""}${noMileage ? `, ${noMileage} no mileage` : ""}, photos: ${photos.join("+") || "none"}`);
    for (const a of photos) photoList.push({ id: car.id, angle: a, ...car.photos[a] });
  }
}

if (showPhotos) {
  console.log(`\nPhotos to download (${photoList.length}):`);
  for (const p of photoList) console.log(`  ${p.id}-${p.angle}: ${p.file} | ${p.license} | ${p.artist}`);
}
console.log(problems ? `\n${problems} problem(s) found.` : "\nNo problems found.");
process.exitCode = problems ? 1 : 0;
