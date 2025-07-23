const db = require('./db/database');

async function smartMergeLegitimateVariants() {
  console.log('🔗 SMART MERGING LEGITIMATE INGREDIENT VARIANTS (FIXED)\n');
  
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
          SELECT id, name, aliases
          FROM "CanonicalRecipeIngredients" 
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
          
          // Add existing aliases (handle malformed JSON safely)
          if (canonical.aliases) {
            try {
              let aliases;
              if (typeof canonical.aliases === 'string') {
                // Try to parse as JSON, if it fails, treat as comma-separated
                try {
                  aliases = JSON.parse(canonical.aliases);
                } catch (e) {
                  // If JSON parsing fails, split by comma
                  aliases = canonical.aliases.split(',').map(a => a.trim()).filter(a => a);
                }
              } else {
                aliases = canonical.aliases;
              }
              
              if (Array.isArray(aliases)) {
                aliases.forEach(alias => {
                  if (alias && typeof alias === 'string') {
                    allAliases.add(alias.trim());
                  }
                });
              }
            } catch (e) {
              console.log(`    ⚠️  Skipping malformed aliases for "${canonical.name}": ${e.message}`);
            }
          }
          
          // Get all mappings for this canonical
          const mappings = await db.query(`
            SELECT "messyName" FROM "IngredientToCanonicals" 
            WHERE "IngredientId" = :canonicalId
          `, { 
            replacements: { canonicalId: canonical.id },
            type: db.QueryTypes.SELECT 
          });
          
          mappings.forEach(mapping => allMappings.push(mapping.messyName));
        }
        
        // Update main canonical with all aliases
        const updatedAliases = Array.from(allAliases).filter(alias => alias && alias.length > 0);
        await db.query(`
          UPDATE "CanonicalRecipeIngredients" 
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
              SET "IngredientId" = :mainCanonicalId 
              WHERE "IngredientId" = :canonicalId
            `, { 
              replacements: { 
                mainCanonicalId: mainCanonical.id,
                canonicalId: canonical.id 
              },
              type: db.QueryTypes.UPDATE 
            });
            
            // Remove duplicate canonical
            await db.query(`
              DELETE FROM "CanonicalRecipeIngredients" 
              WHERE id = :canonicalId
            `, { 
              replacements: { canonicalId: canonical.id },
              type: db.QueryTypes.DELETE 
            });
          }
        }
        
        // Remove duplicate mappings (same messyName, same IngredientId)
        await db.query(`
          DELETE FROM "IngredientToCanonicals" a
          USING "IngredientToCanonicals" b
          WHERE a.id < b.id
            AND a."messyName" = b."messyName"
            AND a."IngredientId" = b."IngredientId"
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
    fs.writeFileSync('smart_merge_legitimate_variants_fixed.log', log.join('\n'));
    
    console.log(`\n📊 MERGING COMPLETE:`);
    console.log(`   Groups processed: ${totalMerged}`);
    console.log(`   Total mappings consolidated: ${totalMappingsConsolidated}`);
    console.log(`   Log written to: smart_merge_legitimate_variants_fixed.log`);
    
    // Verify results
    console.log(`\n🔍 VERIFICATION:`);
    const remainingDuplicates = await db.query(`
      SELECT 
        ci.name as "canonicalName",
        COUNT(itc.id) as "mappingCount"
      FROM "CanonicalRecipeIngredients" ci
      JOIN "IngredientToCanonicals" itc ON ci.id = itc."IngredientId"
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