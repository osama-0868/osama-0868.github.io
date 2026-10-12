#!/usr/bin/env python3
"""
Builds index.html for osama-0868.github.io from content.py.

    python build.py

Browsers can only run HTML, CSS and JavaScript, so this script generates the
page from Python data and style.css / script.js bring it to life. The same data
also feeds the interactive terminal on the site, so every fact is written once.
"""
from __future__ import annotations

import json
import re
from html import escape as esc
from pathlib import Path

import content as C

ROOT = Path(__file__).resolve().parent

# ---------------------------------------------------------------- icons

ICONS = {
    "sun": '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
    "moon": '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    "sliders": '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    "mail": '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M22 6l-10 7L2 6"/>',
    "github": '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
    "linkedin": '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    "ext": '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
    "copy": '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    "send": '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    "arrow": '<path d="M5 12h14M12 5l7 7-7 7"/>',
    "terminal": '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
}


def icon(name: str, cls: str = "ico") -> str:
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'


def sprite() -> str:
    symbols = "".join(f'<symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONS.items())
    return f'<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">{symbols}</svg>'


# ---------------------------------------------------------------- helpers

KEYWORDS = {
    "java": {"public", "class", "String", "boolean", "true", "false", "new"},
    "python": {"True", "False", "None", "def", "class", "import"},
}
TOKEN = re.compile(r'(?P<c>#.*$)|(?P<s>"(?:[^"\\]|\\.)*")|(?P<w>[A-Za-z_][A-Za-z0-9_]*)')


def highlight(line: str, lang: str) -> str:
    """Tiny syntax highlighter for the hero code card."""
    out, pos = [], 0
    for m in TOKEN.finditer(line):
        out.append(esc(line[pos:m.start()]))
        if m.group("c"):
            out.append(f'<span class="c">{esc(m.group("c"))}</span>')
        elif m.group("s"):
            out.append(f'<span class="s">{esc(m.group("s"))}</span>')
        else:
            word = m.group("w")
            if word in KEYWORDS[lang]:
                out.append(f'<span class="k">{word}</span>')
            elif lang == "java" and word == "Osama":
                out.append(f'<span class="t">{word}</span>')
            else:
                out.append(word)
        pos = m.end()
    out.append(esc(line[pos:]))
    return "".join(out)


def kinetic(text: str) -> str:
    """Split a name into words and letters so each letter can react to the cursor."""
    words, i = [], 0
    for word in text.split(" "):
        chars = []
        for ch in word:
            chars.append(f'<span class="ch" style="--i:{i}">{esc(ch)}</span>')
            i += 1
        words.append(f'<span class="word">{"".join(chars)}</span>')
        i += 1
    return " ".join(words)


def words(text: str) -> str:
    return " ".join(f'<span class="w">{esc(w)}</span>' for w in text.split())


def chips(items, small: bool = False) -> str:
    cls = "chips small" if small else "chips"
    return f'<ul class="{cls}">' + "".join(f"<li>{esc(i)}</li>" for i in items) + "</ul>"


def social(extra_mail: bool = True) -> str:
    s = C.SITE
    items = [
        f'<li><a href="{esc(s["github"])}" target="_blank" rel="noopener" aria-label="Osama on GitHub">{icon("github")}</a></li>',
        f'<li><a href="{esc(s["linkedin"])}" target="_blank" rel="noopener" aria-label="Osama on LinkedIn">{icon("linkedin")}</a></li>',
    ]
    if extra_mail:
        items.append(f'<li><a href="mailto:{esc(s["email"])}" aria-label="Email Osama">{icon("mail")}</a></li>')
    return '<ul class="social">' + "".join(items) + "</ul>"


# ---------------------------------------------------------------- sections

SECTIONS = [("home", "Top"), ("about", "About"), ("skills", "Skills"), ("projects", "Projects"),
            ("education", "Education"), ("contact", "Contact")]


def header() -> str:
    links = "".join(
        f'<li><a href="#{sid}" class="nav-link">{label}</a></li>' for sid, label in SECTIONS[1:]
    )
    dots = "".join(
        f'<a href="#{sid}" class="dot-link" data-label="{label}" aria-label="{label}"></a>' for sid, label in SECTIONS
    )
    return f"""
    <header class="header" id="header">
        <nav class="nav container" aria-label="Primary">
            <a href="#home" class="brand" aria-label="Osama Jamal, back to top">
                <span class="brand-mark">OJ</span>
                <span class="brand-name">{esc(C.SITE["name"])}</span>
            </a>
            <ul class="nav-links" id="navLinks">{links}</ul>
            <div class="nav-actions">
                <button class="icon-btn" id="themeToggle" type="button" aria-label="Switch between light and dark mode">
                    {icon("sun", "ico ico-sun")}{icon("moon", "ico ico-moon")}
                </button>
                <button class="icon-btn" id="settingsToggle" type="button" aria-label="Open appearance settings" aria-expanded="false" aria-controls="settingsPanel">
                    {icon("sliders")}
                </button>
                <button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks">
                    <span></span><span></span>
                </button>
            </div>
        </nav>
    </header>
    <nav class="dots-nav" aria-label="Sections">{dots}</nav>
    <aside class="settings" id="settingsPanel" aria-label="Appearance settings" aria-hidden="true">
        <p class="settings-title">Appearance</p>
        <div class="setting">
            <span class="setting-label">Mode</span>
            <div class="seg" role="group" aria-label="Color mode">
                <button type="button" data-mode="light" aria-pressed="false">Light</button>
                <button type="button" data-mode="dark" aria-pressed="true">Dark</button>
                <button type="button" data-mode="system" aria-pressed="false">Auto</button>
            </div>
        </div>
        <div class="setting">
            <span class="setting-label">Accent color</span>
            <div class="swatches" role="group" aria-label="Accent color">
                <button type="button" class="swatch" data-accent="kigali" aria-label="Kigali: sky blue and sun yellow" aria-pressed="true"></button>
                <button type="button" class="swatch" data-accent="aurora" aria-label="Aurora: violet and cyan" aria-pressed="false"></button>
                <button type="button" class="swatch" data-accent="ember" aria-label="Ember: orange and rose" aria-pressed="false"></button>
                <button type="button" class="swatch" data-accent="jade" aria-label="Jade: green and sky" aria-pressed="false"></button>
            </div>
        </div>
        <div class="setting setting-row">
            <span class="setting-label" id="fxLabel">Animated effects</span>
            <button type="button" class="switch" id="fxSwitch" role="switch" aria-checked="true" aria-labelledby="fxLabel"><span></span></button>
        </div>
    </aside>"""


def hero() -> str:
    s = C.SITE
    return f"""
        <section id="home" class="hero">
            <canvas id="net" class="net" aria-hidden="true"></canvas>
            <div class="container hero-grid">
                <div class="hero-copy">
                    <p class="status reveal"><span class="pulse"></span>{esc(s["status"])}</p>
                    <h1 class="hero-name" aria-label="{esc(s["name"])}"><span aria-hidden="true">{kinetic(s["name"])}</span></h1>
                    <h2 class="hero-role reveal" id="heroRole">{esc(C.HERO["role"])}</h2>
                    <p class="hero-text reveal">{esc(C.HERO["text"])}</p>
                    <div class="hero-cta reveal">
                        <a href="#projects" class="btn btn-glow magnetic">See my projects</a>
                        <a href="#contact" class="btn btn-ghost magnetic">Get in touch</a>
                    </div>
                    <div class="hero-foot reveal">
                        {social()}
                        <button class="hint" type="button" id="hintTerm">{icon("terminal")}<span>Try the terminal</span><kbd>&#96;</kbd></button>
                    </div>
                </div>
                <div class="hero-visual reveal">
                    <div class="code-card" data-tilt="5">
                        <div class="code-top">
                            <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
                            <div class="code-tabs" role="tablist" aria-label="Choose a language">
                                <button type="button" class="code-tab active" role="tab" aria-selected="true" data-lang="java">Osama.java</button>
                                <button type="button" class="code-tab" role="tab" aria-selected="false" data-lang="python">osama.py</button>
                            </div>
                        </div>
                        <pre class="code-body" aria-label="A short code snippet describing Osama"><code id="codeEl"></code></pre>
                    </div>
                </div>
            </div>
        </section>"""


def marquee() -> str:
    def row(cls: str) -> str:
        unit = "".join(
            f'<span class="m-item">{esc(i)}</span><span class="m-dot"></span>' for i in C.MARQUEE * 2
        )
        return (f'<div class="marq {cls}"><div class="marq-track">'
                f'<div class="marq-unit">{unit}</div><div class="marq-unit">{unit}</div></div></div>')

    return f'<section class="marquee" aria-hidden="true">{row("marq-a")}{row("marq-b")}</section>'


def about() -> str:
    s = C.SITE
    facts = "".join(f"<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>" for k, v in C.FACTS)
    return f"""
        <section id="about" class="section">
            <div class="container">
                <h2 class="section-title reveal">About me</h2>
                <p class="statement" id="statement" aria-label="{esc(C.STATEMENT)}"><span aria-hidden="true">{words(C.STATEMENT)}</span></p>
                <div class="about-grid">
                    <figure class="photo reveal" data-tilt="4">
                        <div class="photo-ring">
                            <img src="{esc(s["photo"])}" alt="Portrait of {esc(s["name"])}" loading="lazy" onerror="this.style.display='none';this.parentNode.classList.add('no-photo')">
                            <span class="photo-fallback" aria-hidden="true">OJ</span>
                        </div>
                    </figure>
                    <dl class="facts reveal">
                        {facts}
                        <div><dt>Email</dt><dd><a href="mailto:{esc(s["email"])}">{esc(s["email"])}</a></dd></div>
                    </dl>
                </div>
            </div>
        </section>"""


def skills() -> str:
    groups = []
    for g in C.SKILLS:
        cls = "skill learning" if g.get("learning") else "skill"
        items = "".join(f'<li class="{cls}"><span>{esc(i)}</span></li>' for i in g["items"])
        groups.append(
            f'<div class="skill-group reveal"><h3>{esc(g["group"])}</h3><ul class="skill-words">{items}</ul></div>'
        )
    return f"""
        <section id="skills" class="section">
            <div class="container">
                <h2 class="section-title reveal">Skills</h2>
                <p class="lead reveal">What I use today, and what I'm picking up next. Outlined words are the ones I'm still learning.</p>
                <div class="skill-rows">{"".join(groups)}</div>
            </div>
        </section>"""


def projects() -> str:
    panels = []
    for p in C.PROJECTS:
        links = "".join(
            f'<a class="link-btn" href="{esc(url)}" target="_blank" rel="noopener">{esc(label)} {icon("ext")}</a>'
            for label, url in p["links"]
        )
        panels.append(f"""
                    <article class="panel" data-tilt="2">
                        <div class="cover {esc(p["cover"])}" aria-hidden="true">
                            <span class="cover-mark">{esc(p["mark"])}</span>
                            <span class="cover-sub">{esc(p["kind"])}</span>
                        </div>
                        <div class="panel-body">
                            <h3>{esc(p["title"])}</h3>
                            <p>{esc(p["blurb"])}</p>
                            {chips(p["tags"], small=True)}
                            <div class="project-links">{links}</div>
                        </div>
                    </article>""")
    n = len(C.PROJECTS)
    return f"""
        <section id="projects" class="hscroll static" data-hscroll>
            <div class="hscroll-pin">
                <div class="hscroll-head container">
                    <div>
                        <h2 class="section-title">Projects</h2>
                        <p class="lead">Three things I've built. Scroll to move through them.</p>
                    </div>
                    <div class="hmeta"><span class="hcount" id="hcount">1 / {n}</span><div class="hprogress"><span></span></div></div>
                </div>
                <div class="hscroll-track">{"".join(panels)}
                    <a class="panel panel-end" href="{esc(C.SITE["github"])}" target="_blank" rel="noopener">
                        <span class="end-title">More on GitHub</span>
                        {icon("arrow", "ico end-arrow")}
                    </a>
                </div>
            </div>
        </section>"""


def education() -> str:
    items = "".join(f"""
                    <li class="t-item">
                        <span class="t-dot" aria-hidden="true"></span>
                        <div class="t-card">
                            <span class="t-tag">{esc(e["tag"])}</span>
                            <h3>{esc(e["title"])}</h3>
                            <p class="t-sub">{esc(e["place"])}</p>
                            <p>{esc(e["text"])}</p>
                        </div>
                    </li>""" for e in C.EDUCATION)
    return f"""
        <section id="education" class="section">
            <div class="container">
                <h2 class="section-title reveal">Education</h2>
                <p class="lead reveal">University studies, plus the things I teach myself on the side.</p>
                <ol class="timeline">{items}
                </ol>
            </div>
        </section>"""


def contact() -> str:
    s = C.SITE
    ring_text = "Say hello · Say hello · Say hello · "
    return f"""
        <section id="contact" class="section contact">
            <div class="container contact-grid">
                <div class="contact-copy">
                    <h2 class="section-title reveal">Get in touch</h2>
                    <p class="lead reveal">I'm looking for an internship or a junior software role. If you have an opening, a question or a project in mind, write to me.</p>
                    <div class="contact-actions reveal">
                        <button type="button" class="btn btn-glow magnetic" id="copyEmail">{icon("copy")}<span id="copyLabel">Copy email</span></button>
                        <a class="btn btn-ghost magnetic" href="mailto:{esc(s["email"])}">Email me directly</a>
                    </div>
                    <p class="contact-mail reveal">{esc(s["email"])}</p>
                    <p class="sr-only" id="copyStatus" role="status" aria-live="polite"></p>
                    <div class="contact-row reveal">
                        <a class="hello magnetic" href="mailto:{esc(s["email"])}" aria-label="Email Osama">
                            <svg class="hello-ring" viewBox="0 0 200 200" aria-hidden="true">
                                <defs><path id="circ" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs>
                                <text><textPath href="#circ" textLength="480" lengthAdjust="spacing">{esc(ring_text)}</textPath></text>
                            </svg>
                            {icon("arrow", "ico hello-arrow")}
                        </a>
                        {social(extra_mail=False)}
                    </div>
                </div>
                <form id="contactForm" class="form reveal">
                    <div class="field"><label for="name">Your name</label><input type="text" id="name" name="name" autocomplete="name" required></div>
                    <div class="field"><label for="email">Your email</label><input type="email" id="email" name="email" autocomplete="email" required></div>
                    <div class="field"><label for="subject">Subject</label><input type="text" id="subject" name="subject" required></div>
                    <div class="field"><label for="message">Message</label><textarea id="message" name="message" rows="5" required></textarea></div>
                    <button type="submit" class="btn btn-glow magnetic">{icon("send")}<span>Send message</span></button>
                    <p class="form-note" id="formNote">This opens your email app with the message filled in.</p>
                </form>
            </div>
        </section>"""


def footer() -> str:
    return f"""
    <footer class="footer">
        <div class="container">
            <p class="big-name" id="bigName" aria-hidden="true">{esc(C.SITE["name"])}</p>
            <div class="footer-inner">
                <p>&copy; <span id="year">2026</span> {esc(C.SITE["name"])}. {esc(C.SITE["location"])}.</p>
                <p class="built">Page built with Python. Animated with JavaScript.</p>
                <a href="#home" class="text-link">Back to top</a>
            </div>
        </div>
    </footer>"""


def terminal() -> str:
    return f"""
    <button class="term-toggle" id="termToggle" type="button" aria-label="Open the terminal" aria-expanded="false" aria-controls="term">{icon("terminal")}<span>Terminal</span></button>
    <section class="term" id="term" role="dialog" aria-label="Interactive terminal" aria-hidden="true">
        <div class="term-top">
            <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="term-title">osama@portfolio: ~</span>
            <button class="term-close" id="termClose" type="button" aria-label="Close the terminal">&times;</button>
        </div>
        <div class="term-out" id="termOut" role="log" aria-live="polite"></div>
        <form class="term-in" id="termForm" autocomplete="off">
            <label for="termInput" class="prompt">$</label>
            <input id="termInput" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Type a command">
        </form>
    </section>"""


def boot() -> str:
    return """
    <div class="boot" id="boot" aria-hidden="true">
        <div class="boot-box">
            <div class="boot-lines" id="bootLines"></div>
            <div class="boot-bar"><span id="bootBar"></span></div>
            <button type="button" class="boot-skip" id="bootSkip">Skip intro</button>
        </div>
    </div>"""


# ---------------------------------------------------------------- data for script.js

def site_data() -> dict:
    s = C.SITE
    return {
        "name": s["name"],
        "role": C.HERO["role"],
        "status": s["status"],
        "location": s["location"],
        "email": s["email"],
        "github": s["github"],
        "linkedin": s["linkedin"],
        "skills": [{"group": g["group"], "items": g["items"]} for g in C.SKILLS],
        "projects": [
            {"slug": p["slug"], "title": p["title"], "blurb": p["blurb"], "url": p["links"][0][1]}
            for p in C.PROJECTS
        ],
        "education": [{"title": e["title"], "place": e["place"], "text": e["text"]} for e in C.EDUCATION],
        "code": {lang: [highlight(l, lang) for l in lines] for lang, lines in C.SNIPPETS.items()},
        "plain": C.SNIPPETS,
    }


def json_script(data: dict) -> str:
    # "</" would end the script tag early, so escape it.
    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


def json_ld() -> str:
    s = C.SITE
    data = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": s["name"],
        "url": s["url"],
        "email": s["email"],
        "jobTitle": "Software Engineering Student",
        "address": {"@type": "PostalAddress", "addressLocality": "Kigali", "addressCountry": "RW"},
        "sameAs": [s["github"], s["linkedin"]],
        "knowsAbout": ["Java", "C++", "JavaScript", "SQL", "Python", "Machine learning", "Firebase"],
    }
    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


HEAD_SCRIPT = """
        /* Apply saved theme before first paint, and decide whether to play the intro */
        (function () {
            var d = document.documentElement;
            d.classList.add('js');
            try {
                var m = localStorage.getItem('oj-mode') || 'dark';
                var a = localStorage.getItem('oj-accent') || 'kigali';
                var t = m === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : m;
                d.setAttribute('data-theme', t);
                d.setAttribute('data-accent', a);
            } catch (e) {}
            try {
                if (sessionStorage.getItem('oj-booted') || localStorage.getItem('oj-fx') === 'off' ||
                    matchMedia('(prefers-reduced-motion: reduce)').matches) { d.classList.add('no-boot'); }
            } catch (e) {}
            /* Safety net: if script.js fails, show everything anyway */
            setTimeout(function () {
                if (!d.classList.contains('ready')) { d.classList.add('ready', 'show-all'); }
            }, 6500);
        })();
"""


# ---------------------------------------------------------------- page

def page() -> str:
    s = C.SITE
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="dark" data-accent="kigali">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(s["title"])}</title>
    <meta name="description" content="{esc(s["description"])}">
    <meta name="color-scheme" content="dark light">
    <meta name="theme-color" content="#070b14">
    <meta property="og:type" content="website">
    <meta property="og:title" content="{esc(s["title"])}">
    <meta property="og:description" content="{esc(s["description"])}">
    <meta property="og:url" content="{esc(s["url"])}">
    <link rel="canonical" href="{esc(s["url"])}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300..800&family=Inter:wght@400..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%230b1020'/%3E%3Ctext x='32' y='43' font-size='30' font-family='Arial' font-weight='700' text-anchor='middle' fill='%2338bdf8'%3EOJ%3C/text%3E%3C/svg%3E">
    <script>{HEAD_SCRIPT}</script>
    <link rel="stylesheet" href="style.css">
    <script type="application/ld+json">{json_ld()}</script>
</head>

<body>
    {sprite()}
{boot()}
    <div class="progress" id="progress" aria-hidden="true"></div>
    <div class="glow" id="glow" aria-hidden="true"></div>
    <div class="cursor-ring" id="cursorRing" aria-hidden="true"></div>
    <div class="cursor-dot" id="cursorDot" aria-hidden="true"></div>
{header()}

    <main>{hero()}
        {marquee()}{about()}{skills()}{projects()}{education()}{contact()}
    </main>
{footer()}
{terminal()}

    <script type="application/json" id="site-data">{json_script(site_data())}</script>
    <script src="script.js"></script>
</body>

</html>
"""


def main() -> None:
    out = ROOT / "index.html"
    out.write_text(page(), encoding="utf-8")
    print(f"Wrote {out.name} ({out.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
