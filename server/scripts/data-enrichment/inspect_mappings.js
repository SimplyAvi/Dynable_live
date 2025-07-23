const db = require('../../db/database');
const IngredientToCanonical = require('../../db/models/IngredientToCanonical');
const Ingredient = require('../../db/models/Ingredient');

(async () => {
  await db.authenticate();
  const targets = [
    'cream of mushroom soup',
    'cream of chicken soup',
    'apple juice',
    'prosciutto'
  ];
  for (const name of targets) {
    console.log(`\n=== Inspecting: '${name}' ===`);
    // Find canonicals by name (case-insensitive)
    const canonicals = await Ingredient.findAll({ where: { name: { [db.Sequelize.Op.iLike]: name } } });
    if (canonicals.length === 0) {
      console.log('  No canonical found for this name.');
    } else {
      for (const canonical of canonicals) {
        console.log(`  Canonical: ${canonical.name} (ID: ${canonical.id})`);
        const mappings = await IngredientToCanonical.findAll({ where: { IngredientId: canonical.id } });
        if (mappings.length === 0) {
          console.log('    No mappings found for this canonical.');
        } else {
          for (const m of mappings) {
            console.log(`    Mapping: messyName='${m.messyName}' IngredientId=${m.IngredientId}`);
          }
        }
      }
    }
    // Find mappings by messyName (case-insensitive)
    const mappingsByName = await IngredientToCanonical.findAll({ where: { messyName: { [db.Sequelize.Op.iLike]: name } } });
    if (mappingsByName.length === 0) {
      console.log(`  No mappings found for messyName='${name}'.`);
    } else {
      for (const m of mappingsByName) {
        console.log(`  Mapping by messyName: messyName='${m.messyName}' IngredientId=${m.IngredientId}`);
      }
    }
  }
  await db.close();
})(); 