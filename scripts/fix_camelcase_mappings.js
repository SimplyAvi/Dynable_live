const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Improved camelCase conversion
function toCamelCase(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
        .toLowerCase()
        .trim()
        // Remove special characters that shouldn't be in camelCase
        .replace(/[&,;:'"`~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, ' ')
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

// Improved product name cleaning
function cleanProductName(productName) {
    if (!productName) return '';
    
    let cleaned = productName.toLowerCase();
    
    // Remove common descriptors more aggressively
    const DESCRIPTORS = [
        'zero sugar', 'diet', 'light', 'reduced fat', 'low fat', 'fat free',
        'all purpose', 'whole wheat', 'organic', 'natural', 'extra virgin',
        'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked', 'premium',
        'select', 'choice', 'grade a', 'grade b', 'no sugar added',
        'sugar free', 'unsweetened', 'original', 'classic', 'traditional',
        'reduced sodium', 'low sodium', 'no salt added', 'unsalted',
        'gluten free', 'dairy free', 'vegan', 'vegetarian', 'keto',
        'paleo', 'whole grain', 'multi grain', 'stone ground',
        // Remove brand names and specific product identifiers
        'major melon', 'ginger master', 'black cherry', 'mystery',
        'gingerbread snap', 'pitch black', 'sweet baby ray',
        'kickin bourbon', 'southwest ranch', 'honey barbecue',
        'sweet n spicy', 'sweet n sour', 'honey mustard',
        'sweet baby ray\'s', 'sweet baby rays'
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
    
    // If result is empty or too short, use original
    if (!cleaned || cleaned.length < 2) {
        cleaned = toCamelCase(productName.toLowerCase());
    }
    
    return cleaned;
}

// Check if a string is valid camelCase
function isValidCamelCase(str) {
    return /^[a-z][a-zA-Z0-9]*$/.test(str);
}

// Fix existing mappings
async function fixCamelCaseMappings() {
    console.log('🔧 Fixing CamelCase Mappings...\n');
    
    try {
        // Get all existing mappings
        const { data: mappings, error } = await supabase
            .from('ProductCanonical')
            .select('id, original_product_name, canonical_product_name');
        
        if (error) {
            console.error('❌ Error fetching mappings:', error);
            return;
        }
        
        console.log(`📊 Found ${mappings.length} mappings to check`);
        
        let fixedCount = 0;
        let validCount = 0;
        let examples = [];
        
        for (const mapping of mappings) {
            const originalName = mapping.original_product_name;
            const currentCanonical = mapping.canonical_product_name;
            
            // Check if current is valid camelCase
            if (isValidCamelCase(currentCanonical)) {
                validCount++;
                continue;
            }
            
            // Generate new canonical name
            const newCanonical = cleanProductName(originalName);
            
            // Check if new name is valid
            if (isValidCamelCase(newCanonical) && newCanonical !== currentCanonical) {
                try {
                    // Update the mapping
                    const { error: updateError } = await supabase
                        .from('ProductCanonical')
                        .update({ canonical_product_name: newCanonical })
                        .eq('id', mapping.id);
                    
                    if (updateError) {
                        console.error(`❌ Error updating "${currentCanonical}":`, updateError);
                    } else {
                        fixedCount++;
                        examples.push({
                            original: originalName,
                            old: currentCanonical,
                            new: newCanonical
                        });
                        
                        if (examples.length <= 10) {
                            console.log(`✅ Fixed: "${currentCanonical}" → "${newCanonical}"`);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error updating mapping:`, error);
                }
            }
        }
        
        console.log(`\n📊 Fix Summary:`);
        console.log(`✅ Valid mappings: ${validCount}`);
        console.log(`🔧 Fixed mappings: ${fixedCount}`);
        console.log(`📋 Total processed: ${mappings.length}`);
        
        if (examples.length > 0) {
            console.log(`\n📋 Sample Fixes:`);
            examples.slice(0, 5).forEach(example => {
                console.log(`  • "${example.old}" → "${example.new}"`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error in fix process:', error);
    }
}

// Test the fix on a sample
async function testFix() {
    console.log('🧪 Testing Fix on Sample Data...\n');
    
    const testCases = [
        'flavorGrapeseedOil,',
        'majorMelonSodaChargedWithWatermelon,MajorMelon',
        'gingerMasterBrewKombucha,Ginger',
        'sweet&SpicyChipsMadeWithCrushedRedPepper,Sweet&Spicy',
        'sweet\'nSpicyBarbecueSauce,Sweet\'nSpicy',
        '1%LowfatMilk,Strawberry'
    ];
    
    testCases.forEach(testCase => {
        const fixed = cleanProductName(testCase);
        const isValid = isValidCamelCase(fixed);
        console.log(`"${testCase}" → "${fixed}" (${isValid ? '✅' : '❌'})`);
    });
}

// Run the fix
async function main() {
    console.log('🚀 Starting CamelCase Fix Process...\n');
    
    // First test the fix
    await testFix();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Then fix the actual mappings
    await fixCamelCaseMappings();
    
    console.log('\n🎉 CamelCase Fix Complete!');
}

main().catch(console.error); 