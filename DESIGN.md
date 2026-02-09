# DayOneBuilder Design Book
## Complete design system guide for building dark-themed landing pages

---

## 1. Technology Stack

| Technology | Purpose |
|---|---|
| **HTML/CSS/JS** | Static pages (GitHub Pages) |
| **Inline CSS** (`<style>`) | All styles in `<style>` block, no external CSS frameworks |
| **Inter** (Google Fonts) | Primary font, weights: 400, 500, 600, 700 |

---

## 2. Color Palette

### 2.1 Core Background Colors (Dark Theme)

```css
--background:       #08090a;   /* Main page background */
--surface-1:        #0e0e10;   /* Section backgrounds */
--surface-2:        #141416;   /* Cards, popups */
--card:             #111113;   /* Cards */
--foreground:       #f7f8f8;   /* Primary text */
```

| Token | HEX | Usage |
|---|---|---|
| `#030305` | Deepest black | Mobile menu overlay |
| `#08090a` | Near-black | Main `<body>` background |
| `#0a0a0c` | Dark black | Dropdown, select backgrounds |
| `#0c0d0f` | Dark | Alternative section background |
| `#0f0f11` | Gradient bg | Surface gradient from |
| `#111113` | Card | Cards, sidebar |
| `#141416` | Lighter card | Popovers, surface-2 |

### 2.2 Text Colors (bright to dim)

| HEX | CSS | Usage |
|---|---|---|
| `#f7f8f8` | `color: #f7f8f8` | Headings, primary text |
| `#e0e1e3` | `color: #e0e1e3` | Secondary headings |
| `#c2c3c7` | `color: #c2c3c7` | FAQ subheadings |
| `#b4b7be` | `color: #b4b7be` | Descriptive text |
| `#9ca0a8` | `color: #9ca0a8` | Soft text |
| `#8a8f98` | `color: #8a8f98` | Navigation, captions, meta |
| `#7a7e85` | `color: #7a7e85` | Inactive text |
| `#6b6f76` | `color: #6b6f76` | Icons, dim text |
| `#5c5f66` | `color: #5c5f66` | Dimmest text |
| `#565960` | `color: #565960` | Badges, meta |
| `#484b51` | `color: #484b51` | Barely visible |
| `#3a3d44` | `color: #3a3d44` | Borders, dividers |

### 2.3 Accent / Semantic Colors

```css
/* Success (green) */
--success:          #10b981;
--success-foreground: #34d399;

/* Warning (yellow) */
--warning:          #f59e0b;
--warning-foreground: #fbbf24;

/* Info (blue) */
--info:             #3b82f6;
--info-foreground:  #60a5fa;

/* Danger (red) */
--danger:           #ef4444;
--danger-foreground: #f87171;
```

### 2.4 Transparent Colors (key design pattern!)

```css
/* White with opacity — for borders and backgrounds on dark surfaces */
rgba(255,255,255,0.02)    /* Barely visible background */
rgba(255,255,255,0.04)    /* Light background (badges, ghost buttons) */
rgba(255,255,255,0.06)    /* Noticeable background (secondary) */
rgba(255,255,255,0.1)     /* Interactive element background */
rgba(255,255,255,0.15)    /* Hover state */

/* Borders */
border: 1px solid rgba(255,255,255,0.04);  /* Barely visible */
border: 1px solid rgba(255,255,255,0.06);  /* Standard */
border: 1px solid rgba(255,255,255,0.08);  /* Accent */
```

---

## 3. Typography

### Font: Inter

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

Include:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Heading Hierarchy

| Element | Size (mobile → desktop) | Weight | Tracking | Line-height |
|---|---|---|---|---|
| **H1 (Hero)** | `2.25rem` → `3rem` (640px) → `3.25rem` (1024px) → `3.75rem` (1280px) | 600 | `-0.03em` | `1.1` |
| **H2 (Section)** | `1.5rem` → `1.875rem` (640px) → `2.25rem` (1024px) | 600 | `-0.02em` | — |
| **H3 (Card title)** | `15px` → `18px` | 600 | — | — |
| **Body** | `15px` → `16px` (1024px) | 400 | — | `1.6` |
| **Small/Meta** | `13px` | 500 | — | — |
| **Tiny badge** | `11px` | 600 | `0.025em` | — |
| **Nav items** | `14px` | 500 | — | — |

### Text Colors by Level

```css
h1          { color: #f7f8f8; }   /* maximum brightness */
body        { color: #8a8f98; }   /* muted */
small, meta { color: #5c5f66; }   /* barely visible */
nav         { color: #8a8f98; }   /* medium */
nav:hover   { color: #f7f8f8; }   /* bright */
```

---

## 4. Buttons

### 4.1 Primary CTA (white, main)

```css
.btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 500;
    border-radius: 12px;
    transition: background 0.15s, transform 0.1s;
    background: #fff;
    color: #18181b;
    height: 48px;
    padding: 0 24px;
    font-size: 15px;
    border: none;
    cursor: pointer;
}
.btn-primary:hover { background: #f3f4f6; }
.btn-primary:active { transform: scale(0.98); }
```

### 4.2 Ghost / Secondary (transparent)

```css
.btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 500;
    border-radius: 12px;
    transition: all 0.15s;
    background: rgba(255,255,255,0.04);
    color: #8a8f98;
    border: 1px solid rgba(255,255,255,0.06);
    height: 48px;
    padding: 0 24px;
    font-size: 15px;
    cursor: pointer;
}
.btn-secondary:hover { background: rgba(255,255,255,0.06); color: #f7f8f8; }
.btn-secondary:active { transform: scale(0.98); }
```

### 4.3 Pill Badge

```css
.badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
}
.badge-live { background: rgba(16,185,129,0.1); color: #34d399; }
.badge-soon { background: rgba(245,158,11,0.1); color: #fbbf24; }
```

---

## 5. Page Structure

### 5.1 Navigation (Header)

```css
.nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 50;
    background: rgba(8,9,10,0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.04);
}
.nav-inner {
    max-width: 1152px;
    margin: 0 auto;
    padding: 0 16px;
    height: 56px;                      /* mobile */
    display: flex;
    align-items: center;
    justify-content: space-between;
}
@media (min-width: 1024px) {
    .nav-inner { height: 72px; padding: 0 32px; }
}
```

### 5.2 Hero Section

```css
.hero {
    position: relative;
    overflow: hidden;
    padding: 112px 16px 64px;
    text-align: center;
}
@media (min-width: 1024px) {
    .hero { padding: 176px 32px 96px; }
}

/* Background effect — blurred circle */
.hero-glow {
    position: absolute;
    top: -300px; left: -300px;
    width: 600px; height: 600px;
    background: rgba(255,255,255,0.02);
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
}

.hero h1 {
    font-size: 2.5rem;
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: #f7f8f8;
}
@media (min-width: 640px) { .hero h1 { font-size: 3rem; } }
@media (min-width: 1024px) { .hero h1 { font-size: 3.5rem; } }

.hero p {
    font-size: 15px;
    color: #8a8f98;
    max-width: 400px;
    margin: 0 auto;
    line-height: 1.6;
}
```

---

## 6. Design System Components

### 6.1 Container

```css
.container {
    max-width: 1024px;   /* content */
    /* or 1152px for wide sections */
    margin: 0 auto;
    padding: 0 16px;
}
@media (min-width: 640px) { .container { padding: 0 24px; } }
@media (min-width: 1024px) { .container { padding: 0 32px; } }
```

### 6.2 Section

```css
.section {
    padding: 64px 16px;
}
@media (min-width: 1024px) {
    .section { padding: 96px 32px; }
}
.section-header {
    text-align: center;
    margin-bottom: 48px;
}
.section-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #f7f8f8;
    margin-bottom: 16px;
}
@media (min-width: 640px) { .section-header h2 { font-size: 1.875rem; } }
@media (min-width: 1024px) { .section-header h2 { font-size: 2.25rem; } }
.section-header p {
    font-size: 15px;
    color: #8a8f98;
    max-width: 28rem;
    margin: 0 auto;
}
```

### 6.3 Card (universal)

```css
.card {
    border-radius: 12px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    padding: 20px;
    transition: background 0.15s;
}
.card:hover {
    background: rgba(255,255,255,0.04);
}
```

---

## 7. Animations

### 7.1 Core Transitions

```css
transition: color 0.15s;          /* Color only */
transition: all 0.15s;            /* All properties */
transition: background 0.15s;     /* Background only */
```

### 7.2 Micro-interactions

```css
/* Button press */
.btn:active { transform: scale(0.98); }
```

### 7.3 Custom Animations

```css
/* Soft pulse for status dots */
@keyframes pulse-subtle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}
.pulse { animation: pulse-subtle 2s ease-in-out infinite; }
```

---

## 8. Responsive Breakpoints

| Breakpoint | Size | Usage |
|---|---|---|
| **default** | < 640px | Mobile first |
| **640px** | ≥ 640px | Small screens |
| **768px** | ≥ 768px | Tablets |
| **1024px** | ≥ 1024px | Desktop (primary) |
| **1280px** | ≥ 1280px | Large screens |

### Common Responsive Patterns

```css
/* Card grid */
.grid { grid-template-columns: 1fr; }
@media (min-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1024px) { .grid { grid-template-columns: 1fr 1fr 1fr; } }

/* Section padding */
.section { padding: 64px 16px; }
@media (min-width: 1024px) { .section { padding: 96px 32px; } }

/* Hero top padding */
.hero { padding-top: 112px; }
@media (min-width: 1024px) { .hero { padding-top: 176px; } }
```

---

## 9. Visual Effects Patterns

### 9.1 Blurred Circles (Ambient Glow)

```css
.glow {
    position: absolute;
    top: -300px; left: -300px;
    width: 600px; height: 600px;
    background: rgba(255,255,255,0.02);
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
}
```

### 9.2 Borders via Transparent White

```css
border: 1px solid rgba(255,255,255,0.04);   /* Barely visible */
border: 1px solid rgba(255,255,255,0.06);   /* Standard */
border: 1px solid rgba(255,255,255,0.08);   /* Accent */
```

### 9.3 Card Hover Effect

```css
.card {
    background: rgba(255,255,255,0.02);
    transition: background 0.15s;
}
.card:hover {
    background: rgba(255,255,255,0.04);
}
```

---

## 10. Design Checklist

When creating new pages based on this design system, verify:

- [ ] Background: `#08090a` (near-black, NOT pure `#000`)
- [ ] Font: Inter, loaded via Google Fonts
- [ ] All styles in inline `<style>` block (no Tailwind CDN)
- [ ] Headings: `font-weight: 600`, `letter-spacing: -0.03em`, `color: #f7f8f8`
- [ ] Body text: `font-size: 15px`, `color: #8a8f98`
- [ ] Buttons: white bg, `border-radius: 12px`, `height: 48px`, `transform: scale(0.98)` on active
- [ ] Cards: `rgba(255,255,255,0.02)` bg, `rgba(255,255,255,0.06)` border, `border-radius: 12px`
- [ ] Borders: via `rgba(255,255,255,opacity)`, not gray colors
- [ ] Background glow: blurred circle `filter: blur(120px)` on hero
- [ ] Navigation: 72px height on desktop, white CTA button
- [ ] Responsive: mobile-first, media queries at `640px` and `1024px`
- [ ] Animations: `transition` on interactive elements, `scale(0.98)` on buttons
- [ ] Links: relative paths with explicit `index.html` for `file://` compatibility
