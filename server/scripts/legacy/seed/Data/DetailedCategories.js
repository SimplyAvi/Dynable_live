const detailedCategories = {
    'Chicken': ['chicken breast', 'chicken thigh', 'chicken wing', 'ground chicken', 'chicken liver', 'cubed cooked chicken', 'chicken chunks'],
    'Turkey': ['turkey breast', 'ground turkey', 'turkey sausage', 'turkey leg', 'turkey wing', 'turkey neck'],
    'Duck': ['duck breast', 'duck leg', 'whole duck', 'duck liver'],
    'Beef': ['beef steak', 'ground beef', 'beef ribs', 'beef brisket', 'beef tenderloin', 'stewing beef', 'ground chuck beef', 'tri-tips'],
    'Pork': ['pork chop', 'ground pork', 'pork loin', 'pork ribs', 'bacon', 'sweet Italian sausage', 'pork butt', 'Smithfield Extra Tender St Louis Pork Spareribs', 'ham steak', 'pork shoulder roast'],
    'Lamb': ['lamb chop', 'ground lamb', 'lamb leg', 'lamb shoulder', 'lamb shank'],
    'Fish': ['salmon', 'tuna', 'trout', 'mackerel', 'sardine', 'flounder fillets', 'red snapper'],
    'Seafood': ['shrimp', 'crab', 'lobster', 'clam', 'oyster', 'mussels'],
    'Eggs': ['egg', 'egg yolk', 'egg white', 'quail egg', 'duck egg'],
    'Legumes': ['black beans', 'kidney beans', 'pinto beans', 'chickpeas', 'lentils', 'navy beans', 'lima beans', 'great Northern beans', 'butter beans', 'HORMEL Chili No Beans', 'baked beans'],
    'Dairy': [
      'whole milk', 'skim milk', '2% milk', 'condensed milk', 'evaporated milk', 'cheddar cheese', 'mozzarella', 'parmesan',
      'feta', 'blue cheese', 'cream cheese', 'ricotta cheese', 'whipped cream', 'heavy cream', 'sour cream', 'creme fraiche',
      'yogurt', 'greek yogurt', 'flavored yogurt', 'low-fat yogurt', 'buttermilk', 'Monterey Jack cheese', 'grated sharp Cheddar',
      'grated yellow sharp cheddar', 'Pecorino Romano', 'Romano cheese', 'Gruyere cheese', 'mascarpone cheese', 'Italian blend shredded cheese', 'Mexican style cheese', 'vanilla ice cream'
    ],
    'Nuts': ['almond', 'walnut', 'cashew', 'pistachio', 'pecan', 'pine nuts', 'peanuts', 'hazelnuts', 'shredded coconut', 'flaked coconut', 'sunflower seeds'],
    'Grains': [
      'white rice', 'brown rice', 'quinoa', 'oats', 'barley', 'whole wheat flour', 'cornmeal', 'stone ground flour', 'masa corn flour',
      'Simmered Rice', 'arborio rice', 'couscous', 'Jambalaya Rice Mix', 'Millet', 'Amaranth', 'wheat bran', 'Minute MultiGrain Medley', 'basmati rice'
    ],
    'Breads': ['white bread', 'whole wheat bread', 'bagel', 'biscuit', 'tortilla', 'sesame-seed hamburger buns', 'challah', 'brioche'],
    'Pasta': ['spaghetti', 'macaroni', 'fettuccine', 'penne', 'lasagna', 'orecchiette', 'corkscrew-shaped pasta', 'vermicelli pasta'],
    'Root Vegetables': ['potato', 'sweet potato', 'carrot', 'beet', 'turnip'],
    'Leafy Greens': ['spinach', 'lettuce', 'kale', 'collard greens', 'arugula'],
    'Cruciferous Vegetables': ['broccoli', 'cauliflower', 'cabbage', 'brussels sprouts', 'bok choy'],
    'Alliums': ['yellow onion', 'red onion', 'garlic', 'leek', 'shallot', 'green onions', 'onion', 'scallions', 'celery', 'chives'],
    'Nightshades': ['tomato', 'red bell pepper', 'green bell pepper', 'eggplant', 'jalapeno', 'yellow bell pepper'],
    'Squashes': ['zucchini', 'pumpkin', 'butternut squash', 'acorn squash', 'spaghetti squash', 'yellow squash'],
    'Apples': ['granny smith apple', 'fuji apple', 'honeycrisp apple', 'gala apple', 'red delicious apple', 'Pink Lady apple', 'diced apple'],
    'Citrus': ['orange', 'lemon', 'lime', 'grapefruit', 'tangerine'],
    'Berries': ['strawberry', 'blueberry', 'raspberry', 'blackberry', 'cranberry', 'fresh blackberries', 'fresh strawberries'],
    'Tropical Fruits': ['pineapple', 'mango', 'banana', 'papaya', 'passion fruit', 'kiwifruit'],
    'Stone Fruits': ['peach', 'plum', 'nectarine', 'cherry', 'apricot', 'firm-ripe pears'],
    'Melons': ['watermelon', 'cantaloupe', 'honeydew melon', 'galia melon', 'canary melon'],
    'Baking RecipeIngredients': [
      'all-purpose flour', 'baking powder', 'baking soda', 'brown sugar', 'white sugar', 'vanilla extract', 'cocoa powder',
      'yeast', 'vital wheat gluten', 'cornmeal', 'masa corn flour', 'instant coffee granules', 'cornstarch', 'graham cracker crust',
      'pie crust', 'shortbread pie crust', 'panko bread crumbs', 'plain fine breadcrumbs', 'dry bread crumbs', 'tapioca', 'cake mix', 'chocolate frosting', 'flax seeds', 'flaxseed meal', 'apple butter', 'pasta sauce'
    ],
    'Oils': ['olive oil', 'canola oil', 'vegetable oil', 'coconut oil', 'Mazola Corn Oil', 'soybean oil', 'grapeseed oil', 'sesame oil'],
    'Condiments': [
      'Tabasco sauce', 'Worcestershire sauce', 'Thousand Island dressing', 'pickle relish', 'hot sauce', 'vinegar',
      'chipotle pepper sauce', 'salsa', 'ketchup', 'barbeque sauce', 'Italian dressing', 'pesto', 'mustard', 'soy sauce',
      'pepper sauce', 'mayonnaise', 'ranch dressing', 'guacamole', 'hummus', 'pimento-stuffed Manzanilla olives'
    ],
    'Spices & Herbs': [
      'cinnamon', 'nutmeg', 'ginger', 'basil', 'parsley', 'Italian herb seasoning', 'Cajun seasoning', 'dry mustard',
      'rubbed sage', 'dried thyme', 'ground cumin', 'crushed red pepper flakes', 'ground mustard', 'chili powder',
      'ground cardamom', 'dried oregano', 'onion powder', 'fresh cilantro', 'curry powder', 'sweet paprika', 'paprika',
      'fresh thyme', 'cayenne pepper', 'celery seed', 'cloves', 'bay leaf', 'sage', 'ground coriander seeds', 'Creole seasoning', 'green tea powder', 'garam masala', 'turmeric powder', 'mint', 'marjoram', 'mace', 'dill', 'spearmint'
    ],
    'Sweeteners': ['honey', 'sugar', 'brown sugar', 'corn syrup', 'maple-flavored syrup', 'molasses', 'agave nectar'],
    'Beverages': ['wheat whiskey', 'sweet vermouth', 'red wine', 'dry white wine', 'sparkling wine', 'milk chocolate drink mix', 'instant coffee granules', 'hot cocoa mix', 'vodka', 'rum', 'tequila', 'beer', 'white Zinfandel wine', 'espresso', 'triple sec', 'Roses Mojito', 'Roses Cocktail Infusions Pomegranate', 'Roses Cocktail Infusions Sour Apple', 'whiskey', 'brandy'],
    'Miscellaneous': [
    'water', 'salt', 'black pepper', 'boiling water', 'cooking spray', 'maraschino cherries', 'frozen pasta and vegetable blend',
    'coleslaw mix', 'frozen peas', 'frozen blueberries', 'instant dry milk powder', 'hot cocoa mix', 'chocolate syrup',
    'vanilla bean', 'ice cubes', 'cream of mushroom soup', 'cream of chicken soup', 'chocolate chips', 'dark chocolate chips',
    'semisweet chocolate', 'bittersweet chocolate', 'unsweetened chocolate', 'chocolate-covered nougat bites', 'trail mix',
    'dry-roasted peanuts', 'poppy seeds', 'mini marshmallows', 'crushed peppermint candies', 'raisins', 'frozen whipped topping',
    'COOL WHIP', 'crushed whole grain seasoned croutons', 'Mop Sauce', 'Texas BBQ Sauce', 'deep-fry thermometer', 'sliced fresh mushrooms',
    'diced ham steak', 'frozen cut green beans', 'freshly grated Romano cheese', 'prepared marinara sauce', 'vanilla ice cream',
    'semisweet baking chocolate', 'frozen puff pastry', 'fresh pico de gallo', 'cold-pressed vegetable-only green juice',
    'diced baby portabella mushrooms', 'firm-ripe pears', 'caramel sauce', 'chocolate-hazelnut spread', 'pimentón-stuffed Manzanilla olives',
    'crushed ice', 'fresh strawberries', 'hummus', 'Roses Mojito', 'fresh green beans', 'fresh calendula blossoms', 'fennel bulb',
    'fresh berries', 'fat-free half and half', 'grapeseed oil', 'flour', 'fresh blackberries', 'ice', 'creamy salad dressing', 
    'sweet and sour mix', 'triple sec liqueur', 'colas-flavored carbonated beverage', 'liqueur for drizzling', 'chocolate shavings',
    'garam masala', 'oil for frying', 'sesame oil', 'agave nectar', 'oil-cured olives', 'margarine', 'espresso', 'grapeseed oil',
    'zinfandel wine', 'creamy peanut butter', 'garam masala', 'protein powder', 'creamed-style corn', 'chicken broth', 
    'chicken bouillon granules', 'dried mission figs', 'fresh mint', 'creamy salad dressing', 'whole kernel corn', 'whole grain seasoned croutons', 
    'unsweetened coconut flakes', 'chocolate-flavored protein powder', 'sweet-tart apple', 'habanero pepper', 'Medjool dates', 
    'dried apples', 'apple juice', 'capers', 'freshly grated Pecorino Romano', 'Maple-flavored syrup', 'COOL WHIP', 'sliced mild cheese',
    'apple cider', 'fat-free half and half', 'flour', 'tritip', 'grapeseed oil', 'frozen whipped topping', 'creamy peanut butter', 
    'corn chips', 'jambalaya rice mix', 'oil for brushing', 'pasta sauce', 'taco seasoning', 'pasta sauce', 'hummus', 'grape jelly',
    'hot sauce', 'taco seasoning mix', 'pesto', 'pasta sauce', 'pasta sauce', 'margarine', 'cream of corn', 'red beans and rice',
    'cream for drizzling', 'chicken bouillon cubes', 'pimento-stuffed Manzanilla olives', 'sweet and sour mix', 'cocktail infusion',
    'maraschino cherries', 'creamed corn', 'baking powder', 'baking soda', 'garam masala', 'maple syrup', 'dried mint', 'sweet and sour mix',
    'capers', 'dry rub', 'cilantro sprigs', 'vermicelli pasta', 'pinto beans', 'maraschino cherries', 'cucumber', 'cornflakes', 'cucumbers',
    'pasta sauce', 'sriracha sauce', 'fresh berries', 'espresso', 'sherry', 'cornflakes', 'pasta sauce', 'maraschino cherries', 'guacamole',
    'worcestershire sauce', 'chipotle peppers in adobo sauce', 'mushrooms', 'maraschino cherries', 'maraschino cherries', 'maraschino cherries'
  ]
};

module.exports = detailedCategories;
