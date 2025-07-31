const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function getCoverage() {
  // Run quick coverage audit script and parse output
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const proc = spawn('node', [path.join(__dirname, 'quick_coverage_audit.js')]);
    let output = '';
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.on('close', () => {
      const match = output.match(/After:\s+(\d+\.\d+)%/);
      resolve(match ? parseFloat(match[1]) : null);
    });
  });
}

async function main() {
  // 1. Load newMappings
  const normPath = path.join(__dirname, 'ingredient_normalizer_results.json');
  const normData = JSON.parse(fs.readFileSync(normPath, 'utf-8'));
  const newMappings = normData.newMappings;
  if (!newMappings.length) {
    console.log('No new mappings to apply.');
    return;
  }

  // 2. Validate canonicals
  const canonicals = await db.query('SELECT id, name FROM "CanonicalRecipeIngredients"', { type: Sequelize.QueryTypes.SELECT });
  const canonicalMap = Object.fromEntries(canonicals.map(c => [c.name.toLowerCase(), c.id]));
  const validMappings = newMappings.filter(m => canonicalMap[m.normalized]);
  if (!validMappings.length) {
    console.log('No valid mappings after canonical validation.');
    return;
  }

  // 3. Batch insert
  let inserted = 0, skipped = 0;
  for (const m of validMappings) {
    try {
      // Check for duplicate
      const exists = await db.query(
        'SELECT 1 FROM "IngredientToCanonicals" WHERE "messyName" = :messyName',
        { replacements: { messyName: m.original }, type: Sequelize.QueryTypes.SELECT }
      );
      if (exists.length) {
        skipped++;
        continue;
      }
      await db.query(
        'INSERT INTO "IngredientToCanonicals" ("messyName", "IngredientId", "createdAt", "updatedAt") VALUES (:messyName, :canonicalId, NOW(), NOW())',
        { replacements: { messyName: m.original, canonicalId: canonicalMap[m.normalized] } }
      );
      inserted++;
      if (inserted % 10 === 0) console.log(`Inserted ${inserted} mappings...`);
    } catch (e) {
      console.log(`Error inserting mapping for ${m.original}: ${e.message}`);
    }
  }

  // 4. Coverage test
  console.log('Running quick coverage audit...');
  const before = normData.beforeMapped;
  const after = await getCoverage();

  // 5. Results summary
  console.log('=== BATCH NORMALIZATION UPDATE SUMMARY ===');
  console.log(`Attempted: ${validMappings.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Coverage before: ${before}%`);
  console.log(`Coverage after: ${after}%`);
  console.log(`Coverage improvement: ${(after - before).toFixed(2)}%`);
}

main().catch(e => { console.error(e); process.exit(1); }); 