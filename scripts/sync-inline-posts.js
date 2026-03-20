#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ROOT, "blog");
const POSTS_JSON_PATH = path.join(BLOG_DIR, "posts.json");
const BLOG_INDEX_PATH = path.join(BLOG_DIR, "index.html");
const SITE_INDEX_PATH = path.join(ROOT, "index.html");
const HOMEPAGE_LIST_MAX = 5;

function main() {
  let posts = [];
  try {
    const raw = fs.readFileSync(POSTS_JSON_PATH, "utf8");
    posts = JSON.parse(raw);
  } catch (e) {
    console.error("Could not read blog/posts.json:", e.message);
    process.exit(1);
  }
  if (!Array.isArray(posts)) {
    console.error("blog/posts.json must be a JSON array.");
    process.exit(1);
  }

  const blogDataJson = JSON.stringify(posts, null, 2);
  const blogIndexContent = fs.readFileSync(BLOG_INDEX_PATH, "utf8");
  const blogRegex = /(<script\s+type="application\/json"\s+id="blog-posts-data">)([\s\S]*?)(<\/script>)/;
  const blogMatch = blogIndexContent.match(blogRegex);
  const blogIndexNew = blogMatch ? blogIndexContent.replace(blogRegex, (_, open, __, close) => open + "\n" + blogDataJson + "\n    " + close) : blogIndexContent;
  if (!blogMatch) {
    console.warn("Could not find blog-posts-data script in blog/index.html");
  } else {
    fs.writeFileSync(BLOG_INDEX_PATH, blogIndexNew, "utf8");
    console.log("Updated inline blog-posts-data in blog/index.html");
  }

  const published = posts.filter((p) => !p.archived);
  const homepageList = published.slice(0, HOMEPAGE_LIST_MAX).map((p) => ({
    slug: p.slug,
    title: p.title,
  }));
  const siteDataJson = JSON.stringify(homepageList, null, 2);
  const siteIndexContent = fs.readFileSync(SITE_INDEX_PATH, "utf8");
  const siteRegex = /(<script\s+type="application\/json"\s+id="blog-posts-data">)([\s\S]*?)(<\/script>)/;
  const siteMatch = siteIndexContent.match(siteRegex);
  const siteIndexNew = siteMatch ? siteIndexContent.replace(siteRegex, (_, open, __, close) => open + siteDataJson + close) : siteIndexContent;
  if (!siteMatch) {
    console.warn("Could not find blog-posts-data script in index.html");
  } else {
    fs.writeFileSync(SITE_INDEX_PATH, siteIndexNew, "utf8");
    console.log("Updated inline blog-posts-data in index.html");
  }

  console.log("Sync done.");
}

main();
