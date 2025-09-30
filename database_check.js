// Simple database check using the existing app setup
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    console.log('REACT_APP_SUPABASE_URL:', !!supabaseUrl);
    console.log('REACT_APP_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
    console.log('🔍 CHECKING DATABASE TABLES');
    console.log('============================');
    
    const tables = [
        'Users',
        'AllergenDerivatives', 
        'IngredientCategorized',
        'RecipeIngredients',
        'Recipes',
        'SubstituteMappings',
        'IngredientCanonical',
        'Carts'
    ];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
            } else {
                console.log(`✅ ${table}: EXISTS`);
                if (data && data.length > 0) {
                    const columns = Object.keys(data[0]);
                    console.log(`   Columns: ${columns.join(', ')}`);
                }
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
        }
    }
    
    // Check Users table structure specifically
    console.log('\n👤 USERS TABLE STRUCTURE:');
    console.log('==========================');
    
    try {
        const { data: users, error } = await supabase
            .from('Users')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ Error:', error.message);
        } else if (users && users.length > 0) {
            console.log('✅ Users table structure:');
            Object.keys(users[0]).forEach(key => {
                console.log(`   ${key}: ${typeof users[0][key]}`);
            });
        } else {
            console.log('📝 Users table is empty');
        }
    } catch (err) {
        console.log('❌ Error:', err.message);
    }
    
    // Check AllergenDerivatives
    console.log('\n🧬 ALLERGEN DERIVATIVES:');
    console.log('========================');
    
    try {
        const { data: allergens, error } = await supabase
            .from('AllergenDerivatives')
            .select('allergen')
            .limit(10);
        
        if (error) {
            console.log('❌ Error:', error.message);
        } else if (allergens && allergens.length > 0) {
            console.log(`✅ Found ${allergens.length} allergens:`);
            allergens.forEach((allergen, index) => {
                console.log(`   ${index + 1}. ${allergen.allergen}`);
            });
        } else {
            console.log('📝 No allergens found');
        }
    } catch (err) {
        console.log('❌ Error:', err.message);
    }
}

checkDatabase().then(() => {
    console.log('\n✅ Database check completed!');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
