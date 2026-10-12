# Agile Networks website (v3)

Marketing site for Agile Networks (agilenet.works).

## Files
- `index.html` - the whole site: all pages, styles and scripts in one file. Pages are shown by URL hash (`#services`, `#firms`, `#contact`, and so on).
- `package.json` - lets Bolt (or any Node environment) run and build the site with Vite.
- `content/posts/` - one file per Chatterbox post. See `content/HOW-TO-ADD-A-POST.md` and `_TEMPLATE.md`.
- `scripts/build-posts.mjs` - turns those files into a page per post (`/chatterbox/<name>/`) and `public/posts.json`. Runs automatically before `npm run dev` and `npm run build`. Generated output is not committed.
- `.github/workflows/check-posts.yml` - emails you if a post file has a mistake.
- `.gitignore` - keeps build output and generated post files out of the repo.

## Run locally
npm install
npm run dev

## Build
npm run build   (builds the posts, then the site; output goes to dist/)

The host must run `npm run build` (not just `vite build`), or new posts will not appear.

## Before going live
- Remove the "Build notes (preview only)" footer link and the `#notes` page.
- Replace placeholders: logo, photos, videos, client logos, testimonial, phone, email, booking link, pricing, LinkedIn posts.
- Connect the contact form to a real form handler. It currently shows a "preview only" message and sends nothing.
- For better SEO, split the hash-based pages into separate pages with their own URLs (e.g. /services, /who-we-serve).
