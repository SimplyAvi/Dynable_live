const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Audit all tables in the database
async function auditAllTables() {
    console.log('🔍 Starting Comprehensive Database Audit...\n');
    
    try {
        // Get all tables from information_schema
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_type')
            .eq('table_schema', 'public')
            .order('table_name');
        
        if (error) {
            console.error('❌ Error fetching tables:', error);
            return;
        }
        
        console.log('📊 ALL TABLES IN DATABASE:\n');
        
        const tableAudits = [];
        
        for (const table of tables) {
            console.log(`📁 ${table.table_name} (${table.table_type})`);
            
            // Get table details
            const { data: columns, error: columnError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable')
                .eq('table_schema', 'public')
                .eq('table_name', table.table_name)
                .order('ordinal_position');
            
            if (!columnError && columns) {
                console.log(`   📋 Columns: ${columns.map(c => c.column_name).join(', ')}`);
            }
            
            // Get row count
            try {
                const { count, error: countError } = await supabase
                    .from(table.table_name)
                    .select('*', { count: 'exact', head: true });
                
                if (!countError) {
                    console.log(`   📊 Row Count: ${count || 0}`);
                }
            } catch (e) {
                console.log(`   📊 Row Count: Unable to determine`);
            }
            
            // Classify table purpose
            const purpose = classifyTablePurpose(table.table_name, columns);
            console.log(`   🎯 Purpose: ${purpose}`);
            console.log('');
            
            tableAudits.push({
                name: table.table_name,
                type: table.table_type,
                columns: columns || [],
                rowCount: count || 0,
                purpose: purpose
            });
        }
        
        return tableAudits;
        
    } catch (error) {
        console.error('❌ Error in table audit:', error);
        return [];
    }
}

// Classify table purpose based on name and structure
function classifyTablePurpose(tableName, columns) {
    const name = tableName.toLowerCase();
    const columnNames = columns.map(c => c.column_name.toLowerCase());
    
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
    
    if (name.includes('user') || name.includes('auth')) {
        return 'USER/AUTHENTICATION';
    }
    
    if (name.includes('log') || name.includes('checkpoint')) {
        return 'LOGGING/CHECKPOINTING';
    }
    
    if (name.includes('test') || name.includes('temp')) {
        return 'TESTING/TEMPORARY';
    }
    
    return 'UNKNOWN PURPOSE';
}

// Analyze table relationships and dependencies
async function analyzeTableRelationships(tables) {
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
        } else if (purpose.includes('test') || purpose.includes('temp') || purpose.includes('log')) {
            relationships.experimental.push(table);
        } else if (table.rowCount === 0) {
            relationships.unused.push(table);
        } else if (purpose.includes('ingredient') && table.name.includes('ingredient')) {
            relationships.overlapping.push(table);
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

// Show detailed analysis of each table
function showDetailedAnalysis(tables) {
    console.log('📋 DETAILED TABLE ANALYSIS:\n');
    
    const categories = {
        'Core Mapping Tables': [],
        'Experimental Tables': [],
        'Unused Tables': [],
        'Overlapping Tables': []
    };
    
    for (const table of tables) {
        const purpose = table.purpose.toLowerCase();
        
        if (purpose.includes('canonical')) {
            categories['Core Mapping Tables'].push(table);
        } else if (purpose.includes('test') || purpose.includes('temp') || purpose.includes('log')) {
            categories['Experimental Tables'].push(table);
        } else if (table.rowCount === 0) {
            categories['Unused Tables'].push(table);
        } else if (purpose.includes('ingredient') && table.name.includes('ingredient')) {
            categories['Overlapping Tables'].push(table);
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
    
    console.log('🗑️ REMOVE (Experimental/Unused):');
    [...relationships.experimental, ...relationships.unused].forEach(table => {
        console.log(`   • ${table.name} - ${table.purpose}`);
    });
    console.log('');
    
    console.log('⚠️ CONSOLIDATE (Overlapping):');
    relationships.overlapping.forEach(table => {
        console.log(`   • ${table.name} - ${table.purpose}`);
    });
    console.log('');
    
    console.log('📋 CLEANUP ACTIONS:');
    console.log('   1. 🗑️ Drop experimental/temporary tables');
    console.log('   2. 🔄 Consolidate overlapping ingredient tables');
    console.log('   3. ✅ Keep core canonical mapping tables');
    console.log('   4. 🆕 Implement separation on clean foundation');
}

// Test current system safety
async function testSystemSafety() {
    console.log('🛡️ Testing System Safety...\n');
    
    try {
        // Test if core tables are working
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
        
        // Test a sample query
        const { data: sampleQuery, error: queryError } = await supabase
            .from('IngredientCanonical')
            .select('canonical_ingredient, matching_products')
            .limit(1);
        
        console.log('🧪 Sample Query Test:');
        console.log(`   ✅ Query Success: ${!queryError}`);
        console.log(`   📊 Sample Data: ${sampleQuery ? 'Available' : 'None'}`);
        console.log('');
        
        return !productError && !ingredientError && !queryError;
        
    } catch (error) {
        console.error('❌ System safety test failed:', error);
        return false;
    }
}

// Main audit function
async function runDatabaseAudit() {
    console.log('🚀 Starting Comprehensive Database Audit...\n');
    
    // Audit all tables
    const tables = await auditAllTables();
    
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
    console.log(`   📊 Total Tables: ${tables.length}`);
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

runDatabaseAudit().catch(console.error); 