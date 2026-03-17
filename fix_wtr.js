const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Replace loadBooks
const oldLoadBooks = `async function loadBooks() {\n  if (!currentUser) return;\n  const { data } = await supabaseClient.from('books').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });\n  myBooks = data || [];\n  renderBooks();\n}`;

const newLoadBooks = `async function loadBooks() {
  if (!currentUser) return;
  const [{ data: books }, { data: wtr }] = await Promise.all([
    supabaseClient.from('books').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
    supabaseClient.from('want_to_read').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
  ]);
  myBooks = books || [];
  wantToRead = wtr || [];
  renderBooks();
  renderWTR();
}`;

// Replace saveRec
const oldSaveRec = `function saveRec(i) {\n  const rec=currentRecs[i];\n  if(!rec||wantToRead.some(b=>b.title.toLowerCase()===rec.title.toLowerCase()))return;\n  wantToRead.push(rec);\n  const btn=document.getElementById('savebtn-'+i);\n  if(btn){btn.textContent='Saved!';btn.classList.add('saved');btn.disabled=true;}\n  renderWTR();\n}`;

const newSaveRec = `async function saveRec(i) {
  const rec=currentRecs[i];
  if(!rec||wantToRead.some(b=>b.title.toLowerCase()===rec.title.toLowerCase()))return;
  if (currentUser) {
    const { data } = await supabaseClient.from('want_to_read').insert({ user_id: currentUser.id, title: rec.title, author: rec.author }).select().single();
    if (data) wantToRead.push(data);
  } else {
    wantToRead.push(rec);
  }
  const btn=document.getElementById('savebtn-'+i);
  if(btn){btn.textContent='Saved!';btn.classList.add('saved');btn.disabled=true;}
  renderWTR();
}`;

if (html.includes(oldLoadBooks)) {
  html = html.replace(oldLoadBooks, newLoadBooks);
  console.log('loadBooks replaced!');
} else {
  console.log('loadBooks NOT found - trying index-based replacement');
  const start = html.indexOf('async function loadBooks()');
  const end = html.indexOf('\n}', start) + 2;
  html = html.slice(0, start) + newLoadBooks + html.slice(end);
  console.log('loadBooks replaced by index!');
}

if (html.includes(oldSaveRec)) {
  html = html.replace(oldSaveRec, newSaveRec);
  console.log('saveRec replaced!');
} else {
  console.log('saveRec NOT found - trying index-based replacement');
  const start = html.indexOf('function saveRec(i)');
  const end = html.indexOf('\n}', start) + 2;
  html = html.slice(0, start) + newSaveRec + html.slice(end);
  console.log('saveRec replaced by index!');
}

fs.writeFileSync('public/index.html', html);
console.log('Done! Has want_to_read:', html.includes('want_to_read'));
console.log('File size:', html.length);
