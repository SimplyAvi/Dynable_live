const fs = require('fs');
const path = require('path');

// Heuristics for safe spelling/formatting fixes
const SIMPLE_FIXES = [
  ['allpurpose', 'all-purpose'],
  ['whitesugar', 'white sugar'],
  ['oliveoil', 'olive oil'],
  ['all purpose', 'all-purpose'],
  ['mozzarellacheese', 'mozzarella cheese'],
  ['buttermelted', 'butter melted'],
  ['shreddedmozzarella', 'shredded mozzarella'],
  ['gratedzucchini', 'grated zucchini'],
  ['sugarcookies', 'sugar cookies'],
  ['eggsbeaten', 'eggs beaten'],
  ['largeeggs', 'large eggs'],
  ['zucchinisliced', 'zucchini sliced'],
];

function isSimpleFix(original, normalized) {
  for (const [bad, good] of SIMPLE_FIXES) {
    if (original.includes(bad) && normalized.includes(good)) return true;
  }
  // If only one word changed and both are single words, also safe
  const oWords = original.split(' ');
  const nWords = normalized.split(' ');
  if (oWords.length === 2 && nWords.length === 2 && oWords[0] !== nWords[0] && oWords[1] === nWords[1]) return true;
  return false;
}

function isCompound(normalized) {
  // Compound if more than 3 words or contains known compound patterns
  if (normalized.split(' ').length > 3) return true;
  if (/\b(chocolate chip|herb seasoning|noodle soup|chip cookie|spice blend|mixed vegetables|fruit juice|bean salad|cheese blend|vegetable oil)\b/.test(normalized)) return true;
  return false;
}

function scoreCase(q) {
  if (isCompound(q.normalized)) return 0; // Skip
  if (isSimpleFix(q.original, q.normalized)) return 2; // Safe
  // If normalized is only 2 words and both are in original, likely safe
  const nWords = q.normalized.split(' ');
  if (nWords.length <= 2 && nWords.every(w => q.original.includes(w))) return 1; // Risky but possible
  return 0; // Skip
}

function main() {
  const questionable = JSON.parse(fs.readFileSync(path.join(__dirname, 'safe_normalization_questionable.json'), 'utf-8'));
  // Score and categorize
  const scored = questionable.map(q => ({ ...q, score: scoreCase(q) }));
  const safe = scored.filter(q => q.score === 2);
  const risky = scored.filter(q => q.score === 1);
  // Sort by score, then alphabetically
  const sorted = [...safe, ...risky].sort((a, b) => b.score - a.score || a.normalized.localeCompare(b.normalized));
  // Display top 100
  console.log('=== TOP 100 QUESTIONABLE CASES FOR REVIEW ===');
  sorted.slice(0, 100).forEach((q, i) => {
    const rating = q.score === 2 ? 'Safe' : q.score === 1 ? 'Risky' : 'Skip';
    console.log(`#${i + 1}: ${q.original} → ${q.normalized} [${rating}]`);
  });
  // Export 50-100 best
  const best = sorted.slice(0, 100).filter(q => q.score === 2);
  fs.writeFileSync(path.join(__dirname, 'review_questionable_best.json'), JSON.stringify(best, null, 2));
  // Estimate coverage impact
  console.log(`\nSafe candidates exported: ${best.length}`);
  console.log('Results exported to review_questionable_best.json');
  console.log('Recommend: Batch insert these Safe mappings for final 60%+ coverage push.');
}

main(); 