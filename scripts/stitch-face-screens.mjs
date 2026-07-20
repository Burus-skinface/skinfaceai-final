/**
 * Generate Skinface Face screens in Google Stitch (SDK 0.3.x).
 * Env: STITCH_API_KEY
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { stitch } from "@google/stitch-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
for (const f of [".env", ".env.local"]) loadDotEnv(path.join(root, f));

const REF_IMAGE =
  process.env.STITCH_FACE_REF ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-Users-emreb-OneDrive-Masa-st-mis602-cdz/assets",
    "c__Users_emreb_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_2_Tem_2026_15_55_47-c73840c5-3536-4021-b1c4-9065a117bf58.png",
  );

const PROJECT_ID = process.env.STITCH_PROJECT_ID || "12128396166952111108";
const outDir = path.join(root, "stitch-assets/skinface-face-analysis");
fs.mkdirSync(outDir, { recursive: true });

const FACE_PROMPT = `Mobile iPhone UI for Skinface app — Face Analysis tab. Light clinical beauty style.

Background #fbf9f9. White cards, 16-24px radius, soft shadows. Accent purple #7B61FF / navy #2e2f72. Clean sans-serif. No dark mode.

Layout top to bottom:
1) Greeting "Good morning, Sofia" + notification bell with red dot
2) Tabs: Skin | Face (active purple underline) | Scan | Glow Up | Progress
3) Hero "Your Face Score" card: portrait photo with purple glow arc; score 8.1/10 Very Good; Potential 8.9/10 Excellent; Current→Potential slider
4) Face Identity card: "Balanced Classic", purple pill "Top 18% of users", wireframe mesh head, chips Symmetrical/Elegant/Balanced/Timeless
5) "What shapes your face" list rows with thumbnail, name, thin progress bar, score, status Great/Average, chevron — Eye Area, Jawline, Harmony, Symmetry, Proportions, Midface
6) "Biggest Opportunities" with score impact values
7) Face Journey line chart
8) Bottom nav: Skin, Face (active), elevated circular Scan FAB, Glow Up, Progress

Single high-fidelity mobile screen matching a premium face-analysis product.`;

try {
  const project = stitch.project(PROJECT_ID);
  console.log("Project", PROJECT_ID);

  if (fs.existsSync(REF_IMAGE)) {
    console.log("Uploading reference mockup…");
    const uploaded = await project.upload(REF_IMAGE, {
      title: "Face Analysis — Reference (3 screens)",
    });
    console.log(
      "Uploaded screens:",
      uploaded?.map?.((s) => s.id || s.screenId || s) || uploaded,
    );
  } else {
    console.warn("Ref image missing:", REF_IMAGE);
  }

  console.log("Generating Face Dashboard…");
  const gen = await stitch.callTool("generate_screen_from_text", {
    projectId: PROJECT_ID,
    deviceType: "MOBILE",
    modelId: "GEMINI_3_1_PRO",
    prompt: FACE_PROMPT,
  });
  console.log("generate result keys", gen && typeof gen === "object" ? Object.keys(gen) : typeof gen);
  fs.writeFileSync(
    path.join(outDir, "generate-raw.json"),
    JSON.stringify(gen, null, 2).slice(0, 50000),
  );

  console.log("Downloading project assets…");
  const dl = await project.downloadAssets(outDir);
  console.log("Downloaded", dl.screens?.length || 0, "screens");
  if (dl.warnings?.length) console.log("warnings", dl.warnings);

  fs.writeFileSync(
    path.join(outDir, "metadata.json"),
    JSON.stringify(
      {
        success: true,
        projectId: PROJECT_ID,
        stitchUrl: `https://stitch.withgoogle.com/project/${PROJECT_ID}`,
        downloaded: dl.screens,
        at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log("\nOpen:", `https://stitch.withgoogle.com/project/${PROJECT_ID}`);
  console.log("Local:", outDir);
} catch (e) {
  console.error("FAIL:", e?.message || e);
  if (e?.code) console.error("code", e.code);
  process.exitCode = 1;
} finally {
  try {
    await stitch.close();
  } catch {}
}
