// Script to check live database tables and user information structure
import { supabase } from './src/utils/supabaseClient.js';

async function checkDatabaseTables() {
    console.log('🔍 CHECKING LIVE DATABASE TABLES');
    console.log('================================');
    
    try {
        // Check if we can connect to Supabase
        console.log('📡 Testing Supabase connection...');
        
        // List all tables by trying to query common table names
        const tableNames = [
            'Users',
            'AllergenDerivatives', 
            'IngredientCategorized',
            'RecipeIngredients',
            'Recipes',
            'SubstituteMappings',
            'IngredientCanonical',
            'Carts',
            'Orders',
            'UserProfiles',
            'CustomAllergens',
            'UserAllergens'
        ];
        
        console.log('\n📋 CHECKING AVAILABLE TABLES:');
        console.log('=============================');
        
        const availableTables = [];
        
        for (const tableName of tableNames) {
            try {
                // Try to query the table with a limit of 1 to check if it exists
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                        console.log(`❌ ${tableName}: Table does not exist`);
                    } else {
                        console.log(`⚠️  ${tableName}: Error - ${error.message}`);
                    }
                } else {
                    console.log(`✅ ${tableName}: Table exists`);
                    availableTables.push(tableName);
                    
                    // Get column information by checking the first row
                    if (data && data.length > 0) {
                        const columns = Object.keys(data[0]);
                        console.log(`   Columns: ${columns.join(', ')}`);
                    }
                }
            } catch (err) {
                console.log(`❌ ${tableName}: Connection error - ${err.message}`);
            }
        }
        
        console.log(`\n📊 SUMMARY: Found ${availableTables.length} tables`);
        console.log('Available tables:', availableTables.join(', '));
        
        // Check Users table structure if it exists
        if (availableTables.includes('Users')) {
            console.log('\n👤 CHECKING USERS TABLE STRUCTURE:');
            console.log('==================================');
            
            try {
                const { data: users, error } = await supabase
                    .from('Users')
                    .select('*')
                    .limit(3);
                
                if (error) {
                    console.log('❌ Error fetching users:', error.message);
                } else if (users && users.length > 0) {
                    console.log('✅ Users table structure:');
                    const sampleUser = users[0];
                    Object.keys(sampleUser).forEach(key => {
                        const value = sampleUser[key];
                        const type = typeof value;
                        const preview = Array.isArray(value) ? `Array(${value.length})` : 
                                      type === 'string' ? `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"` :
                                      value;
                        console.log(`   ${key}: ${type} = ${preview}`);
                    });
                } else {
                    console.log('📝 Users table is empty');
                }
            } catch (err) {
                console.log('❌ Error checking Users table:', err.message);
            }
        }
        
        // Check authentication info
        console.log('\n🔐 CHECKING AUTHENTICATION INFO:');
        console.log('=================================');
        
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.log('❌ Error getting session:', error.message);
            } else if (session) {
                console.log('✅ Active session found:');
                console.log('   User ID:', session.user.id);
                console.log('   Email:', session.user.email || 'No email');
                console.log('   Phone:', session.user.phone || 'No phone');
                console.log('   Anonymous:', !session.user.email && !session.user.phone);
                console.log('   User metadata:', JSON.stringify(session.user.user_metadata, null, 2));
            } else {
                console.log('📝 No active session (anonymous user)');
            }
        } catch (err) {
            console.log('❌ Error checking auth:', err.message);
        }
        
        // Check AllergenDerivatives table
        if (availableTables.includes('AllergenDerivatives')) {
            console.log('\n🧬 CHECKING ALLERGEN DERIVATIVES:');
            console.log('==================================');
            
            try {
                const { data: allergens, error } = await supabase
                    .from('AllergenDerivatives')
                    .select('allergen')
                    .limit(10);
                
                if (error) {
                    console.log('❌ Error fetching allergens:', error.message);
                } else if (allergens && allergens.length > 0) {
                    console.log(`✅ Found ${allergens.length} allergens:`);
                    allergens.forEach((allergen, index) => {
                        console.log(`   ${index + 1}. ${allergen.allergen}`);
                    });
                } else {
                    console.log('📝 No allergens found');
                }
            } catch (err) {
                console.log('❌ Error checking allergens:', err.message);
            }
        }
        
        console.log('\n✅ Database check completed successfully!');
        return { success: true, availableTables };
        
    } catch (error) {
        console.error('❌ Database check failed:', error);
        return { success: false, error: error.message };
    }
}

// Run the check
checkDatabaseTables()
    .then(result => {
        if (result.success) {
            console.log('\n🎉 Database check completed successfully!');
            process.exit(0);
        } else {
            console.log('\n💥 Database check failed:', result.error);
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
