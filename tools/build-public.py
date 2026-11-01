"""Build the public, search-engine-ready copy of ThrottleWise.

Reads indian-car-specs/site.html (the artifact page) and writes ../throttlewise-site/
plus ../throttlewise-site.zip, ready to drag onto Netlify.

Usage (from the indian-car-specs folder):  python -I tools/build-public.py
"""
import json, os, re, shutil, sys

SITE_URL = "https://throttlewise.netlify.app/"
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(os.path.dirname(root), "throttlewise-site")
os.chdir(root)

if os.path.exists(out):
    shutil.rmtree(out)
os.makedirs(os.path.join(out, "data"))
os.makedirs(os.path.join(out, "photos"))

site = open("site.html", encoding="utf-8").read()
body = site.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
body = body.replace('<meta charset="utf-8">\n<title>ThrottleWise</title>\n', "")

seo = f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>ThrottleWise – Every Indian car variant, explained</title>
<meta name="description" content="Compare every variant of 100+ cars sold in India: real prices, engine specs, mileage, features, on-road price and EMI calculator, Find-My-Car quiz and Car Battle.">
<meta name="keywords" content="car specs India, car variants, on-road price calculator, EMI calculator, car comparison India, Maruti, Hyundai, Tata, Mahindra, Kia, Toyota">
<meta name="robots" content="index, follow">
<meta name="author" content="Harshal Singh">
<link rel="canonical" href="{SITE_URL}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ThrottleWise">
<meta property="og:title" content="ThrottleWise – Every Indian car variant, explained">
<meta property="og:description" content="Real prices, specs, mileage and features for every variant of 100+ cars sold in India, plus an on-road price and EMI calculator.">
<meta property="og:image" content="{SITE_URL}photos/hyundai-creta-front.jpg">
<meta property="og:url" content="{SITE_URL}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"WebSite","name":"ThrottleWise","url":"{SITE_URL}","author":{{"@type":"Person","name":"Harshal Singh","email":"sparkxd46@gmail.com"}},"description":"Every Indian car variant, explained: prices, specs, mileage, features and on-road cost."}}</script>
'''
html = "<!doctype html>\n<html lang=\"en\">\n<head>\n" + seo + body
# The artifact host supplies these basics; a standalone page must set them itself.
html = html.replace("<style>\n", "<style>\nhtml{color-scheme:light}\nbody{margin:0}\n[hidden]{display:none!important}\nimg{max-width:100%}\n", 1)
# Netlify's free plan injects a "Powered by Netlify" badge (an iframe, ~64px tall) fixed to the
# bottom-right, at the maximum z-index, so it would sit on top of the engine start button.
# It can't be removed on the free plan, so lift the button clear of it on the public site only.
html = html.replace("</style>\n", ".start-dock { bottom: calc(92px + env(safe-area-inset-bottom, 0px)); }\n</style>\n</head>\n<body>\n", 1)
html = html.rstrip() + "\n</body>\n</html>\n"
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(html)

open(os.path.join(out, "favicon.svg"), "w", encoding="utf-8").write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 38"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
    '<stop offset="0" stop-color="#2f5bff"/><stop offset="1" stop-color="#1235c9"/></linearGradient></defs>'
    '<rect width="38" height="38" rx="11" fill="url(#g)"/>'
    '<path d="M9 25.5a10.5 10.5 0 0 1 17.4-7.9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>'
    '<path d="M26.4 17.6a10.5 10.5 0 0 1 2.6 7.9" fill="none" stroke="#ff4d3d" stroke-width="2.6" stroke-linecap="round"/>'
    '<path d="M19.5 25.5l7.2-5.4" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="19.5" cy="25.5" r="2.6" fill="#fff"/></svg>')

# Data files, and only the photos the site actually references: the hand-built cars'
# photos (src: "photos/...") plus any image used directly in the page markup, such as
# the creator avatar (src="photos/...").
used = set(re.findall(r'src: "(photos/[^"]+)"', site))
used |= set(re.findall(r'src="(photos/[^"]+)"', site))
for f in os.listdir("data"):
    if not f.endswith(".json"):
        continue
    shutil.copy(os.path.join("data", f), os.path.join(out, "data", f))
    if f == "onroad.json":
        continue
    for c in json.load(open(os.path.join("data", f), encoding="utf-8"))["cars"]:
        for a in ("front", "rear"):
            p = (c.get("photos") or {}).get(a)
            if p and p.get("local"):
                used.add(p["local"])
missing = [p for p in sorted(used) if not os.path.exists(p)]
for p in used:
    if os.path.exists(p):
        shutil.copy(p, os.path.join(out, p))

open(os.path.join(out, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}sitemap.xml\n")
open(os.path.join(out, "sitemap.xml"), "w").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    f'<url><loc>{SITE_URL}</loc><changefreq>weekly</changefreq></url></urlset>\n')

zip_base = os.path.join(os.path.dirname(root), "throttlewise-site")
if os.path.exists(zip_base + ".zip"):
    os.remove(zip_base + ".zip")
shutil.make_archive(zip_base, "zip", out)
size = os.path.getsize(zip_base + ".zip") / 1048576
print(f"built {out}: {len(used) - len(missing)} photos, zip {size:.1f} MB")
if missing:
    print("MISSING photos:", missing, file=sys.stderr)
    sys.exit(1)
