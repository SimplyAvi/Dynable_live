-- 🎯 BASIC TABLE CHECK - 100% RELIABLE
-- Simple queries to check which tables exist

-- Check if IngredientCategorized exists
SELECT 'IngredientCategorized' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'IngredientCategorized') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check if SearchPreferences exists  
SELECT 'SearchPreferences' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SearchPreferences') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check if AllergenDerivatives exists
SELECT 'AllergenDerivatives' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AllergenDerivatives') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check if CanonicalIngredients exists
SELECT 'CanonicalIngredients' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CanonicalIngredients') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check if UserHistories exists
SELECT 'UserHistories' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'UserHistories') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check if Food exists
SELECT 'Food' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Food') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- List all tables with 'allergen' in name
SELECT 'Tables with allergen in name:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name ILIKE '%allergen%';

-- List all tables with 'ingredient' in name  
SELECT 'Tables with ingredient in name:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name ILIKE '%ingredient%';

-- List all tables with 'search' in name
SELECT 'Tables with search in name:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name ILIKE '%search%';

-- List all tables in database
SELECT 'All tables in database:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 