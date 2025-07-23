# Data Methods and Implementation

## Overview
This document consolidates the current methods, philosophy, and implementation details for ingredient-to-canonical mapping, normalization, and audit-driven data improvement in the Dynable project (as of July 2024).

---

## 🚀 Current Workflow & Philosophy

### 1. **Iterative Audit-Driven Process**
- Run a comprehensive, batch-optimized audit across all recipes to measure mapping and real product coverage.
- Review the top unmapped ingredients after each audit, focusing on high-frequency and true product terms.
- Use the audit output as the single source of truth for progress and next steps.

### 2. **Normalization & Cleaning**
- Aggressively clean ingredient names to remove descriptors, action words, and variants, while preserving core ingredient identity.
- Maintain a normalization dictionary for common variants (e.g., "brown sugar" → "sugar", "coarsely black pepper" → "black pepper").
- Expand the normalization dictionary only for clear, unambiguous cases to avoid contradictions with the database.

### 3. **Mapping & Canonical Management**
- For each unmapped true product, add a canonical and a direct mapping in the database.
- Always check for existing canonicals and mappings to avoid duplicates or contradictions.
- For ambiguous or generic terms (e.g., "vegetables", "cooking"), ignore or flag for manual review rather than mapping.
- Ensure all new canonicals have real product associations in the `IngredientCategorized` table.

### 4. **Safe, Auditable, and Scalable**
- All changes are made in batch scripts with logging and validation.
- Each round of fixes is followed by a full audit to measure impact and surface new unmapped ingredients.
- The process is designed to be repeatable, safe, and to avoid regressions or contradictions.

---

## 📊 Current State (July 2024)
- **Mapped Ingredients:** 547,169 / 694,104 (**78.8%**)
- **Real Product Coverage:** 426,577 / 694,104 (**61.5%**)
- **Unmapped Ingredients:** 49,353 unique types (mostly generic, ambiguous, or rare terms)
- All high-frequency true products and variants are mapped or normalized; remaining work is focused on edge cases and rare terms.

### **Top Unmapped Ingredients (as of this audit)**
1. brown sugar (349 recipes)
2. vegetables (242)
3. cooking (199)
4. pie (179)
5. powder (175)
6. oats (166)
7. beef stew (149)
8. green olives (143)
9. low sodium soy sauce (143)
10. unsweetened coconut milk (142)
11. egg to blend (142)
12. wild rice (142)
13. % milk (141)
14. chocolate syrup (141)
15. chicken cubes (138)
16. processed cheese food (138)
17. butter bits (137)
18. instant chocolate pudding (137)
19. flax seeds (136)
20. sauerkraut (136)

---

## 📝 **Summary of the Approach**
- **Audit → Review Unmapped → Clean/Normalize/Map → Audit Again**
- Never introduce contradictions between normalization and database mappings.
- Manual review for ambiguous/generic terms; batch scripts for everything else.
- Progress is tracked by audit output and the shrinking unmapped list.

---

## 🏁 **Next Steps**
1. Review and address the next batch of top unmapped ingredients (focus on true products and high-frequency variants)
2. Continue expanding normalization for clear variants
3. Ignore or flag generic/ambiguous terms (e.g., "vegetables", "cooking", "% milk")
4. Ensure all new canonicals have real product associations in `IngredientCategorized`
5. Re-audit after each round of fixes
6. Document edge cases and update process documentation as needed 