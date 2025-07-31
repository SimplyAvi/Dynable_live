/**
 * Simple migration to update merge_search_preferences function
 * This gives precedence to anonymous preferences (more recent)
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMergeFunction() {
    try {
        console.log('🔄 Updating merge_search_preferences function...');
        
        // Test the current function first
        console.log('\n🧪 Testing current merge function...');
        await testCurrentMergeFunction();
        
        // Update the function using raw SQL
        const updateSQL = `
            CREATE OR REPLACE FUNCTION merge_search_preferences(
                p_anonymous_user_id UUID,
                p_authenticated_user_id UUID
            )
            RETURNS JSONB AS $$
            DECLARE
                anonymous_prefs JSONB;
                authenticated_prefs JSONB;
                merged_prefs JSONB;
                result JSONB;
            BEGIN
                -- Get anonymous user preferences
                SELECT get_search_preferences(p_anonymous_user_id) INTO anonymous_prefs;
                
                -- Get authenticated user preferences
                SELECT get_search_preferences(p_authenticated_user_id) INTO authenticated_prefs;
                
                -- 🎯 MERGE LOGIC: Anonymous preferences take precedence (more recent)
                IF anonymous_prefs != '{}'::jsonb THEN
                    -- Anonymous preferences exist - they take precedence
                    merged_prefs := jsonb_build_object(
                        'search_term', COALESCE(anonymous_prefs->>'search_term', authenticated_prefs->>'search_term', ''),
                        'selected_allergens', COALESCE(anonymous_prefs->'selected_allergens', '[]'::jsonb)
                    );
                ELSIF authenticated_prefs != '{}'::jsonb THEN
                    -- No anonymous preferences, use authenticated
                    merged_prefs := authenticated_prefs;
                ELSE
                    -- No preferences at all
                    merged_prefs := '{}'::jsonb;
                END IF;
                
                -- Save merged preferences to authenticated user
                IF merged_prefs != '{}'::jsonb THEN
                    SELECT save_search_preferences(
                        p_authenticated_user_id,
                        COALESCE(merged_prefs->>'search_term', ''),
                        COALESCE(merged_prefs->'selected_allergens', '[]'::jsonb)
                    ) INTO result;
                END IF;
                
                -- Clean up anonymous user preferences
                DELETE FROM "SearchPreferences" WHERE "supabase_user_id" = p_anonymous_user_id;
                
                RETURN result;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;
        
        // Execute the SQL using the service role client
        const { data, error } = await supabase.rpc('exec_sql', { sql: updateSQL });
        
        if (error) {
            console.error('❌ Error updating function:', error);
            console.log('⚠️  You may need to update this function manually in the Supabase dashboard');
            return;
        }
        
        console.log('✅ Function updated successfully');
        
        // Test the updated function
        console.log('\n🧪 Testing updated merge function...');
        await testUpdatedMergeFunction();
        
    } catch (error) {
        console.error('❌ Failed to update function:', error);
        console.log('⚠️  You may need to update this function manually in the Supabase dashboard');
    }
}

async function testCurrentMergeFunction() {
    try {
        const testAnonymousId = '00000000-0000-0000-0000-000000000005';
        const testAuthenticatedId = '00000000-0000-0000-0000-000000000006';
        
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
        
        // Test merge
        const { data: mergeResult, error: mergeError } = await supabase.rpc('merge_search_preferences', {
            p_anonymous_user_id: testAnonymousId,
            p_authenticated_user_id: testAuthenticatedId
        });
        
        if (mergeError) {
            console.error('❌ Error during merge:', mergeError);
            return;
        }
        
        console.log('🎯 Current merge result:', mergeResult.selected_allergens);
        
        // Clean up test data
        await supabase.rpc('clear_search_preferences', { p_user_id: testAuthenticatedId });
        console.log('🧹 Test data cleaned up');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

async function testUpdatedMergeFunction() {
    try {
        const testAnonymousId = '00000000-0000-0000-0000-000000000007';
        const testAuthenticatedId = '00000000-0000-0000-0000-000000000008';
        
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
        
        console.log('🎯 Updated merge result:', mergeResult.selected_allergens);
        
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

updateMergeFunction(); 