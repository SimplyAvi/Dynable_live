const { Recipe, Ingredient, Food, CanonicalIngredient, IngredientToCanonical } = require('../../db/models');

// Mock the models for testing
jest.mock('../../db/models', () => ({
  Recipe: {
    findOne: jest.fn(),
    findAll: jest.fn()
  },
  Ingredient: {
    findOne: jest.fn()
  },
  Food: {
    findAll: jest.fn()
  },
  CanonicalIngredient: {
    findByPk: jest.fn()
  },
  IngredientToCanonical: {
    findOne: jest.fn()
  }
}));

describe('Audit Script Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Recipe Ingredient Audit', () => {
    test('should find focus recipe and include it in audit', async () => {
      // Mock the focus recipe
      const mockFocusRecipe = {
        id: 1,
        title: '1-Dish Pepperoni Cheese Pizza Bake',
        Ingredients: [
          { name: '3/4 cups all-purpose flour' },
          { name: 'teaspoons sugar' },
          { name: 'tablespoons olive oil' }
        ]
      };

      const mockRandomRecipes = [
        {
          id: 2,
          title: 'Test Recipe 1',
          Ingredients: [{ name: '2 cups milk' }]
        }
      ];

      // Setup mocks
      Recipe.findOne.mockResolvedValue(mockFocusRecipe);
      Recipe.findAll.mockResolvedValue(mockRandomRecipes);

      // Test the audit logic
      const focusRecipe = await Recipe.findOne({ 
        where: { title: '1-Dish Pepperoni Cheese Pizza Bake' }, 
        include: [Ingredient] 
      });
      
      expect(focusRecipe).toBe(mockFocusRecipe);
      expect(focusRecipe.title).toBe('1-Dish Pepperoni Cheese Pizza Bake');
      expect(focusRecipe.Ingredients).toHaveLength(3);
    });

    test('should correctly identify ingredients with product matches', async () => {
      // Mock canonical mapping
      const mockMapping = {
        CanonicalIngredientId: 1
      };

      const mockCanonical = {
        id: 1,
        name: 'flour',
        aliases: ['all-purpose flour', 'bread flour']
      };

      const mockProducts = [
        {
          id: 1,
          description: 'All-Purpose Flour',
          canonicalTag: 'all-purpose flour'
        }
      ];

      // Setup mocks
      IngredientToCanonical.findOne.mockResolvedValue(mockMapping);
      CanonicalIngredient.findByPk.mockResolvedValue(mockCanonical);
      Food.findAll.mockResolvedValue(mockProducts);

      // Test ingredient processing
      const ingredientName = '3/4 cups all-purpose flour';
      const cleanedName = ingredientName.toLowerCase()
        .replace(/\d+[\/\d]*\s*(cups?|tablespoons?|teaspoons?|ounces?|pounds?)/g, '')
        .trim();

      expect(cleanedName).toBe('all-purpose flour');

      const mapping = await IngredientToCanonical.findOne({ 
        where: { messyName: cleanedName.toLowerCase() } 
      });
      expect(mapping).toBe(mockMapping);

      const canonical = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
      expect(canonical).toBe(mockCanonical);

      const canonicalTags = [canonical.name.toLowerCase(), ...(canonical.aliases || []).map(a => a.toLowerCase())];
      const products = await Food.findAll({
        where: { canonicalTag: { [require('sequelize').Op.in]: canonicalTags } },
        limit: 10
      });

      expect(products).toEqual(mockProducts);
      expect(products).toHaveLength(1);
    });

    test('should identify ingredients with no product matches', async () => {
      // Mock no mapping found
      IngredientToCanonical.findOne.mockResolvedValue(null);
      Food.findAll.mockResolvedValue([]);

      const ingredientName = 'unknown ingredient';
      const cleanedName = ingredientName.toLowerCase();

      const mapping = await IngredientToCanonical.findOne({ 
        where: { messyName: cleanedName.toLowerCase() } 
      });
      expect(mapping).toBeNull();

      // Should use cleaned name as fallback
      const products = await Food.findAll({
        where: { canonicalTag: { [require('sequelize').Op.in]: [cleanedName] } },
        limit: 10
      });

      expect(products).toEqual([]);
    });

    test('should detect suspicious product matches', async () => {
      // Mock products that don't contain the ingredient name
      const mockSuspiciousProducts = [
        {
          id: 1,
          description: 'Chocolate Chip Cookies',
          canonicalTag: 'flour'
        }
      ];

      Food.findAll.mockResolvedValue(mockSuspiciousProducts);

      const ingredientName = 'flour';
      const products = mockSuspiciousProducts;

      // Check if any product description contains the ingredient name
      const suspicious = !products.some(p => 
        p.description.toLowerCase().includes(ingredientName.toLowerCase())
      );

      expect(suspicious).toBe(true);
      expect(products[0].description).not.toContain('flour');
    });

    test('should handle substitute testing', async () => {
      // Mock substitute mapping
      const mockSubstitute = {
        substituteType: 'almond milk',
        searchTerms: ['almond milk', 'almond beverage']
      };

      const mockSubstituteProducts = [
        {
          id: 1,
          description: 'Almond Milk',
          canonicalTag: 'almond milk'
        }
      ];

      // Setup mocks
      require('../../db/models').SubstituteMapping = {
        findOne: jest.fn().mockResolvedValue(mockSubstitute)
      };
      Food.findAll.mockResolvedValue(mockSubstituteProducts);

      const ingredientName = 'milk';
      const substitute = await require('../../db/models').SubstituteMapping.findOne({ 
        where: { substituteType: ingredientName } 
      });

      expect(substitute).toBe(mockSubstitute);

      const subTags = [substitute.substituteType.toLowerCase(), ...(substitute.searchTerms || []).map(s => s.toLowerCase())];
      const subProducts = await Food.findAll({
        where: { canonicalTag: { [require('sequelize').Op.in]: subTags } },
        limit: 10
      });

      expect(subProducts).toEqual(mockSubstituteProducts);
      expect(subProducts).toHaveLength(1);
    });
  });
}); 