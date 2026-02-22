// Vercel Serverless Function: GET /api/assets/[vibeId]/[gender]
// Returns URLs for a random costume and background for the given vibe+gender
//
// Assets should be uploaded to a cloud storage (e.g., Cloudinary, S3) 
// and referenced in the ASSETS config below.
// For now, we use public/assets/ folder served by Vercel's CDN.

import path from "path";
import fs from "fs";

// ─── Asset Registry ──────────────────────────────────────────────────────────
// Each vibe has Male/, Female/, Background/ folders in public/assets/<vibe>/
// This function reads them from the filesystem at build time on Vercel

function getAssetsDir() {
  // On Vercel, public/ files are available at the project root
  return path.join(process.cwd(), "public", "assets");
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  const exts = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  return fs.readdirSync(dir).filter(f => exts.has(path.extname(f).toLowerCase()));
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { vibeId, gender } = req.query;

  if (!vibeId || !gender) {
    return res.status(400).json({ error: "vibeId and gender are required" });
  }

  if (!["male", "female"].includes(gender.toLowerCase())) {
    return res.status(400).json({ error: "gender must be 'male' or 'female'" });
  }

  const assetsDir = getAssetsDir();
  // Allow ?folder= override for A/B testing different prompts with same assets
  const folderName = req.query.folder || vibeId;
  const vibeDir = path.join(assetsDir, folderName);

  if (!fs.existsSync(vibeDir)) {
    return res.status(404).json({ error: `Vibe '${vibeId}' not found`, available: fs.readdirSync(assetsDir) });
  }

  const costumeFolder = gender.toLowerCase() === "male" ? "Male" : "Female";
  const costumeDir = path.join(vibeDir, costumeFolder);
  const bgDir = path.join(vibeDir, "Background");

  const costumes = listImages(costumeDir);
  const backgrounds = listImages(bgDir);

  if (costumes.length === 0) {
    return res.status(404).json({ error: `No ${costumeFolder} costumes found for '${vibeId}'` });
  }
  if (backgrounds.length === 0) {
    return res.status(404).json({ error: `No backgrounds found for '${vibeId}'` });
  }

  const costume = randomItem(costumes);
  const background = randomItem(backgrounds);

  // Return URLs relative to the domain — Vercel serves public/ at root
  const baseUrl = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

  return res.status(200).json({
    costumeUrl: `${baseUrl}/assets/${vibeId}/${costumeFolder}/${encodeURIComponent(costume)}`,
    backgroundUrl: `${baseUrl}/assets/${vibeId}/Background/${encodeURIComponent(background)}`,
    costume,
    background,
  });
}
