// High-performance batch processing for 151K+ unmapped ingredients
// Uses: Batch DB reads, caching, batch inserts, parallelization, progress tracking
// Features: Progress bar, resume capability, skip already processed ingredients, skip overly long names

const { CanonicalIngredient, IngredientToCanonical, Food } = require('./db/models');
const fs = require('fs');

// Common allergen keywords for auto-detection
const allergenKeywords = {
  'milk': ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'cheddar', 'mozzarella'],
  'eggs': ['egg', 'mayonnaise'],
  'wheat': ['wheat', 'flour', 'bread', 'bun', 'pasta', 'semolina'],
  'gluten': ['wheat', 'barley', 'rye', 'malt'],
  'tree nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'coconut'],
  'peanuts': ['peanut'],
  'fish': ['fish', 'tuna', 'salmon', 'cod', 'flounder', 'anchovy'],
  'shellfish': ['shrimp', 'crab', 'lobster', 'clam', 'oyster', 'mussel'],
  'soy': ['soy', 'soybean', 'tofu', 'edamame', 'miso', 'tempeh'],
  'sesame': ['sesame']
};

const SKIP_LOG = 'skipped_long_ingredients.txt';
const MAX_NAME_LENGTH = 255;

function detectAllergens(ingredientName) {
  const lowerName = ingredientName.toLowerCase();
  const detected = [];
  
  for (const [allergen, keywords] of Object.entries(allergenKeywords)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      detected.push(allergen);
    }
  }
  
  return detected;
}

function createProgressBar(current, total, width = 50) {
  const progress = Math.round((current / total) * width);
  const bar = '█'.repeat(progress) + '░'.repeat(width - progress);
  return `[${bar}]`;
}

function showProgress(current, total, startTime, processed, skipped) {
  const elapsed = Date.now() - startTime;
  const percent = ((current / total) * 100).toFixed(1);
  const rate = current / (elapsed / 1000);
  const eta = ((total - current) / rate).toFixed(0);
  const bar = createProgressBar(current, total);
  
  process.stdout.write(`\r${bar} ${current.toLocaleString()}/${total.toLocaleString()} (${percent}%) | Rate: ${rate.toFixed(0)}/sec | ETA: ${eta}s | Processed: ${processed} | Skipped: ${skipped}`);
}

async function fastBatchCanonicals() {
  try {
    console.log('🚀 Starting high-performance batch processing...\n');
    
    // Read unmapped ingredients
    const unmappedText = fs.readFileSync('unmapped_ingredients.txt', 'utf8');
    const unmappedIngredients = unmappedText.split('\n').filter(line => line.trim());
    
    console.log(`📊 Found ${unmappedIngredients.length.toLocaleString()} unmapped ingredients to process.\n`);
    
    // BATCH READ: Get all existing canonical ingredients and mappings in memory
    console.log('📖 Loading existing data into memory...');
    const existingCanonicals = await CanonicalIngredient.findAll();
    const existingMappings = await IngredientToCanonical.findAll();
    const existingProducts = await Food.findAll({ 
      where: { canonicalTagConfidence: 'confident' },
      attributes: ['canonicalTag']
    });
    
    // Create lookup maps for O(1) access
    const canonicalMap = new Map(existingCanonicals.map(c => [c.name, c]));
    const mappingMap = new Map(existingMappings.map(m => [m.messyName, m]));
    const productMap = new Set(existingProducts.map(p => p.canonicalTag));
    
    console.log(`✅ Loaded ${existingCanonicals.length} canonicals, ${existingMappings.length} mappings, ${existingProducts.size} products into memory.\n`);
    
    // Filter out already processed ingredients
    const trulyUnmapped = unmappedIngredients.filter(ingredient => !mappingMap.has(ingredient));
    
    console.log(`🔄 Resuming from previous run:`);
    console.log(`   - Total ingredients: ${unmappedIngredients.length.toLocaleString()}`);
    console.log(`   - Already processed: ${(unmappedIngredients.length - trulyUnmapped.length).toLocaleString()}`);
    console.log(`   - Remaining to process: ${trulyUnmapped.length.toLocaleString()}\n`);
    
    if (trulyUnmapped.length === 0) {
      console.log('🎉 All ingredients already processed! Nothing to do.');
      return;
    }
    
    // Prepare batch arrays
    const newCanonicals = [];
    const newMappings = [];
    const newProducts = [];
    const skippedLong = [];
    
    const startTime = Date.now();
    let processed = 0;
    let skipped = 0;
    let totalProcessed = 0;
    
    console.log('⚡ Processing ingredients in batches...\n');
    
    // Process in batches of 1000
    const BATCH_SIZE = 1000;
    for (let i = 0; i < trulyUnmapped.length; i += BATCH_SIZE) {
      const batch = trulyUnmapped.slice(i, i + BATCH_SIZE);
      
      for (const ingredient of batch) {
        if (!ingredient.trim()) continue;
        
        // Skip if already exists (using in-memory lookup)
        if (canonicalMap.has(ingredient)) {
          skipped++;
          totalProcessed++;
          continue;
        }
        
        // Skip if name is too long
        if (ingredient.length > MAX_NAME_LENGTH) {
          skipped++;
          totalProcessed++;
          skippedLong.push(`SKIPPED: [${ingredient.length} chars] ${ingredient}`);
          continue;
        }
        
        // Detect allergens
        const allergens = detectAllergens(ingredient);
        
        // Prepare canonical ingredient
        const canonical = {
          name: ingredient,
          aliases: [],
          allergens: allergens
        };
        newCanonicals.push(canonical);
        canonicalMap.set(ingredient, canonical); // Add to cache
        
        // Prepare mapping
        if (!mappingMap.has(ingredient)) {
          newMappings.push({
            messyName: ingredient,
            CanonicalIngredientId: null // Will be set after canonical creation
          });
          mappingMap.set(ingredient, true);
        }
        
        // Prepare product
        if (!productMap.has(ingredient)) {
          newProducts.push({
            description: `Pure ${ingredient}`,
            canonicalTag: ingredient,
            canonicalTagConfidence: 'confident',
            allergens: allergens,
            brandName: 'Generic',
            brandOwner: 'Generic'
          });
          productMap.add(ingredient);
        }
        
        processed++;
        totalProcessed++;
        
        // Show progress every 100 items
        if (totalProcessed % 100 === 0) {
          showProgress(totalProcessed, trulyUnmapped.length, startTime, processed, skipped);
        }
      }
      
      // BATCH INSERT: Insert canonicals every 1000 items
      if (newCanonicals.length >= 1000) {
        console.log(`\n💾 Batch inserting ${newCanonicals.length} canonical ingredients...`);
        const insertedCanonicals = await CanonicalIngredient.bulkCreate(newCanonicals);
        
        // Update mapping CanonicalIngredientIds
        for (let j = 0; j < insertedCanonicals.length; j++) {
          const canonical = insertedCanonicals[j];
          const mapping = newMappings.find(m => m.messyName === canonical.name);
          if (mapping) {
            mapping.CanonicalIngredientId = canonical.id;
          }
        }
        
        // Batch insert mappings
        const validMappings = newMappings.filter(m => m.CanonicalIngredientId);
        if (validMappings.length > 0) {
          console.log(`💾 Batch inserting ${validMappings.length} mappings...`);
          await IngredientToCanonical.bulkCreate(validMappings);
        }
        
        // Batch insert products
        if (newProducts.length > 0) {
          console.log(`💾 Batch inserting ${newProducts.length} products...`);
          await Food.bulkCreate(newProducts);
        }
        
        // Clear arrays
        newCanonicals.length = 0;
        newMappings.length = 0;
        newProducts.length = 0;
      }
      
      // Write skipped long names to file after each batch
      if (skippedLong.length > 0) {
        fs.appendFileSync(SKIP_LOG, skippedLong.join('\n') + '\n');
        skippedLong.length = 0;
      }
    }
    
    // Insert remaining items
    if (newCanonicals.length > 0) {
      console.log(`\n💾 Final batch: inserting ${newCanonicals.length} canonical ingredients...`);
      const insertedCanonicals = await CanonicalIngredient.bulkCreate(newCanonicals);
      
      // Update remaining mappings
      for (let j = 0; j < insertedCanonicals.length; j++) {
        const canonical = insertedCanonicals[j];
        const mapping = newMappings.find(m => m.messyName === canonical.name);
        if (mapping) {
          mapping.CanonicalIngredientId = canonical.id;
        }
      }
      
      const validMappings = newMappings.filter(m => m.CanonicalIngredientId);
      if (validMappings.length > 0) {
        console.log(`💾 Final batch: inserting ${validMappings.length} mappings...`);
        await IngredientToCanonical.bulkCreate(validMappings);
      }
      
      if (newProducts.length > 0) {
        console.log(`💾 Final batch: inserting ${newProducts.length} products...`);
        await Food.bulkCreate(newProducts);
      }
    }
    
    // Write any remaining skipped long names
    if (skippedLong.length > 0) {
      fs.appendFileSync(SKIP_LOG, skippedLong.join('\n') + '\n');
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 Batch processing complete in ${totalTime}s!`);
    console.log(`📊 Final stats:`);
    console.log(`   - Processed: ${processed.toLocaleString()} new ingredients`);
    console.log(`   - Skipped: ${skipped.toLocaleString()} already existing or too long`);
    console.log(`   - Rate: ${(totalProcessed / totalTime).toFixed(0)}/sec`);
    console.log(`\nNOTE: Recipe IDs must be double-checked for accuracy (e.g., Whaler Fish Sandwich is ID 17).`);
    console.log(`\nSee '${SKIP_LOG}' for skipped overly long ingredient names.`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fastBatchCanonicals(); 