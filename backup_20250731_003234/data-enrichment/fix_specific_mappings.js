const db = require('../../db/database');
const IngredientToCanonical = require('../../db/models/IngredientToCanonical');
const Ingredient = require('../../db/models/Ingredient');

(async () => {
  await db.authenticate();
  const targets = [
    { name: 'cream of mushroom soup' },
    { name: 'cream of chicken soup' },
    { name: 'apple juice' },
    { name: 'prosciutto' }
  ];
  for (const { name } of targets) {
    console.log(`\n=== Fixing: '${name}' ===`);
    // Remove broken mappings (IngredientId=null)
    const broken = await IngredientToCanonical.findAll({ where: { messyName: name, IngredientId: null } });
    for (const b of broken) {
      await b.destroy();
      console.log(`  Removed broken mapping for messyName='${name}'.`);
    }
    // Ensure canonical exists
    let canonical = await Ingredient.findOne({ where: { name: { [db.Sequelize.Op.iLike]: name } } });
    if (!canonical) {
      canonical = await Ingredient.create({ name });
      console.log(`  Created canonical: ${name} (ID: ${canonical.id})`);
    } else {
      console.log(`  Found canonical: ${canonical.name} (ID: ${canonical.id})`);
    }
    // Ensure mapping exists
    let mapping = await IngredientToCanonical.findOne({ where: { messyName: name, IngredientId: canonical.id } });
    if (!mapping) {
      mapping = await IngredientToCanonical.create({ messyName: name, IngredientId: canonical.id });
      console.log(`  Created mapping: messyName='${name}' -> IngredientId=${canonical.id}`);
    } else {
      console.log(`  Mapping already exists: messyName='${name}' -> IngredientId=${canonical.id}`);
    }
  }
  await db.close();
})(); 