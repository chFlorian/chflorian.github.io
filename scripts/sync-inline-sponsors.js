#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ROOT, "blog");
const SPONSORS_JSON_PATH = path.join(BLOG_DIR, "sponsors.json");

const sponsorDataRegex = /(<script\s+type="application\/json"\s+id="sponsor-data">)([\s\S]*?)(<\/script>)/;

function getHtmlFilesToUpdate() {
  const files = [];
  const indexHtml = path.join(BLOG_DIR, "index.html");
  const templateHtml = path.join(BLOG_DIR, "_template.html");
  if (fs.existsSync(indexHtml)) files.push(indexHtml);
  if (fs.existsSync(templateHtml)) files.push(templateHtml);
  try {
    const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory() && !ent.name.startsWith("_")) {
        const postIndex = path.join(BLOG_DIR, ent.name, "index.html");
        if (fs.existsSync(postIndex)) files.push(postIndex);
      }
    }
  } catch (e) {
    // ignore
  }
  return files;
}

function main() {
  let data;
  try {
    const raw = fs.readFileSync(SPONSORS_JSON_PATH, "utf8");
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Could not read blog/sponsors.json:", e.message);
    process.exit(1);
  }

  // Inline the full sponsors.json payload so blog pages
  // can derive the active sponsor (including default + schedule)
  const jsonStr = JSON.stringify(data);

  const files = getHtmlFilesToUpdate();
  let updated = 0;
  for (const filePath of files) {
    let content = fs.readFileSync(filePath, "utf8");
    const match = content.match(sponsorDataRegex);
    if (!match) continue;
    const newContent = content.replace(sponsorDataRegex, (_, open, __, close) => open + jsonStr + close);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
      updated++;
      console.log("Updated " + path.relative(ROOT, filePath));
    }
  }
  if (updated === 0 && files.length > 0) {
    console.log("Inline sponsor-data already in sync.");
  } else if (updated > 0) {
    console.log("Updated " + updated + " file(s).");
  }
  console.log("Sync done.");
}

main();
