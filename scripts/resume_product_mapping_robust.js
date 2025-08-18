const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const BATCH_SIZE = 500; // Smaller batch size to avoid timeouts
const MAX_PRODUCT_NAME_LENGTH = 255;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Resume from specific offset (default: 84000 based on logs)
const RESUME_FROM_OFFSET = process.env.RESUME_OFFSET ? parseInt(process.env.RESUME_OFFSET) : 84000;

// Utility function for camelCase conversion
function toCamelCase(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/[\s_-]+/g, ' ')
        .split(' ')
        .map((word, index) => {
            if (index === 0) {
                return word; // First word stays lowercase
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');
}

// Clean product name by removing descriptors
function cleanProductName(productName) {
    if (!productName) return '';
    
    let cleaned = productName.toLowerCase();
    
    // Remove common descriptors
    const DESCRIPTORS = [
        'zero sugar', 'diet', 'light', 'reduced fat', 'low fat', 'fat free',
        'all purpose', 'whole wheat', 'organic', 'natural', 'extra virgin',
        'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked', 'premium',
        'select', 'choice', 'grade a', 'grade b', 'no sugar added',
        'sugar free', 'unsweetened', 'original', 'classic', 'traditional',
        'reduced sodium', 'low sodium', 'no salt added', 'unsalted',
        'gluten free', 'dairy free', 'vegan', 'vegetarian', 'keto',
        'paleo', 'whole grain', 'multi grain', 'stone ground'
    ];
    
    DESCRIPTORS.forEach(descriptor => {
        const regex = new RegExp(`\\b${descriptor}\\b`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });
    
    // Clean up extra spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Convert to camelCase if multi-word
    if (cleaned.includes(' ')) {
        cleaned = toCamelCase(cleaned);
    }
    
    // Truncate if too long
    if (cleaned.length > MAX_PRODUCT_NAME_LENGTH) {
        cleaned = cleaned.substring(0, MAX_PRODUCT_NAME_LENGTH);
    }
    
    return cleaned;
}

// Check if database tables exist
async function checkDatabaseTables() {
    console.log('🔍 Checking database tables...');
    
    try {
        const { data: productTable, error: productError } = await supabase
            .from('ProductCanonical')
            .select('id')
            .limit(1);
        
        if (productError) {
            console.error('❌ ProductCanonical table not found or not accessible');
            console.error('Error:', productError);
            console.log('\n📋 Please run the SQL migration first:');
            console.log('1. Go to your Supabase SQL editor');
            console.log('2. Run the SQL from database/migrations/create_simple_mapping_tables.sql');
            console.log('3. Then run this script again');
            process.exit(1);
        }
        
        console.log('✅ Database tables are accessible');
        return true;
    } catch (error) {
        console.error('❌ Error checking database tables:', error);
        return false;
    }
}

// Get total product count
async function getTotalProductCount() {
    try {
        console.log('🔍 Getting total product count...');
        
        // Use max ID as approximation (more reliable than count)
        const { data: maxIdData, error: maxIdError } = await supabase
            .from('IngredientCategorized')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);
        
        if (!maxIdError && maxIdData && maxIdData.length > 0) {
            const approximateCount = maxIdData[0].id;
            console.log(`📊 Approximate total products (based on max ID): ${approximateCount}`);
            return approximateCount;
        }
        
        // Fallback to known value
        console.log('🔄 Using fallback count: 243114');
        return 243114;
        
    } catch (error) {
        console.error('❌ Error getting product count:', error);
        console.log('🔄 Using fallback count: 243114');
        return 243114;
    }
}

// Check if product already processed
async function isProductProcessed(productId) {
    try {
        const { data, error } = await supabase
            .from('ProductCanonical')
            .select('product_ids')
            .contains('product_ids', [productId]);
        
        if (error) {
            console.error('❌ Error checking if product processed:', error);
            return false;
        }
        
        return data && data.length > 0;
    } catch (error) {
        console.error('❌ Error checking if product processed:', error);
        return false;
    }
}

// Insert or update canonical mapping
async function insertOrUpdateCanonical(canonicalName, originalName, productIds) {
    try {
        // First, try to find existing record
        const { data: existing, error: selectError } = await supabase
            .from('ProductCanonical')
            .select('id, product_ids')
            .eq('canonical_product_name', canonicalName)
            .single();
        
        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error(`❌ Error checking existing mapping for "${canonicalName}":`, selectError);
            return false;
        }
        
        if (existing) {
            // Update existing record
            const updatedProductIds = [...new Set([...existing.product_ids, ...productIds])];
            
            const { error: updateError } = await supabase
                .from('ProductCanonical')
                .update({ product_ids: updatedProductIds })
                .eq('id', existing.id);
            
            if (updateError) {
                console.error(`❌ Error updating mapping for "${canonicalName}":`, updateError);
                return false;
            }
            
            console.log(`🔄 Updated existing mapping for "${canonicalName}" (${updatedProductIds.length} products)`);
            return true;
        } else {
            // Insert new record
            const { error: insertError } = await supabase
                .from('ProductCanonical')
                .insert({
                    original_product_name: originalName,
                    canonical_product_name: canonicalName,
                    product_ids: productIds
                });
            
            if (insertError) {
                console.error(`❌ Error inserting mapping for "${canonicalName}":`, insertError);
                return false;
            }
            
            console.log(`✅ Created new mapping for "${originalName}" → "${canonicalName}" (${productIds.length} products)`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Error processing mapping for "${canonicalName}":`, error);
        return false;
    }
}

// Fetch products with retry logic
async function fetchProductsWithRetry(offset, retries = 0) {
    try {
        console.log(`📦 Fetching products starting at offset ${offset}...`);
        
        const { data: products, error } = await supabase
            .from('IngredientCategorized')
            .select('id, description')
            .range(offset, offset + BATCH_SIZE - 1)
            .order('id');
        
        if (error) {
            if (error.code === '57014' && retries < MAX_RETRIES) {
                console.log(`⏳ Timeout error, retrying in ${RETRY_DELAY/1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return await fetchProductsWithRetry(offset, retries + 1);
            }
            console.error('❌ Error fetching products:', error);
            return null;
        }
        
        return products;
    } catch (error) {
        if (retries < MAX_RETRIES) {
            console.log(`⏳ Network error, retrying in ${RETRY_DELAY/1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return await fetchProductsWithRetry(offset, retries + 1);
        }
        console.error('❌ Error fetching products after retries:', error);
        return null;
    }
}

// Process products in batches
async function processProductBatch(offset) {
    try {
        const products = await fetchProductsWithRetry(offset);
        
        if (!products) {
            console.log('❌ Failed to fetch products after retries');
            return false;
        }
        
        if (products.length === 0) {
            console.log('📭 No more products to process');
            return false;
        }
        
        console.log(`📊 Processing ${products.length} products...`);
        
        // Group products by canonical name
        const canonicalGroups = {};
        
        for (const product of products) {
            // Skip if already processed
            if (await isProductProcessed(product.id)) {
                console.log(`⏭️ Skipping already processed product ${product.id}`);
                continue;
            }
            
            const canonicalName = cleanProductName(product.description);
            
            if (!canonicalName) {
                console.log(`⚠️ Skipping product with empty canonical name: ${product.description}`);
                continue;
            }
            
            if (!canonicalGroups[canonicalName]) {
                canonicalGroups[canonicalName] = {
                    original_product_name: product.description,
                    canonical_product_name: canonicalName,
                    product_ids: []
                };
            }
            
            canonicalGroups[canonicalName].product_ids.push(product.id);
        }
        
        // Insert or update canonical mappings
        let successCount = 0;
        let errorCount = 0;
        
        for (const [canonicalName, mapping] of Object.entries(canonicalGroups)) {
            const success = await insertOrUpdateCanonical(
                mapping.canonical_product_name,
                mapping.original_product_name,
                mapping.product_ids
            );
            
            if (success) {
                successCount++;
            } else {
                errorCount++;
            }
        }
        
        console.log(`✅ Batch complete: ${successCount} successful, ${errorCount} errors`);
        return true;
        
    } catch (error) {
        console.error('❌ Error processing batch:', error);
        return false;
    }
}

// Save checkpoint
async function saveCheckpoint(offset, processedCount, totalCount) {
    try {
        const checkpoint = {
            lastProcessedOffset: offset,
            timestamp: new Date().toISOString(),
            processedCount: processedCount,
            totalCount: totalCount
        };
        
        const fs = require('fs');
        fs.writeFileSync('scripts/logs/resume_checkpoint_robust.json', JSON.stringify(checkpoint, null, 2));
        console.log(`💾 Checkpoint saved: offset ${offset}, processed ${processedCount}/${totalCount}`);
    } catch (error) {
        console.error('❌ Error saving checkpoint:', error);
    }
}

// Main processing function
async function resumeProductMapping() {
    console.log('🚀 Resuming Product Canonical Mapping (Robust Version)...');
    console.log(`📋 Starting from offset: ${RESUME_FROM_OFFSET}`);
    console.log(`📋 Processing in batches of ${BATCH_SIZE}`);
    console.log(`📋 Max retries: ${MAX_RETRIES}, Retry delay: ${RETRY_DELAY}ms`);
    
    // Check database tables first
    const tablesOk = await checkDatabaseTables();
    if (!tablesOk) {
        return;
    }
    
    // Get total count
    const totalCount = await getTotalProductCount();
    console.log(`📊 Total products to process: ${totalCount}`);
    
    if (totalCount === 0) {
        console.log('❌ No products found to process');
        return;
    }
    
    const startTime = Date.now();
    let processedCount = RESUME_FROM_OFFSET;
    let batchCount = Math.floor(RESUME_FROM_OFFSET / BATCH_SIZE) + 1;
    
    console.log(`🔄 Resuming from batch ${batchCount}/${Math.ceil(totalCount / BATCH_SIZE)}`);
    
    // Process in batches starting from resume offset
    for (let offset = RESUME_FROM_OFFSET; offset < totalCount; offset += BATCH_SIZE) {
        batchCount++;
        console.log(`\n🔄 Processing batch ${batchCount}/${Math.ceil(totalCount / BATCH_SIZE)}`);
        
        const success = await processProductBatch(offset);
        
        if (!success) {
            console.log('❌ Batch failed, saving checkpoint and stopping');
            await saveCheckpoint(offset, processedCount, totalCount);
            break;
        }
        
        processedCount += BATCH_SIZE;
        
        // Save checkpoint every 5 batches
        if (batchCount % 5 === 0) {
            await saveCheckpoint(offset + BATCH_SIZE, processedCount, totalCount);
        }
        
        // Progress tracking
        const elapsed = Date.now() - startTime;
        const rate = processedCount / (elapsed / 1000);
        const remaining = (totalCount - processedCount) / rate;
        const eta = new Date(Date.now() + remaining * 1000);
        
        console.log(`📊 Progress: ${processedCount}/${totalCount} (${((processedCount/totalCount)*100).toFixed(2)}%)`);
        console.log(`⏱️ Rate: ${rate.toFixed(1)} records/sec`);
        console.log(`🕐 ETA: ${eta.toLocaleString()}`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const totalElapsed = Date.now() - startTime;
    console.log(`\n🎉 Processing complete!`);
    console.log(`⏱️ Total time: ${Math.floor(totalElapsed/1000)}s`);
    console.log(`📊 Processed: ${processedCount} products`);
    console.log(`📈 Average rate: ${(processedCount/(totalElapsed/1000)).toFixed(1)} records/sec`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutdown signal received. Finishing current batch...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutdown signal received. Finishing current batch...');
    process.exit(0);
});

// Run the mapping
resumeProductMapping().catch(console.error); 