const { cleanIngredientName } = require('../../api/foodRoutes');

describe('Ingredient Utils', () => {
  describe('cleanIngredientName', () => {
    test('should remove measurements and units', () => {
      expect(cleanIngredientName('2 cups all-purpose flour')).toBe('all-purpose flour');
      expect(cleanIngredientName('1/2 teaspoon salt')).toBe('salt');
      expect(cleanIngredientName('3 tablespoons olive oil')).toBe('olive oil');
      expect(cleanIngredientName('1 pound chicken breast')).toBe('chicken breast');
    });

    test('should remove parentheses and optional text', () => {
      expect(cleanIngredientName('cheese (optional)')).toBe('cheese');
      expect(cleanIngredientName('milk (such as whole milk)')).toBe('milk');
      expect(cleanIngredientName('flour (all-purpose)')).toBe('flour');
    });

    test('should remove common preparation words', () => {
      expect(cleanIngredientName('fresh chopped parsley')).toBe('parsley');
      expect(cleanIngredientName('dried oregano leaves')).toBe('oregano');
      expect(cleanIngredientName('sliced tomatoes')).toBe('tomatoes');
    });

    test('should handle empty or null input', () => {
      expect(cleanIngredientName('')).toBe('');
      expect(cleanIngredientName(null)).toBe('');
      expect(cleanIngredientName(undefined)).toBe('');
    });

    test('should preserve important ingredient names', () => {
      expect(cleanIngredientName('all-purpose flour')).toBe('all-purpose flour');
      expect(cleanIngredientName('extra virgin olive oil')).toBe('extra virgin olive oil');
      expect(cleanIngredientName('sharp cheddar cheese')).toBe('sharp cheddar cheese');
    });

    test('should handle complex ingredient descriptions', () => {
      expect(cleanIngredientName('1/2 cup (120ml) whole milk, warmed to 110°F')).toBe('milk, warmed to °f');
      expect(cleanIngredientName('2 large eggs, room temperature')).toBe('eggs');
      expect(cleanIngredientName('1 package (2 1/4 tsp) active dry yeast')).toBe('active dry yeast');
    });
  });
}); 