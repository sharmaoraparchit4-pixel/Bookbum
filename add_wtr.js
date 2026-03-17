const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Find and show the current loadBooks function
const lbStart = html.indexOf('async function loadBooks()');
const lbEnd = html.indexOf('\n}', lbStart) + 2;
console.log('Current loadBooks:');
console.log(JSON.stringify(html.slice(lbStart, lbEnd)));

// Find and show the current saveRec function
const srStart = html.indexOf('function saveRec(i)');
const srEnd = html.indexOf('\n}', srStart) + 2;
console.log('\nCurrent saveRec:');
console.log(JSON.stringify(html.slice(srStart, srEnd)));
