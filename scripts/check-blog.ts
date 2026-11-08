/**
 * Blog guardrails (run: npm run blog:check). Fails on SEO cannibalisation
 * risks and thin / broken content. See docs/blog-seo-plan.md.
 */
import { blogPosts } from '../utils/blog-data';
import { modelsData } from '../utils/models-data';

const MIN_WORDS = 900;
const STATIC = new Set(['/', '/forsale', '/models', '/pricing', '/contact', '/list-boat', '/blog', '/useful-links', '/forum']);
// Slugs planned in docs/blog-seo-plan.md but not written yet: links to them are
// tolerated (hidden at render time until published) but reported.
const PLANNED = new Set('dragonfly-25-price dragonfly-28-price dragonfly-32-price dragonfly-35-price dragonfly-40-price classic-dragonfly-800-920-1000-price dragonfly-25-vs-28 dragonfly-28-vs-32 dragonfly-32-vs-35 dragonfly-28-touring-sport-performance best-dragonfly-for-a-family dragonfly-swing-wing-explained buy-a-boat-in-europe buy-a-boat-from-the-uk-vat-customs boat-survey-cost-and-scope boat-sea-trial-checklist negotiate-boat-price boat-scams-safe-payment best-first-sailboat boat-photography-tips write-a-boat-ad how-long-to-sell-a-boat broker-vs-private-sale boat-bill-of-sale prepare-boat-for-sale best-time-to-sell-a-boat sailboat-rig-types how-to-sail-a-trimaran trimaran-insurance multihull-marina-costs trailer-a-folding-trimaran ship-a-boat-overseas boat-winter-storage'.split(' '));
const errors: string[] = [];
const warns: string[] = [];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
const tokens = (s: string) => new Set(norm(s).split(' ').filter((w) => w.length > 2 || /[0-9]/.test(w)));
const jaccard = (a: Set<string>, b: Set<string>) => {
  const i = [...a].filter((x) => b.has(x)).length;
  return i / (a.size + b.size - i);
};

const slugs = new Set(blogPosts.map((p) => p.slug));
const byPk = new Map<string, string>();
const byDay = new Map<string, string>();

for (const p of blogPosts) {
  const tag = `[${p.slug}]`;
  const pk = norm(p.primaryKeyword);
  if (byPk.has(pk)) errors.push(`${tag} primaryKeyword "${p.primaryKeyword}" already owned by ${byPk.get(pk)}`);
  byPk.set(pk, p.slug);
  if (byDay.has(p.publishedAt)) errors.push(`${tag} same publishedAt as ${byDay.get(p.publishedAt)} (${p.publishedAt}): one post per day`);
  byDay.set(p.publishedAt, p.slug);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.publishedAt) || !/^\d{4}-\d{2}-\d{2}$/.test(p.updatedAt)) errors.push(`${tag} bad date format`);
  if (p.title.length > 70) errors.push(`${tag} title ${p.title.length} chars (max 70)`);
  if (p.description.length < 110 || p.description.length > 165) errors.push(`${tag} description ${p.description.length} chars (110-165)`);
  if (!norm(p.title).includes(norm(p.primaryKeyword).split(' ').slice(0, 2).join(' ')) && !norm(p.title + ' ' + p.description).includes(pk))
    warns.push(`${tag} primaryKeyword not found in title/description`);

  const text = [p.intro, ...p.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])])].join(' ');
  const wc = words(text);
  if (wc < MIN_WORDS) (p.updatedAt >= '2026-11-09' ? errors : warns).push(`${tag} ${wc} words (< ${MIN_WORDS})`);

  const links = [...text.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
  if (links.length < 3) errors.push(`${tag} only ${links.length} internal links (min 3)`);
  if (!links.some((l) => !l.startsWith('/blog'))) errors.push(`${tag} no link to a non-blog page (/forsale, /models, /list-boat...)`);
  if (new Set(links).size !== links.length) warns.push(`${tag} duplicate internal link targets`);
  for (const l of links) {
    const path = l.split('#')[0];
    if (path.startsWith('/blog/')) {
      if (!slugs.has(path.slice(6))) (PLANNED.has(path.slice(6)) ? warns : errors).push(`${tag} link to unwritten planned post ${l}`);
      if (path.slice(6) === p.slug) errors.push(`${tag} links to itself`);
    } else if (path.startsWith('/models/')) {
      if (!modelsData[path.slice(8)]) errors.push(`${tag} broken link ${l}`);
    } else if (!STATIC.has(path)) errors.push(`${tag} unknown internal route ${l}`);
  }
  for (const k of p.keywords) {
    const owner = blogPosts.find((o) => o.slug !== p.slug && norm(o.primaryKeyword) === norm(k));
    if (owner) errors.push(`${tag} secondary keyword "${k}" is the primaryKeyword of ${owner.slug}`);
  }
  const forSale = /\bfor sale$/i.test(p.primaryKeyword.trim()) && !/^(prepare|how|sell|get|ready)\b/i.test(p.primaryKeyword.trim());
  if (forSale) errors.push(`${tag} targets a "for sale" query: those belong to /forsale`);
}

for (let i = 0; i < blogPosts.length; i++)
  for (let j = i + 1; j < blogPosts.length; j++) {
    const a = blogPosts[i], b = blogPosts[j];
    const t = jaccard(tokens(a.title), tokens(b.title));
    const k = jaccard(tokens(a.primaryKeyword), tokens(b.primaryKeyword));
    if (t > 0.6 || k > 0.75) errors.push(`[${a.slug}] vs [${b.slug}] too similar (title ${t.toFixed(2)}, keyword ${k.toFixed(2)})`);
  }

// Editorial inbound links: links written in article text only. The automatic
// "same topic" block on each page is NOT counted, so this still flags weak spots.
const inbound = new Map<string, Set<string>>();
for (const p of blogPosts) {
  const text = [p.intro, ...p.sections.flatMap((s) => [...s.paragraphs, ...(s.bullets ?? [])])].join(' ');
  for (const m of text.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
    if (!inbound.has(m[1])) inbound.set(m[1], new Set());
    inbound.get(m[1])!.add(p.slug);
  }
}
const PILLARS = ['dragonfly-trimaran-price-guide', 'what-is-a-dragonfly-trimaran', 'how-to-buy-a-boat', 'how-to-sell-your-boat', 'types-of-boats', 'sailboat-transport-guide'];
for (const p of blogPosts) {
  const n = inbound.get(p.slug)?.size ?? 0;
  if (n === 0) warns.push(`[${p.slug}] no editorial link from another article (only the automatic block)`);
}
for (const slug of PILLARS) {
  const pillar = blogPosts.find((p) => p.slug === slug);
  if (!pillar) { errors.push(`pillar ${slug} missing`); continue; }
  const satellites = blogPosts.filter((p) => p.cluster === pillar.cluster && p.slug !== slug).length;
  const n = inbound.get(slug)?.size ?? 0;
  if (n < satellites) warns.push(`[${slug}] pillar has ${n} editorial inbound links for ${satellites} satellites (aim: at least as many)`);
}

console.log(`${blogPosts.length} posts checked`);
warns.forEach((w) => console.warn('WARN ', w));
errors.forEach((e) => console.error('ERROR', e));
process.exit(errors.length ? 1 : 0);
