const { Recipe, Ingredient, IngredientToCanonical, CanonicalIngredient, Substitution, Food } = require('../db/models');

async function addMissingPureProducts() {
  try {
    console.log('🔧 Adding missing pure products for Whaler Fish Sandwich...');
    const whalerRecipe = await Recipe.findByPk(17);
    if (!whalerRecipe) {
      console.log('❌ Whaler recipe not found');
      return;
    }
    const ingredients = await Ingredient.findAll({ where: { RecipeId: whalerRecipe.id } });
    const added = new Set();
    for (const ing of ingredients) {
      const cleanedName = cleanIngredientName(ing.name);
      const mapping = await IngredientToCanonical.findOne({ where: { messyName: cleanedName.toLowerCase() } });
      let canonical = null;
      if (mapping) canonical = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
      if (!canonical) continue;
      // Add pure product for canonical ingredient if missing
      if (!added.has(canonical.name.toLowerCase())) {
        const existing = await Food.findOne({ where: { canonicalTag: canonical.name.toLowerCase(), canonicalTagConfidence: 'confident' } });
        if (!existing) {
          await Food.create({
            description: `Pure ${canonical.name}`,
            canonicalTag: canonical.name.toLowerCase(),
            canonicalTagConfidence: 'confident',
            allergens: canonical.allergens || [],
            brandName: 'Generic',
            brandOwner: 'Generic',
          });
          console.log(`✅ Added pure product for '${canonical.name}'`);
        }
        added.add(canonical.name.toLowerCase());
      }
      // Add pure products for each substitute if missing
      const subs = await Substitution.findAll({ where: { CanonicalIngredientId: canonical.id } });
      for (const sub of subs) {
        if (!added.has(sub.substituteName.toLowerCase())) {
          const existingSub = await Food.findOne({ where: { canonicalTag: sub.substituteName.toLowerCase(), canonicalTagConfidence: 'confident' } });
          if (!existingSub) {
            await Food.create({
              description: `Pure ${sub.substituteName}`,
              canonicalTag: sub.substituteName.toLowerCase(),
              canonicalTagConfidence: 'confident',
              allergens: [],
              brandName: 'Generic',
              brandOwner: 'Generic',
            });
            console.log(`✅ Added pure product for substitute '${sub.substituteName}'`);
          }
          added.add(sub.substituteName.toLowerCase());
        }
      }
    }
    console.log('🎉 Pure product auto-fix complete!');
  } catch (error) {
    console.error('Error adding missing pure products:', error);
  }
}

function cleanIngredientName(raw) {
  if (!raw) return '';
  let cleaned = raw.toLowerCase();
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\d+[\/\d]*\s*/g, '');
  cleaned = cleaned.replace(/\b(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|grams?|g|kilograms?|kg|liters?|l|milliliters?|ml|package|can|container|envelope|slice|loaf|pinch|dash|quart|qt|pint|pt|gallon|gal|stick|clove|head|bunch|sprig|piece|sheet|bag|bottle|jar|box|packet|drop|ear|stalk|strip|cube|block|bar|fillet|filet|link|drumstick|wing|leg|thigh|breast|rib|loin|chop|steak|roast|shank|shoulder|neck|tail|foot|tongue|cheek|snout|jowl|hock|trotter|knuckle|tip|bone|skin|fat|marrow|liver|gizzard|heart|kidney|tripe|sweetbread|testicle|oyster|clam|mussel|scallop|shrimp|prawn|crab|lobster|crawfish|fish|roe|egg|yolk|white|shell|meat|muscle|tendon|cartilage|gristle|sinew|membrane|fatback|crackling|rind|peel|zest|pith|core|pit|seed|stone|pod|bean|pea|lentil|chickpea|split|grain|rice|barley|oat|corn|maize|millet|sorghum|teff|quinoa|buckwheat|amaranth|spelt|kamut|triticale|farro|freekeh|bulgur|couscous|semolina|durum|graham|bread|breadcrumb|breading|cracker|biscuit|cookie|cake|pastry|pie|tart|pasta|noodle|macaroni|spaghetti|fettuccine|linguine|penne|rigatoni|ziti|rotini|fusilli|farfalle|orzo|gnocchi|ravioli|tortellini|manicotti|cannelloni|lasagna|vermicelli|capellini|spaghettini|bucatini|tagliatelle|pappardelle|cavatappi|cavatelli|orecchiette|strozzapreti|tortelloni|tortellacci)\b/g, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();
  return cleaned;
}

addMissingPureProducts(); 