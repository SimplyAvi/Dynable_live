const fs = require('fs');
const path = require('path');

function tokenize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
}

function isPrimaryIngredient(description, canonical) {
  const tokens = tokenize(description);
  return tokens.slice(0, 3).includes(canonical.toLowerCase());
}

function rateSuggestion(s) {
  if (!isPrimaryIngredient(s.description, s.suggestedCanonical)) return 'Bad';
  if ((s.description || '').length > 50) return 'Questionable';
  return 'Good';
}

function main() {
  const data = require('./pattern_recognition_mapper_v2_sample.json');
  console.log('=== V2 SAMPLE REVIEW: FIRST 20 SUGGESTIONS ===');
  data.slice(0, 20).forEach((s, i) => {
    const rating = rateSuggestion(s);
    console.log(`#${i + 1} | Score: ${s.score} | ${s.suggestedCanonical} | ${s.brandOwner}\n  Desc: ${s.description}\n  Rating: ${rating}\n`);
  });

  // Quality validation
  const ratings = data.map(rateSuggestion);
  const good = ratings.filter(r => r === 'Good').length;
  const questionable = ratings.filter(r => r === 'Questionable').length;
  const bad = ratings.filter(r => r === 'Bad').length;
  const qualityPct = ((good / data.length) * 100).toFixed(1);

  // Distribution analysis
  const canonicalDist = {};
  const scoreDist = {};
  const brandDist = {};
  data.forEach(s => {
    canonicalDist[s.suggestedCanonical] = (canonicalDist[s.suggestedCanonical] || 0) + 1;
    scoreDist[s.score] = (scoreDist[s.score] || 0) + 1;
    brandDist[s.brandOwner] = (brandDist[s.brandOwner] || 0) + 1;
  });
  console.log('\n=== CANONICAL DISTRIBUTION ===');
  Object.entries(canonicalDist).forEach(([k, v]) => console.log(`${k}: ${v}`));
  console.log('\n=== SCORE DISTRIBUTION ===');
  Object.entries(scoreDist).forEach(([k, v]) => console.log(`Score ${k}: ${v}`));
  console.log('\n=== BRAND DIVERSITY (top 10) ===');
  Object.entries(brandDist).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log(`${k}: ${v}`));

  // Quality scoring
  console.log(`\n=== QUALITY SCORING ===`);
  console.log(`Good: ${good}`);
  console.log(`Questionable: ${questionable}`);
  console.log(`Bad: ${bad}`);
  console.log(`Quality % (Good): ${qualityPct}%`);
  if (bad > 0) {
    console.log('\n=== BAD SUGGESTIONS (first 5) ===');
    data.filter((s, i) => ratings[i] === 'Bad').slice(0, 5).forEach(s => {
      console.log(`Score: ${s.score} | ${s.suggestedCanonical} | ${s.brandOwner}\n  Desc: ${s.description}\n`);
    });
  }
  if (questionable > 0) {
    console.log('\n=== QUESTIONABLE SUGGESTIONS (first 5) ===');
    data.filter((s, i) => ratings[i] === 'Questionable').slice(0, 5).forEach(s => {
      console.log(`Score: ${s.score} | ${s.suggestedCanonical} | ${s.brandOwner}\n  Desc: ${s.description}\n`);
    });
  }

  // Deployment recommendation
  console.log('\n=== DEPLOYMENT RECOMMENDATION ===');
  if (qualityPct >= 90 && bad === 0) {
    console.log('Recommend: Deploy all 192 suggestions immediately.');
  } else if (qualityPct >= 80) {
    console.log('Recommend: Deploy only highest scores (Good) first, review Questionable/Bad.');
  } else {
    console.log('Recommend: Further refine patterns before deployment.');
  }
}

main(); 