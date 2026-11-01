// Runs the site's script against a stub DOM with data/*.json served from disk, then opens
// every car, clicks through every variant, and checks the rendered output for bad values.
const fs = require("fs");
const path = require("path");
const site = process.argv[2];
const root = path.dirname(site);
const html = fs.readFileSync(site, "utf8");
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];

const els = {};
const el = (k) => els[k] || (els[k] = {
  innerHTML: "", textContent: "", hidden: false, value: 0, style: {}, dataset: {}, parentElement: {},
  addEventListener() {}, scrollIntoView() {},
  classList: { add() {}, remove() {}, toggle() {} },
  querySelector: () => el("x"), querySelectorAll: () => [],
});
global.document = { querySelector: (q) => el(q), querySelectorAll: () => [], addEventListener() {}, createElement: () => el("tmp") };
global.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = v; } };
global.performance = global.performance || { now: () => Date.now() };
global.window = { matchMedia: () => ({ matches: false }), scrollTo() {}, addEventListener() {}, scrollY: 0, innerHeight: 800 };
global.fetch = async (url) => {
  const p = path.join(root, String(url).split("?")[0]);
  if (!fs.existsSync(p)) return { ok: false, status: 404 };
  return { ok: true, json: async () => JSON.parse(fs.readFileSync(p, "utf8")) };
};

const test = `
(async () => {
  await loadCars();
  let errors = 0, variantCount = 0, missingPhotoFiles = 0;
  for (const car of CARS) {
    openDetail(car.id);
    const vs = variantsOf(car);
    if (!vs.length) { errors++; console.log("NO VARIANTS", car.id); }
    for (let i = 0; i < vs.length; i++) {
      state.variantIndex = i; renderDetail(); variantCount++;
      const out = el("#specTable").innerHTML + el("#featureList").innerHTML + el("#variantPrice").innerHTML + el("#detailTitle").textContent;
      if (/undefined|NaN|>null<|\\bnull\\b(?! *rpm)/.test(out.replace(/Not listed/g, ""))) {
        errors++; if (errors < 15) console.log("BAD", car.id, vs[i].trim, vs[i].power);
      }
    }
    for (const p of PHOTOS[car.id] || []) if (!require("fs").existsSync(require("path").join(${JSON.stringify(root)}, p.src))) { missingPhotoFiles++; console.log("MISSING PHOTO", p.src); }
  }
  renderGrid();
  const withPhotos = CARS.filter((c) => (PHOTOS[c.id] || []).length).length;
  console.log("cars:", CARS.length, "| variants:", variantCount, "| cars with photos:", withPhotos, "| render errors:", errors, "| missing photo files:", missingPhotoFiles);
  console.log("brands:", [...new Set(CARS.map((c) => c.brand))].join(", "));
  console.log("fuels:", el("#fuelChips").innerHTML.match(/data-fuel="[^"]+"/g).join(" "));
  process.exit(0);
})();
`;
global.require = require;
new Function("el", code.replace(/\nloadCars\(\);\s*$/, "\n") + test)(el);
