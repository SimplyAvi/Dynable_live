/**
 * Run migration to update merge_search_preferences function
 * This gives precedence to anonymous preferences (more recent)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://fdojimqdhuqhimgjpdai.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        console.log('🔄 Running migration to update merge_search_preferences function...');
        
        // Read the migration SQL
        const migrationPath = path.join(__dirname, 'database/migrations/update_merge_search_preferences.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Migration SQL loaded');
        
        // Execute the migration using raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
        
        if (error) {
            console.error('❌ Migration failed:', error);
            return;
        }
        
        console.log('✅ Migration completed successfully');
        console.log('🎯 Anonymous preferences will now take precedence during merge');
        
        // Test the updated function
        console.log('\n🧪 Testing updated merge function...');
        await testUpdatedMergeFunction();
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

async function testUpdatedMergeFunction() {
    try {
        const testAnonymousId = '00000000-0000-0000-0000-000000000003';
        const testAuthenticatedId = '00000000-0000-0000-0000-000000000004';
        
        // Save anonymous preferences (gluten, eggs)
        const { data: saveAnonymous, error: saveAnonymousError } = await supabase.rpc('save_search_preferences', {
            p_user_id: testAnonymousId,
            p_search_term: 'anonymous search',
            p_allergens: ['gluten', 'eggs']
        });
        
        if (saveAnonymousError) {
            console.error('❌ Error saving anonymous preferences:', saveAnonymousError);
            return;
        }
        
        console.log('✅ Anonymous preferences saved:', saveAnonymous.selected_allergens);
        
        // Save authenticated preferences (gluten, milk, soy)
        const { data: saveAuth, error: saveAuthError } = await supabase.rpc('save_search_preferences', {
            p_user_id: testAuthenticatedId,
            p_search_term: 'authenticated search',
            p_allergens: ['gluten', 'milk', 'soy']
        });
        
        if (saveAuthError) {
            console.error('❌ Error saving authenticated preferences:', saveAuthError);
            return;
        }
        
        console.log('✅ Authenticated preferences saved:', saveAuth.selected_allergens);
        
        // Test merge with updated function
        const { data: mergeResult, error: mergeError } = await supabase.rpc('merge_search_preferences', {
            p_anonymous_user_id: testAnonymousId,
            p_authenticated_user_id: testAuthenticatedId
        });
        
        if (mergeError) {
            console.error('❌ Error during merge:', mergeError);
            return;
        }
        
        console.log('🎯 Merge result:', mergeResult.selected_allergens);
        
        // Verify the result
        if (JSON.stringify(mergeResult.selected_allergens) === JSON.stringify(['gluten', 'eggs'])) {
            console.log('✅ SUCCESS: Anonymous preferences took precedence!');
        } else {
            console.log('❌ FAILED: Anonymous preferences did not take precedence');
            console.log('Expected: ["gluten", "eggs"]');
            console.log('Got:', mergeResult.selected_allergens);
        }
        
        // Clean up test data
        await supabase.rpc('clear_search_preferences', { p_user_id: testAuthenticatedId });
        console.log('🧹 Test data cleaned up');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runMigration(); 