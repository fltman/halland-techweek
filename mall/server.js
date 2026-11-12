// Liten server: visar filerna i public/ och erbjuder AI (Claude) via /api/ai.
//
// Så anropar sidan AI:n:
//   const svar = await fetch('/api/ai', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ system: 'Du är en …', prompt: 'Frågan' })
//   }).then(r => r.json());
//   svar.text   // AI:ns svar, eller svar.error om något gick fel
//
// För en chatt som ska minnas samtalet: skicka hela historiken i stället för prompt,
//   body: JSON.stringify({ system: '…', messages: [{ role: 'user', content: 'Hej' },
//                                                  { role: 'assistant', content: 'Hej!' },
//                                                  { role: 'user', content: 'Nästa fråga' }] })
//
// Nyckeln (ANTHROPIC_API_KEY) kommer från miljön och når aldrig webbläsaren.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const PUBLIC = path.join(import.meta.dirname, 'public');
const TYPER = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2'
};

// Modellen kan bytas med AI_MODEL i miljön.
const MODELL = process.env.AI_MODEL || 'claude-opus-5-5';
// Modeller där API:t självt kan lämna över till en annan modell om den första avböjer.
const HAR_FALLBACK = ['claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5', 'claude-fable-5-2', 'claude-fable-5-1'];
// Appen ligger öppet på nätet och varje anrop kostar pengar: ett tak per timme skyddar nyckeln.
const MAX_PER_TIMME = Number(process.env.AI_MAX_PER_HOUR) || 300;
let anropDennaTimme = 0;
setInterval(() => { anropDennaTimme = 0; }, 3_600_000).unref();

let klient;

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function lasBody(req, max = 200_000) {
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

// Tar emot antingen { prompt } eller { messages: [{ role, content }] } och ger tillbaka en giltig historik.
function tolkaMeddelanden(inn) {
  if (Array.isArray(inn.messages)) {
    const ok = inn.messages.length > 0 && inn.messages.every(m =>
      (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim());
    return ok ? inn.messages.map(m => ({ role: m.role, content: m.content })) : null;
  }
  if (typeof inn.prompt === 'string' && inn.prompt.trim()) return [{ role: 'user', content: inn.prompt }];
  return null;
}

async function ai(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return json(res, 503, { error: 'AI är inte påslaget för den här appen.' });
  if (anropDennaTimme >= MAX_PER_TIMME) return json(res, 429, { error: 'AI:n vilar en stund. Försök igen om en liten stund.' });

  let inn;
  try { inn = JSON.parse(await lasBody(req)); } catch { return json(res, 400, { error: 'Kunde inte läsa frågan.' }); }
  const messages = tolkaMeddelanden(inn);
  if (!messages) return json(res, 400, { error: 'prompt eller messages saknas.' });

  anropDennaTimme++;
  klient ??= new Anthropic();

  const fraga = {
    model: MODELL,
    max_tokens: 16000,
    // Låg ansträngning ger snabba svar, vilket passar små appar. Höj till 'medium' om svaren blir för tunna.
    output_config: { effort: 'low' },
    messages
  };
  if (typeof inn.system === 'string' && inn.system.trim()) fraga.system = inn.system;
  if (HAR_FALLBACK.includes(MODELL)) {
    fraga.betas = ['server-side-fallback-2026-07-01'];
    fraga.fallbacks = 'default';
  }

  try {
    const svar = await klient.beta.messages.create(fraga);
    if (svar.stop_reason === 'refusal') {
      return json(res, 200, { text: '', error: 'AI:n ville inte svara på det. Prova att formulera om.' });
    }
    const text = svar.content.filter(b => b.type === 'text').map(b => b.text).join('');
    json(res, 200, { text });
  } catch (fel) {
    if (fel instanceof Anthropic.AuthenticationError) {
      console.error('AI-fel: nyckeln godkänns inte');
      json(res, 503, { error: 'AI är inte påslaget för den här appen.' });
    } else if (fel instanceof Anthropic.RateLimitError) {
      console.error('AI-fel: för många anrop just nu');
      json(res, 429, { error: 'Det är många som använder AI:n just nu. Försök igen om en liten stund.' });
    } else if (fel instanceof Anthropic.APIError) {
      console.error(`AI-fel ${fel.status}: ${fel.message}`);
      json(res, 502, { error: 'AI:n svarade inte. Försök igen.' });
    } else {
      console.error('AI-fel', fel);
      json(res, 502, { error: 'AI:n svarade inte. Försök igen.' });
    }
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
