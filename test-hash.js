const crypto = require('crypto');
const target = 'e698968faa3c8469e8b5993832f1e57e3bde65139e0f30a0c7a0f9732ed13cd8';

const words = [
  'admin', 'password', 'dre2026', 'dre2027', 'dre', 'hackathon', 
  'admin123', 'Admin123', '123456', 'DRE2026', 'DRE2027', 'dre-admin',
  'drehackathon', 'DRE', 'secret'
];

for (const w of words) {
  const h = crypto.createHash('sha256').update(w).digest('hex');
  if (h === target) {
    console.log('FOUND: ' + w);
    process.exit(0);
  }
}
console.log('NOT FOUND');
