# Update brief: photos, mileage and prices

You are improving ONE data file for an Indian car spec website. Today is 21 Oct 2026.
The file's format is described in RESEARCH_BRIEF.md in this same folder; read it first and keep the format exactly.
Accuracy matters more than completeness: **never fill a value from memory**. Only edit your own data file.

## 1. Photos (most important)
Fix every car in your file where:
- `photos.front` or `photos.rear` is null, or
- the photo shows an older generation or the pre-facelift look of the current model (check `photoNotes`, and look at the photo itself).

The site owner's rules for photos:
- The **current-generation, current-facelift, Indian-market** model.
- A **straight-on or near straight-on front** view for `front`, and a **straight-on or near straight-on rear** view for `rear`. Avoid side views.
- A **clean** car: no stickers, banners or dealer signs on the car, and a reasonably uncluttered background.
- Bright and sharp enough to see the car clearly.

Search **Wikimedia Commons only** (freely licensed). Use the Commons API, e.g. `list=search` with `srnamespace=14` to find the model's
category, then `generator=categorymembers` with `prop=imageinfo&iiprop=size|extmetadata`; also try `generator=search` with
`gsrnamespace=6`. Sub-categories by year or facelift often exist (e.g. "Category:Tata Nexon (2023)").
Keep requests modest; if you get "too many requests", wait a few seconds and retry.

**Check every candidate by eye before using it**: download a small preview with
`curl -sL -A "CarSpecHub/1.0" -o <file> "https://commons.wikimedia.org/wiki/Special:FilePath/<File_name>?width=400"`
into your scratch/temp folder (NOT the project folder), then open it with the Read tool to view it. Reject photos that break the rules.

When you set a new photo, write `{ "file": "File:...", "license": "...", "artist": "..." }` (licence short name and artist from
extmetadata) and do NOT include a `local` key; the site owner's download tool fills that in.
If a good photo already exists for that angle, leave it alone. If nothing on Commons meets the rules, leave the entry as it is
(or null) and explain in `photoNotes`, naming the closest candidate you rejected and why.

## 2. Mileage
For every variant with `mileage: null`, look again on the manufacturer site, then CarDekho / CarWale / Autocar India.
Use the official claimed (ARAI) figure if one exists. Otherwise use a labelled fallback, exactly as RESEARCH_BRIEF.md describes:
`"... (pre-facelift ARAI)"` when the engine is carried over, or `"... (unofficial estimate)"` when at least two car sites agree.
Leave null only if there is truly no figure anywhere.

## 3. Prices
Re-check each variant's `priceInr` against the manufacturer's Indian price page if it loads, otherwise against both CarDekho and
CarWale (New Delhi ex-showroom where a city is given). Fix wrong or stale prices and fill missing ones. Update the car's `priceNote`
to name the source and "Oct 2026".

## Record your changes
Append to each changed car's `notes` a line starting `Update 21 Oct 2026:` that says what changed (photos, mileage, prices) and any
conflicts. Validate that the file still parses as JSON before finishing.

## When you finish
Reply with ONLY a short summary (under 120 words): per car, photos added/replaced (front/rear), mileage figures filled,
prices changed; and which cars still lack a good photo. Do not paste JSON.
