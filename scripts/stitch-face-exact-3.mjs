/**
 * Rebuild Skinface Face flow as 3 exact Stitch screens from the reference mock.
 * - Uploads reference
 * - Generates missing photo assets (via Stitch upload of generated PNGs if present)
 * - Creates 3 mobile screens with GEMINI_3_1_PRO
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { stitch } from '@google/stitch-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const projectId = process.env.STITCH_PROJECT_ID || '12128396166952111108';

const REF =
  process.env.STITCH_FACE_REF ||
  path.join(
    process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-emreb-OneDrive-Masa-st-mis602-cdz/assets',
    'c__Users_emreb_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_2_Tem_2026_15_55_47-0f4726d9-917a-42a2-a247-608191cd0f6b.png',
  );

const FALLBACK_REF = path.join(
  process.env.USERPROFILE || '',
  '.cursor/projects/c-Users-emreb-OneDrive-Masa-st-mis602-cdz/assets',
  'c__Users_emreb_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_2_Tem_2026_15_55_47-c73840c5-3536-4021-b1c4-9065a117bf58.png',
);

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
}
for (const f of ['.env', '.env.local']) loadDotEnv(path.join(root, f));

const PAGE1 = `EXACT replica of LEFT screen in the attached Face Analysis mock (3-panel reference). Mobile iPhone only. Copy layout 1:1.

Design system: bg #FBF9F9, white cards ~20px radius, soft shadows, purple #7B61FF, navy #2E2F72, green for Great, yellow/orange for Average. Thin line icons. iOS status bar 9:41.

MUST INCLUDE ALL OF THESE — nothing extra:

1) Header: "Good morning, Sofia" + purple sparkle; bell with RED dot top-right.
2) Sub-tabs: Skin | Face (ACTIVE purple underline) | Scan | Glow Up | Progress.
3) "Your Face Score" hero card:
   - Large portrait of young woman; LEFT half = Current look, RIGHT half = Potential (slightly enhanced); circular slider handle on the face dividing Current|Potential.
   - Left score 8.1/10 Very Good (green). Right score 8.9/10 Excellent.
4) "Your Face Identity" card:
   - Center purple translucent 3D wireframe digital bust (glowing purple mesh).
   - Title "Balanced Classic" + purple pill "Top 18% of users".
   - Four icon chips: Symmetrical, Elegant, Balanced, Timeless.
5) "What shapes your face" — 6 rows with square photo thumbs + name + colored progress bar + score + Great/Good/Average + chevron:
   Eye Area, Jawline, Harmony, Symmetry, Proportions, Midface.
6) "Biggest Opportunities" — 3 items with icons, titles, short descriptions, Score Impact like +0.4.
7) "AI Face Insight" — dark purple card, glowing crystal icon, short insight paragraph.
8) "Face Journey" — line chart 7.6→8.1 over 2 weeks.
9) Bottom nav: Skin | Face (purple active) | center Scan | Glow Up | Progress.

Generate ALL missing photos (portrait halves, wireframe head, feature thumbs) as high-quality assets inside the screen. Match reference composition exactly.`;

const PAGE2 = `EXACT replica of MIDDLE screen in the Face Analysis 3-panel mock: "See Your Details". Mobile iPhone. 1:1.

Header: back arrow | title See Your Details | info (i) icon.
Secondary tabs: Overview (ACTIVE purple underline) | Measurements | 3D Model | History.

Section "Your Face At A Glance" — tall vertical list of feature rows. EACH row:
- LARGE square thumbnail on left (unique photo per feature: eye closeup, jawline crop, purple wireframe for Harmony, split-face for Symmetry, grid-overlay face for Proportions, midface crop)
- Title + multi-line description
- Score + Great/Average + chevron

Then purple "Unlock Full Analysis" CTA:
- Glowing purple 3D wireframe bust
- Bullets including Golden Ratio Overlay / advanced metrics
- Big purple button "Unlock Everything" with lock icon

"Compare & Track": circular portrait chips with dates & scores (Today, Apr 15, Mar 15) + dashed New Scan + tile.

Bottom nav same as app (Face active). Generate any missing photos. Clinical beauty #FBF9F9 / #7B61FF.`;

const PAGE3 = `EXACT replica of RIGHT screen in the Face Analysis 3-panel mock: "Eye Area" detail. Mobile iPhone. 1:1.

Header: back | Eye Area | share icon.
Hero: full-width high-res eye close-up with white AI mapping dots and dashed lines on eyelid/lash line (GENERATE this technical overlay photo if missing).

Score card: 8.4/10 Great | TOP 15% (Better than 85% of Scanface users) | thin ranking bar.

Strengths: green checkmarks (e.g. Good eye openness).
Improvement Areas: orange circles (e.g. Slight under-eye darkness).
AI Explanation text block.
Tips For You: TWO cards side by side — moon/sleep tip + serum dropper/brightening tip.
How It Compares: bell curve with marker at 8.4 vs Average 4.0 and Excellent 10.0.
Bottom purple button "View Recommended Plan" with arrow.

Same design system. Generate missing photos. No extra sections.`;

async function main() {
  const project = stitch.project(projectId);
  console.log('Project', projectId);

  const assetDir = path.join(
    process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-emreb-OneDrive-Masa-st-mis602-cdz/assets',
  );
  const extraAssets = [
    ['face-hero-current-potential.png', 'Asset — Face hero Current/Potential'],
    ['face-wireframe-bust.png', 'Asset — Purple wireframe bust'],
    ['face-eye-ai-mapping.png', 'Asset — Eye AI mapping'],
  ];

  const refPath = fs.existsSync(REF) ? REF : FALLBACK_REF;
  if (fs.existsSync(refPath)) {
    console.log('Uploading 3-panel reference…', path.basename(refPath));
    const up = await project.upload(refPath, {
      title: 'Face Analysis REF — 3 screens exact',
    });
    console.log('Uploaded ref', up?.map?.((s) => s.id || s) || up);
  } else {
    console.warn('Reference image not found');
  }

  for (const [file, title] of extraAssets) {
    const p = path.join(assetDir, file);
    if (!fs.existsSync(p)) {
      console.warn('Missing asset', p);
      continue;
    }
    console.log('Uploading asset', file);
    const up = await project.upload(p, { title });
    console.log('Uploaded', up?.map?.((s) => s.id || s) || up);
  }

  for (const [label, prompt] of [
    ['PAGE1 Face Dashboard', PAGE1],
    ['PAGE2 See Your Details', PAGE2],
    ['PAGE3 Eye Area', PAGE3],
  ]) {
    console.log('\nGenerating', label, '…');
    const res = await stitch.callTool('generate_screen_from_text', {
      projectId,
      deviceType: 'MOBILE',
      modelId: 'GEMINI_3_1_PRO',
      prompt,
    });
    console.log(label, 'done', res && typeof res === 'object' ? Object.keys(res) : res);
  }

  const listed = await stitch.callTool('list_screens', { projectId });
  console.log('\nAll screens:');
  for (const s of listed.screens || []) console.log('-', s.title);
  console.log('\nhttps://stitch.withgoogle.com/project/' + projectId);
}

try {
  await main();
} catch (e) {
  console.error('FAIL', e?.message || e);
  process.exitCode = 1;
} finally {
  try {
    await stitch.close();
  } catch {}
}
