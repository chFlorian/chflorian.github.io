#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ROOT, "blog");
const TEMPLATE_PATH = path.join(BLOG_DIR, "_template.html");
const POSTS_JSON_PATH = path.join(BLOG_DIR, "posts.json");
const BLOG_INDEX_PATH = path.join(BLOG_DIR, "index.html");
const SITE_INDEX_PATH = path.join(ROOT, "index.html");
const HOMEPAGE_LIST_MAX = 5;

function normalizeSlug(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(isoDate) {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function prompt(rl, question, defaultVal) {
  const suffix = defaultVal !== undefined ? ` [${defaultVal}]` : "";
  return new Promise((resolve) => {
    rl.question(question + suffix + ": ", (answer) => {
      const trimmed = answer.trim();
      resolve(trimmed !== "" ? trimmed : (defaultVal !== undefined ? defaultVal : ""));
    });
  });
}

function getArgs() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const rest = args.filter((a) => a !== "--force");
  return { positional: rest, force };
}

async function main() {
  const { positional, force } = getArgs();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  let slug = positional[0];
  let title = positional[1];
  let dateIso = positional[2];
  let excerpt = positional[3];
  let heroImage = positional[4];

  const today = new Date().toISOString().slice(0, 10);

  if (!slug) slug = await prompt(rl, "Slug (folder name)", "");
  if (!slug) {
    console.error("Slug is required.");
    rl.close();
    process.exit(1);
  }

  slug = normalizeSlug(slug);
  if (!slug) {
    console.error("Slug is empty after normalization.");
    rl.close();
    process.exit(1);
  }

  const postDir = path.join(BLOG_DIR, slug);
  const indexPath = path.join(postDir, "index.html");

  if (fs.existsSync(indexPath) && !force) {
    console.error(`Article already exists at blog/${slug}/index.html. Use --force to overwrite.`);
    rl.close();
    process.exit(1);
  }

  if (!title) title = await prompt(rl, "Title", "");
  if (!title) {
    console.error("Title is required.");
    rl.close();
    process.exit(1);
  }

  if (!dateIso) dateIso = await prompt(rl, "Date (YYYY-MM-DD)", today);
  if (!dateIso) dateIso = today;
  const dateFormatted = formatDate(dateIso);

  if (!excerpt) excerpt = await prompt(rl, "Excerpt", "");
  if (!excerpt) excerpt = "";

  if (heroImage === undefined || heroImage === "") {
    if (process.stdin.isTTY) {
      const heroAnswer = await prompt(rl, "Hero image path relative to post folder (e.g. images/hero.png), or leave empty", "");
      heroImage = heroAnswer || undefined;
    } else {
      heroImage = undefined;
    }
  }

  rl.close();

  // Load template
  let template;
  try {
    template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  } catch (e) {
    console.error("Could not read template at blog/_template.html:", e.message);
    process.exit(1);
  }

  const bodyPlaceholder = "Your content here.";
  const replacements = {
    "{{title}}": escapeHtml(title),
    "{{date}}": dateIso,
    "{{dateFormatted}}": dateFormatted,
    "{{excerpt}}": excerpt,
    "{{body}}": bodyPlaceholder,
  };

  let html = template;
  for (const [key, value] of Object.entries(replacements)) {
    html = html.split(key).join(value);
  }

  // Create directory and optionally images dir
  fs.mkdirSync(postDir, { recursive: true });
  if (heroImage && heroImage.startsWith("images/")) {
    const imagesDir = path.join(postDir, "images");
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  fs.writeFileSync(indexPath, html, "utf8");
  console.log("Wrote blog/" + slug + "/index.html");

  // Update posts.json
  let posts = [];
  try {
    const raw = fs.readFileSync(POSTS_JSON_PATH, "utf8");
    posts = JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read posts.json, starting with empty list.");
  }
  if (!Array.isArray(posts)) posts = [];

  const newPost = {
    slug,
    title,
    date: dateIso,
    excerpt,
  };
  if (heroImage) newPost.heroImage = heroImage;

  posts.unshift(newPost);
  fs.writeFileSync(POSTS_JSON_PATH, JSON.stringify(posts, null, 2) + "\n", "utf8");
  console.log("Updated blog/posts.json");

  // Update inline JSON in blog/index.html
  const blogIndexContent = fs.readFileSync(BLOG_INDEX_PATH, "utf8");
  const blogDataJson = JSON.stringify(posts, null, 2);
  const blogIndexNew = blogIndexContent.replace(
    /(<script\s+type="application\/json"\s+id="blog-posts-data">)([\s\S]*?)(<\/script>)/,
    "$1\n" + blogDataJson + "\n    $3"
  );
  if (blogIndexNew === blogIndexContent) {
    console.warn("Could not find blog-posts-data script in blog/index.html");
  } else {
    fs.writeFileSync(BLOG_INDEX_PATH, blogIndexNew, "utf8");
    console.log("Updated inline blog-posts-data in blog/index.html");
  }

  // Update inline JSON in index.html (first N posts as { slug, title } only)
  const siteIndexContent = fs.readFileSync(SITE_INDEX_PATH, "utf8");
  const homepageList = posts.slice(0, HOMEPAGE_LIST_MAX).map((p) => ({ slug: p.slug, title: p.title }));
  const siteDataJson = JSON.stringify(homepageList, null, 2);
  const siteIndexNew = siteIndexContent.replace(
    /(<script\s+type="application\/json"\s+id="blog-posts-data">)([\s\S]*?)(<\/script>)/,
    "$1" + siteDataJson + "$3"
  );
  if (siteIndexNew === siteIndexContent) {
    console.warn("Could not find blog-posts-data script in index.html");
  } else {
    fs.writeFileSync(SITE_INDEX_PATH, siteIndexNew, "utf8");
    console.log("Updated inline blog-posts-data in index.html");
  }

  console.log("\nDone. Edit blog/" + slug + "/index.html to add your content.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
