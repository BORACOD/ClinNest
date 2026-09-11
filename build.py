import json, re

sections = json.load(open('/tmp/sections.json'))

def fix_html(html):
    # 1) Associate <label>Text</label> with the immediately following input/select via for="id"
    def label_sub(m):
        text, gap, tag, tid = m.group(1), m.group(2), m.group(3), m.group(4)
        return f'<label for="{tid}">{text}</label>{gap}{tag}'
    html = re.sub(
        r'<label>([^<]*)</label>(\s*)(<(?:input|select)\b[^>]*?\bid="([\w\-]+)"[^>]*>)',
        label_sub, html, flags=re.S
    )
    # 2) Explicit type="button" on every button (none live inside a <form>)
    html = html.replace('<button class="btn', '<button type="button" class="btn')
    # 3) scope="col" on plain table headers
    html = re.sub(r'<th>', '<th scope="col">', html)
    # 4) Wire up the visit-window example datalist instead of a dangling list= reference
    html = html.replace(
        '<input type="text" id="vw-schedule" placeholder="e.g. 14,3,Week 2" list="vw-examples">',
        '<input type="text" id="vw-schedule" placeholder="e.g. 14,3,Week 2" list="vw-examples" '
        'aria-describedby="vw-schedule-hint">\n'
        '        <datalist id="vw-examples">\n'
        '          <option value="14,3,Week 2">\n'
        '          <option value="28,5,Week 4">\n'
        '          <option value="0,0,Baseline / Day 1">\n'
        '        </datalist>'
    )
    # 5) Move the CTCAE search box's inline style to the .ctcae-search class + add an accessible label
    html = html.replace(
        '<input type="text" class="ctcae-search" id="ctcae-search" placeholder="Search a term (e.g. rash, neutrophil)…" oninput="filterCTCAE()" style="font-family:var(--mono); font-size:14px; padding:9px 10px; border:1px solid var(--line); border-radius:3px; background:var(--paper); width:100%; max-width:400px;">',
        '<label for="ctcae-search" class="visually-hidden">Search CTCAE terms</label>\n'
        '    <input type="text" class="ctcae-search" id="ctcae-search" '
        'placeholder="Search a term (e.g. rash, neutrophil)…" oninput="filterCTCAE()">'
    )
    # 6) aria-live on result output regions so calculated values are announced
    html = re.sub(r'<div class="result"', '<div class="result" aria-live="polite"', html)
    html = html.replace('<div id="vw-result"></div>', '<div id="vw-result" aria-live="polite"></div>')
    return html

for key in sections:
    sections[key] = fix_html(sections[key])

CATEGORIES = [
    {"id":"dates", "title":"Dates & Windows", "file":"dates.html",
     "desc":"Visit scheduling, protocol day conventions, and date math.",
     "tools":"Visit window calculator · Study day calculator · Date add/subtract",
     "content": sections["dates_flagship"] + "\n\n" + sections["dates_extra"]},
    {"id":"anthro", "title":"Anthropometric", "file":"anthropometric.html",
     "desc":"Body measurements used across dosing and eligibility screens.",
     "tools":"BMI · Body surface area (4 formulas)",
     "content": sections["anthro"]},
    {"id":"renal", "title":"PK / Renal", "file":"renal.html",
     "desc":"Renal function, cardiac interval correction, and dosing weight basis.",
     "tools":"Creatinine clearance / eGFR · QTc · Ideal & adjusted body weight",
     "content": sections["renal"]},
    {"id":"dosing", "title":"Dosing & Infusion", "file":"dosing.html",
     "desc":"Dose conversions, infusion math, and reference-date calculations.",
     "tools":"Dose conversion · Infusion rate · Age at date",
     "content": sections["dosing"]},
    {"id":"aesae", "title":"AE / SAE", "file":"ae-sae.html",
     "desc":"Causality assessment, grading reference, and expedited-reporting deadlines.",
     "tools":"SAE timeline · Naranjo scale · CTCAE v5.0 reference · Deviation classifier",
     "content": sections["aesae"]},
    {"id":"studyops", "title":"Study Operations", "file":"study-ops.html",
     "desc":"Reference tools for site-level study conduct.",
     "tools":"Block randomization generator",
     "content": sections["studyops"]},
    {"id":"accountability", "title":"Drug Accountability", "file":"accountability.html",
     "desc":"Investigational product compliance and reconciliation.",
     "tools":"IP compliance % · IP reconciliation log",
     "content": sections["accountability"]},
    {"id":"convert", "title":"Unit Converters", "file":"converters.html",
     "desc":"Common weight, height, temperature, and lab unit conversions.",
     "tools":"Weight · height · temperature · glucose · creatinine",
     "content": sections["convert"]},
    {"id":"scoring", "title":"Derm Scoring", "file":"derm-scoring.html",
     "desc":"Validated dermatology severity instruments.",
     "tools":"VASI · SALT · EASI",
     "badge": True,
     "content": sections["scoring"]},
]

def nav_html(active_id, prefix):
    links = []
    for c in CATEGORIES:
        cls = ' class="active"' if c["id"] == active_id else ''
        links.append(f'    <a href="{prefix}tools/{c["file"]}"{cls}>{c["title"]}</a>')
    return "\n".join(links)

def header_html(active_id, prefix):
    return f'''<div class="accent-bar"></div>
<header class="site">
  <a href="{prefix}index.html" class="brand">CRC OS <small>clinical research site tools</small></a>
  <a href="{prefix}index.html#tools" class="all-tools-link">All tools</a>
  <nav class="site-nav">
{nav_html(active_id, prefix)}
  </nav>
</header>'''

FOOTER = '''<footer class="site">
  CRC OS is decision support for clinical research staff. Every result should be independently verified against the governing protocol and source documents before use. Not a medical device. No patient identifiers are collected or stored by this tool.
</footer>'''

FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='14' fill='%231B2733'/%3E%3Ctext x='50' y='66' font-family='Georgia,serif' font-size='52' font-weight='600' fill='%232F7A6F' text-anchor='middle'%3EC%3C/text%3E%3C/svg%3E"

CSS_CONTENT = open('styles.css').read()
JS_CONTENT = open('calculators.js').read()

def page_wrap(title, description, header, main_content, footer, prefix, is_home):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#2F7A6F">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:type" content="website">
<link rel="icon" href="{FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
{CSS_CONTENT}
</style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
{header}
<main id="main">
{main_content}
</main>
{footer}
<script>
{JS_CONTENT}
</script>
</body>
</html>
'''

# ---- Build each tool page ----
for c in CATEGORIES:
    badge = ' <span class="badge">Site license</span>' if c.get("badge") else ''
    note = ''
    if c.get("badge"):
        note = '<p class="lede" style="max-width:640px;">These instruments require training to administer reliably. The site license tier adds subject-linked history, photo attachment, and the full validation package (URS/FS/VTS) behind the calculators below — fully functional here as a preview.</p>'
    main_content = f'''<div class="page-head">
  <div class="eyebrow">Tools / {c["title"]}</div>
  <h1>{c["title"]}{badge}</h1>
  <p class="lede">{c["desc"]}</p>
  {note}
</div>

<div class="section">
{c["content"]}
</div>'''
    html = page_wrap(
        f'{c["title"]} — CRC OS',
        f'{c["desc"]} Free, no-login clinical calculators for research coordinators — {c["tools"]}.',
        header_html(c["id"], "../"), main_content, FOOTER, "../", False
    )
    open(f'tools/{c["file"]}', 'w').write(html)
    print("wrote", f'tools/{c["file"]}', len(html), "bytes")

# ---- Build home page ----
cards = []
for i, c in enumerate(CATEGORIES):
    badge = ' <span class="badge">Site license</span>' if c.get("badge") else ''
    n = c["tools"].count("·") + 1
    cards.append(f'''  <a class="cat-card" href="tools/{c["file"]}">
    <div class="cat-index">{i+1:02d}</div>
    <div class="cat-name">{c["title"]}{badge}</div>
    <div class="cat-count">{n} tool{'s' if n != 1 else ''}</div>
    <div class="cat-desc">{c["desc"]}</div>
    <div class="cat-tools">{c["tools"]}</div>
  </a>''')

home_main = f'''<div class="home-hero">
  <div class="eyebrow">Clinical research site tools</div>
  <h1>The math you're doing on a calculator between EDC screens.</h1>
  <p class="lede">Free clinical calculators built for site coordinators — no login, no PHI stored, every result shows its formula.</p>
  <p class="home-meta">22 tools across 9 categories</p>
</div>

<div class="cat-grid" id="tools">
{chr(10).join(cards)}
</div>

<div class="principles">
  <h2>How this is built</h2>
  <div class="principle-row"><div class="p-term">No PHI, ever</div><div class="p-desc">No field accepts a name, date of birth, or MRN. Screening-number patterns only — the free and Pro tiers are architecturally incapable of receiving identifiers.</div></div>
  <div class="principle-row"><div class="p-term">Shows its work</div><div class="p-desc">Every result displays the formula and inputs used. Nothing here is a black box you have to trust blindly.</div></div>
  <div class="principle-row"><div class="p-term">Copy for source note</div><div class="p-desc">Every calculator has a one-tap copy formatted for pasting straight into a source document or EDC comment field.</div></div>
  <div class="principle-row"><div class="p-term">Decision support only</div><div class="p-desc">Not a medical device. Every result should be independently verified against the governing protocol before use.</div></div>
</div>'''

home_html = page_wrap(
    "CRC OS — Clinical research site tools",
    "Free clinical calculators and reference tools for clinical research coordinators — visit windows, dosing, renal function, AE/SAE, and validated dermatology scoring. No login, no PHI stored.",
    header_html("", ""), home_main, FOOTER, "", True
)
open('index.html', 'w').write(home_html)
print("wrote index.html", len(home_html), "bytes")
