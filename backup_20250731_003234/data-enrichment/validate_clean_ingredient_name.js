// Utility to validate if a messy ingredient name is a clean, single-ingredient name
const RECIPE_PATTERNS = [
  /pounds?\s+/i, /teaspoons?\s+/i, /tablespoons?\s+/i, /cups?\s+/i, /ounces?\s+/i, /grams?\s+/i,
  /chopped\s+/i, /diced\s+/i, /sliced\s+/i, /minced\s+/i, /peeled\s+/i, /seeded\s+/i, /cut into\s+/i,
  /quartered\s+/i, /halved\s+/i, /thinly\s+/i, /coarsely\s+/i, /finely\s+/i, /roughly\s+/i, /about\s+/i,
  /such as\s+/i, /divided\s+/i, /optional\s+/i, /or more to taste/i, /for garnish/i, /reserved/i
];
const GENERIC_TERMS = [
  'recipe', 'slice', 'stick', 'spray', 'powder', 'seeds', 'spice', 'stock',
  'solution', 'soda', 'salad', 'servings', 'toppings', 'tortillas', 'twist',
  'vegetables', 'wedge', 'wheel', 'wrap', 'threads', 'shavings', 'shells'
];
const SUSPICIOUS_PATTERNS = [
  /^\d+\//, /^\d+\s*[a-z]+/, /^[a-z]+\s+\d+/, /^\d+$/, /^[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+/i
];
const MEASUREMENT_PATTERN = /\d+\s*(pound|teaspoon|tablespoon|cup|ounce|gram|ml|g|kg|lb)/i;

function isCleanIngredientName(name) {
  const messy = (name || '').toLowerCase();
  if (
    RECIPE_PATTERNS.some(p => p.test(messy)) ||
    GENERIC_TERMS.includes(messy) ||
    SUSPICIOUS_PATTERNS.some(p => p.test(messy)) ||
    MEASUREMENT_PATTERN.test(messy)
  ) {
    return false;
  }
  return true;
}

module.exports = { isCleanIngredientName }; 