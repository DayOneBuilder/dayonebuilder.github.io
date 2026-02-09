# AGENTS.md — Repository Rules

## Overview
This is a **static website** hosted on **GitHub Pages**. Pure HTML/CSS/JS — no frameworks, no build steps.

## Tech Stack
- **HTML/CSS/JS** — plain static files, inline `<style>` blocks
- **Inter** — primary font via Google Fonts
- **No Tailwind CDN, No React, No Vite, No Node.js** — this is a GitHub Pages site

## Design System
Follow `DESIGN.md` for all visual decisions:
- Dark theme (`#08090a` background)
- Inter font (400, 500, 600, 700 weights)
- Transparent white borders (`rgba(255,255,255,0.06)`)
- Cards: `rgba(255,255,255,0.02)` with `border-radius: 12px`
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
- Every project page must include: Google Analytics, dark theme, Inter font, inline CSS
- All links between pages must use **relative paths** with explicit `index.html` (e.g. `./speech-test/index.html`, `../index.html`) for `file://` compatibility

### Commits
- English only
- Descriptive: `Add speech-test project`, `Update landing page hero section`
- No generic messages like `update` or `fix`

### Mobile-First
- Design for mobile viewport first
- Use CSS media queries with standard breakpoints (`640px`, `768px`, `1024px`, `1280px`) to scale up
- Test on 375px width minimum
