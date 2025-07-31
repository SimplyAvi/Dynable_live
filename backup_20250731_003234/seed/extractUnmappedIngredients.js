const { Recipe, Ingredient } = require('../db/models');
const { IngredientToCanonical } = require('../db/models');
const fs = require('fs');

async function extractUnmappedRecipeIngredients() {
  console.log('🔎 Extracting unmapped ingredient names from recipes...\n');
  const allRecipeIngredients = await Ingredient.findAll();
  const uniqueNames = new Set();
  for (const ing of allRecipeIngredients) {
    if (ing.name) uniqueNames.add(ing.name.trim().toLowerCase());
  }
  const unmapped = [];
  for (const name of uniqueNames) {
    const mapping = await IngredientToCanonical.findOne({ where: { messyName: name } });
    if (!mapping) {
      unmapped.push(name);
    }
  }
  console.log(`Found ${unmapped.length} unmapped ingredient names.`);
  fs.writeFileSync('unmapped_ingredients.txt', unmapped.join('\n'));
  console.log('Unmapped ingredient names written to unmapped_ingredients.txt');
}

// Read the audit output (assume it's in seed/audit50RandomRecipes.log)
const auditLog = fs.readFileSync('seed/audit50RandomRecipes.log', 'utf-8');
const lines = auditLog.split('\n');

const unmapped = {};
for (const line of lines) {
  const match = line.match(/No canonical mapping for: (.+)/);
  if (match) {
    const name = match[1].trim();
    if (name) {
      unmapped[name] = (unmapped[name] || 0) + 1;
    }
  }
}

// Sort by frequency
const sorted = Object.entries(unmapped).sort((a, b) => b[1] - a[1]);

// Write to file
const output = sorted.map(([name, count]) => `${count}\t${name}`).join('\n');
fs.writeFileSync('unmapped_ingredient_frequencies.txt', output);

console.log('Exported most common unmapped ingredients to unmapped_ingredient_frequencies.txt');

extractUnmappedRecipeIngredients(); 