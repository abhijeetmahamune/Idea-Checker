---
name: ui-ux-design
description: World-class UI/UX design principles, font pairings, curated color palettes, glassmorphism, micro-animations, component anatomy, and dark/light mode design systems for Next.js and Tailwind CSS v4. Trigger when working on UI, layouts, styling, themes, colors, fonts, or component design.
---

# 🎨 UI/UX Design System & Experience Skill

This skill provides comprehensive UI/UX design principles, curated color palettes, modern typography pairings, component styling guidelines, and interactive micro-animation patterns tailored for Next.js, Tailwind CSS v4, and modern web applications.

---

## ⚡ Core UI/UX Design Principles

1. **Visual Hierarchy & Focal Points**
   - Direct user attention using size contrast, font weight, color saturation, and vertical elevation.
   - Ensure the primary call-to-action (CTA) on any screen is instantly distinguishable within 1 second of landing.
   - Limit high-saturation accent colors to primary actions, key metrics, and dynamic status badges.

2. **Depth, Glassmorphism & Elevation**
   - Avoid flat, lifeless containers. Layer interfaces using subtle borders, multi-layered box shadows, and background blurs.
   - Glass effect formula: `bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg`.
   - Card glow on hover: `hover:border-primary/40 hover:shadow-[0_0_25px_-5px_rgba(var(--primary-rgb),0.15)] transition-all duration-300`.

3. **Spatial Grid & Micro-Spacing**
   - Stick to an 8px / 4px layout grid for paddings and margins (`gap-2`, `gap-4`, `gap-6`, `p-4`, `p-6`).
   - Give content breathing room: use generous vertical padding for sections (`py-12` to `py-20`).

4. **Dynamic Feedback & Micro-Animations**
   - Every interactive element (buttons, cards, links, inputs) **must** have hover, active, and focus states.
   - Button press state: `active:scale-[0.98] transition-transform ease-out duration-150`.
   - Smooth entrance animations: stagger list items with `animate-fade-slide-up` and staggered delays.

---

## 🎨 Curated Color Palettes

Below are 4 hand-crafted, high-converting color palettes defined in **OKLCH** and **Hex** format.

### Palette 1: Obsidian Violet Glow (Recommended for AI / Modern SaaS)
*Vibrant, sleek dark-first aesthetic with deep obsidian tones and glowing violet/cyan accents.*

| Token | Light Mode (OKLCH / Hex) | Dark Mode (OKLCH / Hex) | Purpose |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.99 0.003 240)` (`#FAFBFD`) | `oklch(0.12 0.015 260)` (`#0B0E14`) | Page Canvas |
| `--card` | `oklch(1.0 0 0)` (`#FFFFFF`) | `oklch(0.16 0.02 260)` (`#121721`) | Content Cards |
| `--foreground` | `oklch(0.13 0.02 260)` (`#0F172A`) | `oklch(0.98 0.005 240)` (`#F8FAFC`) | Primary Text |
| `--primary` | `oklch(0.52 0.24 270)` (`#6366F1`) | `oklch(0.65 0.22 270)` (`#818CF8`) | Indigo Primary Accent |
| `--secondary` | `oklch(0.58 0.20 200)` (`#06B6D4`) | `oklch(0.72 0.18 195)` (`#38BDF8`) | Cyan Accent / Glow |
| `--success` | `oklch(0.62 0.19 145)` (`#10B981`) | `oklch(0.70 0.17 145)` (`#34D399`) | Positive Status |
| `--border` | `oklch(0.90 0.01 260)` (`#E2E8F0`) | `oklch(0.24 0.02 260)` (`#1E293B`) | Dividers & Borders |

### Palette 2: Cyber Emerald & Indigo (High Contrast & Energy)
*Electric emerald paired with deep space blue for data-dense dashboards.*

- **Canvas Dark**: `#090D16` (`oklch(0.11 0.02 250)`)
- **Card Surface**: `#111827` (`oklch(0.15 0.02 250)`)
- **Primary Accent**: `#10B981` (Emerald Glow)
- **Secondary Accent**: `#6366F1` (Indigo Spark)
- **Warning**: `#F59E0B` (Amber)
- **Text Primary**: `#F9FAFB`

### Palette 3: Warm Luxe Bronze (Executive & Elegant)
*Refined dark charcoal with warm bronze/gold accents for premium products.*

- **Canvas**: `#121212` (`oklch(0.14 0 0)`)
- **Card Surface**: `#1E1E1E` (`oklch(0.20 0 0)`)
- **Primary Accent**: `#D97706` / `#F59E0B` (Warm Amber Bronze)
- **Secondary Accent**: `#9333EA` (Royal Violet)
- **Border**: `#2D2D2D`

### Palette 4: Nordic Pearl & Mint (Clean Light-First Minimal)
*Fresh, high-legibility light mode with subtle mint and slate accents.*

- **Canvas Light**: `#F8FAFC`
- **Card Surface**: `#FFFFFF`
- **Primary Accent**: `#0D9488` (Teal Mint)
- **Secondary Accent**: `#4F46E5` (Slate Indigo)
- **Border**: `#E2E8F0`

---

## 🔤 Typography & Font Pairings

### Recommended Font Combinations (Google Fonts)

1. **Modern Tech / SaaS (Default)**
   - **Headings**: `Plus Jakarta Sans` or `Geist Sans` (Weights: 600, 700, 800)
   - **Body**: `Inter` or `Geist Sans` (Weights: 400, 500)
   - **Code/Data**: `JetBrains Mono` or `Geist Mono`

2. **High-Impact Bold / Startup**
   - **Headings**: `Outfit` or `Sora`
   - **Body**: `Plus Jakarta Sans`

3. **Editorial / Creative Tech**
   - **Headings**: `Syne` or `Clash Display`
   - **Body**: `Inter`

### Typography Hierarchy Guidelines

- **H1 (Hero Header)**: `text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight`
- **H2 (Section Title)**: `text-2xl sm:text-3xl font-bold tracking-tight`
- **H3 (Card Title)**: `text-lg sm:text-xl font-semibold`
- **Body Large**: `text-base sm:text-lg text-muted-foreground leading-relaxed`
- **Body Regular**: `text-sm sm:text-base text-foreground leading-normal`
- **Caption / Badge**: `text-xs font-medium uppercase tracking-wider text-muted-foreground`

---

## 🧩 Component Design Guidelines

### 1. Interactive Buttons
```tsx
// Primary Gradient Glow Button
<button className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-md hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
  <span>Get Started</span>
</button>
```

### 2. Glassmorphic Feature Cards
```tsx
// Glowing Glass Card
<div className="group relative p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
    <Icon className="w-6 h-6" />
  </div>
  <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Card Title</h3>
  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Description text here.</p>
</div>
```

### 3. Shimmer Skeletons for Loading States
```tsx
<div className="w-full h-24 rounded-xl skeleton-shimmer border border-border/40" />
```

---

## ♿ Accessibility & Contrast Safeguards (WCAG 2.2 AA)

- Always guarantee a text-to-background contrast ratio of at least **4.5:1** for normal text and **3:1** for large text.
- Never rely *only* on color to convey state (e.g. add icons or text labels alongside red/green indicators).
- All interactive elements must provide clear focus rings for keyboard navigation: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
- Minimum tap target size on touchscreens: **44px × 44px**.
