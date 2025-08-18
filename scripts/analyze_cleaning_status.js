const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Check camelCase compliance
function isCamelCase(str) {
    if (!str || typeof str !== 'string') return false;
    
    // Check for common non-camelCase patterns
    const nonCamelPatterns = [
        /[A-Z]{2,}/, // Multiple uppercase letters (like "USA")
        /^[A-Z]/, // Starts with uppercase
        /[^a-zA-Z0-9]/, // Special characters
        /\s/, // Spaces
        /[&,;:'"`~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/ // Special punctuation
    ];
    
    for (const pattern of nonCamelPatterns) {
        if (pattern.test(str)) {
            return false;
        }
    }
    
    return true;
}

// Analyze product canonical names
async function analyzeProductCanonicals() {
    console.log('🔍 Analyzing ProductCanonical table...\n');
    
    try {
        const { data: products, error } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .limit(20);
        
        if (error) {
            console.error('❌ Error fetching products:', error);
            return;
        }
        
        console.log(`📊 Sample Product Canonical Names:`);
        let camelCaseCount = 0;
        let nonCamelCaseCount = 0;
        
        for (const product of products) {
            const isCamel = isCamelCase(product.canonical_product_name);
            const status = isCamel ? '✅' : '❌';
            
            console.log(`${status} "${product.canonical_product_name}"`);
            
            if (isCamel) {
                camelCaseCount++;
            } else {
                nonCamelCaseCount++;
            }
        }
        
        console.log(`\n📈 Product Canonical Summary:`);
        console.log(`   ✅ CamelCase: ${camelCaseCount}`);
        console.log(`   ❌ Non-camelCase: ${nonCamelCaseCount}`);
        console.log(`   📊 Total: ${camelCaseCount + nonCamelCaseCount}`);
        
    } catch (error) {
        console.error('❌ Error analyzing products:', error);
    }
}

// Analyze ingredient canonical names
async function analyzeIngredientCanonicals() {
    console.log('\n🔍 Analyzing IngredientCanonical table...\n');
    
    try {
        const { data: ingredients, error } = await supabase
            .from('IngredientCanonical')
            .select('canonical_ingredient')
            .limit(20);
        
        if (error) {
            console.error('❌ Error fetching ingredients:', error);
            return;
        }
        
        console.log(`📊 Sample Ingredient Canonical Names:`);
        let camelCaseCount = 0;
        let nonCamelCaseCount = 0;
        
        for (const ingredient of ingredients) {
            const isCamel = isCamelCase(ingredient.canonical_ingredient);
            const status = isCamel ? '✅' : '❌';
            
            console.log(`${status} "${ingredient.canonical_ingredient}"`);
            
            if (isCamel) {
                camelCaseCount++;
            } else {
                nonCamelCaseCount++;
            }
        }
        
        console.log(`\n📈 Ingredient Canonical Summary:`);
        console.log(`   ✅ CamelCase: ${camelCaseCount}`);
        console.log(`   ❌ Non-camelCase: ${nonCamelCaseCount}`);
        console.log(`   📊 Total: ${camelCaseCount + nonCamelCaseCount}`);
        
    } catch (error) {
        console.error('❌ Error analyzing ingredients:', error);
    }
}

// Check for common cleaning issues
async function checkCommonCleaningIssues() {
    console.log('\n🔍 Checking for Common Cleaning Issues...\n');
    
    try {
        // Check products for common issues
        const { data: products, error: productError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .limit(50);
        
        if (!productError && products) {
            console.log('📋 Common Product Issues:');
            const issues = {
                commas: 0,
                specialChars: 0,
                spaces: 0,
                uppercase: 0,
                empty: 0
            };
            
            for (const product of products) {
                const name = product.canonical_product_name;
                if (name.includes(',')) issues.commas++;
                if (/[&,;:'"`~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(name)) issues.specialChars++;
                if (name.includes(' ')) issues.spaces++;
                if (/^[A-Z]/.test(name)) issues.uppercase++;
                if (!name || name.trim() === '') issues.empty++;
            }
            
            console.log(`   ❌ Commas: ${issues.commas}`);
            console.log(`   ❌ Special characters: ${issues.specialChars}`);
            console.log(`   ❌ Spaces: ${issues.spaces}`);
            console.log(`   ❌ Starts with uppercase: ${issues.uppercase}`);
            console.log(`   ❌ Empty names: ${issues.empty}`);
        }
        
        // Check ingredients for common issues
        const { data: ingredients, error: ingredientError } = await supabase
            .from('IngredientCanonical')
            .select('canonical_ingredient')
            .limit(50);
        
        if (!ingredientError && ingredients) {
            console.log('\n📋 Common Ingredient Issues:');
            const issues = {
                commas: 0,
                specialChars: 0,
                spaces: 0,
                uppercase: 0,
                empty: 0
            };
            
            for (const ingredient of ingredients) {
                const name = ingredient.canonical_ingredient;
                if (name.includes(',')) issues.commas++;
                if (/[&,;:'"`~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(name)) issues.specialChars++;
                if (name.includes(' ')) issues.spaces++;
                if (/^[A-Z]/.test(name)) issues.uppercase++;
                if (!name || name.trim() === '') issues.empty++;
            }
            
            console.log(`   ❌ Commas: ${issues.commas}`);
            console.log(`   ❌ Special characters: ${issues.specialChars}`);
            console.log(`   ❌ Spaces: ${issues.spaces}`);
            console.log(`   ❌ Starts with uppercase: ${issues.uppercase}`);
            console.log(`   ❌ Empty names: ${issues.empty}`);
        }
        
    } catch (error) {
        console.error('❌ Error checking cleaning issues:', error);
    }
}

// Check mapping quality
async function checkMappingQuality() {
    console.log('\n🔍 Checking Mapping Quality...\n');
    
    try {
        const { data: mappings, error } = await supabase
            .from('IngredientCanonical')
            .select('canonical_ingredient, matching_products')
            .limit(20);
        
        if (error) {
            console.error('❌ Error fetching mappings:', error);
            return;
        }
        
        console.log('📊 Mapping Quality Analysis:');
        
        for (const mapping of mappings) {
            const { canonical_ingredient, matching_products } = mapping;
            const productCount = matching_products ? matching_products.length : 0;
            
            console.log(`   "${canonical_ingredient}": ${productCount} products`);
            
            if (productCount === 0) {
                console.log(`      ⚠️ No products mapped`);
            } else if (productCount > 100) {
                console.log(`      ⚠️ Too many products (${productCount})`);
            } else if (productCount < 5) {
                console.log(`      ✅ Good mapping (${productCount} products)`);
            } else {
                console.log(`      ⚠️ Moderate mapping (${productCount} products)`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking mapping quality:', error);
    }
}

// Main analysis function
async function analyzeCleaningStatus() {
    console.log('🚀 Starting Cleaning Status Analysis...\n');
    
    await analyzeProductCanonicals();
    await analyzeIngredientCanonicals();
    await checkCommonCleaningIssues();
    await checkMappingQuality();
    
    console.log('\n📋 Summary & Recommendations:');
    console.log('1. ✅ We have ingredient-to-product mappings');
    console.log('2. ❓ Need to verify camelCase compliance');
    console.log('3. ❓ Need to check for remaining cleaning issues');
    console.log('4. ❓ Need to ensure consistent naming across both tables');
    console.log('5. ❓ Need to validate mapping quality');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Fix any non-camelCase names');
    console.log('2. Remove remaining special characters');
    console.log('3. Ensure consistent cleaning between products and ingredients');
    console.log('4. Optimize mapping quality');
    console.log('5. Test ingredient-to-product linking');
}

analyzeCleaningStatus().catch(console.error); 