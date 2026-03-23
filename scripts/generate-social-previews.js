#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ROOT, "blog");
const POSTS_JSON_PATH = path.join(BLOG_DIR, "posts.json");
const LOGO_PATH = path.join(ROOT, "images", "image0.png");

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitLines(text, maxCharsPerLine, maxLines) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (words.length > 0 && lines.length === maxLines) {
    const consumed = lines.join(" ").split(/\s+/).length;
    if (consumed < words.length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[. ]+$/, "")}...`;
    }
  }
  return lines;
}

function createSvg(post, logoDataUri) {
  const titleLines = splitLines(post.title, 28, 3);
  const excerptLines = splitLines(post.excerpt || "", 60, 3);

  const titleSvg = titleLines
    .map((line, index) => {
      const y = 220 + index * 64;
      return `<text x="80" y="${y}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" font-size="56" font-weight="800" fill="#1e3a8a">${escapeXml(line)}</text>`;
    })
    .join("");

  const excerptSvg = excerptLines
    .map((line, index) => {
      const y = 450 + index * 38;
      return `<text x="80" y="${y}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" font-size="32" font-weight="500" fill="#1f2937">${escapeXml(line)}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(
    post.title
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#dbeafe" />
      <stop offset="100%" stop-color="#bfdbfe" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1200" height="630" fill="url(#bg)" />
  <rect x="40" y="40" width="1120" height="550" rx="30" fill="#eff6ff" stroke="#93c5fd" stroke-width="3" />

  <circle cx="140" cy="120" r="44" fill="#2563eb" />
  <image href="${logoDataUri}" x="96" y="76" width="88" height="88" preserveAspectRatio="xMidYMid slice" clip-path="circle(44px at 44px 44px)" />
  <text x="205" y="132" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" font-size="34" font-weight="700" fill="#2563eb">Flo Writes Code</text>

  ${titleSvg}
  ${excerptSvg}
</svg>
`;
}

function main() {
  if (!fs.existsSync(LOGO_PATH)) {
    console.error("Logo not found at images/image0.png");
    process.exit(1);
  }

  let posts = [];
  try {
    posts = JSON.parse(fs.readFileSync(POSTS_JSON_PATH, "utf8"));
  } catch (error) {
    console.error("Could not read blog/posts.json:", error.message);
    process.exit(1);
  }
  if (!Array.isArray(posts)) {
    console.error("blog/posts.json must be an array.");
    process.exit(1);
  }

  const logoBase64 = fs.readFileSync(LOGO_PATH).toString("base64");
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  for (const post of posts) {
    if (!post || !post.slug || !post.title) continue;
    const postDir = path.join(BLOG_DIR, post.slug);
    if (!fs.existsSync(postDir)) continue;

    const svg = createSvg(post, logoDataUri);
    const outPath = path.join(postDir, "social-preview.svg");
    fs.writeFileSync(outPath, svg, "utf8");
    console.log(`Wrote blog/${post.slug}/social-preview.svg`);
  }
}

main();
