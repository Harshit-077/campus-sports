---
name: Field & Court
colors:
  surface: '#f1fcf5'
  surface-dim: '#d1ddd6'
  surface-bright: '#f1fcf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ebf6f0'
  surface-container: '#e5f1ea'
  surface-container-high: '#dfebe4'
  surface-container-highest: '#dae5df'
  on-surface: '#141e1a'
  on-surface-variant: '#414844'
  inverse-surface: '#28332e'
  inverse-on-surface: '#e8f3ed'
  outline: '#717974'
  outline-variant: '#c1c8c3'
  surface-tint: '#426656'
  primary: '#002217'
  on-primary: '#ffffff'
  primary-container: '#14382b'
  on-primary-container: '#7da291'
  inverse-primary: '#a8cfbd'
  secondary: '#ab3500'
  on-secondary: '#ffffff'
  secondary-container: '#fe6a34'
  on-secondary-container: '#5d1900'
  tertiary: '#171f1b'
  on-tertiary: '#ffffff'
  tertiary-container: '#2b342f'
  on-tertiary-container: '#939c96'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4ebd8'
  primary-fixed-dim: '#a8cfbd'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#2a4d3f'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59d'
  on-secondary-fixed: '#390c00'
  on-secondary-fixed-variant: '#832600'
  tertiary-fixed: '#dce5de'
  tertiary-fixed-dim: '#c0c9c2'
  on-tertiary-fixed: '#151d19'
  on-tertiary-fixed-variant: '#404944'
  background: '#f1fcf5'
  on-background: '#141e1a'
  surface-variant: '#dae5df'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Sora
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  stat-display:
    fontFamily: Sora
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system drives a modern collegiate sports facility booking experience. The personality is grounded, athletic, and systematically organized—capturing the timeless prestige of university athletics without aggressive aesthetic noise. The interface prioritizes clarity, calm efficiency, and effortless scheduling.

### Visual Aesthetic & Philosophy
- **Modern Minimal Athletic:** Characterized by generous whitespace, calm field tones, and crisp structural organization. Avoid visual clutter, decorative gradients, or photographic cliches.
- **Graphic Over Photographic:** Rely on clean geometric layouts, clear court/pitch schematics, structured schedule blocks, and refined typography rather than stock imagery.
- **Architectural Line Work:** Surfaces layer via subtle, muted backgrounds and crisp 1px borders rather than heavy ambient or drop shadows.
- **Deliberate Accent Hierarchy:** Vivid court orange is reserved strictly for a single primary forward action per view, preventing cognitive exhaustion during time-sensitive bookings.

## Colors

The palette draws inspiration from collegiate tennis courts, synthetic turf, and classic running tracks. Functional colors maintain strict contrast requirements against both page and container backgrounds.

### Palette Assignment
- **Primary (`#14382B`):** Deep court green. Applied to top navigation bars, structural dark hero segments, core status indicators, and standard primary interactions.
- **Accent / Key CTA (`#FF6B35`):** High-visibility athletic orange. Restricted exclusively to the single primary conversion action per screen (e.g., "Confirm Booking", "Proceed to Payment") and active time slot selection states.
- **Soft Neutral / Tint (`#DCE5DE`):** Sage fill. Applied to inactive filter chips, sub-navigation tabs, subtle card backdrops, and active toggle track states.
- **Canvas / Background (`#F1F5F2`):** Sage soft. Default viewport surface creating an easy, low-strain reading environment.
- **Ink Primary (`#1A2420`):** High-contrast dark green-slate for primary titles, body copy, and data values.
- **Ink Secondary (`#5B6B63`):** Muted slate for metadata, time labels, secondary descriptors, and inactive captions.
- **Border / Divider (`#D7DFD9`):** Neutral boundary line for cards, modular slot boundaries, and input borders.

### Semantic & Feedback Roles
- **Success (`#1F7A4D`):** Confirmation banners, confirmed personal bookings, validation success.
- **Warning (`#9A6700`):** Limited capacity, pending approvals, expiring reservations.
- **Danger (`#B42318`):** Cancellations, booking conflicts, payment or form errors.

### Accessibility & Focus Treatment
- Keyboard and assistive focus indicators use a prominent 2px solid ring of Accent Orange (`#FF6B35`) with an offset of 2px (`outline-offset: 2px`).
- Inverted text on Primary (`#14382B`) and Accent (`#FF6B35`) must always be pure white (`#FFFFFF`) to ensure WCAG AA compliance.

## Typography

Typography establishes athletic structure through a dual-typeface hierarchy:
- **Headings & Key Metrics:** Set in `Sora` (Semi-Bold 600). The geometric curves and modern athletic feel provide distinctive clarity for facility titles, arena identifiers, and large numeric time/slot stats.
- **Body, Interfaces & Data Tables:** Set in `Inter` (Regular 400, Medium 500, Semi-Bold 600). Delivers neutral, uncompromising legibility in dense scheduling matrices, rules lists, and transactional booking summaries.

All body copy is kept strictly between 14px and 16px to guarantee rapid legibility when scanning court availability on mobile devices.

## Layout & Spacing

The layout is built upon an 8pt base grid within a responsive fluid column framework.

### Breakpoints & Grid Matrix
- **Mobile (< 768px):** 4-column fluid grid, `margin-mobile` (16px), `gutter-mobile` (12px). Facility views collapse into vertically stacked agenda cards or horizontal day scrollers.
- **Tablet (768px – 1024px):** 8-column fluid grid, `margin` (32px), `gutter` (24px). Schedule matrices display split dual-pane views (facility directory left, day agenda right).
- **Desktop (> 1024px):** 12-column grid maxed at 1280px container width, centered with automatic margins, 24px gutters. Provides horizontal multi-court timeline grids side by side.

### Ergonomics & Interactive Flow
Interactive targets (slot cells, chips, form inputs, buttons) require a mandatory touch target height of at least 44px (`2.75rem`). Grid cells in slot pickers use auto-fill dynamic columns ensuring comfortable tap precision without horizontal overflow on handheld viewports.

## Elevation & Depth

This system avoids blurred drop shadows and skeuomorphic gradients in favor of **crisp surface stacking and structural 1px linear definition**.

### Layering Philosophy
- **Base Canvas:** Background `#F1F5F2` anchors the viewport.
- **Card & Module Surfaces:** Crisp white `#FFFFFF` surfaces sit directly atop the base, delineated by a clean border (`1px solid #D7DFD9`).
- **Interactive Depths:** Elevation is communicated via tonal contrast rather than vertical shadow offset. When elements are focused or selected, border weights and colors shift (`#14382B` or `#FF6B35`) rather than lifting off the page with drop shadows.
- **Top App Bar & Overlays:** The top bar uses a solid `#14382B` fill. Modals and bottom sheets use pure white `#FFFFFF` backgrounds bound by `1px solid #D7DFD9` and rest atop a 40% opacity ink backdrop (`rgba(26, 36, 32, 0.4)`), retaining flat clarity.

## Shapes

The design uses balanced, rounded contours to soften athletic structures while maintaining an engineered, institutional presence.

### Corner Radius System
- **Default Shape Value (`2`):** Base components (cards, text fields, time slot selectors, table containers) use `0.75rem` to `1rem` (12px–16px) corners.
- **Micro-Controls:** Small badges, icon buttons, and sub-chips use `rounded-md` (8px).
- **Pills:** Facility condition indicators, sport category filter pills, and floating counter badges use fully rounded pill shapes (`rounded-full`).
- **Container Hierarchy:** Outer grouping cards use `16px` border-radius; internal child modules (such as nested court slot buttons) use `12px` to preserve balanced concentric margins.

## Components

### Iconography
- Set with a uniform **1.75px stroke width**, round caps, and round joins. Icons inherit current text color or semantic state color without background halos.

### Buttons
- **Single Page CTA (Accent):** Solid `#FF6B35` fill, `#FFFFFF` text, `font-family: Sora`, 600 weight, 12px border radius, 48px height. Strictly limited to one instance per page.
- **Primary Standard:** Solid `#14382B` fill, `#FFFFFF` text, 48px height, 12px border radius.
- **Secondary:** White `#FFFFFF` background, 1px border `#D7DFD9`, text `#1A2420`. Hover state transitions background to `#DCE5DE`.
- **Tertiary / Ghost:** Transparent background, text `#14382B`, 44px min tap area.

### Time Slot Booking Grid
Slot selectors are high-density interactive elements. Each slot maintains a minimum 44px height and 12px corner radius:
- **Available:** White background (`#FFFFFF`), 1px solid Primary Green border (`#14382B`), text `#1A2420`.
- **Selected:** Solid Accent Orange fill (`#FF6B35`), text `#FFFFFF`, no border.
- **Booked (by others):** Neutral light gray fill (`#E5ECE7`), borderless, muted text (`#8A9A92`), disabled interaction.
- **Past:** Transparent/plain fill, light gray text (`#A8B5AE`), no border, strikethrough optional.
- **Unavailable (Maintenance):** Surface styled with 45-degree repeating diagonal slate-gray stripes (`repeating-linear-gradient(45deg, #E5ECE7, #E5ECE7 8px, #F1F5F2 8px, #F1F5F2 16px)`), text `#5B6B63`, not clickable.
- **Booked by Me:** Solid Success Green fill (`#1F7A4D`), text `#FFFFFF`, includes a checkmark icon prefix (1.75px stroke).

### Chips & Filter Pills
- Inactive: Sage soft fill (`#DCE5DE`), borderless, text `#1A2420`, 36px height, rounded-full.
- Active Filter: Solid `#14382B` fill, text `#FFFFFF`, rounded-full.

### Form Inputs
- 48px height, 12px radius, white background (`#FFFFFF`), border `1px solid #D7DFD9`.
- Typography: Inter 14px. Focus state: border color `#14382B`, plus an external 2px ring `#FF6B35` with 2px offset.

### Facility Cards
- Background `#FFFFFF`, border `1px solid #D7DFD9`, border-radius 16px, padding 20px–24px.
- Distinct absence of photographic placeholders: use facility vector badges, court dimension schematics, surface type indicators (e.g., "Hardwood", "Synthetic Grass"), and real-time availability ratios.

### Checkboxes & Radio Controls
- Minimum hit target 44px container enclosing an 18px checkbox/radio element. 
- Border `1.5px solid #5B6B63`. Checked state: `#14382B` fill with white indicator icon.