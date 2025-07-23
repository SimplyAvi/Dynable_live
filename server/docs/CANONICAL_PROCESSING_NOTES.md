# Canonical Ingredient Processing Pipeline

## Overview
This document describes the automated process for adding canonical ingredients, mappings, and allergen tags to ensure all recipe ingredients work with the allergen filtering and substitution logic.

## Important Notes

### Recipe ID Accuracy
⚠️ **CRITICAL**: Always double-check recipe IDs for accuracy. For example:
- Whaler Fish Sandwich is **ID 17** (not 101)
- The title "101 'Whaler' Fish Sandwich" is misleading - the actual ID is 17

### Process Flow
1. **Extract unmapped ingredients** from all recipes
2. **Clean ingredient names** (remove quantities, units, etc.)
3. **Auto-detect allergens** using keyword matching
4. **Batch process** missing canonical ingredients, mappings, and products
5. **Verify coverage** across all recipes

## Performance Optimizations

### Batch Processing Strategy
- **Batch DB reads**: Load all existing data into memory first
- **Caching**: Use Maps/Sets for O(1) lookups
- **Batch inserts**: Process 1000+ items at once
- **Progress tracking**: Real-time progress with ETA
- **Reduced logging**: Only log batch operations, not individual items

### Expected Performance
- **151K+ ingredients** processed in minutes instead of hours
- **1000+ ingredients/second** processing rate
- **Memory efficient** with batch clearing

## Files
- `extract_unmapped_ingredients.js` - Extracts all unmapped cleaned ingredient names
- `fast_batch_canonicals.js` - High-performance batch processing
- `unmapped_ingredients.txt` - Output file with all unmapped ingredients

## Usage
```bash
# Extract unmapped ingredients
node extract_unmapped_ingredients.js

# Process in batches (high performance)
node fast_batch_canonicals.js
```

## Allergen Detection
The system automatically detects allergens using keyword matching:
- Milk: milk, cheese, yogurt, cream, butter, cheddar, mozzarella
- Eggs: egg, mayonnaise
- Wheat: wheat, flour, bread, bun, pasta, semolina
- Gluten: wheat, barley, rye, malt
- Tree nuts: almond, walnut, pecan, cashew, pistachio, hazelnut, macadamia, coconut
- Peanuts: peanut
- Fish: fish, tuna, salmon, cod, flounder, anchovy
- Shellfish: shrimp, crab, lobster, clam, oyster, mussel
- Soy: soy, soybean, tofu, edamame, miso, tempeh
- Sesame: sesame

## Future Maintenance
When adding new recipes or ingredients:
1. Run the extraction script to identify new unmapped ingredients
2. Run the batch processing script to add canonical mappings
3. Verify that allergen filtering works for new ingredients
4. Update this documentation if needed 