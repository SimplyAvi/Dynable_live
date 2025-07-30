# 🚨 DATABASE PERFORMANCE CRISIS: Allergen Filtering Timeouts

## **CRITICAL ISSUE**
- **Database timeouts** on allergen filtering queries
- **243,114 products** causing `ILIKE` operations to timeout
- **Error code 57014**: "canceling statement due to statement timeout"
- **Affected queries**: `description NOT ILIKE '%allergen%'`

## **IMMEDIATE ACTION TAKEN**
✅ **Allergen filtering DISABLED** in `src/utils/supabaseQueries.js`
✅ **User notification** added in `AllergyFilter.js`
✅ **Search functionality preserved** (no filtering applied)

## **ROOT CAUSE ANALYSIS**

### **Problem Query:**
```sql
SELECT * FROM "IngredientCategorized" 
WHERE description NOT ILIKE '%milk%' 
AND description NOT ILIKE '%peanuts%'
-- ... additional allergen filters
```

### **Performance Issues:**
1. **Unindexed text field**: `description` column has no indexes
2. **Large dataset**: 243,114 products to scan
3. **Multiple ILIKE operations**: Each allergen adds another scan
4. **Case-insensitive matching**: `ILIKE` is slower than `LIKE`

## **SOLUTION ROADMAP**

### **Phase 1: Immediate Fix (COMPLETED)**
- [x] Disable allergen filtering
- [x] Add user notification
- [x] Preserve search functionality

### **Phase 2: Database Optimization (PRIORITY)**
- [ ] **Create text indexes** on `description` column
- [ ] **Add GIN indexes** for full-text search
- [ ] **Optimize query structure** with proper indexing
- [ ] **Consider materialized views** for common allergen combinations

### **Phase 3: Alternative Approaches**
- [ ] **Pre-computed allergen flags** in separate columns
- [ ] **Separate allergen table** with foreign key relationships
- [ ] **Elasticsearch integration** for advanced text search
- [ ] **Caching layer** for filtered results

## **RECOMMENDED DATABASE INDEXES**

### **1. Basic Text Index:**
```sql
CREATE INDEX idx_ingredient_description_gin ON "IngredientCategorized" 
USING gin(to_tsvector('english', description));
```

### **2. Trigram Index for ILIKE:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_ingredient_description_trgm ON "IngredientCategorized" 
USING gin(description gin_trgm_ops);
```

### **3. Composite Index for Common Allergens:**
```sql
-- Pre-compute common allergen flags
ALTER TABLE "IngredientCategorized" 
ADD COLUMN has_milk BOOLEAN DEFAULT FALSE,
ADD COLUMN has_peanuts BOOLEAN DEFAULT FALSE,
ADD COLUMN has_gluten BOOLEAN DEFAULT FALSE;

-- Update existing data
UPDATE "IngredientCategorized" 
SET has_milk = description ILIKE '%milk%',
    has_peanuts = description ILIKE '%peanut%',
    has_gluten = description ILIKE '%gluten%';

-- Create indexes
CREATE INDEX idx_ingredient_allergen_flags ON "IngredientCategorized" 
(has_milk, has_peanuts, has_gluten);
```

## **TESTING PLAN**

### **Performance Testing:**
1. **Baseline**: Current timeout behavior
2. **Index testing**: Measure query performance with indexes
3. **Load testing**: Simulate concurrent user searches
4. **Monitoring**: Track query execution times

### **User Experience Testing:**
1. **Filter accuracy**: Ensure allergens are correctly identified
2. **Search speed**: Measure response times
3. **Edge cases**: Test with multiple allergen combinations

## **ROLLBACK PLAN**

If indexing doesn't solve the performance issues:

### **Option A: Simplified Filtering**
- Only filter by top 5-10 most common allergens
- Use exact matches instead of ILIKE
- Implement client-side filtering for less critical allergens

### **Option B: Caching Strategy**
- Cache filtered results for common allergen combinations
- Implement Redis or similar caching layer
- Pre-compute popular allergen combinations

### **Option C: Search Engine Integration**
- Integrate Elasticsearch for advanced text search
- Move allergen filtering to search engine
- Maintain Supabase for basic CRUD operations

## **MONITORING & ALERTS**

### **Database Monitoring:**
- Query execution time alerts (>5 seconds)
- Database connection pool monitoring
- Index usage statistics

### **Application Monitoring:**
- Search response time tracking
- User error rate monitoring
- Performance metrics collection

## **TIMELINE**

- **Week 1**: Implement database indexes
- **Week 2**: Test performance improvements
- **Week 3**: Gradual re-enabling of allergen filtering
- **Week 4**: Full deployment with monitoring

## **CONTACT**

For immediate database optimization assistance, contact the database administrator or DevOps team.

---

**Last Updated**: January 2025  
**Status**: 🚨 CRITICAL - Allergen filtering disabled  
**Priority**: HIGH - Database performance optimization required 