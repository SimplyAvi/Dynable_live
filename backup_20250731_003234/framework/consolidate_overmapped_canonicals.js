const db = require('./db/database');
const { Ingredient, IngredientToCanonical } = require('./db/models');

async function analyzeOvermappedCanonicals() {
  await db.authenticate();
  // 1. Count mappings per canonical
  const mappings = await IngredientToCanonical.findAll();
  const canonicalCounts = {};
  for (const m of mappings) {
    if (!canonicalCounts[m.IngredientId]) canonicalCounts[m.IngredientId] = [];
    canonicalCounts[m.IngredientId].push(m.messyName);
  }
  // 2. Get canonical names
  const canonicals = await Ingredient.findAll();
  const canonicalMap = {};
  for (const c of canonicals) canonicalMap[c.id] = c.name;

  // 3. Find over-mapped canonicals (>50)
  const overMapped = Object.entries(canonicalCounts)
    .filter(([id, arr]) => arr.length > 50)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20);

  // 4. Analyze for splits and duplicates
  const splitSuggestions = {};
  const duplicateMappings = {};
  for (const [cid, messyNames] of overMapped) {
    const name = canonicalMap[cid] || `ID:${cid}`;
    // Suggest splits if compound (e.g., contains 'powder', 'fresh', 'paste', etc.)
    const splitTypes = ['powder', 'fresh', 'paste', 'ground', 'dried', 'minced', 'crushed', 'granulated', 'whole', 'seed', 'flaked', 'shredded', 'sliced', 'chopped'];
    const splitGroups = {};
    for (const messy of messyNames) {
      for (const type of splitTypes) {
        if (messy.includes(type)) {
          if (!splitGroups[type]) splitGroups[type] = [];
          splitGroups[type].push(messy);
        }
      }
    }
    if (Object.keys(splitGroups).length > 1) {
      splitSuggestions[name] = splitGroups;
    }
    // Find duplicate messyNames
    const seen = new Set();
    const dups = [];
    for (const messy of messyNames) {
      const norm = messy.trim().toLowerCase();
      if (seen.has(norm)) dups.push(messy);
      else seen.add(norm);
    }
    if (dups.length > 0) duplicateMappings[name] = dups;
  }

  // 5. Print report
  console.log('=== Over-mapped Canonicals (>50 mappings) ===');
  overMapped.forEach(([cid, arr], i) => {
    const name = canonicalMap[cid] || `ID:${cid}`;
    console.log(`${i+1}. ${name} (ID:${cid}): ${arr.length} mappings`);
  });
  console.log('\n=== Suggested Splits for Compound Canonicals ===');
  for (const [name, groups] of Object.entries(splitSuggestions)) {
    console.log(`\n- ${name}:`);
    for (const [type, list] of Object.entries(groups)) {
      console.log(`    ${type}: ${list.length} (e.g., ${list.slice(0,3).join(', ')})`);
    }
  }
  console.log('\n=== Duplicate Messy Names (to merge) ===');
  for (const [name, dups] of Object.entries(duplicateMappings)) {
    console.log(`\n- ${name}: ${dups.length} duplicates (e.g., ${dups.slice(0,5).join(', ')})`);
  }
}

analyzeOvermappedCanonicals().then(() => process.exit(0)); 