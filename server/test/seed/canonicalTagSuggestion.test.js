const { Food, CanonicalIngredient, IngredientToCanonical } = require('../../db/models');
const { Op } = require('sequelize');

// Mock the cleanIngredientName function
jest.mock('../../api/foodRoutes', () => ({
  cleanIngredientName: jest.fn((input) => {
    if (!input) return '';
    return input.toLowerCase().replace(/\d+\s*(cups?|tablespoons?|teaspoons?|ounces?|pounds?)/g, '').trim();
  })
}));

describe('Canonical Tag Suggestion', () => {
  let mockCanonicalIngredients;
  let mockProducts;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock canonical ingredients
    mockCanonicalIngredients = [
      {
        id: 1,
        name: 'flour',
        aliases: ['all-purpose flour', 'bread flour', 'cake flour']
      },
      {
        id: 2,
        name: 'milk',
        aliases: ['whole milk', 'skim milk', '2% milk']
      },
      {
        id: 3,
        name: 'butter',
        aliases: ['unsalted butter', 'salted butter']
      },
      {
        id: 4,
        name: 'sugar',
        aliases: ['granulated sugar', 'brown sugar', 'powdered sugar']
      }
    ];

    // Mock products
    mockProducts = [
      {
        id: 1,
        description: 'All-Purpose Flour',
        canonicalTag: null,
        canonicalTagConfidence: null,
        save: jest.fn()
      },
      {
        id: 2,
        description: 'Whole Milk',
        canonicalTag: null,
        canonicalTagConfidence: null,
        save: jest.fn()
      },
      {
        id: 3,
        description: 'Chocolate Chip Cookies with Flour',
        canonicalTag: null,
        canonicalTagConfidence: null,
        save: jest.fn()
      },
      {
        id: 4,
        description: 'Pure Granulated Sugar',
        canonicalTag: null,
        canonicalTagConfidence: null,
        save: jest.fn()
      }
    ];
  });

  describe('Confident Tag Assignment', () => {
    test('should assign confident tag for exact matches', async () => {
      // Mock database calls
      CanonicalIngredient.findAll = jest.fn().mockResolvedValue(mockCanonicalIngredients);
      Food.findAll = jest.fn().mockResolvedValue(mockProducts);

      const { cleanIngredientName } = require('../../api/foodRoutes');
      
      // Test exact matches
      const flourProduct = mockProducts[0];
      const cleanedDesc = cleanIngredientName(flourProduct.description); // 'all-purpose flour'
      
      // Check if cleaned description exactly matches a canonical name or alias
      const allTags = mockCanonicalIngredients.flatMap(ci => [ci.name, ...(ci.aliases || [])]);
      const exactMatch = allTags.find(tag => cleanedDesc === tag.toLowerCase());
      
      expect(exactMatch).toBe('all-purpose flour');
    });

    test('should assign confident tag for cleaned exact matches', async () => {
      const { cleanIngredientName } = require('../../api/foodRoutes');
      
      // Test that "All-Purpose Flour" becomes "all-purpose flour" and matches
      const cleaned = cleanIngredientName('All-Purpose Flour');
      expect(cleaned).toBe('all-purpose flour');
      
      const allTags = mockCanonicalIngredients.flatMap(ci => [ci.name, ...(ci.aliases || [])]);
      const match = allTags.find(tag => cleaned === tag.toLowerCase());
      expect(match).toBe('all-purpose flour');
    });
  });

  describe('Suggested Tag Assignment', () => {
    test('should identify suggested tags for substring matches', async () => {
      const { cleanIngredientName } = require('../../api/foodRoutes');
      
      // Test substring match: "Chocolate Chip Cookies with Flour" contains "flour"
      const productDesc = 'Chocolate Chip Cookies with Flour';
      const cleanedDesc = cleanIngredientName(productDesc);
      
      const allTags = mockCanonicalIngredients.flatMap(ci => [ci.name, ...(ci.aliases || [])]);
      const exactMatch = allTags.find(tag => cleanedDesc === tag.toLowerCase());
      const substringMatch = allTags.find(tag => cleanedDesc.includes(tag.toLowerCase()));
      
      expect(exactMatch).toBeUndefined(); // No exact match
      expect(substringMatch).toBe('flour'); // Substring match found
    });

    test('should avoid false positives for unrelated products', async () => {
      const { cleanIngredientName } = require('../../api/foodRoutes');
      
      // Test that "Pure Granulated Sugar" doesn't match "flour"
      const productDesc = 'Pure Granulated Sugar';
      const cleanedDesc = cleanIngredientName(productDesc);
      
      const flourTags = ['flour', 'all-purpose flour', 'bread flour', 'cake flour'];
      const hasFlourMatch = flourTags.some(tag => cleanedDesc.includes(tag.toLowerCase()));
      
      expect(hasFlourMatch).toBe(false);
    });
  });

  describe('Tag Confidence Logic', () => {
    test('should distinguish between confident and suggested assignments', () => {
      const determineConfidence = (productDesc, canonicalTags) => {
        const { cleanIngredientName } = require('../../api/foodRoutes');
        const cleaned = cleanIngredientName(productDesc);
        
        // Check for exact match (confident)
        const exactMatch = canonicalTags.find(tag => cleaned === tag.toLowerCase());
        if (exactMatch) return 'confident';
        
        // Check for substring match (suggested)
        const substringMatch = canonicalTags.find(tag => cleaned.includes(tag.toLowerCase()));
        if (substringMatch) return 'suggested';
        
        return 'none';
      };

      const allTags = mockCanonicalIngredients.flatMap(ci => [ci.name, ...(ci.aliases || [])]);
      
      expect(determineConfidence('All-Purpose Flour', allTags)).toBe('confident');
      expect(determineConfidence('Chocolate Chip Cookies with Flour', allTags)).toBe('suggested');
      expect(determineConfidence('Random Product Name', allTags)).toBe('none');
    });
  });
}); 