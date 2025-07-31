/**
 * Update merge_search_preferences function to give precedence to anonymous preferences
 * This follows the same pattern as the cart system: anonymous preferences are more recent
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY or REACT_APP_SUPABASE_ANON_KEY not set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMergeFunction() {
    try {
        console.log('🔄 Updating merge_search_preferences function...');
        
        const updateSQL = `
            -- Function to merge search preferences (for login flow) - UPDATED VERSION
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
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: updateSQL });
        
        if (error) {
            console.error('❌ Error updating function:', error);
            return;
        }
        
        console.log('✅ merge_search_preferences function updated successfully');
        console.log('🎯 Anonymous preferences will now take precedence during merge');
        
    } catch (error) {
        console.error('❌ Failed to update function:', error);
    }
}

updateMergeFunction(); 