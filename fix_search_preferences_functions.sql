-- 🔧 FIX SEARCH PREFERENCES FUNCTIONS - CAMELCASE COLUMN NAMES
-- This script updates the database functions to use the correct column names after the migration

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

-- Verify the functions work
DO $$
BEGIN
    RAISE NOTICE '✅ Search preferences functions updated to use camelCase column names';
    RAISE NOTICE '✅ Functions: save_search_preferences, get_search_preferences, merge_search_preferences';
END $$; 