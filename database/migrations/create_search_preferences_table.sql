-- Create SearchPreferences table for search persistence
-- Author: Justin Linzan
-- Date: January 2025
-- 
-- Follows the same pattern as Carts table for consistency
-- Supports anonymous and authenticated user search preferences

-- 1. Create SearchPreferences table
CREATE TABLE IF NOT EXISTS "SearchPreferences" (
    "id" SERIAL PRIMARY KEY,
    "supabase_user_id" UUID NOT NULL,
    "search_term" TEXT DEFAULT '',
    "selected_allergens" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_search_preferences_user_id" ON "SearchPreferences"("supabase_user_id");
CREATE INDEX IF NOT EXISTS "idx_search_preferences_created_at" ON "SearchPreferences"("createdAt");

-- 3. Enable RLS
ALTER TABLE "SearchPreferences" ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies (following Carts table pattern)

-- Admin users can access all search preferences
CREATE POLICY "admin_search_preferences_access" ON "SearchPreferences"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.jwt() 
            WHERE (auth.jwt() ->> 'role')::text = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM "Users" 
            WHERE "Users"."email" = (auth.jwt() ->> 'email')::text 
            AND "Users"."role" = 'admin'
        )
    );

-- Permanent users can access their own search preferences
CREATE POLICY "permanent_user_search_preferences_access" ON "SearchPreferences"
    FOR ALL USING (
        "supabase_user_id"::text = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM "Users" 
            WHERE "Users"."supabase_user_id"::text = auth.uid()::text
            AND "SearchPreferences"."supabase_user_id"::text = auth.uid()::text
        )
    );

-- Anonymous users can access their own search preferences
CREATE POLICY "anonymous_search_preferences_access" ON "SearchPreferences"
    FOR ALL USING (
        "supabase_user_id"::text = auth.uid()::text
    );

-- 5. Create trigger for updatedAt
CREATE OR REPLACE FUNCTION update_search_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_preferences_updated_at
    BEFORE UPDATE ON "SearchPreferences"
    FOR EACH ROW
    EXECUTE FUNCTION update_search_preferences_updated_at();

-- 6. Create helper functions for search preferences management

-- Function to save search preferences
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
    INSERT INTO "SearchPreferences" ("supabase_user_id", "search_term", "selected_allergens")
    VALUES (p_user_id, p_search_term, p_allergens)
    ON CONFLICT ("supabase_user_id") 
    DO UPDATE SET 
        "search_term" = EXCLUDED."search_term",
        "selected_allergens" = EXCLUDED."selected_allergens",
        "updatedAt" = NOW()
    RETURNING jsonb_build_object(
        'id', "id",
        'supabase_user_id', "supabase_user_id",
        'search_term', "search_term",
        'selected_allergens', "selected_allergens",
        'createdAt', "createdAt",
        'updatedAt', "updatedAt"
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get search preferences
CREATE OR REPLACE FUNCTION get_search_preferences(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', "id",
        'supabase_user_id', "supabase_user_id",
        'search_term', "search_term",
        'selected_allergens', "selected_allergens",
        'createdAt', "createdAt",
        'updatedAt', "updatedAt"
    ) INTO result
    FROM "SearchPreferences"
    WHERE "supabase_user_id" = p_user_id;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to merge search preferences (for login flow)
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

-- Function to clear search preferences (for logout)
CREATE OR REPLACE FUNCTION clear_search_preferences(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM "SearchPreferences" WHERE "supabase_user_id" = p_user_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT ALL ON "SearchPreferences" TO authenticated;
GRANT ALL ON "SearchPreferences" TO anon;
GRANT EXECUTE ON FUNCTION save_search_preferences(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION save_search_preferences(UUID, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION get_search_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_search_preferences(UUID) TO anon;
GRANT EXECUTE ON FUNCTION merge_search_preferences(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION merge_search_preferences(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION clear_search_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_search_preferences(UUID) TO anon;

-- 8. Verify table creation
SELECT 'SearchPreferences table created successfully' as status; 