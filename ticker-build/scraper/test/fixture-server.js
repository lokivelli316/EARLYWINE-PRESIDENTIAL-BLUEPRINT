#!/usr/bin/env node
/* Local fake "internet" for the scraper e2e test. Behaviour per round is read from $STATE (JSON) on every request.
 * Two hosts: 127.0.0.1:<port> (normal robots) and localhost:<port> (robots.txt returns 500 → full disallow). */
'use strict';
const http = require('http'), fs = require('fs');
const [, , port, stateFile] = process.argv;
const page = (title, body, extraHead = '') => `<!doctype html><html><head><title>${title}</title>${extraHead}<script>var t=${Date.now()}</script></head><body><nav>Home · Help</nav><main><h1>${title}</h1>${body}</main><footer>© Example</footer></body></html>`;
const filler = n => Array.from({ length: n }, (_, i) => `<p>Standing paragraph ${i + 1} of the policy text, unchanged across versions.</p>`).join('');
http.createServer((req, res) => {
  const S = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const host = req.headers.host || '', p = req.url;
  const send = (code, body, headers = {}) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', ...headers }); res.end(body); };
  if (host.startsWith('localhost')) { if (p === '/robots.txt') return send(500, 'oops'); return send(200, page('Local', filler(10))); }
  if (p === '/robots.txt') return send(200, 'User-agent: *\nDisallow: /private/\n', { 'content-type': 'text/plain' });
  if (p.startsWith('/gc-ledger-soft404-probe')) return send(200, page('Help Center', '<p>Sorry, we could not find that article.</p>'));
  if (p === '/') return send(200, page('Example Home', filler(5)));
  if (p === '/policy') return send(200, page('Download policy', filler(30) + (S.policy === 'v2' ? '<p>Last updated: October 1, 2026</p><p>Free accounts may download up to 5 songs.</p>' : '<p>Free accounts may download up to 10 songs.</p>')));
  if (p === '/dateonly') return send(200, page('Terms', filler(20), `<meta property="article:modified_time" content="${S.dateonly}">`));
  if (p === '/big') return send(200, page('Big page', S.big === 'v2' ? Array.from({ length: 40 }, (_, i) => `<p>Completely new section ${i}.</p>`).join('') : filler(40)));
  if (p === '/moved') { if (S.moved === 'home') { res.writeHead(301, { location: '/' }); return res.end(); } return send(200, page('Moving page', filler(15))); }
  if (p === '/soft') { if (S.soft === 'gone') return send(200, page('Help Center', '<p>Sorry, we could not find that article.</p>')); return send(200, page('Soft page', filler(15))); }
  if (p === '/wall') return send(503, '<html><head><title>Just a moment...</title></head><body>Checking your browser</body></html>', { 'cf-mitigated': 'challenge' });
  if (p === '/feed.xml') { const items = `<item><title>Post A</title><link>https://x/a</link><pubDate>Mon, 05 Oct 2026 00:00:00 GMT</pubDate></item><item><title>Post B</title><link>https://x/b</link><pubDate>Tue, 06 Oct 2026 00:00:00 GMT</pubDate></item>`; return send(200, S.feed === 'trunc' ? `<?xml version="1.0"?><rss><channel><title>F</title>${items}` : `<?xml version="1.0"?><rss><channel><title>F</title>${items}</channel></rss>`, { 'content-type': 'application/rss+xml' }); }
  if (p.startsWith('/private/')) return send(200, page('Private', filler(5)));
  send(404, page('Not Found', '<p>404</p>'));
}).listen(Number(port), '0.0.0.0');
