import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { stitch } from "@google/stitch-sdk";

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

for (const f of [".env", ".env.local"]) loadDotEnv(f);

const hasKey = Boolean(process.env.STITCH_API_KEY);
const hasToken = Boolean(process.env.STITCH_ACCESS_TOKEN);
console.log(`auth: STITCH_API_KEY=${hasKey ? "yes" : "no"}, STITCH_ACCESS_TOKEN=${hasToken ? "yes" : "no"}`);

const projectId = "6091286712815826104";
const screenId = "57278e46064d4b49abc892af0aa5f95e";
const projectTitle = "Glow Beauty Analysis";
const screenTitle = "Skincare Dashboard - Larger Focus Images";
const outDir = path.resolve("stitch-assets/glow-beauty-analysis/skincare-dashboard-larger-focus-images");
fs.mkdirSync(outDir, { recursive: true });

const metaPath = path.join(outDir, "metadata.json");
const htmlPath = path.join(outDir, "screen.html");
const imagePath = path.join(outDir, "screenshot.png");

try {
  const screen = await stitch.project(projectId).getScreen(screenId);
  const htmlUrl = await screen.getHtml();
  const imageUrl = await screen.getImage();

  if (!htmlUrl || !imageUrl) {
    throw new Error(`Empty download URL(s): html=${Boolean(htmlUrl)}, image=${Boolean(imageUrl)}`);
  }

  execFileSync("curl", ["-L", "-o", htmlPath, htmlUrl], { stdio: "inherit" });
  execFileSync("curl", ["-L", "-o", imagePath, imageUrl], { stdio: "inherit" });

  const metadata = {
    project: { id: projectId, title: projectTitle },
    screen: { id: screenId, title: screenTitle },
    sources: { htmlUrl, imageUrl },
    files: {
      html: htmlPath,
      screenshot: imagePath,
      metadata: metaPath,
    },
    downloadedAt: new Date().toISOString(),
  };
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  console.log("SUCCESS");
  console.log(htmlPath);
  console.log(imagePath);
  console.log(metaPath);
} catch (e) {
  const blocker = e?.message || String(e);
  const failure = {
    success: false,
    blocker,
    auth: {
      STITCH_API_KEY: hasKey,
      STITCH_ACCESS_TOKEN: hasToken,
    },
    project: { id: projectId, title: projectTitle },
    screen: { id: screenId, title: screenTitle },
    outputDir: outDir,
  };
  fs.writeFileSync(metaPath, JSON.stringify(failure, null, 2));
  console.error("FAIL:", blocker);
  process.exitCode = 1;
} finally {
  try {
    await stitch.close();
  } catch {}
}
