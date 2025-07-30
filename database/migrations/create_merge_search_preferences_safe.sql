-- Create a safe merge function that can be called during authentication
CREATE OR REPLACE FUNCTION merge_search_preferences_safe(
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
    -- 🎯 INPUT VALIDATION
    IF p_anonymous_user_id IS NULL OR p_authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'Both anonymous and authenticated user IDs are required';
    END IF;
    
    IF p_anonymous_user_id = p_authenticated_user_id THEN
        RAISE EXCEPTION 'Cannot merge preferences with same user ID';
    END IF;
    
    -- 🎯 FUNCTION DEPENDENCY CHECK: Verify required functions exist
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_search_preferences') THEN
        RAISE EXCEPTION 'Required function get_search_preferences does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'save_search_preferences') THEN
        RAISE EXCEPTION 'Required function save_search_preferences does not exist';
    END IF;
    
    -- 🎯 ERROR HANDLING: Wrap operations in exception handling
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
        
        -- 🎯 CLEANUP: Remove anonymous user preferences (with error handling)
        BEGIN
            DELETE FROM "SearchPreferences" WHERE "supabase_user_id" = p_anonymous_user_id;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log cleanup error but don't fail the merge
                RAISE WARNING 'Failed to cleanup anonymous preferences: %', SQLERRM;
        END;
        
        RETURN result;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- 🎯 ERROR HANDLING: Log error and return empty result
            RAISE WARNING 'Safe merge operation failed: %', SQLERRM;
            RETURN '{}'::jsonb;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION merge_search_preferences_safe(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION merge_search_preferences_safe(UUID, UUID) TO anon;

-- Verify the function was created
SELECT 'merge_search_preferences_safe function created successfully' as status; 