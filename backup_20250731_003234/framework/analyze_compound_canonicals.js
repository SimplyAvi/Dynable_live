const fs = require('fs');
const path = require('path');

// Patterns for categorization
const FORMS = ['flour', 'oil', 'butter', 'bits', 'powder', 'paste', 'milk', 'syrup', 'extract', 'cream', 'cheese', 'juice', 'sauce', 'jelly', 'jam', 'puree', 'halves', 'slices', 'chunks', 'wedges', 'greens', 'leaves', 'tips', 'liqueur', 'preserves', 'brandy'];
const PREPARATIONS = ['chopped', 'sliced', 'ground', 'grated', 'toasted', 'optional', 'cleaned', 'trimmed', 'packed', 'divided', 'crushed', 'roasted', 'peeled', 'minced', 'shredded', 'beaten', 'melted'];
const MULTI_INGREDIENT_PATTERNS = [/\b(and|or|blend|mix|seasoning|spice|mixed|combo|assorted|variety|medley|with|plus)\b/];

function categorize(compound) {
  const words = compound.split(' ');
  if (words.length > 2) return 'complex';
  if (MULTI_INGREDIENT_PATTERNS.some(re => re.test(compound))) return 'multi';
  if (FORMS.includes(words[1])) return 'form';
  if (PREPARATIONS.includes(words[1])) return 'prep';
  return 'product';
}

function isLegitimate(compound, freq, cat) {
  if (freq < 3) return false;
  if (cat === 'complex' || cat === 'multi') return false;
  if (cat === 'prep') return false; // skip pure preparation
  return true;
}

function main() {
  const questionable = JSON.parse(fs.readFileSync(path.join(__dirname, 'safe_normalization_questionable.json'), 'utf-8'));
  // 1. Extract and count
  const freq = {};
  for (const q of questionable) {
    const norm = q.normalized.trim();
    if (!norm || norm.split(' ').length > 3) continue;
    freq[norm] = (freq[norm] || 0) + 1;
  }
  // 2. Categorize and filter
  const compounds = Object.entries(freq)
    .map(([compound, count]) => {
      const cat = categorize(compound);
      return { compound, count, cat };
    })
    .filter(c => isLegitimate(c.compound, c.count, c.cat));
  // 3. Prioritize
  const prioritized = compounds.sort((a, b) => b.count - a.count).slice(0, 100);
  // 4. Export and summary
  const roadmap = prioritized.map((c, i) => ({
    rank: i + 1,
    canonical: c.compound,
    category: c.cat,
    frequency: c.count,
    expectedCoverage: `${c.count} ingredients`
  }));
  fs.writeFileSync(path.join(__dirname, 'analyze_compound_canonicals_results.json'), JSON.stringify(roadmap, null, 2));
  // Print summary
  console.log('=== COMPOUND CANONICAL ANALYSIS SUMMARY ===');
  console.log(`Total questionable compounds analyzed: ${Object.keys(freq).length}`);
  console.log('Top compound canonicals to add:');
  roadmap.slice(0, 20).forEach(c =>
    console.log(`#${c.rank}: ${c.canonical} (${c.category}) - Frequency: ${c.frequency}`)
  );
  console.log('\nImplementation roadmap exported to analyze_compound_canonicals_results.json');
}

main(); 