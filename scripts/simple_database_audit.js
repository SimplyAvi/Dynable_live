const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// List of tables we know about from our work
const KNOWN_TABLES = [
    'ProductCanonical',
    'IngredientCanonical', 
    'IngredientCategorized',
    'Recipes',
    'RecipeIngredients',
    'Ingredients'
];

// Test each table and get its details
async function auditKnownTables() {
    console.log('🔍 Auditing Known Tables...\n');
    
    const tableAudits = [];
    
    for (const tableName of KNOWN_TABLES) {
        console.log(`📁 Testing: ${tableName}`);
        
        try {
            // Test if table exists and get count
            const { count, error: countError } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            
            if (countError) {
                console.log(`   ❌ Table does not exist or error: ${countError.message}`);
                continue;
            }
            
            // Get sample data to understand structure
            const { data: sampleData, error: sampleError } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (sampleError) {
                console.log(`   ❌ Error getting sample data: ${sampleError.message}`);
                continue;
            }
            
            const columns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
            
            console.log(`   ✅ Exists: YES`);
            console.log(`   📊 Row Count: ${count || 0}`);
            console.log(`   📋 Columns: ${columns.join(', ')}`);
            
            // Classify purpose
            const purpose = classifyTablePurpose(tableName, columns);
            console.log(`   🎯 Purpose: ${purpose}`);
            console.log('');
            
            tableAudits.push({
                name: tableName,
                rowCount: count || 0,
                columns: columns,
                purpose: purpose,
                exists: true
            });
            
        } catch (error) {
            console.log(`   ❌ Error testing table: ${error.message}`);
            console.log('');
        }
    }
    
    return tableAudits;
}

// Classify table purpose
function classifyTablePurpose(tableName, columns) {
    const name = tableName.toLowerCase();
    
    if (name.includes('product') && name.includes('canonical')) {
        return 'PRODUCT CANONICAL MAPPING (Phase 1)';
    }
    
    if (name.includes('ingredient') && name.includes('canonical')) {
        return 'INGREDIENT CANONICAL MAPPING (Phase 2)';
    }
    
    if (name.includes('ingredient') && name.includes('categor')) {
        return 'INGREDIENT CATEGORIZATION (Original)';
    }
    
    if (name.includes('recipe')) {
        return 'RECIPE DATA';
    }
    
    if (name.includes('ingredient') && !name.includes('canonical') && !name.includes('categor')) {
        return 'INGREDIENT DATA (Original)';
    }
    
    return 'UNKNOWN PURPOSE';
}

// Analyze table relationships
function analyzeTableRelationships(tables) {
    console.log('🔗 Analyzing Table Relationships...\n');
    
    const relationships = {
        core: [],
        experimental: [],
        unused: [],
        overlapping: []
    };
    
    for (const table of tables) {
        const purpose = table.purpose.toLowerCase();
        
        if (purpose.includes('canonical') || purpose.includes('recipe')) {
            relationships.core.push(table);
        } else if (purpose.includes('categor')) {
            relationships.overlapping.push(table);
        } else if (table.rowCount === 0) {
            relationships.unused.push(table);
        } else {
            relationships.core.push(table); // Assume core if not categorized
        }
    }
    
    console.log('📊 Table Classification:');
    console.log(`   ✅ Core Tables: ${relationships.core.length}`);
    console.log(`   🧪 Experimental: ${relationships.experimental.length}`);
    console.log(`   ❌ Unused: ${relationships.unused.length}`);
    console.log(`   ⚠️ Overlapping: ${relationships.overlapping.length}`);
    console.log('');
    
    return relationships;
}

// Show detailed analysis
function showDetailedAnalysis(tables) {
    console.log('📋 DETAILED TABLE ANALYSIS:\n');
    
    const categories = {
        'Core Mapping Tables': [],
        'Original Data Tables': [],
        'Overlapping Tables': [],
        'Unused Tables': []
    };
    
    for (const table of tables) {
        const purpose = table.purpose.toLowerCase();
        
        if (purpose.includes('canonical')) {
            categories['Core Mapping Tables'].push(table);
        } else if (purpose.includes('categor')) {
            categories['Overlapping Tables'].push(table);
        } else if (table.rowCount === 0) {
            categories['Unused Tables'].push(table);
        } else {
            categories['Original Data Tables'].push(table);
        }
    }
    
    Object.entries(categories).forEach(([category, tableList]) => {
        if (tableList.length > 0) {
            console.log(`📁 ${category}:`);
            tableList.forEach(table => {
                console.log(`   • ${table.name} (${table.rowCount} rows) - ${table.purpose}`);
            });
            console.log('');
        }
    });
}

// Recommend cleanup plan
function recommendCleanupPlan(tables, relationships) {
    console.log('🧹 RECOMMENDED CLEANUP PLAN:\n');
    
    console.log('✅ KEEP (Core Tables):');
    relationships.core.forEach(table => {
        console.log(`   • ${table.name} - ${table.purpose}`);
    });
    console.log('');
    
    console.log('⚠️ CONSOLIDATE (Overlapping):');
    relationships.overlapping.forEach(table => {
        console.log(`   • ${table.name} - ${table.purpose}`);
    });
    console.log('');
    
    console.log('❌ REMOVE (Unused):');
    relationships.unused.forEach(table => {
        console.log(`   • ${table.name} - ${table.purpose}`);
    });
    console.log('');
    
    console.log('📋 CLEANUP ACTIONS:');
    console.log('   1. ✅ Keep ProductCanonical and IngredientCanonical');
    console.log('   2. 🔄 Consolidate IngredientCategorized into IngredientCanonical');
    console.log('   3. 🗑️ Remove unused tables');
    console.log('   4. 🆕 Implement separation on clean foundation');
}

// Test system safety
async function testSystemSafety() {
    console.log('🛡️ Testing System Safety...\n');
    
    try {
        // Test core tables
        const { data: productCount, error: productError } = await supabase
            .from('ProductCanonical')
            .select('*', { count: 'exact', head: true });
        
        const { data: ingredientCount, error: ingredientError } = await supabase
            .from('IngredientCanonical')
            .select('*', { count: 'exact', head: true });
        
        console.log('📊 Current System Status:');
        console.log(`   ✅ ProductCanonical: ${productCount || 0} records`);
        console.log(`   ✅ IngredientCanonical: ${ingredientCount || 0} records`);
        console.log(`   ❌ Product Errors: ${productError ? 'YES' : 'NO'}`);
        console.log(`   ❌ Ingredient Errors: ${ingredientError ? 'YES' : 'NO'}`);
        console.log('');
        
        // Test sample queries
        const { data: productSample, error: productQueryError } = await supabase
            .from('ProductCanonical')
            .select('canonical_product_name')
            .limit(1);
        
        const { data: ingredientSample, error: ingredientQueryError } = await supabase
            .from('IngredientCanonical')
            .select('canonical_ingredient')
            .limit(1);
        
        console.log('🧪 Sample Query Tests:');
        console.log(`   ✅ Product Query: ${!productQueryError}`);
        console.log(`   ✅ Ingredient Query: ${!ingredientQueryError}`);
        console.log(`   📊 Product Sample: ${productSample ? 'Available' : 'None'}`);
        console.log(`   📊 Ingredient Sample: ${ingredientSample ? 'Available' : 'None'}`);
        console.log('');
        
        return !productError && !ingredientError && !productQueryError && !ingredientQueryError;
        
    } catch (error) {
        console.error('❌ System safety test failed:', error);
        return false;
    }
}

// Main audit function
async function runSimpleDatabaseAudit() {
    console.log('🚀 Starting Simple Database Audit...\n');
    
    // Audit known tables
    const tables = await auditKnownTables();
    
    if (tables.length === 0) {
        console.log('❌ No tables found or audit failed');
        return;
    }
    
    // Analyze relationships
    const relationships = await analyzeTableRelationships(tables);
    
    // Show detailed analysis
    showDetailedAnalysis(tables);
    
    // Test system safety
    const isSystemSafe = await testSystemSafety();
    
    // Recommend cleanup
    recommendCleanupPlan(tables, relationships);
    
    console.log('🎉 Database Audit Complete!');
    console.log('\n📋 Key Findings:');
    console.log(`   📊 Total Tables Found: ${tables.length}`);
    console.log(`   ✅ Core Tables: ${relationships.core.length}`);
    console.log(`   🧪 Experimental: ${relationships.experimental.length}`);
    console.log(`   ❌ Unused: ${relationships.unused.length}`);
    console.log(`   ⚠️ Overlapping: ${relationships.overlapping.length}`);
    console.log(`   🛡️ System Safe: ${isSystemSafe ? 'YES' : 'NO'}`);
    
    return {
        tables,
        relationships,
        isSystemSafe
    };
}

runSimpleDatabaseAudit().catch(console.error); 