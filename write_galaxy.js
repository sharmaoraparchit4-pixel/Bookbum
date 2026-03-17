const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

// Add galaxy CSS before </style>
const galaxyCSS = `
.galaxy-feed { display: flex; flex-direction: column; gap: 10px; }
.galaxy-item { background: rgba(36,24,80,0.6); border: 1px solid rgba(108,92,231,0.2); border-radius: 14px; padding: 1rem 1.25rem; animation: fadeInUp 0.3s ease; cursor: pointer; transition: all 0.2s; }
.galaxy-item:hover { border-color: rgba(108,92,231,0.5); box-shadow: 0 0 20px rgba(108,92,231,0.15); transform: translateY(-1px); }
.galaxy-item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.galaxy-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid rgba(108,92,231,0.4); }
.galaxy-username { font-size: 12px; color: #a78bfa; font-family: 'Orbitron', monospace; letter-spacing: 1px; }
.galaxy-time { font-size: 11px; color: #4a3d7a; margin-left: auto; }
.galaxy-book-title { font-size: 15px; font-weight: 600; color: #e8e0ff; }
.galaxy-book-author { font-size: 13px; color: #9b8ec4; margin-top: 2px; }
.galaxy-rating { color: #f59e0b; font-size: 13px; margin-top: 4px; }
.user-library-modal { max-width: 540px; max-height: 80vh; overflow-y: auto; }
.user-library-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
.user-library-avatar { width: 56px; height: 56px; border-radius: 50%; border: 3px solid #6c5ce7; box-shadow: 0 0 20px rgba(108,92,231,0.4); }
.user-library-name { font-family: 'Orbitron', monospace; font-size: 15px; color: #e8e0ff; }
.user-library-bio { font-size: 13px; color: #9b8ec4; font-style: italic; margin-top: 2px; }
.user-library-stats { font-size: 11px; color: #6c5ce7; margin-top: 4px; font-family: 'Orbitron', monospace; letter-spacing: 1px; }
.close-btn { margin-left: auto; background: none; border: none; color: #6b5fa0; font-size: 20px; cursor: pointer; padding: 4px; }
.close-btn:hover { color: #e8e0ff; }`;

// Add galaxy tab button
const galaxyTab = `<button class="tab" onclick="switchTab('galaxy')">✦ Galaxy</button>`;

// Add galaxy panel HTML
const galaxyPanel = `
  <div id="galaxy" class="panel">
    <div class="section-label">◈ Recent transmissions from the galaxy</div>
    <div id="galaxyFeed"><div class="empty">Sign in to explore the galaxy.</div></div>
  </div>`;

// Add user library modal
const userLibraryModal = `
<div class="modal-overlay" id="userLibraryModal" style="display:none" onclick="closeUserLibrary(event)">
  <div class="modal user-library-modal" id="userLibraryContent"></div>
</div>`;

// Add galaxy JS functions
const galaxyJS = `
async function loadGalaxy() {
  if (!currentUser) return;
  const { data } = await supabaseClient.from('books').select('*, profiles(display_name, avatar_url)').order('created_at', { ascending: false }).limit(30);
  renderGalaxy(data || []);
}

function renderGalaxy(books) {
  const el = document.getElementById('galaxyFeed');
  if (!books.length) { el.innerHTML='<div class="empty">The galaxy is empty. Be the first to log a book!</div>'; return; }
  el.innerHTML = '<div class="galaxy-feed">' + books.map(b => {
    const profile = b.profiles || {};
    const name = profile.display_name || 'Unknown Traveller';
    const avatar = profile.avatar_url || '';
    const stars = b.rating ? '\\u2605'.repeat(b.rating) + '\\u2606'.repeat(5-b.rating) : '';
    const time = timeAgo(b.created_at);
    return '<div class="galaxy-item" onclick="openUserLibrary(\\'' + b.user_id + '\\')">' +
      '<div class="galaxy-item-header">' +
      '<img class="galaxy-avatar" src="' + avatar + '" onerror="this.style.display=\\'none\\'"/>' +
      '<span class="galaxy-username">' + name + '</span>' +
      '<span class="galaxy-time">' + time + '</span>' +
      '</div>' +
      '<div class="galaxy-book-title">' + b.title + '</div>' +
      '<div class="galaxy-book-author">' + b.author + '</div>' +
      (stars ? '<div class="galaxy-rating">' + stars + '</div>' : '') +
      '</div>';
  }).join('') + '</div>';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff/60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs/24) + 'd ago';
}

async function openUserLibrary(userId) {
  const modal = document.getElementById('userLibraryModal');
  const content = document.getElementById('userLibraryContent');
  content.innerHTML = '<div class="loading">SCANNING DIMENSION...</div>';
  modal.style.display = 'flex';
  const [{ data: profile }, { data: books }] = await Promise.all([
    supabaseClient.from('profiles').select('*').eq('id', userId).single(),
    supabaseClient.from('books').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  ]);
  const p = profile || {};
  const bks = books || [];
  content.innerHTML = '<div class="user-library-header">' +
    '<img class="user-library-avatar" src="' + (p.avatar_url||'') + '" onerror="this.style.display=\\'none\\'"/>' +
    '<div>' +
    '<div class="user-library-name">' + (p.display_name||'Unknown Traveller') + '</div>' +
    '<div class="user-library-bio">' + (p.bio||'No transmission yet...') + '</div>' +
    '<div class="user-library-stats">◈ ' + bks.length + ' books logged</div>' +
    '</div>' +
    '<button class="close-btn" onclick="closeUserLibrary()">✕</button>' +
    '</div>' +
    '<div class="section-label">◈ Their library</div>' +
    (bks.length ? bks.map(b =>
      '<div class="card book-item"><div class="book-info"><h3>' + b.title + '</h3>' +
      '<p>' + b.author + (b.rating ? ' &nbsp;' + '★'.repeat(b.rating) + '<span style="color:#2d1f63">' + '★'.repeat(5-b.rating) + '</span>' : '') + '</p>' +
      '</div></div>'
    ).join('') : '<div class="empty">No books logged yet.</div>');
}

function closeUserLibrary(e) {
  if (!e || e.target === document.getElementById('userLibraryModal')) {
    document.getElementById('userLibraryModal').style.display = 'none';
  }
}`;

let updated = html;

// 1. Add CSS
updated = updated.replace('</style>', galaxyCSS + '\n</style>');

// 2. Add Galaxy tab (before Profile tab)
updated = updated.replace('<button class="tab" onclick="switchTab(\'profile\')">◈ Profile</button>', galaxyTab + '\n    <button class="tab" onclick="switchTab(\'profile\')">◈ Profile</button>');

// 3. Add Galaxy panel (before profile panel)
updated = updated.replace('<div id="profile" class="panel">', galaxyPanel + '\n\n  <div id="profile" class="panel">');

// 4. Add user library modal (before </body>)
updated = updated.replace('</body>', userLibraryModal + '\n</body>');

// 5. Add galaxy JS (before initSupabase())
updated = updated.replace('initSupabase();', galaxyJS + '\ninitSupabase();');

// 6. Update switchTab to include galaxy
updated = updated.replace(
  "['mybooks','boink','wtr','profile']",
  "['mybooks','boink','wtr','galaxy','profile']"
);

// 7. Call loadGalaxy in onSignIn
updated = updated.replace(
  'await loadBooks();\n  renderProfile();',
  'await loadBooks();\n  await loadGalaxy();\n  renderProfile();'
);

// 8. Update switchTab to reload galaxy
updated = updated.replace(
  "document.getElementById(tab).classList.add('active');\n}",
  "document.getElementById(tab).classList.add('active');\n  if (tab==='galaxy' && currentUser) loadGalaxy();\n}"
);

fs.writeFileSync('public/index.html', updated);
console.log('Done! New file size:', updated.length);
console.log('Has galaxy tab:', updated.includes('galaxy'));
