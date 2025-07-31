const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./db/database');

const MEASUREMENTS = [
  'teaspoon', 'teaspoons', 'tablespoon', 'tablespoons', 'cup', 'cups', 'pound', 'pounds', 'ounce', 'ounces',
  'tbsp', 'tsp', 'oz', 'lb', 'lbs', 'g', 'kg', 'ml', 'l', 'quart', 'quarts', 'pint', 'pints', 'gallon', 'gallons'
];
const FRACTIONS = ['1/2', '1/3', '1/4', '2/3', '3/4', '1/8', '3/8', '5/8', '7/8'];

function tokenize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
}

function isSafePattern(tokens, canonicalSet) {
  // [measurement] + [canonical] or [fraction/number] + [measurement] + [canonical]
  if (tokens.length < 2 || tokens.length > 3) return false;
  let t = tokens;
  if (tokens.length === 3 && (FRACTIONS.includes(tokens[0]) || !isNaN(tokens[0]))) t = tokens.slice(1);
  if (MEASUREMENTS.includes(t[0]) && canonicalSet.has(t[1])) return true;
  return false;
}

function normalizeSafe(tokens) {
  // Remove leading number/fraction and measurement
  let t = tokens;
  if (t.length === 3 && (FRACTIONS.includes(t[0]) || !isNaN(t[0]))) t = t.slice(1);
  if (MEASUREMENTS.includes(t[0])) t = t.slice(1);
  return t.join(' ');
}

async function main() {
  // 1. Load all unmapped ingredients
  const unmapped = await db.query(
    `SELECT DISTINCT i.name as ingredient
     FROM "RecipeIngredients" i
     LEFT JOIN "IngredientToCanonicals" itc ON LOWER(i.name) = itc."messyName"
     WHERE itc."messyName" IS NULL`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  const ingredients = unmapped.map(r => r.ingredient.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim());

  // 2. Load whitelist of proven safe canonicals
  const canonicals = await db.query('SELECT name FROM "CanonicalRecipeIngredients"', { type: Sequelize.QueryTypes.SELECT });
  const canonicalSet = new Set(canonicals.map(c => c.name.toLowerCase()));

  // 3. Process with conservative rules
  const safeMappings = [];
  const questionable = [];
  for (const ing of ingredients) {
    const tokens = tokenize(ing);
    if (!isSafePattern(tokens, canonicalSet)) continue;
    const normalized = normalizeSafe(tokens);
    // Quality gates
    if (!canonicalSet.has(normalized)) {
      questionable.push({ original: ing, normalized });
      continue;
    }
    if (normalized.split(' ').length > 3) {
      questionable.push({ original: ing, normalized });
      continue;
    }
    safeMappings.push({ original: ing, normalized });
  }

  // 4. Export
  fs.writeFileSync(path.join(__dirname, 'safe_normalization_mappings.json'), JSON.stringify(safeMappings, null, 2));
  fs.writeFileSync(path.join(__dirname, 'safe_normalization_questionable.json'), JSON.stringify(questionable, null, 2));

  // 5. Print summary
  console.log('=== SAFE NORMALIZATION SUMMARY ===');
  console.log(`Total unmapped ingredients: ${ingredients.length}`);
  console.log(`Safe mappings found: ${safeMappings.length}`);
  console.log(`Questionable cases: ${questionable.length}`);
  console.log('Results exported to safe_normalization_mappings.json and safe_normalization_questionable.json');
}

main().catch(e => { console.error(e); process.exit(1); }); 