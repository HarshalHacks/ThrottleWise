# Research brief: Indian car spec site

You are researching cars for a website that helps Indian new-car buyers compare variants.
Today is 21 Oct 2026. Research the **current Indian-market line-up as on sale now** using the web
(WebSearch / WebFetch). Accuracy matters more than completeness: **never fill a value from memory**.

## Sources, in order of preference
1. The manufacturer's Indian website (price page, brochure, specs page).
2. CarDekho, CarWale, Autocar India (variant and spec pages). Cross-check at least two where you can.
If sources disagree, use the manufacturer figure and mention the conflict in `notes`.
If a model was recently facelifted or renamed, use the current version and say so in `notes`.

## What to collect per car
- Every variant currently sold (each distinct trim + engine + gearbox [+ drivetrain] combination).
- Ex-showroom price in INR (New Delhi if the source states a city). One `priceNote` per car naming
  the source and month, e.g. "marutisuzuki.com, Oct 2026" or "CarDekho New Delhi, Oct 2026".
- Engine figures per engine: cylinders, displacement cc, aspiration, max power (bhp) and rpm, max torque (Nm) and rpm.
  rpm may be a range string like "1500-2750"; use null if not found.
- Claimed mileage per variant (manufacturer / ARAI). If the official figure for the current model is not
  published, you MAY use a clearly labelled fallback and must label it in the string itself:
  `"19.01 kmpl (pre-facelift ARAI)"` when the engine is carried over, or `"15.2 kmpl (unofficial estimate)"`
  when only car sites agree on a figure. Otherwise null.
- Wheels and airbag count per trim.
- Features per trim: up to 8 short phrases for what that trim ADDS over the trim below it
  (the lowest trim lists its key standard features). Use plain buyer-friendly phrases
  ("Sunroof", "Rear camera", "Wireless Android Auto and Apple CarPlay").
- `extras`: for a variant that is not the trim's base powertrain, the short list of what that
  powertrain adds (e.g. ["6-speed torque-converter automatic", "Paddle shifters"]) or ["Factory-fitted CNG kit"].
- Fuel tank litres and seats if found.

## Photos (do NOT download anything)
For each car, look on Wikimedia Commons for one **front** and one **rear** photo of the **current-generation,
Indian-market** model. Prefer: straight-on or near straight-on views, clean car (no stickers/banners),
uncluttered background, freely licensed. Use the Commons API, e.g.
`https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=Category:<Model>&gcmtype=file&prop=imageinfo&iiprop=size|extmetadata&format=json`
or `list=search` with `srnamespace=14` to find the model's category. Record the exact Commons file title,
licence short name and artist. If nothing suitable exists, set it to null and say why in `photoNotes`.
Keep Commons API calls modest (it rate-limits); pause briefly if you get "too many requests".

## Output
Write ONE JSON file (UTF-8, valid JSON, no comments) at the path given in your task, with this shape:

```json
{
  "cars": [
    {
      "id": "hyundai-creta",
      "brand": "Hyundai",
      "model": "Creta",
      "bodyType": "SUV",
      "seats": 5,
      "fuelTankL": 50,
      "priceNote": "hyundai.com/in, Oct 2026",
      "engines": {
        "p15": { "type": "1.5 MPi petrol", "cylinders": 4, "displacementCc": 1497, "aspiration": "Naturally aspirated",
                 "maxPowerBhp": 113, "maxPowerRpm": 6300, "maxTorqueNm": 143.8, "maxTorqueRpm": 4500 }
      },
      "trims": [
        { "trim": "E", "wheels": "16-inch steel", "airbags": 6, "features": ["6 airbags", "ESC", "..."] }
      ],
      "variants": [
        { "trim": "E", "power": "1.5 Petrol MT", "engine": "p15", "fuel": "Petrol",
          "transmission": "Manual, 6-speed", "drivetrain": "FWD", "priceInr": 1100000,
          "mileage": "17.4 kmpl", "wheels": null, "airbags": null, "extras": [] }
      ],
      "photos": {
        "front": { "file": "File:Example front.jpg", "license": "CC BY-SA 4.0", "artist": "Name" },
        "rear": null
      },
      "photoNotes": "No current-generation rear photo on Commons",
      "sources": ["https://..."],
      "notes": "Conflicts, gaps, renames"
    }
  ]
}
```

Rules for the JSON:
- `aspiration` is one of: "Naturally aspirated", "Turbocharged", "Turbocharged diesel".
  For strong hybrids, describe the petrol engine and put "Strong hybrid" in the engine `type`.
- `fuel` is one of: "Petrol", "Diesel", "CNG", "Hybrid".
- `power` is a short button label combining engine and gearbox (and drivetrain if it varies), e.g.
  "1.5 Petrol MT", "1.5 Turbo DCT", "2.2 Diesel 4WD AT", "CNG MT". Keep it under ~20 characters.
- `trims` are ordered lowest to highest. Every variant's `trim` must exist in `trims`.
- Within a trim, list the base powertrain variant first.
- Variant `wheels`/`airbags` are null unless that variant differs from its trim.
- Use null for anything you could not confirm. Never guess.

## Electric vehicles (EVs)
If your task includes EVs, do NOT skip them. For an EV:
- `fuel` is "Electric". `transmission` is "Single-speed automatic" (or as the maker states). `drivetrain` as usual.
- In `engines`, describe the motor instead: `"type": "Permanent-magnet synchronous motor"` (or as stated), `"cylinders": null`,
  `"displacementCc": null`, `"aspiration": "Electric"`, `maxPowerBhp` / `maxTorqueNm` = the MOTOR's rated output (convert kW to bhp: x 1.341).
- Add an `"ev"` object on each variant (or on the engine entry if it's per-battery-pack):
  `"ev": { "batteryKwh": 30.2, "rangeKm": 315, "rangeStandard": "ARAI" | "MIDC" | "WLTP" | "claimed", "dcChargeKw": 50,
            "dcChargeNote": "10-80% in 56 min", "acChargeNote": "7.2 kW: 0-100% in 4.5 h" }` — null for anything not confirmed.
- `mileage` is null for EVs (range replaces it). Put the official claimed range in `rangeKm`, with the standard it was measured under.
- Everything else (prices, trims, features, photos) exactly as for other cars. State in `notes` if the maker sells the EV under a separate brand site.

## When you finish
Reply with ONLY a short summary (under 120 words): cars done, variant count per car, number of
photos found (front/rear), and the main gaps or conflicts. Do not paste the JSON into your reply.
