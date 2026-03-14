# Blog

Posts are driven by **`posts.json`**. The homepage “Latest” link and the blog listing both read from this file (newest first).

To add a new article:

1. **Add an entry to `posts.json`** at the **top** of the array (so it’s the latest):
   - `slug`: folder name under `blog/` (e.g. `my-post-title`)
   - `title`: display title
   - `date`: ISO date string (e.g. `2025-03-14`)
   - `excerpt`: short summary for the card
   - `heroImage`: optional, e.g. `"images/hero.png"` (path relative to the post folder), or omit for no image
2. **Create the folder** `blog/<slug>/` and add `index.html`. Copy the structure from `swiftui-custom-layouts/index.html`: same header/footer, then your title, date, and content. For code blocks use `<pre class="rounded-xl overflow-x-auto"><code class="language-swift">…</code></pre>` (or `language-xxx` for other languages). Highlight.js runs on load and styles the block automatically.
3. **Optional:** Add an `images/` folder inside the post and reference images as `images/yourfile.png` in the post. If you set `heroImage` in `posts.json`, add that file (e.g. `images/hero.png`) so the blog card shows it.

When the site is served over HTTP (e.g. GitHub Pages or a local server), the “Latest” button and blog list are loaded from `posts.json`. When you open the site from disk (`file://`), the same data is read from inline script tags so it works without a server. **To keep file:// preview in sync:** after editing `posts.json`, copy the full array into the `<script type="application/json" id="blog-posts-data">` in `blog/index.html`, and copy the first post’s `slug` and `title` into `<script type="application/json" id="blog-latest-post">` in `index.html`.

Root-relative links: from a post at `blog/my-post/index.html`, use `../../index.html` for the home page and `../index.html` for the blog list.

---

### Sponsors

The current sponsor is read from **`blog/sponsors.json`**. All blog post pages inject a sponsor box (icon, title, message) after the first paragraph automatically—no need to edit individual articles.

- **Config format:** `sponsors.json` must have a `current` object (or `null` when there’s no sponsor) with:
  - `icon`: URL or path to the sponsor’s image (e.g. logo)
  - `title`: Sponsor name
  - `message`: Short line (e.g. “Thanks to X for supporting the blog!”)
  - `url`: (optional) Link when the box is clicked
- **To change the sponsor:** Edit `blog/sponsors.json` only. Every post will show the new sponsor on next load.
- **To hide the sponsor:** Set `"current": null` in `sponsors.json`.
- **In each new post:** Include the same `<div id="sponsor-slot"></div>` where you want the box (e.g. after the first paragraph) and the same sponsor script block from `swiftui-custom-layouts/index.html` (the script that fetches `../sponsors.json` and the optional inline `#sponsor-data` for file:// preview).
