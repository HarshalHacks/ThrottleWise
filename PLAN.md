# Indian Car Engine & Spec Hub — Project Plan

## 1. Research summary

**Existing spec sites (India)**
- [CarWale](https://www.carwale.com) — large variant database, shows ARAI mileage and separate user-reported mileage.
- [CarDekho](https://www.cardekho.com) — broad coverage, spec pages plus editorial content.
- [Autocar India](https://www.autocarindia.com) — per-variant spec pages (engine, power/torque with RPM, gearbox, tank, CNG data).
- ZigWheels — popular, but its page structure could not be confirmed during research.

Lesson: sites disagree slightly on power and torque. Store the source and the test standard for each figure.

**Viewer experience and realism**
- Strong examples use real-time 3D (WebGL) with camera moves between options, as in Smart's EV configurator.
- Practical stacks: Three.js or React Three Fiber, optionally with GSAP for animation.
- Keep models and textures light so mobile pages load fast.
- Pair photoreal visuals with clear, logical menus.

**Data required per variant**
- Identity: brand, model, variant, body type, model year, market (India).
- Engine: type, displacement, cylinders, aspiration, max power (bhp @ rpm), max torque (Nm @ rpm), redline, idle RPM.
- Drivetrain and gearbox: transmission type, gears, drive layout.
- Efficiency: ARAI-certified mileage, plus a separate user-reported field if available. CNG range in km/kg.
- Dimensions and capacity: ground clearance, boot space, fuel tank, seats.
- Status: data source, date checked, verification status.

**Official data**
- No public ARAI or government API surfaced during research. Commercial vendors (for example Segmenty) sell India-wide spec data, but that is a paid licence.

**Engine sound**
- Recorded sounds from commercial libraries need a licence that covers commercial and web use. Free download sites usually don't state licence terms, so they are not safe to use.
- Realistic in-browser option: synthesise the engine with the Web Audio API. Use oscillators with a low-pass filter and firing-order maths tied to cylinder count and RPM. Use AudioWorklet for custom DSP in production.
- Honest claim: a synthesised sound is an approximation, not a recording of a specific car. Exact recordings need either a licence or new recordings made with permission.

## 2. Product scope

**MVP (this build)**
- Catalogue with search and fuel-type filter.
- Car detail view with a full spec table and a data status badge.
- Side-by-side comparison of two cars.
- Engine sound simulator (idle, throttle, redline) driven by each car's engine data.

**Not in MVP**
- Full India-wide coverage (needs a data pipeline, see below).
- Licensed recordings of real engine sounds.
- 3D car models and user reviews.

## 3. Data pipeline (next phase)
1. Collect each variant's spec page from manufacturer sites and at least one major portal.
2. Enter values into `data.js` with a `sourceUrl` and `checkedOn` date.
3. Flag mismatches between sources for review.
4. Mark each car `verified` only after a human check.

## 4. Roadmap
- **Phase 1 (now):** MVP with 4 sample cars.
- **Phase 2:** 50–100 popular Indian models with verified data; add a database and an admin form.
- **Phase 3:** 3D models with a configurator, licensed or self-recorded engine sounds, user reviews.

## 5. Open items
- Confirm the target market (assumed India).
- Decide on a licensing route for real engine recordings.
- Choose the production stack (static site with JSON, or Next.js plus a database).
