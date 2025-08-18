const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 🔍 CHECK INGREDIENTCANONICAL COLUMN NAMES
async function checkIngredientCanonicalColumns() {
    console.log('🔍 CHECKING INGREDIENTCANONICAL COLUMN NAMES\n');
    
    try {
        // Get sample data to see actual column names
        const { data: samples, error: samplesError } = await supabase
            .from('IngredientCanonical')
            .select('*')
            .limit(3);
        
        if (samplesError) {
            console.log('❌ Error fetching IngredientCanonical samples:', samplesError);
            return;
        }
        
        console.log('📊 IngredientCanonical sample data:');
        samples.forEach((sample, index) => {
            console.log(`   ${index + 1}. ID: ${sample.id}`);
            console.log(`      All columns:`, Object.keys(sample));
            console.log(`      Values:`, sample);
            console.log('');
        });
        
        // Try to get column count
        const { count: totalCount, error: countError } = await supabase
            .from('IngredientCanonical')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.log('❌ Error counting IngredientCanonical:', countError);
        } else {
            console.log(`📊 Total IngredientCanonical rows: ${totalCount}`);
        }
        
        // Try different possible column names
        const possibleColumnNames = [
            'canonical_ingredient_name',
            'canonical_name', 
            'ingredient_name',
            'name',
            'canonical',
            'original_ingredient_name',
            'original_name'
        ];
        
        console.log('🧪 Testing possible column names:');
        for (const columnName of possibleColumnNames) {
            try {
                const { data: testData, error: testError } = await supabase
                    .from('IngredientCanonical')
                    .select(columnName)
                    .limit(1);
                
                if (testError) {
                    console.log(`   ❌ ${columnName}: ${testError.message}`);
                } else {
                    console.log(`   ✅ ${columnName}: EXISTS`);
                }
            } catch (error) {
                console.log(`   ❌ ${columnName}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error in column check:', error);
    }
}

// 🚀 RUN THE CHECK
if (require.main === module) {
    checkIngredientCanonicalColumns().catch(console.error);
}

module.exports = {
    checkIngredientCanonicalColumns
}; 