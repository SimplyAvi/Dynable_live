const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function getCoverage() {
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
  // 1. Load top candidates
  const roadmap = JSON.parse(fs.readFileSync(path.join(__dirname, 'analyze_compound_canonicals_results.json'), 'utf-8'));
  const top = roadmap.filter(c => c.frequency >= 5).slice(0, 30);
  // Validate against CanonicalRecipeIngredients
  const canonicals = await db.query('SELECT name FROM "CanonicalRecipeIngredients"', { type: Sequelize.QueryTypes.SELECT });
  const canonicalSet = new Set(canonicals.map(c => c.name.toLowerCase()));
  const toAdd = top.filter(c => !canonicalSet.has(c.canonical.toLowerCase()));

  // 2. Batch canonical creation (no category)
  let added = 0, skipped = 0, newCanonicals = [];
  for (const c of toAdd) {
    try {
      await db.query(
        'INSERT INTO "CanonicalRecipeIngredients" ("name", "createdAt", "updatedAt") VALUES (:name, NOW(), NOW())',
        { replacements: { name: c.canonical } }
      );
      added++;
      newCanonicals.push(c.canonical);
    } catch (e) {
      if (e.message && e.message.includes('duplicate')) { skipped++; } else { console.log(`Error adding ${c.canonical}: ${e.message}`); }
    }
  }

  // 3. Mapping application
  const questionable = JSON.parse(fs.readFileSync(path.join(__dirname, 'safe_normalization_questionable.json'), 'utf-8'));
  const newMappings = [];
  for (const c of toAdd) {
    for (const q of questionable) {
      if (q.normalized === c.canonical) {
        // Check for existing mapping
        const exists = await db.query(
          'SELECT 1 FROM "IngredientToCanonicals" WHERE "messyName" = :messyName',
          { replacements: { messyName: q.original }, type: Sequelize.QueryTypes.SELECT }
        );
        if (!exists.length) {
          // Get canonical id
          const [cid] = await db.query('SELECT id FROM "CanonicalRecipeIngredients" WHERE name = :name', { replacements: { name: c.canonical }, type: Sequelize.QueryTypes.SELECT });
          if (cid && cid.id) {
            await db.query(
              'INSERT INTO "IngredientToCanonicals" ("messyName", "IngredientId", "createdAt", "updatedAt") VALUES (:messyName, :cid, NOW(), NOW())',
              { replacements: { messyName: q.original, cid: cid.id } }
            );
            newMappings.push({ messyName: q.original, canonical: c.canonical });
          }
        }
      }
    }
  }

  // 4. Coverage impact
  const before = canonicals.length;
  const afterCanonicals = (await db.query('SELECT COUNT(*) as count FROM "CanonicalRecipeIngredients"', { type: Sequelize.QueryTypes.SELECT }))[0].count;
  const coverage = await getCoverage();

  // 5. Export and summary
  const results = {
    addedCanonicals: newCanonicals,
    attempted: toAdd.length,
    actuallyAdded: added,
    skipped,
    newMappings: newMappings.slice(0, 100), // sample
    totalNewMappings: newMappings.length,
    beforeCanonicals: before,
    afterCanonicals,
    coverageAfter: coverage
  };
  fs.writeFileSync(path.join(__dirname, 'add_compound_canonicals_results.json'), JSON.stringify(results, null, 2));
  // Print summary
  console.log('=== COMPOUND CANONICAL CREATION SUMMARY ===');
  console.log(`Attempted to add: ${toAdd.length}`);
  console.log(`Actually added: ${added}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`New mappings created: ${newMappings.length}`);
  console.log(`Canonicals before: ${before}, after: ${afterCanonicals}`);
  console.log(`Coverage after: ${coverage}%`);
  console.log('Results exported to add_compound_canonicals_results.json');
}

main().catch(e => { console.error(e); process.exit(1); }); 