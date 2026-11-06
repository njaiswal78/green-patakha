export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface PageOpts {
  title: string;
  description: string;
  path: string;
  body: string;
  origin: string;
  repo: string;
  jsonLd?: unknown[];
  scripts?: string[];
}

export function page(o: PageOpts) {
  const url = `${o.origin}${o.path}`;
  const ld = (o.jsonLd || [])
    .map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, "\\u003c")}</script>`)
    .join("\n");
  const scripts = (o.scripts || []).map((s) => `<script type="module" src="${s}"></script>`).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:image" content="${o.origin}/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt">
<link rel="stylesheet" href="/css/site.css">
${ld}
${scripts}
</head>
<body>
<header class="nav">
  <div class="wrap nav-in">
    <a class="brand" href="/"><span class="dot"></span>Green Patakha</a>
    <nav class="links">
      <a href="/#crackers">Crackers</a>
      <a href="/compare">Compare</a>
      <a href="/docs">Docs</a>
      <a href="${o.repo}" rel="noopener">GitHub</a>
    </nav>
    <a class="btn" href="/play">Start bursting</a>
  </div>
</header>
<main>
${o.body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <div>
      <a class="brand" href="/"><span class="dot"></span>Green Patakha</a>
      <p class="muted">Indian Diwali crackers in your browser, with real recorded sound and zero smoke. Free and open source.</p>
    </div>
    <div class="cols">
      <div><b>Product</b><a href="/play">Burst crackers</a><a href="/#crackers">The 12 crackers</a><a href="/compare">Compare</a><a href="/#faq">FAQ</a></div>
      <div><b>Build</b><a href="/docs">Docs</a><a href="/docs/mcp">MCP</a><a href="/docs/self-host">Self-host</a><a href="/llms.txt">llms.txt</a></div>
      <div><b>Open source</b><a href="${o.repo}" rel="noopener">GitHub repo</a><a href="${o.repo}/blob/main/LICENSE" rel="noopener">MIT license</a><a href="${o.repo}/blob/main/public/sounds/CREDITS.md" rel="noopener">Sound credits</a><a href="${o.repo}/issues" rel="noopener">Report a bug</a></div>
    </div>
  </div>
  <div class="wrap copy">
    <p>© ${new Date().getUTCFullYear()} Green Patakha. MIT licensed. No cookies, no ads, no tracking.</p>
    <p class="tiny"><a href="https://natrajan.me/" rel="noopener">Startups by Natrajan</a></p>
  </div>
</footer>
</body>
</html>`;
}
