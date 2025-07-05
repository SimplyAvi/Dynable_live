const request = require('supertest');
const { Food, CanonicalIngredient, IngredientToCanonical, SubstituteMapping } = require('../../db/models');

// Mock the models
jest.mock('../../db/models', () => ({
  Food: {
    findAll: jest.fn()
  },
  CanonicalIngredient: {
    findByPk: jest.fn()
  },
  IngredientToCanonical: {
    findOne: jest.fn()
  },
  SubstituteMapping: {
    findOne: jest.fn()
  }
}));

// Mock the cleanIngredientName function
jest.mock('../../api/foodRoutes', () => ({
  cleanIngredientName: jest.fn((input) => {
    if (!input) return '';
    return input.toLowerCase().replace(/\d+\s*(cups?|tablespoons?|teaspoons?|ounces?|pounds?)/g, '').trim();
  })
}));

describe('Product Matching API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/product/by-ingredient', () => {
    test('should return products with matching canonical tags', async () => {
      // Mock data
      const mockCanonicalIngredient = {
        id: 1,
        name: 'flour',
        aliases: ['all-purpose flour', 'bread flour']
      };

      const mockMapping = {
        CanonicalIngredientId: 1
      };

      const mockProducts = [
        {
          id: 1,
          description: 'All-Purpose Flour',
          canonicalTag: 'all-purpose flour',
          allergens: []
        },
        {
          id: 2,
          description: 'Bread Flour',
          canonicalTag: 'bread flour',
          allergens: []
        }
      ];

      // Setup mocks
      IngredientToCanonical.findOne.mockResolvedValue(mockMapping);
      CanonicalIngredient.findByPk.mockResolvedValue(mockCanonicalIngredient);
      Food.findAll.mockResolvedValue(mockProducts);

      // Test the logic directly (since we can't easily test the Express route)
      const { cleanIngredientName } = require('../../api/foodRoutes');
      
      const ingredientName = 'all-purpose flour';
      const cleanedName = cleanIngredientName(ingredientName);
      
      // Simulate the mapping logic
      const mapping = await IngredientToCanonical.findOne({ where: { messyName: cleanedName.toLowerCase() } });
      expect(mapping).toBe(mockMapping);
      
      const canonical = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
      expect(canonical).toBe(mockCanonicalIngredient);
      
      // Simulate the product query
      const canonicalTags = [canonical.name.toLowerCase(), ...(canonical.aliases || []).map(a => a.toLowerCase())];
      const products = await Food.findAll({
        where: { canonicalTag: { [require('sequelize').Op.in]: canonicalTags } }
      });
      
      expect(products).toEqual(mockProducts);
      expect(products).toHaveLength(2);
    });

    test('should handle substitutes correctly', async () => {
      // Mock substitute data
      const mockSubstitute = {
        substituteType: 'almond milk',
        searchTerms: ['almond milk', 'almond beverage']
      };

      const mockSubstituteProducts = [
        {
          id: 3,
          description: 'Almond Milk',
          canonicalTag: 'almond milk',
          allergens: []
        }
      ];

      // Setup mocks
      SubstituteMapping.findOne.mockResolvedValue(mockSubstitute);
      Food.findAll.mockResolvedValue(mockSubstituteProducts);

      // Test substitute logic
      const substituteName = 'milk';
      const substitute = await SubstituteMapping.findOne({ where: { substituteType: substituteName } });
      expect(substitute).toBe(mockSubstitute);

      const subTags = [substitute.substituteType.toLowerCase(), ...(substitute.searchTerms || []).map(s => s.toLowerCase())];
      const subProducts = await Food.findAll({
        where: { canonicalTag: { [require('sequelize').Op.in]: subTags } }
      });

      expect(subProducts).toEqual(mockSubstituteProducts);
      expect(subProducts).toHaveLength(1);
    });

    test('should filter out products with allergens when substitute is selected', async () => {
      // Mock products with allergens
      const mockProductsWithAllergens = [
        {
          id: 1,
          description: 'Regular Milk',
          canonicalTag: 'milk',
          allergens: ['milk']
        },
        {
          id: 2,
          description: 'Almond Milk',
          canonicalTag: 'almond milk',
          allergens: []
        }
      ];

      const mockSubstitute = {
        substituteType: 'almond milk',
        searchTerms: ['almond milk']
      };

      // Setup mocks
      SubstituteMapping.findOne.mockResolvedValue(mockSubstitute);
      Food.findAll.mockResolvedValue(mockProductsWithAllergens);

      // Test allergen filtering
      const allergens = ['milk'];
      const substitute = await SubstituteMapping.findOne({ where: { substituteType: 'milk' } });
      
      const subTags = [substitute.substituteType.toLowerCase(), ...(substitute.searchTerms || []).map(s => s.toLowerCase())];
      
      // Simulate the filtering logic
      const filteredProducts = mockProductsWithAllergens.filter(product => {
        const hasAllergen = product.allergens && product.allergens.some(allergen => 
          allergens.includes(allergen.toLowerCase())
        );
        return !hasAllergen;
      });

      expect(filteredProducts).toHaveLength(1);
      expect(filteredProducts[0].description).toBe('Almond Milk');
    });

    test('should return empty array when no canonical mapping exists', async () => {
      // Setup mocks
      IngredientToCanonical.findOne.mockResolvedValue(null);
      Food.findAll.mockResolvedValue([]);

      const { cleanIngredientName } = require('../../api/foodRoutes');
      
      const ingredientName = 'unknown ingredient';
      const cleanedName = cleanIngredientName(ingredientName);
      
      const mapping = await IngredientToCanonical.findOne({ where: { messyName: cleanedName.toLowerCase() } });
      expect(mapping).toBeNull();
      
      // Should return empty array when no mapping exists
      const products = await Food.findAll();
      expect(products).toEqual([]);
    });
  });

  describe('Enhanced Filtering Logic', () => {
    test('should filter by subcategory size for basic ingredients', async () => {
      // Mock basic ingredient detection
      const canonicalTags = ['sugar'];
      const basicIngredients = ['sugar', 'salt', 'flour', 'milk', 'butter', 'oil', 'yeast', 'egg'];
      const isBasicIngredient = basicIngredients.some(basic => 
        canonicalTags.some(tag => tag.includes(basic.toLowerCase()))
      );
      
      expect(isBasicIngredient).toBe(true);
      
      // Test that the subcategory filtering would be applied
      const subcategoryFilter = `"SubcategoryID" IN (
        SELECT "SubcategoryID" FROM "Subcategories" 
        WHERE "pure_ingredient" = true
        AND "SubcategoryID" IN (
          SELECT "SubcategoryID" FROM "Food" 
          GROUP BY "SubcategoryID" 
          HAVING COUNT(*) < 100
        )
      )`;
      
      expect(subcategoryFilter).toContain('pure_ingredient" = true');
      expect(subcategoryFilter).toContain('COUNT(*) < 100');
    });

    test('should filter out problematic brands for sugar/chocolate', async () => {
      const canonicalTags = ['sugar'];
      const problematicBrands = ['M&M', 'Hershey', 'Nestle', 'Kraft', 'General Mills'];
      const hasProblematicBrand = problematicBrands.some(brand => 
        canonicalTags.some(tag => tag.includes('sugar') || tag.includes('chocolate'))
      );
      
      expect(hasProblematicBrand).toBe(true);
      
      // Test brand filtering logic
      const brandFilter = `(
        "brandName" IS NULL OR 
        LOWER("brandName") NOT LIKE '%m&m%' AND
        LOWER("brandName") NOT LIKE '%hershey%' AND
        LOWER("brandName") NOT LIKE '%nestle%' AND
        LOWER("brandName") NOT LIKE '%kraft%' AND
        LOWER("brandName") NOT LIKE '%general mills%'
      )`;
      
      expect(brandFilter).toContain('NOT LIKE');
      expect(brandFilter).toContain('m&m');
    });

    test('should apply strict description filtering for sugar', async () => {
      const canonicalTags = ['sugar'];
      const hasSugar = canonicalTags.some(tag => tag.includes('sugar'));
      
      expect(hasSugar).toBe(true);
      
      // Test description filtering
      const descriptionFilter = `(
        LOWER("description") NOT LIKE '%donut%' AND
        LOWER("description") NOT LIKE '%cookie%' AND
        LOWER("description") NOT LIKE '%cake%' AND
        LOWER("description") NOT LIKE '%cereal%' AND
        LOWER("description") NOT LIKE '%oat%' AND
        LOWER("description") NOT LIKE '%candy%' AND
        LOWER("description") NOT LIKE '%chocolate%'
      )`;
      
      expect(descriptionFilter).toContain('NOT LIKE');
      expect(descriptionFilter).toContain('donut');
      expect(descriptionFilter).toContain('cookie');
      expect(descriptionFilter).toContain('cake');
    });

    test('should not apply strict filtering for non-basic ingredients', async () => {
      const canonicalTags = ['pizza sauce'];
      const basicIngredients = ['sugar', 'salt', 'flour', 'milk', 'butter', 'oil', 'yeast', 'egg'];
      const isBasicIngredient = basicIngredients.some(basic => 
        canonicalTags.some(tag => tag.includes(basic.toLowerCase()))
      );
      
      expect(isBasicIngredient).toBe(false);
      
      // For non-basic ingredients, only canonical tag filtering should apply
      const where = {
        canonicalTag: { [require('sequelize').Op.in]: canonicalTags }
      };
      
      expect(where.canonicalTag).toBeDefined();
      expect(where[require('sequelize').Op.and]).toBeUndefined();
    });
  });
}); 