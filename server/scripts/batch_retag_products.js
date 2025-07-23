const fs = require('fs');
const path = require('path');
const { Op, fn, col } = require('sequelize');
const sequelize = require('../db/database');
const IngredientCategorized = require('../db/models/IngredientCategorized');
const Ingredient = require('../db/models/Ingredient');

// Expanded patterns to catch all gum/gummi/gummy products
const PATTERNS = [
  { pattern: 'gum', canonical: 'gum' },
  { pattern: 'gummi', canonical: 'gum' },
  { pattern: 'gummy', canonical: 'gum' },
  { pattern: 'eggplant', canonical: 'eggplant' },
  { pattern: 'pasta', canonical: 'pasta' },
  { pattern: 'noodles', canonical: 'noodles' }
];

const BATCH_SIZE = 20; // Start with 20 per pattern for safety
const LOG_FILE = path.resolve(__dirname, 'retag_log.json');

async function main() {
  await sequelize.authenticate();
  console.log('✅ Connected to database');

  // Print DB connection info
  const [dbInfo] = await sequelize.query('SELECT current_database(), inet_server_addr(), inet_server_port(), current_user;');
  console.log('SCRIPT DB INFO:', dbInfo);

  // Debug: List all canonicals named 'gum'
  const gumCanonicals = await Ingredient.findAll({
    where: { name: { [Op.iLike]: 'gum' } }
  });
  console.log('DEBUG: Canonicals found for gum:', gumCanonicals.map(c => c.name));

  const log = [];

  for (const { pattern, canonical } of PATTERNS) {
    // Case-insensitive canonical lookup with debug logging
    console.log('Looking for canonical:', canonical);
    const canonicalObj = await Ingredient.findOne({
      where: sequelize.where(fn('LOWER', col('name')), canonical.toLowerCase())
    });
    console.log('Found canonical:', canonicalObj ? canonicalObj.name : null);
    if (!canonicalObj) {
      console.log(`❌ Canonical '${canonical}' does not exist. Skipping.`);
      continue;
    }
    // Find products to update (canonicalTag is not exactly 'gum', including null, 'gum*', etc.)
    const products = await IngredientCategorized.findAll({
      where: {
        description: { [Op.iLike]: `%${pattern}%` },
        canonicalTag: { [Op.notILike]: canonical } // not exactly 'gum', case-insensitive
      },
      limit: BATCH_SIZE
    });
    if (products.length === 0) {
      console.log(`No products found for pattern '${pattern}' needing update.`);
      continue;
    }
    console.log(`\n🔄 Updating ${products.length} products for pattern '${pattern}' → '${canonical}'`);
    for (const product of products) {
      const oldTag = product.canonicalTag;
      product.canonicalTag = canonical;
      await product.save();
      log.push({
        id: product.id,
        oldTag,
        newTag: canonical,
        description: product.description
      });
      console.log(`  - Updated ID ${product.id}: '${oldTag}' → '${canonical}'`);
    }
  }
  // Write log
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
  console.log(`\n✅ Batch update complete. Log written to ${LOG_FILE}`);
}

main().catch(err => {
  console.error('❌ Error during batch update:', err);
  process.exit(1);
}); 