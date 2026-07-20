#!/usr/bin/env node
/**
 * Copies MediaPipe WASM assets and downloads face_landmarker.task into public/models/mediapipe/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public', 'models', 'mediapipe');
const wasmSrc = path.join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const taskUrl =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn('[setup-mediapipe] WASM source missing — run npm install first:', src);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log('[setup-mediapipe] Model already present:', dest);
      resolve();
      return;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('[setup-mediapipe] Preparing public/models/mediapipe ...');
  fs.mkdirSync(outDir, { recursive: true });
  copyDir(wasmSrc, outDir);
  await download(taskUrl, path.join(outDir, 'face_landmarker.task'));
  console.log('[setup-mediapipe] Done.');
}

main().catch((err) => {
  console.warn('[setup-mediapipe] Failed:', err.message);
  process.exit(0);
});
