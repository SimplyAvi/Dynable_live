const organizedCategories = {
    'Poultry': {
      'Chicken': ['chicken breast', 'chicken thigh', 'chicken wing', 'ground chicken', 'chicken liver', 'cubed cooked chicken'],
      'Turkey': ['turkey breast', 'ground turkey', 'turkey sausage', 'turkey leg', 'turkey wing', 'turkey neck'],
      'Duck': ['duck breast', 'duck leg', 'whole duck', 'duck liver']
    },
    'Meat': {
      'Beef': ['beef steak', 'ground beef', 'beef ribs', 'beef brisket', 'beef tenderloin', 'stewing beef', 'ground chuck beef'],
      'Pork': ['pork chop', 'ground pork', 'pork loin', 'pork ribs', 'bacon', 'sweet Italian sausage'],
      'Lamb': ['lamb chop', 'ground lamb', 'lamb leg', 'lamb shoulder', 'lamb shank'],
      'Sausages': ['Andouille sausage', 'sweet Italian sausages']
    },
    'Seafood': {
      'Fish': ['salmon', 'tuna', 'trout', 'mackerel', 'sardine', 'flounder fillets', 'red snapper'],
      'Shellfish': ['shrimp', 'crab', 'lobster', 'clam', 'oyster', 'mussels']
    },
    'Dairy': {
      'Milk': ['whole milk', 'skim milk', '2% milk', 'condensed milk', 'evaporated milk', 'buttermilk'],
      'Cheese': [
        'cheddar cheese', 'mozzarella', 'parmesan', 'feta', 'blue cheese', 'cream cheese', 'ricotta cheese', 
        'Monterey Jack cheese', 'grated sharp Cheddar', 'grated yellow sharp cheddar', 'Pecorino Romano', 'Romano cheese'
      ],
      'Cream': ['whipped cream', 'heavy cream', 'sour cream', 'creme fraiche'],
      'Yogurt': ['yogurt', 'greek yogurt', 'flavored yogurt', 'low-fat yogurt']
    },
    'Eggs': {
      'Types': ['egg', 'egg yolk', 'egg white', 'quail egg', 'duck egg']
    },
    'Legumes': {
      'Types': ['black beans', 'kidney beans', 'pinto beans', 'chickpeas', 'lentils', 'navy beans', 'lima beans', 'great Northern beans']
    },
    'Vegetables': {
      'Root Vegetables': ['potato', 'sweet potato', 'carrot', 'beet', 'turnip'],
      'Leafy Greens': ['spinach', 'lettuce', 'kale', 'collard greens', 'arugula'],
      'Cruciferous Vegetables': ['broccoli', 'cauliflower', 'cabbage', 'brussels sprouts', 'bok choy'],
      'Alliums': ['yellow onion', 'red onion', 'garlic', 'leek', 'shallot', 'green onions', 'onion'],
      'Nightshades': ['tomato', 'red bell pepper', 'green bell pepper', 'eggplant', 'jalapeno', 'yellow bell pepper'],
      'Squashes': ['zucchini', 'pumpkin', 'butternut squash', 'acorn squash', 'spaghetti squash', 'yellow squash'],
      'Other Vegetables': ['celery', 'green beans', 'artichoke hearts', 'pico de gallo', 'coleslaw mix']
    },
    'Fruits': {
      'Apples': ['granny smith apple', 'fuji apple', 'honeycrisp apple', 'gala apple', 'red delicious apple'],
      'Citrus': ['orange', 'lemon', 'lime', 'grapefruit', 'tangerine'],
      'Berries': ['strawberry', 'blueberry', 'raspberry', 'blackberry', 'cranberry'],
      'Tropical Fruits': ['pineapple', 'mango', 'banana', 'papaya', 'passion fruit'],
      'Stone Fruits': ['peach', 'plum', 'nectarine', 'cherry', 'apricot'],
      'Melons': ['watermelon', 'cantaloupe', 'honeydew melon', 'galia melon', 'canary melon'],
      'Other Fruits': ['raisins', 'pears', 'maraschino cherries']
    },
    'Nuts & Seeds': {
      'Nuts': ['almond', 'walnut', 'cashew', 'pistachio', 'pecan', 'pine nuts', 'peanuts', 'hazelnuts'],
      'Seeds': ['flax seeds', 'flax seed meal', 'sesame seeds', 'sunflower seeds', 'poppy seeds']
    },
    'Grains': {
      'Rice': ['white rice', 'brown rice', 'Simmered Rice', 'arborio rice'],
      'Cereal Grains': ['quinoa', 'oats', 'barley', 'couscous'],
      'Flour': ['all-purpose flour', 'whole wheat flour', 'cornmeal', 'masa corn flour'],
      'Pasta': ['spaghetti', 'macaroni', 'fettuccine', 'penne', 'lasagna', 'orecchiette', 'corkscrew-shaped pasta'],
      'Breads': [
        'white bread', 'whole wheat bread', 'bagel', 'biscuit', 'tortilla', 'sesame-seed hamburger buns', 'challah', 
        'brioche', 'pie crust', 'shortbread pie crust'
      ]
    },
    'Baking Ingredients': {
      'Types': [
        'baking powder', 'baking soda', 'brown sugar', 'white sugar', 'vanilla extract', 'cocoa powder', 'yeast', 
        'vital wheat gluten', 'cornstarch', 'panko bread crumbs', 'plain fine breadcrumbs', 'dry bread crumbs'
      ]
    },
    'Oils & Fats': {
      'Types': ['olive oil', 'canola oil', 'vegetable oil', 'coconut oil', 'Mazola Corn Oil', 'butter', 'margarine', 'shortening']
    },
    'Condiments': {
      'Types': [
        'Tabasco sauce', 'Worcestershire sauce', 'Thousand Island dressing', 'pickle relish', 'hot sauce', 'vinegar', 
        'chipotle pepper sauce', 'salsa', 'ketchup', 'barbeque sauce', 'Italian dressing', 'pesto', 'mustard', 'soy sauce', 
        'pepper sauce'
      ]
    },
    'Spices & Herbs': {
      'Types': [
        'cinnamon', 'nutmeg', 'ginger', 'basil', 'parsley', 'Italian herb seasoning', 'Cajun seasoning', 'dry mustard', 
        'rubbed sage', 'dried thyme', 'ground cumin', 'crushed red pepper flakes', 'ground mustard', 'chili powder', 
        'ground cardamom', 'dried oregano', 'onion powder', 'fresh cilantro', 'curry powder', 'sweet paprika', 'paprika', 
        'fresh thyme'
      ]
    },
    'Sweeteners': {
      'Types': ['honey', 'sugar', 'brown sugar', 'corn syrup', 'maple-flavored syrup', 'apple butter', 'caramel sauce']
    },
    'Beverages': {
      'Types': [
        'wheat whiskey', 'sweet vermouth', 'red wine', 'dry white wine', 'sparkling wine', 'milk chocolate drink mix', 
        'instant coffee granules', 'hot cocoa mix'
      ]
    },
    'Miscellaneous': {
      'Types': [
        'water', 'salt', 'black pepper', 'boiling water', 'cooking spray', 'chocolate chips', 'dark chocolate chips', 
        'semisweet chocolate', 'bittersweet chocolate', 'unsweetened chocolate', 'chocolate-covered nougat bites', 
        'trail mix', 'mini marshmallows', 'crushed peppermint candies', 'ice cubes', 'maraschino cherries', 
        'cream of mushroom soup', 'cream of chicken soup', 'marinara sauce'
      ]
    }
  };
  
  module.exports = organizedCategories;
  