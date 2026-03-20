---
description: Pro UI Layout Rules - Fluid Dimensions and Flexbox
---
# Professional UI Layout Principles

The user explicitly mandated adopting a "Pro App" mindset for all layout and styling decisions. Never use a "fixed pixel" mindset.

## Core Rules

1. **NO Fixed Sizes**: Do not use hardcoded pixels like `width: 300px`, `height: 200px`, or large static margins (`marginTop: 40px`). These break across different screen sizes.

2. **Root Container is King**: The outermost container must always span the full screen bounds. In Tailwind web apps, use `flex flex-col min-h-screen w-full`. In React Native, always use `flex: 1`. 

3. **Flexbox Proportions**: Layouts must be built proportionally using flexbox.
   - Example App Structure:
     - Header/Nav: strictly sized or proportional (`flex-none` or `10-15%`)
     - Main Content: `flex: 1` (or `flex-grow` in Tailwind) to take up all remaining available space (`70%`)
     - Bottom CTA / Navbar: (`15-20%`)

4. **Padding Inside, Margin Minimal**: 
   - Apply padding (`p-4`, `p-6`) on the outer containers to give the content breathing room.
   - Avoid plastering margins everywhere on inner elements. Rely on Flex properties (`gap`, `items-center`, `justify-between`) to handle spacing.

5. **Mentality Shift**:
   - ❌ BAD: "This card should be 300px wide."
   - ✅ GOOD: "This card should fill 100% of its parent container." (e.g., `w-full`, `flex-1`).
   - ❌ BAD: "This button should be 48px."
   - ✅ GOOD: "This button should size dynamically with padding and fill width if CTA."

Always verify that custom UI elements (like cards, charts, and analysis results) expand gracefully from edge to edge (respecting safe area padding) instead of looking like a locked mobile mockup trapped in the center.
