---
name: Clinical Radiance
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdada'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e8'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#484555'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#797587'
  outline-variant: '#c9c4d8'
  surface-tint: '#5d3fe0'
  primary: '#5b3cdd'
  on-primary: '#ffffff'
  primary-container: '#7459f7'
  on-primary-container: '#fffbff'
  inverse-primary: '#c9bfff'
  secondary: '#56579c'
  on-secondary: '#ffffff'
  secondary-container: '#b1b2fe'
  on-secondary-container: '#404285'
  tertiary: '#8d4b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b15f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5deff'
  primary-fixed-dim: '#c9bfff'
  on-primary-fixed: '#1a0063'
  on-primary-fixed-variant: '#441cc8'
  secondary-fixed: '#e1dfff'
  secondary-fixed-dim: '#c1c1ff'
  on-secondary-fixed: '#100f56'
  on-secondary-fixed-variant: '#3e3f83'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 24px
  stack-gap: 16px
  section-margin: 40px
  gutter: 16px
  unit: 8px
---

## Brand & Style
The design system is built upon a "Clinical Beauty" aesthetic, merging medical precision with high-end luxury skincare. The target audience seeks data-driven results wrapped in a premium, calming experience. 

The style is **Refined Minimalism** with a focus on high-clarity information architecture. It utilizes ample whitespace to evoke a sense of purity and hygiene, while the sophisticated color palette ensures the product feels authoritative yet accessible. The UI should feel like a high-end apothecary: organized, translucent, and meticulously composed.

## Colors
This design system employs a restricted, high-contrast palette to maintain its clinical focus.
- **Primary Purple (#7B61FF):** Used for primary actions, active states, and highlighting key scientific data. It represents the "tech" in beauty-tech.
- **Secondary Navy (#2E2F72):** Used for headings and primary text to provide a grounded, authoritative contrast against the light background.
- **Background (#FBF9F9):** A warm, off-white "clinical" base that reduces eye strain and feels more premium than pure hex white.
- **Surface (#FFFFFF):** Reserved for floating cards and interactive containers to create clear separation from the background.

## Typography
The typography utilizes **Inter** exclusively to lean into a systematic, modern, and neutral appearance. 
- **Headlines:** Set in Secondary Navy with tight letter-spacing to appear confident and structured.
- **Body Text:** Uses high line-heights to ensure readability of clinical descriptions and ingredient lists.
- **Labels:** Small caps or increased letter spacing are used for technical metadata (e.g., pH levels, percentages) to distinguish them from prose.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a standard 8px baseline rhythm. 
- **Mobile:** 4-column grid with 24px side margins to allow the content to breathe.
- **Desktop:** 12-column centered grid with a maximum content width of 1200px.
- **Rhythm:** Use large vertical gaps (40px+) between major sections to maintain a "high-end" minimalist feel. Content within cards should use a generous 24px internal padding.

## Elevation & Depth
Depth is created through **Ambient Shadows** rather than harsh borders. This mimics the soft lighting found in professional dermatology clinics.
- **Surface Elevation:** Cards use a very soft shadow: `0px 4px 20px rgba(46, 47, 114, 0.04)`.
- **Active Elevation:** Interactive elements like buttons or pressed cards use a slightly deeper, more concentrated shadow: `0px 8px 24px rgba(123, 97, 255, 0.15)`.
- **Tonal Layering:** The background is #FBF9F9, while the elevated surfaces are pure #FFFFFF, providing a subtle but clear hierarchy without the need for heavy outlines.

## Shapes
The design system uses **Rounded** geometry to soften the clinical precision, making the app feel more approachable and "human." 
- **Base Components:** 8px (0.5rem) for buttons and input fields.
- **Large Containers:** 16px to 24px for cards and image carousels to create a modern, app-centric feel.
- **Interactive Elements:** Checkboxes and progress bars use a 4px radius to maintain a sense of precision within smaller scales.

## Components
- **Buttons:** Primary buttons are solid Purple (#7B61FF) with white text. Secondary buttons are ghost-style with a Navy (#2E2F72) border. All buttons should have a minimum height of 48px to ensure accessibility.
- **Cards:** Pure white background, 24px corner radius, and the defined ambient shadow. Used for product displays, skin analysis results, and routine steps.
- **Chips:** Used for "Skin Type" or "Ingredient" tags. These should have a light Purple background at 10% opacity with Purple text.
- **Input Fields:** Minimalist design with a light gray bottom border that transforms into a Purple border on focus. Labels should persist above the field in Navy.
- **Progress Gauges:** Used for "Skin Health Scores." Use a circular stroke with the Primary Purple. The track should be the Background color (#FBF9F9) to look "etched" into the surface.
- **Lists:** Clean dividers using 1px lines at 5% opacity of Navy. Use chevron-right icons for navigation cues in Secondary Navy.