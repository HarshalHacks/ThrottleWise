const state = { query: "", fuel: "All", compare: [], currentId: null };

const $ = (sel) => document.querySelector(sel);

const SPEC_ROWS = [
  ["Brand", (c) => c.brand],
  ["Model", (c) => c.model],
  ["Variant", (c) => c.variant],
  ["Body type", (c) => c.bodyType],
  ["Fuel", (c) => c.fuel],
  ["Engine", (c) => c.engine.type],
  ["Cylinders", (c) => c.engine.cylinders],
  ["Displacement", (c) => `${c.engine.displacementCc} cc`],
  ["Aspiration", (c) => c.engine.aspiration],
  ["Max power", (c) => `${c.engine.maxPowerBhp} bhp @ ${c.engine.maxPowerRpm} rpm`],
  ["Max torque", (c) => `${c.engine.maxTorqueNm} Nm @ ${c.engine.maxTorqueRpm} rpm`],
  ["Idle / redline", (c) => `${c.engine.idleRpm} / ${c.engine.redlineRpm} rpm`],
  ["Transmission", (c) => c.transmission],
  ["Drivetrain", (c) => c.drivetrain],
  ["Seats", (c) => c.seats],
  ["Mileage (ARAI)", (c) => c.mileageArai ?? "Not yet verified"],
  ["Fuel tank", (c) => `${c.fuelTankL} L`],
  ["Data status", (c) => (c.verified ? "Verified" : "Unverified")],
  ["Source", (c) => `<a href="${c.sourceUrl}" target="_blank" rel="noopener">${c.sourceUrl}</a>`],
];

function renderFuelChips() {
  const fuels = ["All", ...new Set(CARS.map((c) => c.fuel))];
  $("#fuelChips").innerHTML = fuels
    .map((f) => `<button class="chip ${f === state.fuel ? "active" : ""}" data-fuel="${f}">${f}</button>`)
    .join("");
}

function filteredCars() {
  const q = state.query.trim().toLowerCase();
  return CARS.filter((c) => {
    const haystack = `${c.brand} ${c.model} ${c.variant} ${c.engine.type}`.toLowerCase();
    return (state.fuel === "All" || c.fuel === state.fuel) && haystack.includes(q);
  });
}

function renderGrid() {
  const cars = filteredCars();
  if (cars.length === 0) {
    $("#grid").innerHTML = `<p class="note">No cars match your search.</p>`;
    return;
  }
  $("#grid").innerHTML = cars
    .map((c) => {
      const inCompare = state.compare.includes(c.id);
      return `
        <article class="card">
          <span class="brand">${c.brand}</span>
          <h3>${c.model} ${c.variant}</h3>
          <span class="meta">${c.engine.displacementCc} cc · ${c.engine.cylinders} cyl · ${c.engine.maxPowerBhp} bhp · ${c.engine.maxTorqueNm} Nm</span>
          <span class="meta">${c.fuel} · ${c.transmission}</span>
          <span class="badge">${c.verified ? "Verified" : "Unverified data"}</span>
          <div class="actions">
            <button class="btn" data-open="${c.id}">View specs</button>
            <button class="btn ghost ${inCompare ? "active" : ""}" data-compare="${c.id}">${inCompare ? "Added" : "Compare"}</button>
          </div>
        </article>`;
    })
    .join("");
}

function renderCompare() {
  const section = $("#compareSection");
  if (state.compare.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  $("#compareCount").textContent = `(${state.compare.length}/2)`;
  const cars = state.compare.map((id) => CARS.find((c) => c.id === id));
  const rows = SPEC_ROWS.filter(([label]) => !["Source"].includes(label));
  $("#compareTable").innerHTML = `
    <tr><th></th>${cars.map((c) => `<th>${c.model} ${c.variant}</th>`).join("")}</tr>
    ${rows.map(([label, get]) => `<tr><th>${label}</th>${cars.map((c) => `<td>${get(c)}</td>`).join("")}</tr>`).join("")}`;
}

function carArtSvg(car) {
  return `
    <svg viewBox="0 0 400 200" role="img" aria-label="${car.brand} ${car.model} silhouette">
      <path d="M40 130 Q40 110 70 108 L120 98 Q150 60 220 58 Q280 58 310 98 L350 108 Q370 112 370 132 L370 142 L40 142 Z"
            fill="${car.verified ? "#3ccf91" : "#ff5a36"}" opacity="0.9"/>
      <path d="M140 98 Q165 72 220 72 Q265 72 285 98 Z" fill="#0d0f14" opacity="0.55"/>
      <circle cx="105" cy="146" r="24" fill="#0d0f14"/><circle cx="105" cy="146" r="10" fill="#8a93a6"/>
      <circle cx="305" cy="146" r="24" fill="#0d0f14"/><circle cx="305" cy="146" r="10" fill="#8a93a6"/>
      <text x="200" y="185" text-anchor="middle" fill="#8a93a6" font-size="14">${car.brand} ${car.model}</text>
    </svg>`;
}

function openDetail(id) {
  const car = CARS.find((c) => c.id === id);
  state.currentId = id;
  $("#detailTitle").textContent = `${car.brand} ${car.model} — ${car.variant}`;
  $("#carArt").innerHTML = carArtSvg(car);
  $("#specTable").innerHTML = SPEC_ROWS.map(([label, get]) => `<tr><th>${label}</th><td>${get(car)}</td></tr>`).join("");
  $("#detailSection").hidden = false;
  $("#rpmReadout").textContent = "0 rpm";
  $("#throttle").value = 0;
  $("#detailSection").scrollIntoView({ behavior: "smooth" });
}

function closeDetail() {
  stopEngine();
  state.currentId = null;
  $("#detailSection").hidden = true;
}

// --- Engine sound simulator ------------------------------------------------
// Four-stroke engines fire each cylinder once every two crank revolutions, so the
// firing frequency is (rpm / 60) * cylinders / 2. Real engines are too low to hear
// on laptop speakers, so the tone is raised by a fixed multiplier. Treat the result
// as a rough approximation of the engine's character, not a recording.
const PITCH_MULTIPLIER = 4;
let engine = null;

function firingHz(car, rpm) {
  return (rpm / 60) * (car.engine.cylinders / 2) * PITCH_MULTIPLIER;
}

function setEngineRpm(rpm) {
  if (!engine) return;
  const { ctx, osc1, osc2, filter, car } = engine;
  const now = ctx.currentTime;
  const hz = firingHz(car, rpm);
  osc1.frequency.setTargetAtTime(hz, now, 0.05);
  osc2.frequency.setTargetAtTime(hz / 2, now, 0.05);
  filter.frequency.setTargetAtTime(400 + (rpm / car.engine.redlineRpm) * 2600, now, 0.05);
  $("#rpmReadout").textContent = `${Math.round(rpm)} rpm`;
}

function startEngine(car) {
  stopEngine();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    $("#rpmReadout").textContent = "Audio not supported in this browser";
    return;
  }
  const ctx = new AudioCtx();
  const osc1 = ctx.createOscillator();
  osc1.type = "sawtooth";
  const osc2 = ctx.createOscillator();
  osc2.type = "square";
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 6;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc1.start();
  osc2.start();
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.4);
  engine = { ctx, osc1, osc2, filter, gain, car };
  setEngineRpm(car.engine.idleRpm);
  $("#soundToggle").textContent = "Stop engine";
  $("#soundToggle").classList.add("active");
}

function stopEngine() {
  if (!engine) return;
  const { ctx, gain, osc1, osc2 } = engine;
  gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
  setTimeout(() => {
    osc1.stop();
    osc2.stop();
    ctx.close();
  }, 500);
  engine = null;
  $("#soundToggle").textContent = "Start engine";
  $("#soundToggle").classList.remove("active");
  $("#rpmReadout").textContent = "0 rpm";
}

// --- Wiring ----------------------------------------------------------------
$("#search").addEventListener("input", (e) => {
  state.query = e.target.value;
  renderGrid();
});

$("#fuelChips").addEventListener("click", (e) => {
  const fuel = e.target.dataset.fuel;
  if (!fuel) return;
  state.fuel = fuel;
  renderFuelChips();
  renderGrid();
});

$("#grid").addEventListener("click", (e) => {
  const openId = e.target.dataset.open;
  const compareId = e.target.dataset.compare;
  if (openId) openDetail(openId);
  if (compareId) {
    const list = state.compare;
    if (list.includes(compareId)) {
      state.compare = list.filter((id) => id !== compareId);
    } else {
      state.compare = [...list.slice(-1), compareId];
    }
    renderGrid();
    renderCompare();
  }
});

$("#closeDetail").addEventListener("click", closeDetail);

$("#soundToggle").addEventListener("click", () => {
  if (engine) {
    stopEngine();
    return;
  }
  const car = CARS.find((c) => c.id === state.currentId);
  if (car) startEngine(car);
});

$("#throttle").addEventListener("input", (e) => {
  if (!engine) return;
  const { idleRpm, redlineRpm } = engine.car.engine;
  const t = Number(e.target.value) / 100;
  setEngineRpm(idleRpm + (redlineRpm - idleRpm) * t);
});

renderFuelChips();
renderGrid();
