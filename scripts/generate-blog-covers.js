#!/usr/bin/env node
/* =====================================================================
   generate-blog-covers.js — F.AI.Z Tech Blog
   ---------------------------------------------------------------------
   Generates a unique, on-brand SVG cover image for every post in
   blog-posts.json and writes them to images/blog/post-<id>.svg.

   Each cover is deterministically derived from the post id, so re-running
   is stable. Variety comes from: category-tinted gradient, a per-post
   accent hue, one of four decorative patterns, a topic icon, and a
   headline keyword pulled from the post's tags/title.

   Usage:  node scripts/generate-blog-covers.js
           node scripts/generate-blog-covers.js --write-json   (also
           rewrites the "image" field of each post to the new SVG path)
   ===================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'blog-posts.json');
const OUT_DIR = path.join(ROOT, 'images', 'blog');

const WRITE_JSON = process.argv.includes('--write-json');

/* ---------- colour helpers ---------- */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v)))
    .toString(16).padStart(2, '0')).join('');
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
function adjust(hex, { h = 0, s = 0, l = 0 } = {}) {
  const [H, S, L] = rgbToHsl(...hexToRgb(hex));
  return hslToHex(H + h, S + s, L + l);
}

/* ---------- deterministic RNG (mulberry32) ---------- */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- category palette (matches blog.css) ---------- */
const CAT = {
  phones:   { color: '#3b82f6', label: 'PHONES',         icon: 'phone' },
  laptops:  { color: '#8b5cf6', label: 'LAPTOPS',        icon: 'laptop' },
  cyber:    { color: '#ef4444', label: 'CYBER SECURITY', icon: 'shield' },
  consoles: { color: '#10b981', label: 'CONSOLES',       icon: 'gamepad' },
  tips:     { color: '#f59e0b', label: 'TECH TIPS',      icon: 'tools' },
};

/* ---------- topic icons (paths drawn on a 0..100 box) ---------- */
const ICONS = {
  phone: `<rect x="34" y="8" width="32" height="84" rx="9" fill="none" stroke="CC" stroke-width="4"/>
          <rect x="40" y="18" width="20" height="58" rx="2" fill="CC" opacity="0.35"/>
          <rect x="44" y="11" width="12" height="3" rx="1.5" fill="CC"/>
          <circle cx="50" cy="84" r="3" fill="CC"/>`,
  shield: `<path d="M50 6 L84 20 V48 C84 72 68 86 50 94 C32 86 16 72 16 48 V20 Z"
             fill="none" stroke="CC" stroke-width="4"/>
           <path d="M37 49 L46 60 L65 36" fill="none" stroke="CC" stroke-width="5"
             stroke-linecap="round" stroke-linejoin="round"/>`,
  gamepad: `<path d="M28 34 H72 C84 34 92 46 92 60 C92 72 86 78 79 78
              C73 78 70 72 66 68 H34 C30 72 27 78 21 78 C14 78 8 72 8 60
              C8 46 16 34 28 34 Z" fill="none" stroke="CC" stroke-width="4"/>
            <line x1="24" y1="50" x2="24" y2="62" stroke="CC" stroke-width="4" stroke-linecap="round"/>
            <line x1="18" y1="56" x2="30" y2="56" stroke="CC" stroke-width="4" stroke-linecap="round"/>
            <circle cx="70" cy="52" r="4" fill="CC"/>
            <circle cx="80" cy="60" r="4" fill="CC"/>`,
  laptop: `<rect x="20" y="22" width="60" height="42" rx="5" fill="none" stroke="CC" stroke-width="4"/>
           <rect x="27" y="29" width="46" height="28" rx="2" fill="CC" opacity="0.32"/>
           <path d="M10 76 H90 L84 66 H16 Z" fill="none" stroke="CC" stroke-width="4" stroke-linejoin="round"/>`,
  tools: `<path d="M40 30 a14 14 0 1 0 -8 18 L18 64 a8 8 0 0 0 11 11 L45 59
             a14 14 0 0 0 27 -12 a14 14 0 0 0 -20 -13 l10 10 -7 7 -10 -10 Z"
             fill="none" stroke="CC" stroke-width="4" stroke-linejoin="round"/>`,
};

/* ---------- headline keyword resolver ---------- */
// First match wins; checked against tags + title (case-insensitive).
const KEYWORDS = [
  ['Motorola', 'MOTOROLA'], ['Razr', 'MOTO RAZR'], ['Samsung', 'SAMSUNG'],
  ['Galaxy', 'SAMSUNG'], ['One UI', 'ONE UI'], ['MacBook', 'MACBOOK'],
  ['iPhone', 'iPHONE'], ['Apple', 'APPLE'], ['Foldable', 'FOLDABLES'],
  ['Oppo', 'OPPO'], ['Find X9', 'OPPO'], ['Pixel', 'GOOGLE PIXEL'],
  ['Google', 'GOOGLE'], ['Gemini', 'GOOGLE AI'], ['OnePlus', 'ONEPLUS'],
  ['Switch 2', 'SWITCH 2'], ['Nintendo', 'NINTENDO'], ['Yoshi', 'NINTENDO'],
  ['Indiana Jones', 'SWITCH 2'], ['Pokemon', 'NINTENDO'],
  ['PlayStation', 'CONSOLE WAR'], ['Xbox', 'CONSOLE WAR'],
  ['Steam Deck', 'STEAM DECK'], ['Valve', 'STEAM DECK'],
  ['Windows 11', 'WINDOWS 11'], ['Microsoft', 'MICROSOFT'],
  ['Ransomware', 'RANSOMWARE'], ['Smishing', 'SMISHING'],
  ['Phishing', 'PHISHING'], ['Infostealer', 'MALWARE'], ['Malware', 'MALWARE'],
  ['Spyware', 'SPYWARE'], ['Router', 'ROUTER HIJACK'], ['Russia', 'STATE HACKERS'],
  ['iCloud', 'iCLOUD SCAM'], ['HMRC', 'HMRC SCAM'], ['Royal Mail', 'PARCEL SCAM'],
  ['Hack', 'IPHONE HACK'], ['Data Breach', 'DATA BREACH'], ['Fraud', 'FRAUD ALERT'],
  ['Scam', 'SCAM ALERT'], ['NCSC', 'CYBER ALERT'], ['CYBERUK', 'CYBERUK 2026'],
];
function keywordFor(post) {
  const hay = (post.title + ' ' + (post.tags || []).join(' ')).toLowerCase();
  for (const [needle, label] of KEYWORDS) {
    if (hay.includes(needle.toLowerCase())) return label;
  }
  return CAT[post.category]?.label || 'TECH NEWS';
}

/* ---------- subtitle (short, from category) ---------- */
const SUB = {
  phones: 'New phone news & leaks',
  laptops: 'Laptops & computing',
  cyber: 'Stay safe online',
  consoles: 'Gaming & consoles',
  tips: 'Guides from the F.AI.Z bench',
};

/* ---------- pattern generators ---------- */
function pattern(style, r, accent) {
  const out = [];
  if (style === 0) { // dot grid
    for (let y = 30; y < 350; y += 34) {
      for (let x = 360; x < 600; x += 34) {
        out.push(`<circle cx="${x}" cy="${y}" r="2.4" fill="${accent}" opacity="0.18"/>`);
      }
    }
  } else if (style === 1) { // concentric rings off the right edge
    const cx = 560 + Math.round(r() * 30), cy = 90 + Math.round(r() * 160);
    for (let i = 1; i <= 6; i++) {
      out.push(`<circle cx="${cx}" cy="${cy}" r="${i * 34}" fill="none" stroke="${accent}" stroke-width="2" opacity="${0.2 - i * 0.02}"/>`);
    }
  } else if (style === 2) { // diagonal lines top-right
    for (let i = 0; i < 9; i++) {
      const off = 300 + i * 40;
      out.push(`<line x1="${off}" y1="-20" x2="${off + 140}" y2="170" stroke="${accent}" stroke-width="2" opacity="0.12"/>`);
    }
  } else { // scattered floating circles
    for (let i = 0; i < 14; i++) {
      const x = 330 + r() * 250, y = 20 + r() * 310, rad = 6 + r() * 30;
      out.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(0)}" fill="none" stroke="${accent}" stroke-width="2" opacity="0.13"/>`);
    }
  }
  return out.join('\n  ');
}

/* ---------- build one cover ---------- */
function buildSvg(post) {
  const cat = CAT[post.category] || CAT.tips;
  const r = rng(post.id * 2654435761);

  // Per-post accent hue: rotate the category colour for a unique tone,
  // while keeping it in the same family so the category stays readable.
  const hueShift = (r() * 70 - 35);             // -35°..+35°
  const accent = adjust(cat.color, { h: hueShift, s: 6, l: 4 });
  const accentSoft = adjust(accent, { l: 12, s: -4 });
  const deep = adjust(cat.color, { h: hueShift, s: -30, l: -42 }); // dark tint
  const ink = '#0b1220';

  const style = post.id % 4;
  const kw = keywordFor(post);
  const sub = SUB[post.category] || '';
  const iconPath = ICONS[cat.icon].replace(/CC/g, accentSoft);
  const wmPath = ICONS[cat.icon].replace(/CC/g, accent);

  // category pill geometry
  const pillW = 26 + cat.label.length * 8.6 + 22;
  // keyword font size shrinks for long words so it never overflows
  const kwSize = kw.length > 11 ? 46 : kw.length > 8 ? 56 : 64;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="600" height="350" role="img" aria-label="${esc(post.imageAlt || post.title)}">
  <defs>
    <linearGradient id="bg${post.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ink}"/>
      <stop offset="58%" stop-color="${deep}"/>
      <stop offset="100%" stop-color="${adjust(accent, { l: -34, s: -10 })}"/>
    </linearGradient>
    <radialGradient id="glowA${post.id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ink${post.id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <filter id="soft${post.id}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="38"/>
    </filter>
  </defs>

  <rect width="600" height="350" fill="url(#bg${post.id})"/>

  <!-- soft accent glows -->
  <circle cx="${(440 + r() * 120).toFixed(0)}" cy="${(70 + r() * 60).toFixed(0)}" r="150" fill="url(#glowA${post.id})" filter="url(#soft${post.id})"/>
  <circle cx="${(120 + r() * 80).toFixed(0)}" cy="${(300 + r() * 40).toFixed(0)}" r="120" fill="url(#glowA${post.id})" opacity="0.5" filter="url(#soft${post.id})"/>

  <!-- decorative pattern -->
  ${pattern(style, r, accent)}

  <!-- large watermark icon -->
  <g transform="translate(372,150) scale(2.1)" opacity="0.08">${wmPath}</g>

  <!-- category pill -->
  <g transform="translate(40,38)">
    <rect width="${pillW.toFixed(0)}" height="34" rx="17" fill="${accent}" opacity="0.16"/>
    <rect width="${pillW.toFixed(0)}" height="34" rx="17" fill="none" stroke="${accent}" stroke-width="1" opacity="0.5"/>
    <g transform="translate(13,7) scale(0.20)">${iconPath}</g>
    <text x="38" y="23" font-family="'Segoe UI',Roboto,Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="1.5" fill="${accentSoft}">${esc(cat.label)}</text>
  </g>

  <!-- icon badge -->
  <g transform="translate(40,120)">
    <rect width="64" height="64" rx="16" fill="${accent}" opacity="0.14"/>
    <rect width="64" height="64" rx="16" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.45"/>
    <g transform="translate(13,13) scale(0.38)">${iconPath}</g>
  </g>

  <!-- headline keyword -->
  <text x="42" y="232" font-family="'Segoe UI',Roboto,Arial,sans-serif" font-size="${kwSize}" font-weight="800" letter-spacing="-1" fill="url(#ink${post.id})">${esc(kw)}</text>
  <rect x="44" y="248" width="64" height="5" rx="2.5" fill="${accent}"/>
  <text x="42" y="284" font-family="'Segoe UI',Roboto,Arial,sans-serif" font-size="17" font-weight="500" fill="#94a3b8">${esc(sub)}</text>

  <!-- wordmark -->
  <text x="42" y="324" font-family="'Segoe UI',Roboto,Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="3" fill="${accent}" opacity="0.85">F.AI.Z<tspan fill="#64748b" letter-spacing="3"> · TECH</tspan></text>
</svg>`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---------- main ---------- */
function main() {
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let count = 0;
  for (const post of data.posts) {
    const svg = buildSvg(post);
    const file = path.join(OUT_DIR, `post-${post.id}.svg`);
    fs.writeFileSync(file, svg);
    post.image = `images/blog/post-${post.id}.svg`;
    count++;
  }

  if (WRITE_JSON) {
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
    console.log(`Updated ${JSON_PATH} image fields.`);
  }
  console.log(`Generated ${count} blog covers in images/blog/`);
}

main();
