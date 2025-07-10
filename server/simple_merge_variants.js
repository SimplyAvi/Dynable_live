const db = require('./db/database');

async function simpleMergeVariants() {
  console.log('🔗 SIMPLE MERGING OF INGREDIENT VARIANTS\n');
  
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');
    
    // Define merge groups for common ingredients with variants
    const mergeGroups = {
      'garlic': {
        patterns: ['garlic', 'clove', 'bulb'],
        canonical: 'garlic'
      },
      'egg': {
        patterns: ['egg', 'eggs'],
        canonical: 'egg'
      },
      'chicken': {
        patterns: ['chicken'],
        canonical: 'chicken'
      },
      'oil': {
        patterns: ['oil'],
        canonical: 'oil'
      },
      'lettuce': {
        patterns: ['lettuce'],
        canonical: 'lettuce'
      },
      'lemon': {
        patterns: ['lemon'],
        canonical: 'lemon'
      },
      'flour': {
        patterns: ['flour'],
        canonical: 'flour'
      },
      'onion': {
        patterns: ['onion'],
        canonical: 'onion'
      },
      'tomato': {
        patterns: ['tomato'],
        canonical: 'tomato'
      },
      'potato': {
        patterns: ['potato'],
        canonical: 'potato'
      },
      'carrot': {
        patterns: ['carrot'],
        canonical: 'carrot'
      },
      'celery': {
        patterns: ['celery'],
        canonical: 'celery'
      },
      'pepper': {
        patterns: ['pepper', 'bell pepper'],
        canonical: 'pepper'
      },
      'mushroom': {
        patterns: ['mushroom'],
        canonical: 'mushroom'
      },
      'cheese': {
        patterns: ['cheese'],
        canonical: 'cheese'
      },
      'milk': {
        patterns: ['milk'],
        canonical: 'milk'
      },
      'butter': {
        patterns: ['butter'],
        canonical: 'butter'
      },
      'bread': {
        patterns: ['bread'],
        canonical: 'bread'
      },
      'rice': {
        patterns: ['rice'],
        canonical: 'rice'
      },
      'pasta': {
        patterns: ['pasta'],
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
          SELECT id, name
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
        
        // Count total mappings for this group
        let totalMappings = 0;
        for (const canonical of matchingCanonicals) {
          const count = await db.query(`
            SELECT COUNT(*) as count
            FROM "IngredientToCanonicals" 
            WHERE "CanonicalIngredientId" = :canonicalId
          `, { 
            replacements: { canonicalId: canonical.id },
            type: db.QueryTypes.SELECT 
          });
          totalMappings += count[0].count;
        }
        
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
        totalMappingsConsolidated += totalMappings;
        
        console.log(`  ✅ Merged ${matchingCanonicals.length} canonicals into "${mainCanonical.name}"`);
        console.log(`     Total mappings: ${totalMappings}`);
        
        log.push(`Merged ${groupName}: ${matchingCanonicals.length} canonicals → "${mainCanonical.name}" (${totalMappings} mappings)`);
        
      } catch (error) {
        console.log(`  ❌ Error processing ${groupName}: ${error.message}`);
        log.push(`Error processing ${groupName}: ${error.message}`);
      }
    }
    
    // Write log to file
    const fs = require('fs');
    fs.writeFileSync('simple_merge_variants.log', log.join('\n'));
    
    console.log(`\n📊 MERGING COMPLETE:`);
    console.log(`   Groups processed: ${totalMerged}`);
    console.log(`   Total mappings consolidated: ${totalMappingsConsolidated}`);
    console.log(`   Log written to: simple_merge_variants.log`);
    
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

simpleMergeVariants(); 