"""
Everything written on the portfolio lives in this file.

Edit the text here, then run:

    python build.py

That regenerates index.html. Upload index.html (plus style.css and script.js)
to your GitHub Pages repo to publish the change.
"""

SITE = {
    "name": "Osama Jamal",
    "url": "https://osama-0868.github.io/",
    "title": "Osama Jamal | Software Engineering Student",
    "description": (
        "Portfolio of Osama Jamal, a software engineering student in Kigali, Rwanda, "
        "working with Java, C++, JavaScript and SQL and learning Python and AI/ML."
    ),
    "email": "osamajamal0868@gmail.com",
    "github": "https://github.com/osama-0868",
    "linkedin": "https://www.linkedin.com/in/osama-jamal0868",
    "location": "Kigali, Rwanda",
    "status": "Open to internships and junior roles",
    "photo": "osama.PNG",
}

HERO = {
    "role": "Software engineering student in Kigali, building with Java, C++, JavaScript and SQL.",
    "text": (
        "I like turning ideas into clean, working software, from database design to "
        "responsive websites. Right now I'm learning Python and AI/ML to take on bigger problems."
    ),
}

# Shown in the About section. Each word fades in as you scroll.
STATEMENT = (
    "I'm a software engineering student in Kigali. I build databases, websites and small "
    "programs, I like code that reads clearly, and I'm teaching myself Python and machine "
    "learning to build smarter software."
)

FACTS = [
    ("Based in", "Kigali, Rwanda"),
    ("Studying", "Software engineering"),
    ("Looking for", "Internships and junior roles"),
]

# The two scrolling strips under the hero.
MARQUEE = ["Java", "Python", "C++", "SQL", "JavaScript", "Firebase", "AI/ML"]

# "learning" groups are drawn as outlined words.
SKILLS = [
    {"group": "Languages", "items": ["Java", "C++", "JavaScript", "SQL"]},
    {"group": "Web", "items": ["HTML5", "CSS3", "Responsive design", "Firebase"]},
    {"group": "Tools", "items": ["Git", "GitHub", "VS Code"]},
    {"group": "Learning now", "items": ["Python", "AI/ML", "Advanced JavaScript"], "learning": True},
]

# Three projects. Add more later by copying one block.
# cover is one of: cover-a, cover-b, cover-c (colors are set in style.css).
PROJECTS = [
    {
        "slug": "vision-office",
        "title": "The Vision Office",
        "kind": "Live website",
        "mark": "VO",
        "cover": "cover-a",
        "blurb": (
            "A live website for an education-focused organisation, built around the line "
            "\"Shaping Bright Futures Through Education\" and hosted on Firebase."
        ),
        "tags": ["HTML", "CSS", "JavaScript", "Firebase"],
        "links": [("Visit the site", "https://the-vision-dd56e.web.app")],
    },
    {
        "slug": "jtc",
        "title": "JTC Training Website",
        "kind": "Website",
        "mark": "JTC",
        "cover": "cover-b",
        "blurb": "A website for JTC with login and verification pages, a custom 404 page and Firebase behind it.",
        "tags": ["HTML", "JavaScript", "Firebase"],
        "links": [("View the code", "https://github.com/osama-0868/JAMAL-TRAINING-JTC")],
    },
    {
        "slug": "bank",
        "title": "Bank Management System",
        "kind": "SQL database",
        "mark": "SQL",
        "cover": "cover-c",
        "blurb": "A relational database project for a bank, written in SQL.",
        "tags": ["SQL", "Database design"],
        "links": [("View the code", "https://github.com/osama-0868/bank_management_system")],
    },
]

EDUCATION = [
    {
        "tag": "In progress",
        "title": "Software engineering",
        "place": "Adventist University of Central Africa, Kigali",
        "text": (
            "Studying software development with a focus on programming and databases. "
            "Coursework projects include a revenue administration database for my DBMS course."
        ),
    },
    {
        "tag": "Ongoing",
        "title": "Web development and Firebase",
        "place": "Self-directed learning",
        "text": "Building and deploying websites with HTML, CSS, JavaScript and Firebase hosting.",
    },
    {
        "tag": "Current focus",
        "title": "Python and AI/ML",
        "place": "Self-directed learning",
        "text": "Learning Python and the fundamentals of machine learning to build smarter software.",
    },
]

# The code card in the hero. Plain text; build.py adds the colors.
SNIPPETS = {
    "java": [
        "public class Osama {",
        '  String role = "Software Engineering Student";',
        '  String[] stack = { "Java", "C++", "JavaScript", "SQL" };',
        '  String learning = "Python & AI/ML";',
        "  boolean openToInternships = true;",
        "}",
    ],
    "python": [
        "# osama.py",
        "osama = {",
        '    "role": "Software Engineering Student",',
        '    "stack": ["Java", "C++", "JavaScript", "SQL"],',
        '    "learning": "Python & AI/ML",',
        '    "open_to_internships": True,',
        "}",
    ],
}
