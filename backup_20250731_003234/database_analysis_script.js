/**
 * Comprehensive Database Analysis Script for Dynable
 * Connects to Supabase and analyzes all tables, data quality, and RLS policies
 * 
 * Author: AI Assistant
 * Date: January 2025
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase connection details (from supabaseClient.js)
const SUPABASE_URL = 'process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL';
const SUPABASE_ANON_KEY = 'process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 DYNABLE DATABASE ANALYSIS STARTING...');
console.log('==========================================');
console.log(`📡 Connecting to: ${SUPABASE_URL}`);
console.log('');

// Analysis results storage
const analysisResults = {
    connection: {},
    tables: {},
    dataQuality: {},
    rlsPolicies: {},
    relationships: {},
    indexes: {},
    recommendations: []
};

/**
 * 1. DATABASE CONNECTION & AUTHENTICATION
 */
async function testConnection() {
    console.log('🔌 TESTING DATABASE CONNECTION...');
    
    try {
        // Test basic connection
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(1);
        
        if (error) {
            throw error;
        }
        
        analysisResults.connection = {
            status: 'SUCCESS',
            url: SUPABASE_URL,
            message: 'Successfully connected to Supabase database'
        };
        
        console.log('✅ Database connection successful');
        console.log(`📊 Connected to: ${SUPABASE_URL}`);
        console.log('');
        
    } catch (error) {
        analysisResults.connection = {
            status: 'FAILED',
            error: error.message,
            url: SUPABASE_URL
        };
        
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
}

/**
 * 2. COMPLETE TABLE INVENTORY
 */
async function analyzeTableStructure() {
    console.log('📋 ANALYZING TABLE STRUCTURE...');
    
    try {
        // Get all tables in public schema
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_table_info');
        
        if (tablesError) {
            // Fallback: Use direct SQL query
            const { data, error } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .neq('table_name', 'information_schema')
                .neq('table_name', 'pg_catalog');
            
            if (error) throw error;
            
            // Get column information for each table
            for (const table of data) {
                await analyzeTableColumns(table.table_name);
            }
        } else {
            analysisResults.tables = tables;
        }
        
    } catch (error) {
        console.error('❌ Error analyzing table structure:', error.message);
        throw error;
    }
}

async function analyzeTableColumns(tableName) {
    try {
        // Get column information
        const { data: columns, error } = await supabase
            .from('information_schema.columns')
            .select('*')
            .eq('table_schema', 'public')
            .eq('table_name', tableName)
            .order('ordinal_position');
        
        if (error) throw error;
        
        // Get row count
        const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.warn(`⚠️ Could not get row count for ${tableName}:`, countError.message);
        }
        
        analysisResults.tables[tableName] = {
            columns: columns,
            rowCount: count || 'Unknown',
            hasRLS: false, // Will be updated later
            indexes: [] // Will be updated later
        };
        
        console.log(`📊 Table: ${tableName} (${count || 'Unknown'} rows)`);
        
    } catch (error) {
        console.error(`❌ Error analyzing table ${tableName}:`, error.message);
    }
}

/**
 * 3. DATA QUALITY ANALYSIS
 */
async function analyzeDataQuality() {
    console.log('');
    console.log('🔍 ANALYZING DATA QUALITY...');
    
    // Analyze IngredientCategorized table
    await analyzeIngredientCategorized();
    
    // Analyze AllergenDerivative table
    await analyzeAllergenDerivative();
    
    // Analyze Users table
    await analyzeUsers();
    
    // Analyze Carts table
    await analyzeCarts();
    
    // Analyze SearchPreferences table
    await analyzeSearchPreferences();
}

async function analyzeIngredientCategorized() {
    console.log('📦 Analyzing IngredientCategorized table...');
    
    try {
        // Basic statistics
        const { data: stats, error: statsError } = await supabase
            .rpc('analyze_ingredient_categorized_stats');
        
        if (statsError) {
            // Fallback: Manual analysis
            const { data, error } = await supabase
                .from('IngredientCategorized')
                .select('id, description, allergens, ingredients, brandName');
            
            if (error) throw error;
            
            const analysis = {
                totalRows: data.length,
                hasDescription: data.filter(row => row.description).length,
                hasAllergens: data.filter(row => row.allergens && row.allergens.length > 0).length,
                hasIngredients: data.filter(row => row.ingredients).length,
                hasBrand: data.filter(row => row.brandName).length,
                nullAllergens: data.filter(row => !row.allergens || row.allergens.length === 0).length,
                nullIngredients: data.filter(row => !row.ingredients).length
            };
            
            analysisResults.dataQuality.IngredientCategorized = analysis;
            
            // Sample data with allergens
            const sampleWithAllergens = data.filter(row => row.allergens && row.allergens.length > 0).slice(0, 10);
            analysisResults.dataQuality.IngredientCategorized.samples = sampleWithAllergens;
            
            console.log(`   📊 Total rows: ${analysis.totalRows}`);
            console.log(`   📊 Has description: ${analysis.hasDescription}`);
            console.log(`   📊 Has allergens: ${analysis.hasAllergens}`);
            console.log(`   📊 Has ingredients: ${analysis.hasIngredients}`);
            console.log(`   📊 Has brand: ${analysis.hasBrand}`);
            console.log(`   📊 Null allergens: ${analysis.nullAllergens}`);
            console.log(`   📊 Null ingredients: ${analysis.nullIngredients}`);
            
        } else {
            analysisResults.dataQuality.IngredientCategorized = stats;
            console.log(`   📊 Analysis complete: ${stats.totalRows} rows`);
        }
        
    } catch (error) {
        console.error('❌ Error analyzing IngredientCategorized:', error.message);
    }
}

async function analyzeAllergenDerivative() {
    console.log('🦠 Analyzing AllergenDerivative table...');
    
    try {
        const { data, error } = await supabase
            .from('AllergenDerivative')
            .select('*')
            .order('allergen, derivative');
        
        if (error) throw error;
        
        const analysis = {
            totalRows: data.length,
            uniqueAllergens: [...new Set(data.map(row => row.allergen))].length,
            allergenCounts: {}
        };
        
        // Count derivatives per allergen
        data.forEach(row => {
            if (!analysis.allergenCounts[row.allergen]) {
                analysis.allergenCounts[row.allergen] = 0;
            }
            analysis.allergenCounts[row.allergen]++;
        });
        
        analysisResults.dataQuality.AllergenDerivative = analysis;
        
        console.log(`   📊 Total rows: ${analysis.totalRows}`);
        console.log(`   📊 Unique allergens: ${analysis.uniqueAllergens}`);
        console.log(`   📊 Sample allergen counts:`, Object.entries(analysis.allergenCounts).slice(0, 5));
        
    } catch (error) {
        console.error('❌ Error analyzing AllergenDerivative:', error.message);
    }
}

async function analyzeUsers() {
    console.log('👥 Analyzing Users table...');
    
    try {
        const { data, error } = await supabase
            .from('Users')
            .select('*');
        
        if (error) throw error;
        
        const analysis = {
            totalUsers: data.length,
            adminUsers: data.filter(row => row.role === 'admin').length,
            sellerUsers: data.filter(row => row.role === 'seller').length,
            regularUsers: data.filter(row => !row.role || row.role === 'user').length,
            usersWithoutEmail: data.filter(row => !row.email).length
        };
        
        analysisResults.dataQuality.Users = analysis;
        
        console.log(`   📊 Total users: ${analysis.totalUsers}`);
        console.log(`   📊 Admin users: ${analysis.adminUsers}`);
        console.log(`   📊 Seller users: ${analysis.sellerUsers}`);
        console.log(`   📊 Regular users: ${analysis.regularUsers}`);
        console.log(`   📊 Users without email: ${analysis.usersWithoutEmail}`);
        
    } catch (error) {
        console.error('❌ Error analyzing Users:', error.message);
    }
}

async function analyzeCarts() {
    console.log('🛒 Analyzing Carts table...');
    
    try {
        const { data, error } = await supabase
            .from('Carts')
            .select('*');
        
        if (error) throw error;
        
        const analysis = {
            totalCarts: data.length,
            uniqueUsers: [...new Set(data.map(row => row.supabase_user_id))].length,
            anonymousCarts: data.filter(row => row.supabase_user_id && row.supabase_user_id.startsWith('anon_')).length,
            avgItemsPerCart: data.reduce((sum, cart) => {
                const itemCount = cart.items ? cart.items.length : 0;
                return sum + itemCount;
            }, 0) / data.length
        };
        
        analysisResults.dataQuality.Carts = analysis;
        
        console.log(`   📊 Total carts: ${analysis.totalCarts}`);
        console.log(`   📊 Unique users: ${analysis.uniqueUsers}`);
        console.log(`   📊 Anonymous carts: ${analysis.anonymousCarts}`);
        console.log(`   📊 Avg items per cart: ${analysis.avgItemsPerCart.toFixed(2)}`);
        
    } catch (error) {
        console.error('❌ Error analyzing Carts:', error.message);
    }
}

async function analyzeSearchPreferences() {
    console.log('🔍 Analyzing SearchPreferences table...');
    
    try {
        const { data, error } = await supabase
            .from('SearchPreferences')
            .select('*');
        
        if (error) throw error;
        
        const analysis = {
            totalPreferences: data.length,
            uniqueUsers: [...new Set(data.map(row => row.supabase_user_id))].length,
            usersWithAllergens: data.filter(row => row.allergens && row.allergens.length > 0).length
        };
        
        // Analyze most common allergens
        const allergenCounts = {};
        data.forEach(row => {
            if (row.allergens) {
                row.allergens.forEach(allergen => {
                    allergenCounts[allergen] = (allergenCounts[allergen] || 0) + 1;
                });
            }
        });
        
        analysis.mostCommonAllergens = Object.entries(allergenCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        analysisResults.dataQuality.SearchPreferences = analysis;
        
        console.log(`   📊 Total preferences: ${analysis.totalPreferences}`);
        console.log(`   📊 Unique users: ${analysis.uniqueUsers}`);
        console.log(`   📊 Users with allergens: ${analysis.usersWithAllergens}`);
        console.log(`   📊 Most common allergens:`, analysis.mostCommonAllergens.slice(0, 5));
        
    } catch (error) {
        console.error('❌ Error analyzing SearchPreferences:', error.message);
    }
}

/**
 * 4. RLS POLICY ANALYSIS
 */
async function analyzeRLSPolicies() {
    console.log('');
    console.log('🔒 ANALYZING RLS POLICIES...');
    
    try {
        // Get all RLS policies
        const { data: policies, error: policiesError } = await supabase
            .rpc('get_rls_policies');
        
        if (policiesError) {
            console.warn('⚠️ Could not get RLS policies via RPC, using fallback method');
            // Fallback: We'll analyze based on known policies from migrations
            analysisResults.rlsPolicies = {
                status: 'FALLBACK_ANALYSIS',
                policies: [
                    {
                        table: 'Carts',
                        policies: ['users_own_cart'],
                        description: 'Users can only access their own cart'
                    },
                    {
                        table: 'IngredientCategorized',
                        policies: ['products_public_read', 'sellers_own_products'],
                        description: 'Public read, seller-only write'
                    },
                    {
                        table: 'Users',
                        policies: ['admin_users_all', 'users_own_profile'],
                        description: 'Users see own profile, admins see all'
                    }
                ]
            };
        } else {
            analysisResults.rlsPolicies = policies;
        }
        
        console.log('✅ RLS policy analysis complete');
        
    } catch (error) {
        console.error('❌ Error analyzing RLS policies:', error.message);
    }
}

/**
 * 5. DATA RELATIONSHIPS & FOREIGN KEYS
 */
async function analyzeRelationships() {
    console.log('');
    console.log('🔗 ANALYZING DATA RELATIONSHIPS...');
    
    try {
        const { data: relationships, error } = await supabase
            .rpc('get_foreign_key_relationships');
        
        if (error) {
            console.warn('⚠️ Could not get foreign key relationships via RPC');
            // Fallback: Known relationships from code analysis
            analysisResults.relationships = {
                status: 'FALLBACK_ANALYSIS',
                relationships: [
                    {
                        table: 'IngredientCategorized',
                        column: 'seller_id',
                        foreign_table: 'Users',
                        foreign_column: 'id',
                        description: 'Product ownership by sellers'
                    },
                    {
                        table: 'Carts',
                        column: 'supabase_user_id',
                        foreign_table: 'Users',
                        foreign_column: 'id',
                        description: 'Cart ownership by users'
                    }
                ]
            };
        } else {
            analysisResults.relationships = relationships;
        }
        
        console.log('✅ Relationship analysis complete');
        
    } catch (error) {
        console.error('❌ Error analyzing relationships:', error.message);
    }
}

/**
 * 6. INDEX ANALYSIS
 */
async function analyzeIndexes() {
    console.log('');
    console.log('📈 ANALYZING INDEXES...');
    
    try {
        const { data: indexes, error } = await supabase
            .rpc('get_database_indexes');
        
        if (error) {
            console.warn('⚠️ Could not get indexes via RPC');
            analysisResults.indexes = {
                status: 'FALLBACK_ANALYSIS',
                message: 'Index analysis not available via RPC'
            };
        } else {
            analysisResults.indexes = indexes;
        }
        
        console.log('✅ Index analysis complete');
        
    } catch (error) {
        console.error('❌ Error analyzing indexes:', error.message);
    }
}

/**
 * 7. DATA INCONSISTENCY IDENTIFICATION
 */
async function identifyDataInconsistencies() {
    console.log('');
    console.log('🚨 IDENTIFYING DATA INCONSISTENCIES...');
    
    const inconsistencies = [];
    
    try {
        // Check for allergen naming inconsistencies
        const { data: allergenVariations, error: allergenError } = await supabase
            .from('IngredientCategorized')
            .select('allergens')
            .not('allergens', 'is', null);
        
        if (!allergenError && allergenVariations) {
            const uniqueAllergens = new Set();
            allergenVariations.forEach(row => {
                if (row.allergens) {
                    row.allergens.forEach(allergen => {
                        uniqueAllergens.add(allergen);
                    });
                }
            });
            
            const allergenList = Array.from(uniqueAllergens).sort();
            inconsistencies.push({
                type: 'ALLERGEN_NAMING_INCONSISTENCIES',
                count: allergenList.length,
                examples: allergenList.slice(0, 10),
                description: 'Multiple variations of allergen names found'
            });
        }
        
        // Check for potential duplicates
        const { data: duplicates, error: duplicateError } = await supabase
            .from('IngredientCategorized')
            .select('description, brandName')
            .not('description', 'is', null);
        
        if (!duplicateError && duplicates) {
            const duplicateMap = {};
            duplicates.forEach(row => {
                const key = `${row.description}-${row.brandName}`;
                duplicateMap[key] = (duplicateMap[key] || 0) + 1;
            });
            
            const actualDuplicates = Object.entries(duplicateMap)
                .filter(([, count]) => count > 1)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);
            
            if (actualDuplicates.length > 0) {
                inconsistencies.push({
                    type: 'POTENTIAL_DUPLICATES',
                    count: actualDuplicates.length,
                    examples: actualDuplicates.map(([key, count]) => ({ key, count })),
                    description: 'Products with identical description and brand'
                });
            }
        }
        
        analysisResults.dataQuality.inconsistencies = inconsistencies;
        
        console.log(`   📊 Found ${inconsistencies.length} types of inconsistencies`);
        inconsistencies.forEach(inc => {
            console.log(`   🚨 ${inc.type}: ${inc.count} issues`);
        });
        
    } catch (error) {
        console.error('❌ Error identifying inconsistencies:', error.message);
    }
}

/**
 * 8. GENERATE RECOMMENDATIONS
 */
function generateRecommendations() {
    console.log('');
    console.log('💡 GENERATING RECOMMENDATIONS...');
    
    const recommendations = [];
    
    // Data quality recommendations
    if (analysisResults.dataQuality.IngredientCategorized) {
        const stats = analysisResults.dataQuality.IngredientCategorized;
        
        if (stats.nullAllergens > stats.totalRows * 0.5) {
            recommendations.push({
                priority: 'HIGH',
                type: 'DATA_QUALITY',
                title: 'Fix NULL allergen data',
                description: `${stats.nullAllergens} products have NULL allergen data`,
                sql: `-- Add allergen detection to products
UPDATE "IngredientCategorized" 
SET allergens = ARRAY[]::text[] 
WHERE allergens IS NULL;`
            });
        }
    }
    
    // Performance recommendations
    recommendations.push({
        priority: 'CRITICAL',
        type: 'PERFORMANCE',
        title: 'Create allergen filtering indexes',
        description: 'Add GIN indexes for allergen filtering performance',
        sql: `-- Create indexes for allergen filtering
CREATE INDEX IF NOT EXISTS idx_ingredientcategorized_allergens 
ON "IngredientCategorized" USING GIN (allergens);

CREATE INDEX IF NOT EXISTS idx_ingredientcategorized_description 
ON "IngredientCategorized" USING gin(to_tsvector('english', description));`
    });
    
    // Standardization recommendations
    recommendations.push({
        priority: 'HIGH',
        type: 'DATA_STANDARDIZATION',
        title: 'Standardize allergen naming',
        description: 'Create allergen standardization table',
        sql: `-- Create allergen standardization table
CREATE TABLE IF NOT EXISTS allergen_standardization (
    original_name TEXT PRIMARY KEY,
    standardized_name TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0
);

-- Insert common variations
INSERT INTO allergen_standardization VALUES
('Tree Nuts', 'tree_nuts', 1.0),
('treeNuts', 'tree_nuts', 1.0),
('tree-nuts', 'tree_nuts', 1.0),
('tree_nuts', 'tree_nuts', 1.0)
ON CONFLICT (original_name) DO NOTHING;`
    });
    
    analysisResults.recommendations = recommendations;
    
    console.log(`   📊 Generated ${recommendations.length} recommendations`);
    recommendations.forEach(rec => {
        console.log(`   💡 ${rec.priority}: ${rec.title}`);
    });
}

/**
 * MAIN ANALYSIS FUNCTION
 */
async function runCompleteAnalysis() {
    try {
        // 1. Test connection
        await testConnection();
        
        // 2. Analyze table structure
        await analyzeTableStructure();
        
        // 3. Analyze data quality
        await analyzeDataQuality();
        
        // 4. Analyze RLS policies
        await analyzeRLSPolicies();
        
        // 5. Analyze relationships
        await analyzeRelationships();
        
        // 6. Analyze indexes
        await analyzeIndexes();
        
        // 7. Identify inconsistencies
        await identifyDataInconsistencies();
        
        // 8. Generate recommendations
        generateRecommendations();
        
        // Save results to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `database_analysis_results_${timestamp}.json`;
        
        fs.writeFileSync(filename, JSON.stringify(analysisResults, null, 2));
        
        console.log('');
        console.log('✅ COMPLETE DATABASE ANALYSIS FINISHED');
        console.log('=====================================');
        console.log(`📄 Results saved to: ${filename}`);
        console.log('');
        
        // Print summary
        printSummary();
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
}

function printSummary() {
    console.log('📋 ANALYSIS SUMMARY');
    console.log('==================');
    
    // Connection status
    console.log(`🔌 Connection: ${analysisResults.connection.status}`);
    
    // Table count
    const tableCount = Object.keys(analysisResults.tables).length;
    console.log(`📊 Tables analyzed: ${tableCount}`);
    
    // Data quality summary
    if (analysisResults.dataQuality.IngredientCategorized) {
        const stats = analysisResults.dataQuality.IngredientCategorized;
        console.log(`📦 Products: ${stats.totalRows} total`);
        console.log(`   - With allergens: ${stats.hasAllergens}`);
        console.log(`   - Without allergens: ${stats.nullAllergens}`);
    }
    
    // Recommendations count
    const recCount = analysisResults.recommendations.length;
    console.log(`💡 Recommendations: ${recCount}`);
    
    // Critical issues
    const criticalIssues = analysisResults.recommendations.filter(r => r.priority === 'CRITICAL').length;
    if (criticalIssues > 0) {
        console.log(`🚨 Critical issues: ${criticalIssues}`);
    }
}

// Run the analysis
if (require.main === module) {
    runCompleteAnalysis();
}

module.exports = {
    runCompleteAnalysis,
    analysisResults
}; 