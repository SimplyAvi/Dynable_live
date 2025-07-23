const fs = require('fs');
const path = require('path');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

function printSample(samples) {
  for (const s of samples) {
    console.log(`ID: ${s.id} | Brand: ${s.brandOwner} | Score: ${s.score} | Canonical: ${s.suggestedCanonical}\n  Desc: ${s.description.substring(0, 100)}\n`);
  }
}

function topN(obj, n) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
}

function main() {
  const suggestions = JSON.parse(fs.readFileSync(path.join(__dirname, 'pattern_recognition_suggestions.json'), 'utf-8'));
  const sample = shuffle([...suggestions]).slice(0, 50);
  const byScore = groupBy(sample, 'score');

  // 1. Console display
  console.log('=== RANDOM SAMPLE OF 50 SUGGESTIONS ===');
  Object.keys(byScore).sort((a, b) => b - a).forEach(score => {
    console.log(`\n--- Score ${score} ---`);
    printSample(byScore[score].slice(0, 5));
  });

  // 2. Quality assessment
  const questionable = sample.filter(s => s.score === 3);
  const highConfidence = sample.filter(s => s.score >= 4);
  const canonicalDist = groupBy(sample, 'suggestedCanonical');
  console.log('\n=== CANONICAL DISTRIBUTION IN SAMPLE ===');
  Object.entries(canonicalDist).forEach(([k, v]) => {
    console.log(`${k}: ${v.length}`);
  });

  // 3. Pattern validation
  const allCanonicals = groupBy(suggestions, 'suggestedCanonical');
  const canonicalCounts = Object.fromEntries(Object.entries(allCanonicals).map(([k, v]) => [k, v.length]));
  const topCanonicals = topN(canonicalCounts, 10);
  console.log('\n=== TOP 10 CANONICALS IN ALL SUGGESTIONS ===');
  topCanonicals.forEach(([k, v]) => console.log(`${k}: ${v}`));
  const overMapped = topCanonicals.filter(([k, v]) => v > 100);
  if (overMapped.length) {
    console.log('\n=== OVER-MAPPED CANONICALS (100+ suggestions) ===');
    overMapped.forEach(([k, v]) => console.log(`${k}: ${v}`));
  }
  // High vs low scoring
  const highScoreSample = suggestions.filter(s => s.score >= 5).slice(0, 5);
  const lowScoreSample = suggestions.filter(s => s.score === 3).slice(0, 5);
  console.log('\n=== HIGH-SCORE SAMPLES (score >= 5) ===');
  printSample(highScoreSample);
  console.log('\n=== LOW-SCORE SAMPLES (score = 3) ===');
  printSample(lowScoreSample);

  // 4. Export options
  fs.writeFileSync(path.join(__dirname, 'pattern_review_high_confidence.json'), JSON.stringify(suggestions.filter(s => s.score >= 4), null, 2));
  fs.writeFileSync(path.join(__dirname, 'pattern_review_questionable.json'), JSON.stringify(suggestions.filter(s => s.score === 3), null, 2));
  const summary = {
    total: suggestions.length,
    highConfidence: suggestions.filter(s => s.score >= 4).length,
    questionable: suggestions.filter(s => s.score === 3).length,
    topCanonicals,
    overMapped: overMapped.map(([k, v]) => ({ canonical: k, count: v })),
    canonicalDistribution: Object.fromEntries(Object.entries(canonicalDist).map(([k, v]) => [k, v.length]))
  };
  fs.writeFileSync(path.join(__dirname, 'pattern_review_summary.json'), JSON.stringify(summary, null, 2));

  // 5. Recommendations
  console.log('\n=== RECOMMENDATIONS ===');
  console.log(`- Deploy high-confidence (score >= 4) suggestions immediately (${summary.highConfidence} mappings)`);
  console.log(`- Manually review questionable (score = 3) suggestions (${summary.questionable} mappings)`);
  if (overMapped.length) {
    console.log('- Review over-mapped canonicals for possible false positives.');
  }
  console.log('- Use this review to further refine pattern recognition rules.');
}

main(); 