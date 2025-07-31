const db = require('./db/database');
const { IngredientToCanonical, Ingredient } = require('./db/models');
const fs = require('fs');

// Canonical names to focus on
const TARGET_CANONICALS = ['egg', 'flour', 'chicken', 'butter', 'cheese'];

function normalizeMessyName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation
    .replace(/\s+/g, ' ')         // normalize spaces
    .trim();
}

async function mergeDuplicates({ dryRun = false } = {}) {
  await db.authenticate();
  // Get canonical IDs for target names
  const canonicals = await Ingredient.findAll({ where: { name: TARGET_CANONICALS } });
  const canonicalIdMap = {};
  canonicals.forEach(c => { canonicalIdMap[c.name] = c.id; });

  let logLines = [];
  for (const cname of TARGET_CANONICALS) {
    const cid = canonicalIdMap[cname];
    if (!cid) continue;
    const mappings = await IngredientToCanonical.findAll({ where: { IngredientId: cid } });
    // Group by normalized messy name
    const groups = {};
    for (const m of mappings) {
      const norm = normalizeMessyName(m.messyName);
      if (!groups[norm]) groups[norm] = [];
      groups[norm].push(m);
    }
    // For each group with >1, keep the most common/cleanest, delete others
    for (const [norm, arr] of Object.entries(groups)) {
      if (arr.length < 2) continue;
      // Pick the cleanest: shortest, no extra spaces, no punctuation, most common
      arr.sort((a, b) => a.messyName.length - b.messyName.length);
      const keep = arr[0];
      const toDelete = arr.slice(1);
      logLines.push(`Canonical: ${cname} (ID:${cid}) - Keeping: "${keep.messyName}" [${keep.id}], Removing: [${toDelete.map(x => `"${x.messyName}" [${x.id}]`).join(', ')}]`);
      if (!dryRun) {
        for (const del of toDelete) {
          await del.destroy();
        }
      }
    }
  }
  fs.writeFileSync('merge_duplicate_messy_names.log', logLines.join('\n'));
  console.log(`[${dryRun ? 'DRY RUN' : 'APPLIED'}] Duplicate merge log written to merge_duplicate_messy_names.log`);
  if (dryRun) {
    console.log('Sample changes:');
    logLines.slice(0, 10).forEach(l => console.log(l));
    console.log(`...and ${logLines.length - 10} more (see log file)`);
  }
}

// Support --dry-run flag
const dryRun = process.argv.includes('--dry-run');
mergeDuplicates({ dryRun }).then(() => process.exit(0)); 