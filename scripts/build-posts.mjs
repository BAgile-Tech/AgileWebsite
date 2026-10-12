// Builds the Chatterbox blog from the files in content/posts/.
//
//   node scripts/build-posts.mjs            builds everything (runs automatically before `npm run build`)
//   node scripts/build-posts.mjs --check    same, but exits with an error if any post has a problem
//
// For every post file it writes a real page at public/chatterbox/<slug>/index.html (own web address,
// site header and footer, search-engine tags), and it writes public/posts.json, which the Chatterbox
// page and the home page read to show the newest posts. Both outputs are generated, so they are not
// committed (see .gitignore). To add a post, see content/HOW-TO-ADD-A-POST.md.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { marked } from 'marked';

const ROOT = new URL('../', import.meta.url);
const SITE = 'https://www.agilenet.works';
const TOPICS = {
  managed: 'Managed IT',
  egnyte: 'Egnyte & files',
  software: 'AEC software',
  ai: 'AI governance',
  security: 'Security',
};
const CHECK = process.argv.includes('--check');
const problems = [];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const problem = (file, msg) => { problems.push(`${file}: ${msg}`); console.warn(`SKIPPED ${file}: ${msg}`); };

function parsePost(file) {
  const raw = readFileSync(new URL(`content/posts/${file}`, ROOT), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return problem(file, 'the file must start with a block of settings between two --- lines');
  const meta = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i < 1) return problem(file, `this settings line has no "name: value" form: "${line}"`);
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  if (String(meta.draft).toLowerCase() === 'true') return null;
  for (const k of ['title', 'date', 'summary']) if (!meta[k]) return problem(file, `missing "${k}:" in the settings block`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || isNaN(new Date(meta.date))) return problem(file, `date must look like 2026-10-11, not "${meta.date}"`);
  meta.topic = (meta.topic || 'managed').toLowerCase();
  if (!TOPICS[meta.topic]) return problem(file, `topic must be one of: ${Object.keys(TOPICS).join(', ')}`);
  const format = (meta.format || 'md').toLowerCase();
  if (!['md', 'html'].includes(format)) return problem(file, 'format must be md or html');
  const slug = (meta.slug || file.replace(/\.md$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return problem(file, `web address "${slug}" may only use lowercase letters, numbers and hyphens`);
  let body = format === 'html' ? m[2] : marked.parse(m[2], { gfm: true });
  body = body.replace(/href="#/g, 'href="/#'); // links to sections of the main site must leave the post page
  const words = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const d = new Date(`${meta.date}T12:00:00Z`);
  return {
    slug, format, body,
    title: meta.title,
    date: meta.date,
    dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
    topic: meta.topic,
    topicLabel: TOPICS[meta.topic],
    summary: meta.summary,
    description: meta.description || meta.summary,
    author: meta.author || 'Brian @ Agile',
    image: meta.image || null,
    imageAlt: meta.image_alt || '',
    tile: meta.tile || '',
    readMinutes: Math.max(1, Math.round(words / 220)),
    url: `/chatterbox/${slug}/`,
  };
}

const files = readdirSync(new URL('content/posts/', ROOT)).filter((f) => /\.md$/i.test(f) && !f.startsWith('_'));
const posts = [];
for (const f of files) {
  const p = parsePost(f);
  if (!p) continue;
  if (posts.some((x) => x.slug === p.slug)) { problem(f, `another post already uses the web address "${p.slug}"`); continue; }
  posts.push(p);
}
posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));

// ---- page template: the site's own head, header and footer, taken from index.html ----
const indexHtml = readFileSync(new URL('index.html', ROOT), 'utf8');
const cut = (start, end) => { const i = indexHtml.indexOf(start); const j = indexHtml.indexOf(end, i); if (i < 0 || j < 0) throw new Error(`index.html is missing ${start}`); return indexHtml.slice(i, j + end.length); };
const rootLinks = (s) => s.replace(/href="#/g, 'href="/#');
const baseHead = indexHtml.slice(0, indexHtml.indexOf('</head>'))
  .replace(/<title>[\s\S]*?<\/title>\s*/, '')
  .replace(/<meta\s+name="description"[^>]*>\s*/, '')
  .replace(/<meta\s+(?:property|name)="(?:og|twitter):[^"]*"[^>]*>\s*/g, '')
  .replace(/<script src="https:\/\/elfsightcdn[^>]*><\/script>\s*/, '');
const header = rootLinks(cut('<header class="site-header">', '</header>')).replace('<a href="/#chatterbox"', '<a aria-current="page" href="/#chatterbox"');
const footer = rootLinks(cut('<footer class="site-footer">', '</footer>'));

const RELATED = `
  <section class="section tint" aria-labelledby="more-h">
    <div class="wrap">
      <div class="section-head split"><div class="stack"><p class="eyebrow">Keep reading</p><h2 id="more-h">Related</h2></div></div>
      <div class="cards six m-scroll">
        <a class="card" href="/#svc-license"><span class="code">Service</span><h3>Software License &amp; Spend Review</h3><p>See every seat and renewal in one place.</p><span class="more arrow">Details </span></a>
        <a class="card" href="/#ai-sample"><span class="code">AI governance</span><h3>A one-page staff guideline</h3><p>The approved-tools rule, applied to AI.</p><span class="more arrow">See the sample </span></a>
        <a class="card" href="/#work"><span class="code">Our work</span><h3>Case studies</h3><p>Egnyte migration, office move and Entra ID projects.</p><span class="more arrow">See our work </span></a>
      </div>
    </div>
  </section>`;

const MENU_JS = `<script>
(function(){
  var nav = document.getElementById('site-nav'), btn = document.getElementById('menu-btn');
  function closeGroups(){ document.querySelectorAll('.nav-group.open').forEach(function(g){ g.classList.remove('open'); g.querySelector('.sub-toggle').setAttribute('aria-expanded','false'); }); }
  btn.addEventListener('click', function(){ var o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  document.querySelectorAll('.sub-toggle').forEach(function(b){
    b.addEventListener('click', function(){
      var g = b.parentNode, open = !g.classList.contains('open');
      closeGroups();
      if(open){ g.classList.add('open'); b.setAttribute('aria-expanded','true'); }
    });
  });
  document.addEventListener('click', function(e){ if(!e.target.closest('.nav-group')) closeGroups(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeGroups(); });
})();
</script>`;

function pageFor(p) {
  const url = `${SITE}${p.url}`;
  const img = p.image && /^https?:\/\//.test(p.image) ? p.image : p.image ? `${SITE}${p.image}` : null;
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description,
    datePublished: p.date, author: { '@type': 'Person', name: p.author },
    publisher: { '@type': 'Organization', name: 'Agile Networks' }, mainEntityOfPage: url,
  };
  if (img) ld.image = img;
  const head = `${baseHead}<title>${esc(p.title)} | Chatterbox | Agile Networks</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
${img ? `<meta property="og:image" content="${esc(img)}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<style>.post-cover{margin:0 0 clamp(24px,3vw,40px)}.post-cover img{display:block;width:100%;height:auto;border:1px solid var(--rule)}.post-back{margin-top:2rem}</style>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>`;
  const cover = p.image && p.format === 'md'
    ? `<figure class="post-cover"><img src="${esc(p.image)}" alt="${esc(p.imageAlt)}" width="1456" height="971" loading="eager"></figure>\n` : '';
  const inner = p.format === 'html'
    ? p.body
    : `${cover}<div class="prose">\n${p.body}\n<p class="post-back"><a class="arrow" href="/#chatterbox">Back to Chatterbox </a></p></div>`;
  return `${head}
<body>
<a class="skip" href="#main">Skip to main content</a>

${header}

<main id="main">
  <article aria-labelledby="po-h1" style="--gx:38%;--gy:48%;--gb:.54;--gc1:#0B1D32;--gc2:#122E50;--gc3:#06142A;--ga:25,105,155">
    <header class="page-hero on-navy">
      <div class="wrap article-head">
        <p class="eyebrow"><a href="/#chatterbox" style="color:var(--line-on-navy);text-decoration:none">Chatterbox</a> · ${esc(p.topicLabel)}</p>
        <h1 id="po-h1">${esc(p.title)}</h1>
        <p class="lede">${esc(p.summary)}</p>
        <p class="byline">${esc(p.author)} · ${esc(p.dateLabel)} · About ${p.readMinutes} min read</p>
      </div>
    </header>

    <div class="section">
      <div class="wrap">
${inner}
      </div>
    </div>
  </article>
${RELATED}
</main>

${footer}

${MENU_JS}
</body>
</html>
`;
}

// ---- write outputs ----
rmSync(new URL('public/chatterbox/', ROOT), { recursive: true, force: true });
for (const p of posts) {
  const dir = new URL(`public/chatterbox/${p.slug}/`, ROOT);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), pageFor(p));
}
const list = posts.map(({ body, format, author, description, ...rest }) => rest);
writeFileSync(new URL('public/posts.json', ROOT), JSON.stringify({ updated: new Date().toISOString(), posts: list }, null, 2) + '\n');
console.log(`Built ${posts.length} post${posts.length === 1 ? '' : 's'}: ${posts.map((p) => p.slug).join(', ') || '(none)'}`);
if (CHECK && problems.length) { console.error(`\n${problems.length} problem(s) found:\n- ${problems.join('\n- ')}`); process.exit(1); }
