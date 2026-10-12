// Pulls the latest Chatterbox posts from Substack's RSS feed into public/substack.json.
// Runs before every build (npm run build) and daily via .github/workflows/substack-refresh.yml.
// If Substack can't be reached, the existing file is left alone and the build continues.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// Change this once chatterbox.agilenet.works (or another custom domain) is set up in Substack.
const SUBSTACK_URL = process.env.SUBSTACK_URL || 'https://brianagile.substack.com';
const OUT = new URL('../public/substack.json', import.meta.url);
const MAX_POSTS = 6;

const decode = (s) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&');
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]).trim() : '';
};
const text = (html) => decode(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

try {
  const res = await fetch(`${SUBSTACK_URL}/feed`, { headers: { 'User-Agent': 'agilenet-site-build' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const posts = xml.split(/<item[\s>]/).slice(1).map((item) => {
    const img = item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/) || item.match(/<media:content[^>]*url="([^"]+)"/);
    const date = new Date(tag(item, 'pubDate'));
    return {
      title: text(tag(item, 'title')),
      link: tag(item, 'link'),
      date: isNaN(date) ? null : date.toISOString(),
      summary: text(tag(item, 'description')).slice(0, 300),
      image: img ? decode(img[1]) : null,
    };
  }).filter((p) => p.title && p.link.startsWith('https://')).slice(0, MAX_POSTS);

  const next = JSON.stringify({ url: SUBSTACK_URL, updated: new Date().toISOString(), posts }, null, 2) + '\n';
  const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  // Only rewrite when the posts changed, so the daily job doesn't commit timestamp-only changes.
  const strip = (s) => s.replace(/"updated": "[^"]*",?\n?/, '');
  if (strip(prev) !== strip(next)) {
    writeFileSync(OUT, next);
    console.log(`substack.json updated: ${posts.length} posts`);
  } else {
    console.log('substack.json unchanged');
  }
} catch (err) {
  console.warn(`Could not refresh Substack posts (${err.message}). Keeping the existing substack.json.`);
}
