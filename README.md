# Agile Networks website (v3)

Marketing site for Agile Networks (agilenet.works).

## Files
- `index.html` - the whole site: all pages, styles and scripts in one file. Pages are shown by URL hash (`#services`, `#firms`, `#contact`, and so on).
- `package.json` - lets Bolt (or any Node environment) run and build the site with Vite.
- `.gitignore` - keeps build output out of the repo.

## Run locally
npm install
npm run dev

## Build
npm run build   (output goes to dist/)

## Before going live
- Remove the "Build notes (preview only)" footer link and the `#notes` page.
- Replace placeholders: logo, photos, videos, client logos, testimonial, phone, email, booking link, pricing, LinkedIn posts.
- Connect the contact form to a real form handler. It currently shows a "preview only" message and sends nothing.
- For better SEO, split the hash-based pages into separate pages with their own URLs (e.g. /services, /who-we-serve).
