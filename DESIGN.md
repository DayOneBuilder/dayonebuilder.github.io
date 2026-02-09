# DayOneBuilder Design Book
## Complete design system guide for building dark-themed landing pages

---

## 1. Technology Stack

| Technology | Purpose |
|---|---|
| **HTML/CSS/JS** | Static pages (GitHub Pages) |
| **Tailwind CSS** (CDN) | Utility-first styles |
| **Inter** (Google Fonts) | Primary font, weights: 400, 500, 600, 700, 800 |

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

| HEX | Tailwind Class | Usage | Frequency |
|---|---|---|---|
| `#f7f8f8` | `text-[#f7f8f8]` | Headings, primary text | 202 |
| `#e0e1e3` | `text-[#e0e1e3]` | Secondary headings | 175 |
| `#c2c3c7` | `text-[#c2c3c7]` | FAQ subheadings | 11 |
| `#b4b7be` | `text-[#b4b7be]` | Descriptive text | 157 |
| `#9ca0a8` | `text-[#9ca0a8]` | Soft text | 112 |
| `#8a8f98` | `text-[#8a8f98]` | Navigation, captions, meta | 155 |
| `#7a7e85` | `text-[#7a7e85]` | Inactive text | 138 |
| `#6b6f76` | `text-[#6b6f76]` | Icons, dim text | 153 |
| `#5c5f66` | `text-[#5c5f66]` | Dimmest text | 154 |
| `#565960` | `text-[#565960]` | Badges, meta | 125 |
| `#484b51` | `text-[#484b51]` | Barely visible | 50 |
| `#3a3d44` | `text-[#3a3d44]` | Borders, dividers | 9 |

### 2.3 Accent / Semantic Colors

```css
/* Success (green) */
--success:          #10b981;   /* emerald-500 */
--success-foreground: #34d399; /* emerald-400 */

/* Warning (yellow) */
--warning:          #f59e0b;   /* amber-500 */
--warning-foreground: #fbbf24; /* amber-400 */

/* Info (blue) */
--info:             #3b82f6;   /* blue-500 */
--info-foreground:  #60a5fa;   /* blue-400 */

/* Danger (red) */
--danger:           #ef4444;   /* red-500 */
--danger-foreground: #f87171;  /* red-400 */
```

### 2.4 Transparent Colors (key design pattern!)

```css
/* White with opacity — for borders and backgrounds on dark surfaces */
bg-white/[0.02]    /* Barely visible background */
bg-white/[0.04]    /* Light background (badges, ghost buttons) */
bg-white/[0.06]    /* Noticeable background (secondary) */
bg-white/[0.1]     /* Interactive element background */
bg-white/[0.15]    /* Hover state */

border-white/[0.04]  /* Barely visible border */
border-white/[0.06]  /* Light border */
border-white/[0.08]  /* Standard border */
```

---

## 3. Typography

### Font: Inter

```
font-family: 'Inter', sans-serif;
```

Include:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### Heading Hierarchy

| Element | Size (mobile → desktop) | Weight | Tracking | Line-height |
|---|---|---|---|---|
| **H1 (Hero)** | `text-[2.25rem]` → `sm:text-5xl` → `lg:text-[3.25rem]` → `xl:text-6xl` | `font-semibold` (600) | `tracking-[-0.03em]` | `leading-[1.1]` |
| **H2 (Section)** | `text-2xl` → `sm:text-3xl` → `lg:text-4xl` | `font-semibold` (600) | `tracking-tight` | — |
| **H3 (Card title)** | `text-lg` → `text-xl` | `font-semibold` (600) | — | — |
| **Body** | `text-[15px]` → `lg:text-base` | `font-normal` (400) | — | `leading-[1.6]` |
| **Small/Meta** | `text-[13px]` / `text-xs` | `font-medium` (500) | — | — |
| **Tiny badge** | `text-[11px]` | `font-semibold` (600) / `font-medium` (500) | `tracking-wide` | — |
| **Nav items** | `text-[14px]` | `font-medium` (500) | — | — |

### Text Colors by Level

```
H1:           text-[#f7f8f8]   — maximum brightness
Body:         text-[#8a8f98]   — muted
Small/Meta:   text-[#5c5f66]   — barely visible
Nav inactive: text-[#8a8f98]   — medium
Nav hover:    text-[#f7f8f8]   — bright
```

---

## 4. Buttons

### 4.1 Primary CTA (white, main)

```html
<button class="
  inline-flex items-center justify-center gap-2
  font-medium rounded-xl
  transition-all
  bg-white text-zinc-900
  hover:bg-gray-100
  active:scale-[0.98]
  h-12 px-6 text-[15px]
">
  Get Started
</button>
```

**Characteristics:**
- Background: white (`bg-white`)
- Text: dark (`text-zinc-900`)
- Border radius: `rounded-xl` (12px)
- Height: `h-12` (48px)
- Padding: `px-6` (24px) or `px-7` (28px)
- Text size: `text-[15px]`
- Hover: `hover:bg-gray-100`
- Active: `active:scale-[0.98]` (slight squeeze)

### 4.2 Ghost / Secondary (transparent)

```html
<button class="
  inline-flex items-center justify-center gap-2
  font-medium rounded-xl
  transition-all
  text-[#8a8f98] hover:text-[#f7f8f8]
  active:text-[#b4b7be]
  h-12 px-5 text-[15px]
">
  Watch Demo
</button>
```

### 4.3 Pill Badge

```html
<span class="
  inline-flex items-center px-3 py-1
  rounded-full
  bg-white text-zinc-900
  text-[11px] font-semibold tracking-wide
">
  Popular
</span>
```

---

## 5. Page Structure

### 5.1 Navigation (Header)

- Fixed header
- Height: `h-14` (mobile) / `h-[72px]` (desktop)
- Logo: text-based "DayOneBuilder"
- Nav hidden on mobile: `hidden lg:flex`
- Icons: `w-[18px] h-[18px]`

### 5.2 Hero Section

**Key styles:**
```css
/* Container */
.hero { padding-top: 96px; /* lg: 160px */ }

/* Background effect — blurred circle */
.bg-blur {
  position: absolute;
  top: -300px; left: -300px;
  width: 600px; height: 600px;
  background: rgba(255,255,255,0.02);
  border-radius: 50%;
  filter: blur(120px);
}

/* Title */
.hero-title {
  font-size: 2.25rem; /* → 3.25rem → 3.75rem */
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #f7f8f8;
}

/* Subtitle */
.hero-subtitle {
  font-size: 15px;
  color: #8a8f98;
  max-width: 24rem;
  line-height: 1.6;
}
```

---

## 6. Design System Components

### 6.1 Container

```css
max-width: max-w-5xl (1024px) — for content
max-width: max-w-6xl (1152px) — for wide sections
padding-x: px-4 sm:px-6 lg:px-8
margin: mx-auto
```

### 6.2 Section

```html
<section class="py-16 lg:py-24">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12 lg:mb-16">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#f7f8f8] tracking-tight mb-4">
        Section Title
      </h2>
      <p class="text-[15px] text-[#8a8f98] max-w-md mx-auto">
        Section description text
      </p>
    </div>
  </div>
</section>
```

### 6.3 Card (universal)

```html
<div class="
  rounded-xl
  bg-white/[0.02]
  border border-white/[0.06]
  p-5
  hover:bg-white/[0.04]
  transition-colors
">
  <!-- content -->
</div>
```

---

## 7. Animations

### 7.1 Core Transitions

```css
transition-colors    /* Colors only */
transition-all       /* All properties */
duration: 150ms      /* Tailwind default */
```

### 7.2 Micro-interactions

```css
/* Button press */
active:scale-[0.98]
```

### 7.3 Custom Animations

```css
/* Soft pulse for status dots */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
animation: pulse-subtle 2s ease-in-out infinite;
```

---

## 8. Responsive Grid (Breakpoints)

Standard Tailwind breakpoints:

| Breakpoint | Size | Usage |
|---|---|---|
| **default** | < 640px | Mobile first |
| **sm:** | ≥ 640px | Small screens |
| **md:** | ≥ 768px | Tablets |
| **lg:** | ≥ 1024px | Desktop (primary) |
| **xl:** | ≥ 1280px | Large screens |

### Common Responsive Patterns

```css
/* Card grid */
grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-3

/* Navigation */
hamburger (mobile) → lg:flex (desktop)

/* Section padding */
py-16 → lg:py-24

/* Hero top padding */
pt-24 → lg:pt-40
```

---

## 9. Visual Effects Patterns

### 9.1 Blurred Circles (Ambient Glow)

```html
<div class="absolute -top-[300px] -left-[300px]
            w-[600px] h-[600px]
            bg-white/[0.02]
            rounded-full
            blur-[120px]">
</div>
```

### 9.2 Borders via Transparent White

```css
border border-white/[0.04]   /* Barely visible */
border border-white/[0.06]   /* Standard */
border border-white/[0.08]   /* Accent */
```

### 9.3 Card Hover Effect

```css
hover:bg-white/[0.04]   /* Light highlight */
transition-colors        /* Smooth transition */
```

---

## 10. Design Checklist

When creating new pages based on this design system, verify:

- [ ] Background: `#08090a` (near-black, NOT pure `#000`)
- [ ] Font: Inter, loaded via Google Fonts
- [ ] Headings: `font-semibold`, tracking `-0.03em`, color `#f7f8f8`
- [ ] Body text: `text-[15px]`, color `#8a8f98`
- [ ] Buttons: white bg, `rounded-xl`, height `h-12`, `active:scale-[0.98]`
- [ ] Cards: `bg-white/[0.02]`, `border border-white/[0.06]`, `rounded-xl`
- [ ] Borders: via `white/[opacity]`, not gray colors
- [ ] Background glow: blurred circle `blur-[120px]` on hero
- [ ] Navigation: `h-[72px]` on desktop, white CTA button
- [ ] Responsive: mobile-first, grid breaks at `sm:` and `lg:`
- [ ] Animations: `transition-colors` on everything, `active:scale` on buttons
