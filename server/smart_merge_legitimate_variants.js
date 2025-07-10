const db = require('./db/database');

async function smartMergeLegitimateVariants() {
  console.log('🔗 SMART MERGING LEGITIMATE INGREDIENT VARIANTS\n');
  
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');
    
    // Define merge groups for common ingredients with variants
    const mergeGroups = {
      'garlic': {
        patterns: ['garlic', 'clove', 'bulb'],
        variants: ['garlic clove', 'clove garlic', 'bulb garlic', 'cloves garlic', 'garlic cloves'],
        canonical: 'garlic'
      },
      'egg': {
        patterns: ['egg', 'eggs'],
        variants: ['egg white', 'egg yolk', 'beaten egg', 'eggs beaten', 'whole egg'],
        canonical: 'egg'
      },
      'chicken': {
        patterns: ['chicken'],
        variants: ['chicken breast', 'chicken thigh', 'boneless chicken', 'skinless chicken'],
        canonical: 'chicken'
      },
      'oil': {
        patterns: ['oil'],
        variants: ['olive oil', 'vegetable oil', 'cooking oil', 'canola oil'],
        canonical: 'oil'
      },
      'lettuce': {
        patterns: ['lettuce'],
        variants: ['romaine lettuce', 'iceberg lettuce', 'butter lettuce', 'leaf lettuce'],
        canonical: 'lettuce'
      },
      'lemon': {
        patterns: ['lemon'],
        variants: ['lemon juice', 'lemon zest', 'fresh lemon', 'lemon wedges'],
        canonical: 'lemon'
      },
      'flour': {
        patterns: ['flour'],
        variants: ['all-purpose flour', 'whole wheat flour', 'bread flour', 'cake flour'],
        canonical: 'flour'
      },
      'onion': {
        patterns: ['onion'],
        variants: ['yellow onion', 'white onion', 'red onion', 'sweet onion'],
        canonical: 'onion'
      },
      'tomato': {
        patterns: ['tomato'],
        variants: ['roma tomato', 'cherry tomato', 'beefsteak tomato', 'tomato sauce'],
        canonical: 'tomato'
      },
      'potato': {
        patterns: ['potato'],
        variants: ['russet potato', 'red potato', 'yukon gold potato', 'sweet potato'],
        canonical: 'potato'
      },
      'carrot': {
        patterns: ['carrot'],
        variants: ['baby carrot', 'carrots', 'shredded carrot', 'diced carrot'],
        canonical: 'carrot'
      },
      'celery': {
        patterns: ['celery'],
        variants: ['celery stalk', 'celery ribs', 'chopped celery', 'diced celery'],
        canonical: 'celery'
      },
      'pepper': {
        patterns: ['pepper', 'bell pepper'],
        variants: ['red bell pepper', 'green bell pepper', 'yellow bell pepper', 'jalapeno pepper'],
        canonical: 'pepper'
      },
      'mushroom': {
        patterns: ['mushroom'],
        variants: ['button mushroom', 'shiitake mushroom', 'portobello mushroom', 'cremini mushroom'],
        canonical: 'mushroom'
      },
      'cheese': {
        patterns: ['cheese'],
        variants: ['cheddar cheese', 'mozzarella cheese', 'parmesan cheese', 'cream cheese'],
        canonical: 'cheese'
      },
      'milk': {
        patterns: ['milk'],
        variants: ['whole milk', 'skim milk', 'almond milk', 'soy milk'],
        canonical: 'milk'
      },
      'butter': {
        patterns: ['butter'],
        variants: ['unsalted butter', 'salted butter', 'clarified butter', 'melted butter'],
        canonical: 'butter'
      },
      'bread': {
        patterns: ['bread'],
        variants: ['sourdough bread', 'whole wheat bread', 'white bread', 'rye bread'],
        canonical: 'bread'
      },
      'rice': {
        patterns: ['rice'],
        variants: ['white rice', 'brown rice', 'basmati rice', 'jasmine rice'],
        canonical: 'rice'
      },
      'pasta': {
        patterns: ['pasta'],
        variants: ['spaghetti', 'penne', 'fettuccine', 'rigatoni'],
        canonical: 'pasta'
      }
    };
    
    let totalMerged = 0;
    let totalMappingsConsolidated = 0;
    let log = [];
    
    for (const [groupName, group] of Object.entries(mergeGroups)) {
      try {
        console.log(`\n🔗 Processing ${groupName} variants...`);
        
        // Find all canonicals that match this group
        const matchingCanonicals = await db.query(`
          SELECT id, name, aliases
          FROM "CanonicalIngredients" 
          WHERE name ILIKE ANY(ARRAY[:patterns])
          ORDER BY name
        `, { 
          replacements: { patterns: group.patterns.map(p => `%${p}%`) },
          type: db.QueryTypes.SELECT 
        });
        
        if (matchingCanonicals.length === 0) {
          console.log(`  ⚠️  No canonicals found for ${groupName}`);
          continue;
        }
        
        if (matchingCanonicals.length === 1) {
          console.log(`  ℹ️  Only one canonical found for ${groupName}, no merging needed`);
          continue;
        }
        
        console.log(`  Found ${matchingCanonicals.length} canonicals to merge`);
        
        // Find the main canonical (prefer the exact match, then shortest name)
        let mainCanonical = null;
        for (const canonical of matchingCanonicals) {
          if (canonical.name.toLowerCase() === group.canonical.toLowerCase()) {
            mainCanonical = canonical;
            break;
          }
        }
        
        if (!mainCanonical) {
          // Find the shortest name as main canonical
          mainCanonical = matchingCanonicals.reduce((shortest, current) => 
            current.name.length < shortest.name.length ? current : shortest
          );
        }
        
        console.log(`  Main canonical: "${mainCanonical.name}" (ID: ${mainCanonical.id})`);
        
        // Collect all aliases and mappings
        let allAliases = new Set();
        let allMappings = [];
        
        for (const canonical of matchingCanonicals) {
          // Add canonical name as alias if it's not the main one
          if (canonical.id !== mainCanonical.id) {
            allAliases.add(canonical.name);
          }
          
          // Add existing aliases
          if (canonical.aliases) {
            try {
              const aliases = typeof canonical.aliases === 'string' ? 
                JSON.parse(canonical.aliases) : canonical.aliases;
              aliases.forEach(alias => allAliases.add(alias));
            } catch (e) {
              // Skip invalid JSON
            }
          }
          
          // Get all mappings for this canonical
          const mappings = await db.query(`
            SELECT "messyName" FROM "IngredientToCanonicals" 
            WHERE "CanonicalIngredientId" = :canonicalId
          `, { 
            replacements: { canonicalId: canonical.id },
            type: db.QueryTypes.SELECT 
          });
          
          mappings.forEach(mapping => allMappings.push(mapping.messyName));
        }
        
        // Update main canonical with all aliases
        const updatedAliases = Array.from(allAliases);
        await db.query(`
          UPDATE "CanonicalIngredients" 
          SET aliases = :aliases 
          WHERE id = :canonicalId
        `, { 
          replacements: { 
            aliases: JSON.stringify(updatedAliases),
            canonicalId: mainCanonical.id 
          },
          type: db.QueryTypes.UPDATE 
        });
        
        // Move all mappings to main canonical
        for (const canonical of matchingCanonicals) {
          if (canonical.id !== mainCanonical.id) {
            // Update mappings to point to main canonical
            await db.query(`
              UPDATE "IngredientToCanonicals" 
              SET "CanonicalIngredientId" = :mainCanonicalId 
              WHERE "CanonicalIngredientId" = :canonicalId
            `, { 
              replacements: { 
                mainCanonicalId: mainCanonical.id,
                canonicalId: canonical.id 
              },
              type: db.QueryTypes.UPDATE 
            });
            
            // Remove duplicate canonical
            await db.query(`
              DELETE FROM "CanonicalIngredients" 
              WHERE id = :canonicalId
            `, { 
              replacements: { canonicalId: canonical.id },
              type: db.QueryTypes.DELETE 
            });
          }
        }
        
        // Remove duplicate mappings (same messyName, same CanonicalIngredientId)
        await db.query(`
          DELETE FROM "IngredientToCanonicals" a
          USING "IngredientToCanonicals" b
          WHERE a.id < b.id
            AND a."messyName" = b."messyName"
            AND a."CanonicalIngredientId" = b."CanonicalIngredientId"
        `);
        
        totalMerged++;
        totalMappingsConsolidated += allMappings.length;
        
        console.log(`  ✅ Merged ${matchingCanonicals.length} canonicals into "${mainCanonical.name}"`);
        console.log(`     Aliases: ${updatedAliases.join(', ')}`);
        console.log(`     Total mappings: ${allMappings.length}`);
        
        log.push(`Merged ${groupName}: ${matchingCanonicals.length} canonicals → "${mainCanonical.name}" (${allMappings.length} mappings)`);
        
      } catch (error) {
        console.log(`  ❌ Error processing ${groupName}: ${error.message}`);
        log.push(`Error processing ${groupName}: ${error.message}`);
      }
    }
    
    // Write log to file
    const fs = require('fs');
    fs.writeFileSync('smart_merge_legitimate_variants.log', log.join('\n'));
    
    console.log(`\n📊 MERGING COMPLETE:`);
    console.log(`   Groups processed: ${totalMerged}`);
    console.log(`   Total mappings consolidated: ${totalMappingsConsolidated}`);
    console.log(`   Log written to: smart_merge_legitimate_variants.log`);
    
    // Verify results
    console.log(`\n🔍 VERIFICATION:`);
    const remainingDuplicates = await db.query(`
      SELECT 
        ci.name as "canonicalName",
        COUNT(itc.id) as "mappingCount"
      FROM "CanonicalIngredients" ci
      JOIN "IngredientToCanonicals" itc ON ci.id = itc."CanonicalIngredientId"
      GROUP BY ci.id, ci.name
      HAVING COUNT(itc.id) > 1
      ORDER BY COUNT(itc.id) DESC
      LIMIT 10
    `, { type: db.QueryTypes.SELECT });
    
    console.log(`   Remaining duplicate canonicals: ${remainingDuplicates.length}`);
    if (remainingDuplicates.length > 0) {
      console.log(`   Top remaining duplicates:`);
      remainingDuplicates.forEach(item => {
        console.log(`     "${item.canonicalName}": ${item.mappingCount} mappings`);
      });
    }
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.close();
  }
}

smartMergeLegitimateVariants(); 