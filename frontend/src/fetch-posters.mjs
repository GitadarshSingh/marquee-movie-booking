// Run: node fetch-details.mjs TUMHARI_TMDB_KEY   (Spring Boot 8081 chalta ho)
const KEY = process.argv[2];
if (!KEY) { console.error('TMDB key do: node fetch-details.mjs KEY'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\s*\n\s*/g, ' ');
const ALT = { Chhaava: 'Chhava' };                 // jinka TMDB par naam alag hai
const US_TO_IN = { G: 'U', PG: 'UA7+', 'PG-13': 'UA13+', R: 'A', 'NC-17': 'A' };
const api = async (path) => (await fetch(`https://api.themoviedb.org/3${path}${path.includes('?') ? '&' : '?'}api_key=${KEY}`)).json();

const movies = await (await fetch('http://localhost:8081/api/movies')).json();
const lines = ['USE bms_db;'];
const missing = [];

for (const m of movies) {
  try {
    let hit;
    for (const q of [m.title, ALT[m.title]].filter(Boolean)) {
      const res = await api(`/search/movie?query=${encodeURIComponent(q)}`);
      hit = (res.results || []).find((x) => x.poster_path) || (res.results || [])[0];
      if (hit) break;
    }
    if (!hit) { missing.push(m.title); console.log('NOT FOUND', m.id, m.title); continue; }

    const d = await api(`/movie/${hit.id}?append_to_response=release_dates,videos`);
    const rels = d.release_dates?.results || [];
    const cert = (c) => rels.find((r) => r.iso_3166_1 === c)?.release_dates?.map((x) => x.certification).find(Boolean);
    const certificate = cert('IN') || US_TO_IN[cert('US')] || null;
    const trailer = (d.videos?.results || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer');

    const sets = [];
    if (d.overview) sets.push(`description='${esc(d.overview)}'`);
    if (d.vote_average) sets.push(`rating=${Number(d.vote_average).toFixed(1)}`);
    if (d.release_date) sets.push(`release_date='${d.release_date}'`);
    if (certificate) sets.push(`certificate='${esc(certificate)}'`);
    if (trailer) sets.push(`trailer_url='https://www.youtube.com/watch?v=${trailer.key}'`);
    if (sets.length) lines.push(`UPDATE movies SET ${sets.join(', ')} WHERE id=${m.id};`);
    console.log('OK       ', m.id, m.title);
  } catch (e) {
    missing.push(m.title);
    console.log('ERROR    ', m.title, e.message);
  }
  await sleep(150);
}

import { writeFileSync } from 'node:fs';
writeFileSync('details.sql', lines.join('\n'));
console.log(`\nDone. details.sql ban gayi. Nahi mile: ${missing.length}`, missing);