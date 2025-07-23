-- Phase 2: Supabase Row Level Security (RLS) Policies
-- Updated for Dynable RBAC System with Anonymous User Support

-- 1. Enable RLS on all tables
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Carts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IngredientCategorized" ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- 2. User Table Policies
-- Admins can see all users
CREATE POLICY "admin_users_all" ON "Users"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can see their own profile
CREATE POLICY "users_own_profile" ON "Users"
    FOR SELECT USING (
        auth.uid()::text = id::text OR
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can update their own profile (except role)
CREATE POLICY "users_update_own" ON "Users"
    FOR UPDATE USING (
        auth.uid()::text = id::text
    ) WITH CHECK (
        auth.uid()::text = id::text AND
        (OLD.role = NEW.role OR (auth.jwt() ->> 'role')::text = 'admin')
    );

-- Only admins can change roles
CREATE POLICY "admin_role_changes" ON "Users"
    FOR UPDATE USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 3. Product Table Policies (IngredientCategorized)
-- Everyone (including anonymous users) can view active products
CREATE POLICY "products_public_read" ON "IngredientCategorized"
    FOR SELECT USING (
        is_active = true
    );

-- Anonymous users can view but cannot modify products
CREATE POLICY "anonymous_products_read_only" ON "IngredientCategorized"
    FOR SELECT USING (
        (auth.jwt() ->> 'is_anonymous')::boolean = true AND 
        is_active = true
    );

-- Sellers can manage their own products (permanent users only)
CREATE POLICY "sellers_own_products" ON "IngredientCategorized"
    FOR ALL USING (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        (seller_id::text = auth.uid()::text OR (auth.jwt() ->> 'role')::text = 'admin')
    );

-- Only verified permanent users can create products
CREATE POLICY "sellers_create_products" ON "IngredientCategorized"
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        (auth.jwt() ->> 'role')::text IN ('seller', 'admin') AND
        (seller_id::text = auth.uid()::text OR (auth.jwt() ->> 'role')::text = 'admin')
    );

-- Sellers can update their own products
CREATE POLICY "sellers_update_own_products" ON "IngredientCategorized"
    FOR UPDATE USING (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        (seller_id::text = auth.uid()::text OR (auth.jwt() ->> 'role')::text = 'admin')
    ) WITH CHECK (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        (seller_id::text = auth.uid()::text OR (auth.jwt() ->> 'role')::text = 'admin')
    );

-- 4. Cart Table Policies
-- Users can access their own cart (including anonymous users)
CREATE POLICY "users_own_cart" ON "Carts"
    FOR ALL USING (
        "userId"::text = auth.uid()::text OR
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Anonymous users can have carts but limited functionality
CREATE POLICY "anonymous_cart_access" ON "Carts"
    FOR SELECT USING (
        (auth.jwt() ->> 'is_anonymous')::boolean = true AND
        "userId"::text = auth.uid()::text
    );

-- Anonymous users can add/update cart items
CREATE POLICY "anonymous_cart_modify" ON "Carts"
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'is_anonymous')::boolean = true AND
        "userId"::text = auth.uid()::text
    );

CREATE POLICY "anonymous_cart_update" ON "Carts"
    FOR UPDATE USING (
        (auth.jwt() ->> 'is_anonymous')::boolean = true AND
        "userId"::text = auth.uid()::text
    );

-- 5. Order Table Policies
-- Users can view their own orders (permanent users only)
CREATE POLICY "users_own_orders" ON "Orders"
    FOR SELECT USING (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        ("userId"::text = auth.uid()::text OR (auth.jwt() ->> 'role')::text = 'admin')
    );

-- Only permanent users can create orders (no anonymous checkout)
CREATE POLICY "permanent_users_create_orders" ON "Orders"
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        (auth.jwt() ->> 'role')::text IN ('end_user', 'seller', 'admin') AND
        "userId"::text = auth.uid()::text
    );

-- Users can update their own orders
CREATE POLICY "users_update_own_orders" ON "Orders"
    FOR UPDATE USING (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        ("userId"::text = auth.uid()::text OR (auth.jwt() ->> 'role')::text = 'admin')
    ) WITH CHECK (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        ("userId"::text = auth.uid()::text OR (auth.jwt() ->> 'role')::text = 'admin')
    );

-- 6. Admin Actions Table Policies
-- Only admins can view admin actions
CREATE POLICY "admin_actions_admin_only" ON admin_actions
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 7. Additional Product Policies for Inventory Management
-- Sellers can update inventory for their own products
CREATE POLICY "sellers_update_inventory" ON "IngredientCategorized"
    FOR UPDATE USING (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        (auth.jwt() ->> 'role')::text IN ('seller', 'admin') AND
        (seller_id::text = auth.uid()::text OR (auth.jwt() ->> 'role')::text = 'admin')
    ) WITH CHECK (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        (auth.jwt() ->> 'role')::text IN ('seller', 'admin') AND
        (seller_id::text = auth.uid()::text OR (auth.jwt() ->> 'role')::text = 'admin')
    );

-- 8. Product Search and Filtering Policies
-- Public product search (including anonymous users)
CREATE POLICY "products_public_search" ON "IngredientCategorized"
    FOR SELECT USING (
        is_active = true
    );

-- 9. Verification Queries to Test Policies
-- Test user access policies
SELECT 
    'User Policies Test' as test_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'seller' THEN 1 END) as seller_count,
    COUNT(CASE WHEN role = 'end_user' THEN 1 END) as end_user_count
FROM "Users";

-- Test product access policies
SELECT 
    'Product Policies Test' as test_name,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
    COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as products_with_seller,
    COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as in_stock_products
FROM "IngredientCategorized";

-- 10. Policy Verification Queries
-- Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('Users', 'Carts', 'Orders', 'IngredientCategorized', 'admin_actions')
ORDER BY tablename;

-- Check all policies on key tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('Users', 'Carts', 'Orders', 'IngredientCategorized', 'admin_actions')
ORDER BY tablename, policyname; 