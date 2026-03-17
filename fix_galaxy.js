const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const oldGalaxy = `async function loadGalaxy() {
  if (!currentUser) return;
  const { data } = await supabaseClient.from('books').select('*, profiles(display_name, avatar_url)').order('created_at', { ascending: false }).limit(30);
  renderGalaxy(data || []);
}`;

const newGalaxy = `async function loadGalaxy() {
  if (!currentUser) return;
  const { data: books } = await supabaseClient.from('books').select('*').order('created_at', { ascending: false }).limit(30);
  if (!books || !books.length) { renderGalaxy([]); return; }
  const userIds = [...new Set(books.map(b => b.user_id))];
  const { data: profiles } = await supabaseClient.from('profiles').select('*').in('id', userIds);
  const profileMap = {};
  (profiles || []).forEach(p => profileMap[p.id] = p);
  const enriched = books.map(b => ({ ...b, profiles: profileMap[b.user_id] || {} }));
  renderGalaxy(enriched);
}`;

if (html.includes('async function loadGalaxy()')) {
  const start = html.indexOf('async function loadGalaxy()');
  const end = html.indexOf('\n}', start) + 2;
  html = html.slice(0, start) + newGalaxy + html.slice(end);
  console.log('loadGalaxy replaced!');
} else {
  console.log('loadGalaxy NOT found');
}

fs.writeFileSync('public/index.html', html);
console.log('Done! File size:', html.length);
