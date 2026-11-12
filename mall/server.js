// Liten server utan beroenden: visar filerna i public/ och erbjuder AI via /api/ai.
//
// Så anropar sidan AI:n:
//   const svar = await fetch('/api/ai', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ system: 'Du är en …', prompt: 'Frågan' })
//   }).then(r => r.json());
//   svar.text   // AI:ns svar, eller svar.error om något gick fel
//
// Nyckeln (OPENROUTER_API_KEY) och modellen (AI_MODEL) kommer från miljön och når aldrig webbläsaren.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC = path.join(__dirname, 'public');
const TYPER = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2'
};

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function lasBody(req, max = 100_000) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', bit => {
      data += bit;
      if (data.length > max) { reject(new Error('För mycket text')); req.destroy(); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function ai(req, res) {
  const { OPENROUTER_API_KEY, AI_MODEL } = process.env;
  if (!OPENROUTER_API_KEY || !AI_MODEL) return json(res, 503, { error: 'AI är inte påslaget för den här appen.' });

  let inn;
  try { inn = JSON.parse(await lasBody(req)); } catch { return json(res, 400, { error: 'Kunde inte läsa frågan.' }); }
  if (typeof inn.prompt !== 'string' || !inn.prompt.trim()) return json(res, 400, { error: 'prompt saknas.' });

  const messages = [];
  if (typeof inn.system === 'string' && inn.system.trim()) messages.push({ role: 'system', content: inn.system });
  messages.push({ role: 'user', content: inn.prompt });

  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: AI_MODEL, messages, max_tokens: 1500 }),
      signal: AbortSignal.timeout(60_000)
    });
    const ut = await r.json();
    if (!r.ok) {
      console.error('AI-fel', r.status, JSON.stringify(ut));
      return json(res, 502, { error: 'AI:n svarade inte. Försök igen.' });
    }
    json(res, 200, { text: ut.choices?.[0]?.message?.content ?? '' });
  } catch (fel) {
    console.error('AI-fel', fel);
    json(res, 502, { error: 'AI:n svarade inte. Försök igen.' });
  }
}

function fil(req, res) {
  let sokvag;
  try { sokvag = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  if (sokvag.endsWith('/')) sokvag += 'index.html';
  const full = path.join(PUBLIC, sokvag);
  if (full !== PUBLIC && !full.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }

  fs.readFile(full, (fel, data) => {
    if (fel) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Hittar inte sidan.'); }
    res.writeHead(200, { 'Content-Type': TYPER[path.extname(full).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/ai') return ai(req, res);
  if (req.method === 'GET' || req.method === 'HEAD') return fil(req, res);
  res.writeHead(405); res.end();
});

// Railway bestämmer porten via PORT. Lokalt väljs en ledig port.
server.listen(process.env.PORT || 0, () => {
  console.log(`Appen körs på http://localhost:${server.address().port}`);
});
