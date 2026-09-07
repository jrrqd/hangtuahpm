#!/usr/bin/env node
/**
 * Regenerates Hangtuah brand SVG placeholders under public/brand/.
 * Safe to re-run; overwrites generated assets only.
 */
const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "..", "public", "brand");
fs.mkdirSync(out, { recursive: true });

const crest = `<circle cx="32" cy="32" r="30" fill="#0B1F3A"/>
  <circle cx="32" cy="32" r="22" fill="none" stroke="#0F8BF6" stroke-width="2"/>
  <path d="M10 32h44M32 10c8 8 8 36 0 44M32 10c-8 8-8 36 0 44" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
  <path d="M44 18 L48 14 L50 16 L46 20 Z M46 20 L38 42 L36 41 L44 19" fill="#C8102E"/>
  <circle cx="20" cy="22" r="2" fill="#0F8BF6"/>
  <circle cx="18" cy="26" r="1.5" fill="#FFFFFF"/>
  <circle cx="22" cy="26" r="1.5" fill="#FFFFFF"/>`;

fs.writeFileSync(
  path.join(out, "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">${crest}</svg>\n`
);

console.log("Brand assets refreshed in public/brand/");
