// 🔧 FIX SEARCH PREFERENCES FUNCTIONS - CAMELCASE COLUMN NAMES
// This script fixes the database functions to use the correct column names

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSearchPreferencesFunctions() {
    try {
        console.log('🔧 Fixing search preferences functions to use camelCase column names...');
        
        // Test the current function to see the error
        console.log('🔍 Testing current function...');
        const testResult = await supabase.rpc('save_search_preferences', {
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_search_term: 'test',
            p_allergens: ['milk']
        });
        
        if (testResult.error) {
            console.log('✅ Confirmed the error:', testResult.error.message);
        }
        
        // Since we can't run DDL through the client, let's create a simple test
        console.log('🔍 Testing if we can access the SearchPreferences table...');
        const { data: tableData, error: tableError } = await supabase
            .from('SearchPreferences')
            .select('*')
            .limit(1);
        
        if (tableError) {
            console.error('❌ Error accessing SearchPreferences table:', tableError);
            return false;
        }
        
        console.log('✅ Can access SearchPreferences table');
        
        // Let's try to create a simple function using a different approach
        console.log('🔧 Attempting to fix functions through direct SQL...');
        
        // We'll need to use the Supabase dashboard or psql to run the DDL
        console.log('⚠️  The database functions need to be updated manually.');
        console.log('⚠️  Please run the following SQL in your Supabase SQL editor:');
        console.log('');
        console.log('-- Copy and paste this into your Supabase SQL editor:');
        console.log('');
        console.log(`
-- Function to save search preferences (FIXED: uses selectedallergens)
CREATE OR REPLACE FUNCTION save_search_preferences(
    p_user_id UUID,
    p_search_term TEXT DEFAULT '',
    p_allergens JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Upsert search preferences
    INSERT INTO "SearchPreferences" ("supabase_user_id", "search_term", "selectedallergens")
    VALUES (p_user_id, p_search_term, p_allergens)
    ON CONFLICT ("supabase_user_id") 
    DO UPDATE SET 
        "search_term" = EXCLUDED."search_term",
        "selectedallergens" = EXCLUDED."selectedallergens",
        "updatedAt" = NOW()
    RETURNING jsonb_build_object(
        'id', "id",
        'supabase_user_id', "supabase_user_id",
        'search_term', "search_term",
        'selectedallergens', "selectedallergens",
        'createdAt', "createdAt",
        'updatedAt', "updatedAt"
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get search preferences (FIXED: uses selectedallergens)
CREATE OR REPLACE FUNCTION get_search_preferences(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', "id",
        'supabase_user_id', "supabase_user_id",
        'search_term', "search_term",
        'selectedallergens', "selectedallergens",
        'createdAt', "createdAt",
        'updatedAt', "updatedAt"
    ) INTO result
    FROM "SearchPreferences"
    WHERE "supabase_user_id" = p_user_id;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to merge search preferences (FIXED: uses selectedallergens)
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
            'selectedallergens', COALESCE(anonymous_prefs->'selectedallergens', '[]'::jsonb)
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
            COALESCE(merged_prefs->'selectedallergens', '[]'::jsonb)
        ) INTO result;
    END IF;
    
    -- Clean up anonymous preferences
    DELETE FROM "SearchPreferences" WHERE "supabase_user_id" = p_anonymous_user_id;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION save_search_preferences(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION save_search_preferences(UUID, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION get_search_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_search_preferences(UUID) TO anon;
GRANT EXECUTE ON FUNCTION merge_search_preferences(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION merge_search_preferences(UUID, UUID) TO anon;
        `);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error fixing search preferences functions:', error);
        return false;
    }
}

// Run the fix
fixSearchPreferencesFunctions().then(success => {
    if (success) {
        console.log('');
        console.log('🎯 NEXT STEPS:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the SQL above');
        console.log('4. Run the SQL');
        console.log('5. Test the frontend again');
        console.log('');
        console.log('✅ After running the SQL, the frontend should work without database errors!');
    } else {
        console.log('❌ Failed to analyze the functions.');
        process.exit(1);
    }
}); 