const { Food } = require('../db/models');
const Subcategory = require('../db/models/Categories/Subcategory');

const EXCLUDE_WORDS = ['anchovy', 'anchovies', 'tomato', 'vegetable', 'bean', 'sardine', 'mackerel', 'tuna', 'salmon', 'herring', 'eggplant', 'pepper', 'artichoke', 'garlic', 'onion', 'olive', 'capers', 'pasta', 'sauce', 'spread', 'dip', 'dressing', 'marinade', 'mix', 'blend', 'relish', 'salsa', 'chili', 'soup', 'stew', 'rice', 'lentil', 'pea', 'corn', 'carrot', 'potato', 'zucchini', 'squash', 'broccoli', 'cauliflower', 'spinach', 'kale', 'greens', 'seaweed', 'clam', 'crab', 'lobster', 'shrimp', 'octopus', 'squid', 'calamari', 'muscle', 'scallop', 'oyster', 'caviar', 'roe', 'meat', 'chicken', 'beef', 'pork', 'duck', 'turkey', 'lamb', 'goat', 'veal', 'bacon', 'ham', 'sausage', 'hot dog', 'frank', 'brat', 'bratwurst', 'salami', 'pepperoni', 'prosciutto', 'pastrami', 'corned beef', 'tongue', 'liver', 'gizzard', 'heart', 'kidney', 'tripe', 'sweetbread', 'testicle', 'snout', 'jowl', 'hock', 'trotter', 'knuckle', 'tip', 'bone', 'skin', 'fat', 'marrow', 'crackling', 'rind', 'peel', 'zest', 'pith', 'core', 'pit', 'seed', 'stone', 'pod', 'bean', 'pea', 'lentil', 'chickpea', 'split', 'grain', 'rice', 'barley', 'oat', 'corn', 'maize', 'millet', 'sorghum', 'teff', 'quinoa', 'buckwheat', 'amaranth', 'spelt', 'kamut', 'triticale', 'farro', 'freekeh', 'bulgur', 'couscous', 'semolina', 'durum', 'graham', 'bread', 'breadcrumb', 'breading', 'cracker', 'biscuit', 'cookie', 'cake', 'pastry', 'pie', 'tart', 'pasta', 'noodle', 'macaroni', 'spaghetti', 'fettuccine', 'linguine', 'penne', 'rigatoni', 'ziti', 'rotini', 'fusilli', 'farfalle', 'orzo', 'gnocchi', 'ravioli', 'tortellini', 'manicotti', 'cannelloni', 'lasagna', 'vermicelli', 'capellini', 'spaghettini', 'bucatini', 'tagliatelle', 'pappardelle', 'cavatappi', 'cavatelli', 'orecchiette', 'strozzapreti', 'tortelloni', 'tortellacci'];

async function cleanOliveOilSubcategories() {
  // Find all products with 'olive oil' in the description
  const products = await Food.findAll({
    where: {
      description: {
        [require('sequelize').Op.iLike]: '%olive oil%'
      }
    }
  });

  let updated = 0;
  for (const product of products) {
    const desc = product.description.toLowerCase();
    if (EXCLUDE_WORDS.some(word => desc.includes(word))) {
      if (product.SubcategoryID) {
        const subcat = await Subcategory.findByPk(product.SubcategoryID);
        if (subcat && subcat.pure_ingredient) {
          subcat.pure_ingredient = false;
          await subcat.save();
          updated++;
          console.log(`Set pure_ingredient = false for subcategory '${subcat.name}' (ID: ${subcat.SubcategoryID})`);
        }
      }
    }
  }
  console.log(`Updated ${updated} subcategories.`);
  process.exit(0);
}

cleanOliveOilSubcategories(); 