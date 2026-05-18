---
name: Nexus Logistics System
colors:
  surface: '#faf9ff'
  surface-dim: '#ccdaff'
  surface-bright: '#faf9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8ff'
  surface-container-highest: '#d8e2ff'
  on-surface: '#051a3e'
  on-surface-variant: '#434654'
  inverse-surface: '#1d3054'
  inverse-on-surface: '#edf0ff'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#0059b8'
  on-secondary: '#ffffff'
  secondary-container: '#0071e6'
  on-secondary-container: '#fefcff'
  tertiary: '#004b59'
  on-tertiary: '#ffffff'
  tertiary-container: '#006477'
  on-tertiary-container: '#76e2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#d7e2ff'
  secondary-fixed-dim: '#abc7ff'
  on-secondary-fixed: '#001b3f'
  on-secondary-fixed-variant: '#004590'
  tertiary-fixed: '#afecff'
  tertiary-fixed-dim: '#48d7f9'
  on-tertiary-fixed: '#001f27'
  on-tertiary-fixed-variant: '#004e5d'
  background: '#faf9ff'
  on-background: '#051a3e'
  surface-variant: '#d8e2ff'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max-width: 1440px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system is engineered for high-velocity logistics management. It prioritizes **reliability, efficiency, and clarity**, ensuring that merchants can navigate complex data without cognitive fatigue. 

The aesthetic is **Corporate Modern**, blending the precision of enterprise software with the approachability of a contemporary SaaS platform. We utilize a structured grid, clear information hierarchy, and a restrained color palette to evoke a sense of "technological calm." The interface is professional yet forward-thinking, emphasizing data integrity and operational speed.

## Colors

The palette is built on a foundation of **Corporate Blue**, symbolizing trust and stability. 
- **Primary Blue (#0052CC)**: Used for core actions, active states, and primary branding elements.
- **Secondary Blue (#2684FF)**: Used for interactive highlights and supporting UI components.
- **Background (#F4F7FA)**: A cool, light grayish-blue that reduces glare and distinguishes the content area from the white "surface" cards.
- **Surface (#FFFFFF)**: Reserved for containers, cards, and input fields to ensure maximum contrast for data readability.
- **Neutrals**: A range of blue-tined grays used for text hierarchy and subtle borders.

## Typography

The design system utilizes **Inter** for all UI text. Inter’s tall x-height and neutral character make it ideal for data-heavy merchant dashboards. 

Headlines use semi-bold and bold weights with slight negative letter spacing to feel tight and professional. Body text is optimized for legibility at 14px, while labels utilize a slightly heavier weight and increased tracking to provide clear distinction for metadata and table headers.

## Layout & Spacing

This design system uses a **Fluid Grid** model within a maximum container width of 1440px. 
- **Desktop (1024px+):** 12-column grid with 24px gutters. Sidebars are fixed at 280px.
- **Tablet (768px - 1023px):** 8-column grid with 16px gutters. Sidebars collapse into a drawer.
- **Mobile (<768px):** 4-column grid with 16px margins. Content stacks vertically.

Spacing follows a strict 4px/8px baseline rhythm to ensure alignment and consistent density across all dashboard modules.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Soft Ambient Shadows**. 
1. **Level 0 (Base):** The light grayish-blue background.
2. **Level 1 (Cards):** White surfaces with a subtle 1px border (#E1E4E8) and a very soft, diffused shadow (0px 4px 12px rgba(0, 0, 0, 0.05)).
3. **Level 2 (Popovers/Modals):** High-contrast white surfaces with a deeper shadow (0px 12px 24px rgba(0, 0, 0, 0.12)) to indicate focus.

Avoid heavy black shadows; instead, use tinted shadows that incorporate the primary blue to maintain a "tech-forward" feel.

## Shapes

The shape language is defined by **Rounded (8px-12px)** corners, striking a balance between modern friendliness and professional rigidity. 
- **Standard UI (Buttons, Inputs):** 8px (0.5rem) radius.
- **Large Containers (Cards, Modals):** 12px (0.75rem) radius.
- **Status Badges/Chips:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components

### Metric Cards
Metric cards should feature a large primary value (Headline-XL), a supporting label, and a subtle trend indicator (Success or Error color). Use the Level 1 Elevation style.

### Data Tables
Tables are the heart of the merchant experience. Use a white background with thin horizontal dividers (#F0F2F5). Row height should be fixed at 56px for standard density. Table headers use `label-md` for clarity.

### Inputs & Search
Inputs use an 8px border-radius and a 1px neutral border. In focus states, the border transitions to the primary Corporate Blue with a 3px soft outer glow. Icons (e.g., Search) should be 20px and set in a medium gray.

### Buttons
- **Primary:** Solid #0052CC with white text.
- **Secondary:** Transparent background with #0052CC border and text.
- **Ghost:** No border, primary color text; for low-priority actions like "Cancel."

### Status Chips
Use background tints for status chips (e.g., 10% opacity of the status color) with the full-color text to ensure they are glanceable but not distracting.