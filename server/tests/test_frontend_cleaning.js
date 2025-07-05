// Test the frontend cleaning function logic
function cleanIngredientNameFrontend(raw) {
    if (!raw) return '';
    let cleaned = raw.toLowerCase();
    cleaned = cleaned.replace(/\([^)]*\)/g, ''); // remove parentheticals
    cleaned = cleaned.replace(/optional|such as.*?\(.*?\)/g, ''); // remove optional text
    cleaned = cleaned.replace(/(^|\s)(\d+[\/\d]*\s*)/g, ' '); // remove numbers/fractions at start or after space
    cleaned = cleaned.replace(/(?<=\s|^)(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|grams?|kilograms?|kg|liters?|l|milliliters?|ml|package|can|container|envelope|slice|loaf|pinch|dash|quart|qt|pint|pt|gallon|gal|stick|clove|head|bunch|sprig|piece|sheet|bag|bottle|jar|box|packet|drop|ear|stalk|strip|cube|block|bar)(?=\s|$)/g, '');
    cleaned = cleaned.replace(/\b(sliced|chopped|fresh|dried|mild|to taste|and|drained|rinsed|peeled|seeded|halved|quartered|shredded|grated|zested|minced|mashed|crushed|diced|cubed|julienned|optional|with juice|with syrup|with liquid|in juice|in syrup|in liquid|powdered|sweetened|unsweetened|raw|cooked|baked|roasted|steamed|boiled|fried|blanched|toasted|softened|melted|room temperature|cold|warm|hot|refrigerated|frozen|thawed|defrosted|prepared|beaten|whipped|stiff|soft|firm|fine|coarse|crumbled|broken|pieces|chunks|strips|sticks|spears|tips|ends|whole|large|small|medium|extra large|extra small|thin|thick|lean|fatty|boneless|skinless|bone-in|with skin|without skin|with bone|without bone|center cut|end cut|trimmed|untrimmed|pitted|unpitted|seedless|with seeds|without seeds|cored|uncored|stemmed|destemmed|deveined|unveined|cleaned|uncleaned|split|unsplit|shelled|unshelled|hulled|unhulled|deveined|unveined|deveined|unveined|deveined|unveined)\b/g, '');
    cleaned = cleaned.replace(/\b(leaves?|slices?|pieces?|chunks?|strips?|sticks?|spears?|tips?|ends?)\b/g, '');
    cleaned = cleaned.replace(/\b(yellow|white|black|red|green|orange|purple|brown|golden|pink|blue|rainbow)\b/g, '');
    cleaned = cleaned.replace(/,\s*$/, ''); // remove trailing commas
    cleaned = cleaned.replace(/^\s*,\s*/, ''); // remove leading commas
    cleaned = cleaned.replace(/\s{2,}/g, ' '); // collapse spaces
    cleaned = cleaned.trim();
    return cleaned;
}

const testIngredients = [
    '1 pound lean ground beef',
    '2 teaspoons onion powder',
    '1/4 cup honey mustard',
    '1 teaspoon garlic powder',
    '2 teaspoons crushed red pepper',
    '1/2 teaspoon salt',
    '1/4 cup brown sugar',
    '2 tablespoons olive oil',
    '4 slices Swiss cheese (optional)',
    '4 hamburger buns'
];

console.log('🔍 Testing frontend cleaning function:');
testIngredients.forEach(ingredient => {
    const cleaned = cleanIngredientNameFrontend(ingredient);
    console.log(`"${ingredient}" -> "${cleaned}"`);
}); 