# Blog

Posts are driven by **`posts.json`**. The homepage “Latest” link and the blog listing both read from this file (newest first).

### Using the article creation tool

From the site root, run:

```bash
node scripts/new-post.js
```

You’ll be prompted for **slug**, **title**, **date** (default: today), **excerpt**, and optional **hero image** path (e.g. `images/hero.png`). The script will:

- Create `blog/<slug>/` and generate `index.html` from `blog/_template.html`
- Prepend the new post to `posts.json`
- Update the inline `blog-posts-data` in both `blog/index.html` and `index.html` so file:// preview stays in sync

You can also pass arguments to skip prompts: `node scripts/new-post.js "my-slug" "My Title" "2025-03-15" "Short excerpt." "images/hero.png"` (hero can be omitted or left empty). Use `--force` to overwrite an existing article. Then edit `blog/<slug>/index.html` to add your content.

**Markdown editor:** Open `tools/article-editor.html` in your browser (e.g. from the repo root via a local server or `file://`). It provides a form (slug, title, date, excerpt, hero), a Markdown editor, and a live preview that matches the blog’s styling. Use **Save Article** (new slug) or **Update Article** (existing slug): with a supported browser you can pick the repo root or blog folder and it will create or update `blog/<slug>/article.md` and `posts.json`; otherwise it downloads the markdown file and copies the posts.json entry for you to add manually. The live preview in the editor is the same rendering as on the article page (`blog/article.html?slug=<slug>`).

### Blog CMS

Open **`tools/index.html`** in your browser via a local server (e.g. `npx serve .` from the repo root) to use the content management dashboard. You can:

- See all articles (from `posts.json`)
- **View** (open the live post), **Edit** (open the article editor with that post’s content loaded), and **Archive / Unarchive** (hide or show the post on the blog and homepage)
- **Add new article** (opens the article editor)
- **Download updated posts.json** after archiving or unarchiving, then replace `blog/posts.json` and run the sync script to update the blog and homepage

After any manual change to `posts.json` (not only from the CMS), run:

```bash
node scripts/sync-inline-posts.js
```

to refresh the inline `blog-posts-data` in `blog/index.html` and `index.html`. The homepage “Latest” list shows only non-archived posts (first 5). Posts can have an optional `archived: true` field in `posts.json` to hide them from the public list.

---

To add a new article **manually**:

1. **Add an entry to `posts.json`** at the **top** of the array (so it’s the latest):
   - `slug`: folder name under `blog/` (e.g. `my-post-title`)
   - `title`: display title
   - `date`: ISO date string (e.g. `2025-03-14`)
   - `excerpt`: short summary for the card
   - `heroImage`: optional, e.g. `"images/hero.png"` (path relative to the post folder), or omit for no image
   - `archived`: optional; set to `true` to hide the post from the blog list and homepage
2. **Create the folder** `blog/<slug>/` and add **`article.md`** with your content in Markdown. Use the same syntax as in the article editor: `##` / `###` for headings, ` ```language ` for code blocks (e.g. `swift`), `![alt](url "caption")` for images. The page `blog/article.html?slug=<slug>` fetches this file and renders it; the blog index links to that URL.
3. **Optional:** Add an `images/` folder inside the post and reference images in the markdown (e.g. `images/yourfile.png` or `../images/...` for site-root images). If you set `heroImage` in `posts.json`, add that file (e.g. `images/hero.png`) so the blog card shows it.

When the site is served over HTTP (e.g. GitHub Pages or a local server), the “Latest” button and blog list are loaded from `posts.json`. When you open the site from disk (`file://`), the same data is read from inline script tags so it works without a server. **To keep file:// preview in sync:** after editing `posts.json`, run `node scripts/sync-inline-posts.js`, or manually copy the full array into the `<script type="application/json" id="blog-posts-data">` in `blog/index.html` and the first 5 non-archived posts as `{ "slug", "title" }` into the same script id in `index.html`.

Root-relative links: from the article page at `blog/article.html`, use `../index.html` for the home page and `index.html` for the blog list. In markdown, image paths are relative to the page (e.g. `../images/photo.png` for site-root images).

---

### Sponsors

The sponsor box on the blog is driven by **`blog/sponsors.json`**. All blog post pages inject a sponsor box (icon, title, message) automatically—no need to edit individual articles.

- **Config format:** `sponsors.json` has:
  - `default`: optional object. When set, may include `icon`, `title`, `message`, `url`. Used as a **fallback sponsor** when no time‑framed sponsor is active.
  - `sponsors`: array of scheduled sponsors. Each entry has `icon`, `title`, `message`, `url`, `startDate`, `endDate` (all dates are ISO strings like `2025-03-15`). On page load the blog JS picks the sponsor whose timeframe includes **today** (`startDate <= today <= endDate`). If none match, it falls back to `default` (if present).
  - `current` / `history`: legacy fields that may still exist for backwards compatibility but are no longer used by the blog; new data is stored in `default` + `sponsors`.
- **Sponsor management in the CMS:** Open **`tools/index.html`** (via a local server). The “Sponsors” section lets you:
  - Configure a **default sponsor** (used as fallback when there is no active scheduled sponsor).
  - Add or edit a **scheduled sponsor** with `startDate` and `endDate`. The CMS validates that a new or edited sponsor’s timeframe does **not overlap** with any existing sponsor.
  - See which sponsor is **current for today** based on these timeframes.
  - Download updated `sponsors.json`, replace `blog/sponsors.json`, then run `node scripts/sync-inline-sponsors.js` to update the inline sponsor data in `blog/index.html`, `blog/_template.html`, and all post pages (for file:// preview).
- **Rendered articles:** `blog/article.html` injects the sponsor slot automatically when it renders markdown; no need to add anything to `article.md`.
