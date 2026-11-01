# Spec audit brief

You are auditing engine and drivetrain specs on an Indian car spec website. Today is 21 Oct 2026.
Data format: see RESEARCH_BRIEF.md in this folder. Edit ONLY the data files named in your task. Never fill a value from memory.

For every car in your files, verify each entry in `engines` against the manufacturer's Indian spec page/brochure,
and if that won't load, against at least two of CarDekho, CarWale and Autocar India:
- displacementCc, cylinders, aspiration
- maxPowerBhp and maxPowerRpm (convert PS to bhp: bhp = PS x 0.9863; kW to bhp: x 1.341)
- maxTorqueNm and maxTorqueRpm
Also check each variant's `transmission` (type and number of gears), `drivetrain` and `fuel`, and that each variant points to the
right `engine` key (e.g. a CNG variant uses the CNG figures, a diesel AT uses the AT tune if it differs).

Rules:
- Fix anything wrong. Fill nulls where a source gives the figure. Leave null if no source states it.
- If sources disagree, use the manufacturer figure; else the figure two sources agree on; record the conflict.
- Do not change prices, mileage, features or photos.
- Append to each car's `notes` a line `Spec audit 21 Oct 2026:` listing what you changed, or "all engine figures confirmed".
- Validate the JSON parses before finishing.

Reply with ONLY a short summary (under 150 words): per car, "confirmed" or the exact corrections (old -> new), and any values still unconfirmed.
