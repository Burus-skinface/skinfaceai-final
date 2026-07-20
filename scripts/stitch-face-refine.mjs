import { stitch } from '@google/stitch-sdk';

const projectId = '12128396166952111108';
const faceScreenId = '87149a3e5c7c4cd397a170d9367e0f21';

const editPrompt = `CRITICAL: Rebuild this screen to MATCH the left panel of the uploaded Face Analysis reference mock EXACTLY. Pixel-faithful clinical beauty UI. Do not invent extra sections.

STRICT VISUAL SPEC:
- Background #FBF9F9, white cards, soft ambient shadows, 20–24px radius
- Accent purple #7B61FF, navy text #2E2F72, muted gray labels
- NO dark mode, NO purple gradient blobs, NO glassmorphism overload

TOP (exact):
- Greeting line "Good morning, Sofia" (small gray) + bell icon with RED notification dot top-right
- Horizontal text tabs under greeting: Skin | Face | Scan | Glow Up | Progress — Face is ACTIVE with purple underline; others gray

HERO CARD "Your Face Score":
- Large rounded portrait of woman on the RIGHT/center with glowing purple ARC/halo around her head
- Left: label YOUR FACE SCORE, big 8.1 / 10, status "Very Good" in green
- Right of score area: POTENTIAL 8.9 / 10, "Excellent"
- Bottom of card: horizontal slider bar from Current → Potential with a circular handle in the middle

FACE IDENTITY CARD:
- Title "Balanced Classic"
- Purple pill badge "Top 18% of users"
- Right side: purple wireframe / 3D mesh head illustration
- Bottom: 4 chips with icons — Symmetrical, Elegant, Balanced, Timeless

SECTION "What shapes your face":
- Header with optional chevron
- Exactly 6 rows, each with: small square face-region thumbnail | title | thin progress bar | numeric score | status text (Great/Average) | chevron >
- Rows: Eye Area 8.4 Great, Jawline 8.2 Great, Harmony 8.5 Great, Symmetry 7.9 Average, Proportions 8.1 Great, Midface 8.0 Great

SECTION "Biggest Opportunities":
- Rows: Improve Eye Area (Score Impact +0.4), Define Jawline (Score Impact +0.3) with simple line icons

SECTION "Face Journey":
- Simple line chart with points labeled like 2 Weeks Ago / Last Week / Today

BOTTOM NAV (exact 5 items):
- Skin, Face (active purple), center elevated dark circular Scan FAB with scan-frame icon, Glow Up, Progress
- Labels under icons

Keep mobile single-column iPhone width. Remove anything that does not appear in the reference left screen.`;

const page2Prompt = `Create a NEW mobile screen matching the MIDDLE panel of the Face Analysis reference mock EXACTLY: "See Your Details".

Header: back chevron, title "See Your Details", info (i) icon.
Sub-tabs: Overview (active purple underline) | Measurements | 3D Model | History.

Vertical list of LARGE feature cards (Eye Area, Jawline, Harmony, etc.):
- Large zoomed close-up thumbnail on left
- Title + short description paragraph
- Score e.g. 8.4 and colored status Great/Average
- Chevron

Purple "Unlock Full Analysis" CTA card:
- Checklist: 3D Face Model, Golden Ratio Overlay, Advanced Metrics
- Glowing purple wireframe bust illustration
- Primary button "Unlock Everything" with lock icon

"Compare & Track" horizontal row of dated portrait chips with scores + "New Scan" dashed tile.

Bottom nav: Skin, Face, Scan FAB, Glow Up, Progress.
Light clinical style #FBF9F9 / #7B61FF / white cards.`;

const page3Prompt = `Create a NEW mobile screen matching the RIGHT panel of the Face Analysis reference mock EXACTLY: feature detail "Eye Area".

Header: back, title "Eye Area", share icon.
Hero: large close-up eye photo with white AI mapping dots/lines on eyelid.
Score card: 8.4 / 10 left; TOP 15% — Better than 85% of users right; full-width progress bar.
Strengths list with green checkmarks.
Improvement Areas with orange hollow circles.
AI Explanation paragraph block.
Tips For You: two side-by-side tip cards (sleep / eye care) with icons.
How It Compares: bell-curve chart with purple user marker vs population.
Bottom CTA card "Want Better Results?" + purple button "View Recommended Plan".

Same design system: #FBF9F9 background, #7B61FF accents, white rounded cards, clinical beauty.`;

console.log('1/3 Editing Face Dashboard to match reference…');
const edited = await stitch.callTool('edit_screens', {
  projectId,
  selectedScreenIds: [faceScreenId],
  deviceType: 'MOBILE',
  modelId: 'GEMINI_3_1_PRO',
  prompt: editPrompt,
});
console.log('edit done', edited && typeof edited === 'object' ? Object.keys(edited) : typeof edited);

console.log('2/3 Generating See Your Details…');
const p2 = await stitch.callTool('generate_screen_from_text', {
  projectId,
  deviceType: 'MOBILE',
  modelId: 'GEMINI_3_1_PRO',
  prompt: page2Prompt,
});
console.log('p2 done', p2 && typeof p2 === 'object' ? Object.keys(p2) : typeof p2);

console.log('3/3 Generating Eye Area detail…');
const p3 = await stitch.callTool('generate_screen_from_text', {
  projectId,
  deviceType: 'MOBILE',
  modelId: 'GEMINI_3_1_PRO',
  prompt: page3Prompt,
});
console.log('p3 done', p3 && typeof p3 === 'object' ? Object.keys(p3) : typeof p3);

const listed = await stitch.callTool('list_screens', { projectId });
console.log('\nScreens in project:');
for (const s of listed.screens || []) {
  console.log('-', s.title);
}
console.log('\nOpen Stitch: https://stitch.withgoogle.com/project/' + projectId);
await stitch.close();
