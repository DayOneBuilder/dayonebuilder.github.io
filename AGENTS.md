# AGENTS.md — Repository Rules

## Overview
This is a **static website** hosted on **GitHub Pages**. Pure HTML/CSS/JS — no frameworks, no build steps.

## Tech Stack
- **HTML/CSS/JS** — plain static files
- **Tailwind CSS** — via CDN (`<script src="https://cdn.tailwindcss.com"></script>`)
- **Inter** — primary font via Google Fonts
- **No React, No Vite, No Node.js** — this is a GitHub Pages site

## Design System
Follow `DESIGN.md` for all visual decisions:
- Dark theme (`#08090a` background)
- Inter font (400, 500, 600, 700 weights)
- Transparent white borders (`border-white/[0.06]`)
- Cards: `bg-white/[0.02]` with `rounded-xl`
- Text hierarchy: `#f7f8f8` headings, `#8a8f98` body
- Mobile-first responsive design

## Structure
```
/
├── index.html          # Landing page
├── DESIGN.md           # Design system reference
├── AGENTS.md           # This file — repo rules
├── README.md           # Project readme
├── speech-test/
│   └── index.html      # Speech Test project
└── <project-name>/
    └── index.html      # Each project in its own subfolder
```

## Rules

### Google Analytics
**G-KQMLYS3VVE** must be included on **every page**, in `<head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-KQMLYS3VVE"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-KQMLYS3VVE");</script>
```

### Language
- All UI text in **English**
- All commit messages in **English**, descriptive

### Projects
- Each project lives in its own subfolder with its own `index.html`
- Landing page (`/index.html`) links to all projects
- Every project page must include: Google Analytics, dark theme, Inter font, Tailwind CDN

### Commits
- English only
- Descriptive: `Add speech-test project`, `Update landing page hero section`
- No generic messages like `update` or `fix`

### Mobile-First
- Design for mobile viewport first
- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) to scale up
- Test on 375px width minimum
