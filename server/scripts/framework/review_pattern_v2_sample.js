const data = require('./pattern_recognition_mapper_v2_sample.json');

console.log('=== SAMPLE OF V2 SUGGESTIONS ===');
data.slice(0, 20).forEach(s =>
  console.log(`Score: ${s.score} | ${s.suggestedCanonical} | ${s.brandOwner} | ${s.description}`)
);

console.log('\n=== CANONICAL DISTRIBUTION IN SAMPLE ===');
const dist = {};
data.forEach(s => dist[s.suggestedCanonical] = (dist[s.suggestedCanonical] || 0) + 1);
Object.entries(dist).forEach(([k, v]) => console.log(`${k}: ${v}`));

console.log('\n=== SCORE DISTRIBUTION ===');
const scores = {};
data.forEach(s => scores[s.score] = (scores[s.score] || 0) + 1);
Object.entries(scores).forEach(([k, v]) => console.log(`Score ${k}: ${v}`)); 