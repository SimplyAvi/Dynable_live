# Phase 3: Build Ingredient Taxonomy - Strategy Document

## 🎯 Goal

Extract and categorize **canonical ingredients** from 683,784 recipe ingredient entries to create a semantic taxonomy that will power the new matching system.

## 📊 Current State

- **RecipeIngredients table**: 683,784 records
- **Sample raw data**:
  - `"cup dried cranberries*"`
  - `"tablespoons flax seed"`
  - `"apple - peeled, cored, and chopped"`
  - `"1/2 teaspoons brown sugar, or to taste"`

**Problem**: These are messy, include quantities, preparation notes, and variations.

## 🎯 Target State

Clean **`ingredients`** table with:
- Canonical names (e.g., "cranberries", "flax seed", "apple", "brown sugar")
- Semantic categories (e.g., "fruit", "seed", "fruit", "sweetener")
- Aliases for variations
- Allergen information

---

## 🔄 Phase 3 Strategy (Multi-Step Approach)

### **Step 1: Extract Raw Ingredient Names** ✅
**Goal**: Get unique ingredient names from recipes

```sql
-- Extract distinct ingredient names (will result in ~50,000-100,000 unique entries)
SELECT DISTINCT name FROM "RecipeIngredients";
```

### **Step 2: Clean and Normalize** 🧹
**Goal**: Remove quantities, prep notes, and normalize text

**Cleaning Rules**:
1. Remove quantities: `"1 cup"`, `"2 tablespoons"`, `"1/2 teaspoon"`
2. Remove measurements: `"cup"`, `"tablespoon"`, `"teaspoon"`, `"ounce"`, `"pound"`
3. Remove prep notes: `"peeled"`, `"chopped"`, `"diced"`, `"to taste"`
4. Remove special characters: `"*"`, `"-"`, `"()"`
5. Convert to lowercase
6. Trim whitespace

**Example transformations**:
- `"cup dried cranberries*"` → `"dried cranberries"`
- `"apple - peeled, cored, and chopped"` → `"apple"`
- `"1/2 teaspoons brown sugar, or to taste"` → `"brown sugar"`

### **Step 3: Deduplicate** 🔄
**Goal**: Combine similar ingredients

After cleaning, we'll likely have:
- ~10,000-20,000 unique canonical ingredients
- Many duplicates due to variations

### **Step 4: Categorize** 📁
**Goal**: Assign semantic categories

**Category System** (from DATABASE_ARCHITECTURE_ANALYSIS.md):
- `protein` (meat, fish, eggs, legumes)
- `vegetable` (all vegetables)
- `fruit` (all fruits)
- `dairy` (milk, cheese, yogurt)
- `grain` (rice, wheat, pasta)
- `spice` (herbs and spices)
- `sweetener` (sugar, honey, syrup)
- `fat` (oil, butter)
- `liquid` (water, broth, juice)
- `condiment` (sauce, dressing)
- `nut` (all nuts and seeds)
- `baking` (flour, baking powder)
- `other` (miscellaneous)

**Subcategories** (examples):
- protein → `poultry`, `beef`, `fish`, `legume`
- vegetable → `leafy_green`, `root`, `nightshade`
- fruit → `citrus`, `berry`, `stone_fruit`

### **Step 5: Add Aliases** 🔤
**Goal**: Handle variations and synonyms

Examples:
- `egg` → aliases: `["eggs", "whole egg", "chicken egg"]`
- `eggplant` → aliases: `["aubergine", "brinjal"]`
- `cilantro` → aliases: `["coriander", "chinese parsley"]`
- `scallion` → aliases: `["green onion", "spring onion"]`

### **Step 6: Add Allergen Info** ⚠️
**Goal**: Mark common allergens

Common allergens:
- `egg`, `milk`, `peanut`, `tree nut`, `soy`, `wheat`, `fish`, `shellfish`, `sesame`

---

## 🛠️ Implementation Approaches

### **Approach A: Simple SQL Extraction (Fast, Basic)**

**Pros**:
- Quick to implement
- Gets us started immediately
- Works with existing data

**Cons**:
- Results in "unknown" category for most ingredients
- Manual categorization required
- No automatic cleaning

**Timeline**: 1-2 days

### **Approach B: USDA Import (Comprehensive, Recommended)**

**Pros**:
- 8,000+ pre-categorized ingredients
- Professional taxonomy
- Allergen information included
- Saves months of manual work

**Cons**:
- Requires USDA API key (free)
- Need to map USDA categories to our semantic categories
- Additional setup

**Timeline**: 3-5 days (including setup and mapping)

### **Approach C: Hybrid (Best)**

**Pros**:
- Start with USDA as foundation (~8,000 ingredients)
- Add recipe-specific ingredients on top
- Gradual improvement over time

**Cons**:
- Most complex initially
- Requires both approaches

**Timeline**: 1 week

---

## 📋 Recommended Implementation Plan

### **Phase 3A: Quick Start (Days 1-2)**

1. Extract and clean ingredient names from recipes
2. Insert into `ingredients` table with `category = 'unknown'`
3. Get basic taxonomy in place
4. Result: ~10,000 ingredients, mostly uncategorized

### **Phase 3B: USDA Enhancement (Days 3-5)**

1. Get USDA API key (free, instant)
2. Import USDA FoodData Central taxonomy
3. Match recipe ingredients to USDA foods
4. Update categories with USDA data
5. Result: ~5,000-8,000 ingredients with proper categories

### **Phase 3C: Manual Curation (Days 6-7)**

1. Export top 500 most-used ingredients
2. Manually categorize remaining "unknown" ingredients
3. Add aliases for common variations
4. Result: High-quality taxonomy ready for Phase 4

---

## 🎯 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Total unique ingredients | 10,000-20,000 | TBD |
| Categorized ingredients | >80% | TBD |
| With aliases | >500 (top ingredients) | TBD |
| With allergen info | All common allergens | TBD |
| Coverage of recipes | >90% | TBD |

---

## 🚀 Next Immediate Steps

**For you to decide**:

1. **Quick Start** → Simple SQL extraction, get basic taxonomy in place today
2. **USDA First** → Get API key, import professional taxonomy (recommended)
3. **Review & Plan** → Take time to review the strategy before proceeding

**My Recommendation**: Start with **Quick Start** (Phase 3A) to get something working, then enhance with USDA in Phase 3B. This gives us:
- ✅ Immediate progress
- ✅ Something to test with
- ✅ Foundation for USDA enhancement
- ✅ Flexibility to iterate

What would you like to do?

