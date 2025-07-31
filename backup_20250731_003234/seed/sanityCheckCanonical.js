const sequelize = require('../db/database');
const Ingredient = require('../db/models/Ingredient');
const IngredientToCanonical = require('../db/models/IngredientToCanonical');
const AllergenDerivative = require('../db/models/AllergenDerivative');
const Substitution = require('../db/models/Substitution');
const readline = require('readline');

async function sanityCheck() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter a messy ingredient name: ', async (messy) => {
    rl.question('Enter an allergen to check: ', async (allergen) => {
      try {
        await sequelize.authenticate();
        console.log('DB connection OK');

        // Canonical mapping
        const mapping = await IngredientToCanonical.findOne({ where: { messyName: messy.toLowerCase() } });
        if (mapping) {
          const canonical = await Ingredient.findByPk(mapping.IngredientId);
          console.log(`'${messy}' maps to canonical:`, canonical ? canonical.name : 'Not found');
          if (canonical) {
            // Substitutions
            const subs = await Substitution.findAll({ where: { IngredientId: canonical.id } });
            if (subs.length > 0) {
              console.log(`Substitutions for '${canonical.name}':`);
              subs.forEach(s => {
                if (s.notes) {
                  console.log(`- ${s.substituteName} (${s.notes})`);
                } else {
                  console.log(`- ${s.substituteName}`);
                }
              });
            } else {
              console.log(`No substitutions found for '${canonical.name}'.`);
            }
          }
        } else {
          console.log(`No canonical mapping for '${messy}'`);
        }

        // Allergen derivatives
        const derivatives = await AllergenDerivative.findAll({ where: { allergen: allergen.toLowerCase() } });
        if (derivatives.length > 0) {
          console.log(`Derivatives for allergen '${allergen}':`, derivatives.map(d => d.derivative));
        } else {
          console.log(`No derivatives found for allergen '${allergen}'.`);
        }
      } catch (err) {
        console.error('Sanity check failed:', err);
      } finally {
        await sequelize.close();
        rl.close();
      }
    });
  });
}

sanityCheck(); 