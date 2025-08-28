# 🚀 Unified Search + Filter System

## Overview

The unified search and filter system provides seamless integration between text search and allergy filtering, ensuring users can combine both features without conflicts.

## 🎯 Key Features

### Search + Filter Integration:
1. **User searches for food + has allergens toggled** → Show only searched products that match allergen filters
2. **User searches for food + no allergens toggled** → Show all products matching search
3. **User searches first, then toggles allergens** → Maintain search results but apply allergen filtering
4. **User toggles allergens first, then searches** → Search within allergen-safe products only

### Basic Search Behavior:
- **Empty search** → Show homepage (current random products/recipes)
- **No matching products** → Display "No products available"
- **No matching recipes** → Display "No recipes available"
- **Handle misspellings gracefully**

## 🏗️ Architecture

### Component Structure:
```
Homepage
└── SearchAndFilter (Unified Controller)
    ├── Searchbar (Input + Submit)
    └── AllergyFilter (Toggle + Status)
└── ShowResults (Display Results)
```

### State Management:
- **Single Source of Truth**: `searchPreferences` Redux slice
- **Search Term**: `searchPreferences.searchTerm`
- **Selected Allergens**: `searchPreferences.selectedAllergens`
- **Unified Updates**: All search/filter changes go through `SearchAndFilter`

## 🔧 Implementation Details

### SearchAndFilter Component
**File**: `src/components/SearchAndFilter/SearchAndFilter.js`

**Key Functions:**
- `performUnifiedSearch()` - Handles all search + filter combinations
- `handleSearchSubmit()` - Processes search form submission
- `handleAllergenToggle()` - Processes allergen toggle
- `handleClearFilters()` - Clears all filters

**Search Logic:**
```javascript
// 1. Search + Filters: Search within allergen-safe products
if (searchInput.trim()) {
    productResponse = await searchProductsUnified({
        searchTerm: searchInput,
        allergens: allergens,
        // ... other params
    });
}

// 2. Filters Only: Show all allergen-safe products
else if (allergens.length > 0) {
    productResponse = await searchProductsUnified({
        searchTerm: '',
        allergens: allergens,
        // ... other params
    });
}

// 3. No Search, No Filters: Show homepage content
else {
    productResponse = await searchProductsUnified({
        searchTerm: '',
        allergens: [],
        // ... other params
    });
}
```

### Searchbar Component
**File**: `src/components/Searchbar/Searchbar.js`

**Simplified Role:**
- Handles input state and form submission
- Delegates search logic to parent (`SearchAndFilter`)
- Provides loading states and error handling

**Props:**
- `searchTerm` - Current search term
- `onSearchSubmit` - Callback for search submission
- `isSearching` - Loading state
- `error` - Error state

### AllergyFilter Component
**File**: `src/components/AllergyFilter/AllergyFilter.js`

**Simplified Role:**
- Displays allergen toggles
- Delegates toggle logic to parent (`SearchAndFilter`)
- Provides status indicators and clear functionality

**Props:**
- `selectedAllergens` - Array of selected allergens
- `onAllergenToggle` - Callback for allergen toggle
- `isSearching` - Loading state

### Homepage Component
**File**: `src/pages/Homepage/Homepage.js`

**Simplified Role:**
- Loads initial data (no search, no filters)
- Renders `SearchAndFilter` and `ShowResults`
- Handles auth transitions

## 📊 State Flow

### Search Flow:
1. User types in Searchbar
2. User submits search form
3. SearchAndFilter receives search term
4. SearchAndFilter calls `performUnifiedSearch()`
5. Results are dispatched to Redux
6. ShowResults displays results

### Filter Flow:
1. User clicks allergen in AllergyFilter
2. AllergyFilter calls `onAllergenToggle()`
3. SearchAndFilter updates `selectedAllergens`
4. SearchAndFilter calls `performUnifiedSearch()`
5. Results are dispatched to Redux
6. ShowResults displays results

### Combined Flow:
1. User has search term + toggles allergen
2. SearchAndFilter detects both search and filters
3. SearchAndFilter calls `performUnifiedSearch()` with both
4. Backend searches within allergen-safe products
5. Results are dispatched to Redux
6. ShowResults displays results

## 🎨 UI/UX Features

### Status Indicators:
- **Searching**: "Searching..." with loading spinner
- **Filtering**: "Filtering products..." with progress indicator
- **Complete**: "Filtered X allergens" with success indicator
- **Saved**: "Saved to preferences" with save indicator
- **Error**: Error message with retry option

### Clear Functionality:
- **Clear All Filters**: Button to remove all allergen filters
- **Clear Search**: Reset search term to empty
- **Clear Both**: Reset both search and filters

### Responsive Design:
- Mobile-optimized touch targets
- Tablet-friendly layout
- Desktop-enhanced interactions

## 🔍 Search Scenarios

### Scenario 1: Search + Allergens
```
User searches: "chocolate"
User toggles: "milk", "nuts"
Result: Chocolate products that are milk-free and nut-free
```

### Scenario 2: Search Only
```
User searches: "pasta"
User toggles: none
Result: All pasta products
```

### Scenario 3: Allergens Only
```
User searches: (empty)
User toggles: "gluten", "dairy"
Result: All gluten-free and dairy-free products
```

### Scenario 4: No Search, No Filters
```
User searches: (empty)
User toggles: none
Result: Homepage content (random products/recipes)
```

## 🛡️ Error Handling

### Network Errors:
- Retry mechanism for failed requests
- Graceful degradation with cached results
- User-friendly error messages

### Validation Errors:
- Input validation for search terms
- Allergen validation against available options
- Clear error messages with suggestions

### State Errors:
- Redux state consistency checks
- Fallback to safe defaults
- Recovery mechanisms for corrupted state

## 📱 Mobile Optimization

### Touch Interactions:
- Large touch targets for allergen toggles
- Swipe gestures for horizontal scrolling
- Optimized keyboard handling

### Performance:
- Debounced search input
- Lazy loading of results
- Efficient re-renders

### Accessibility:
- Screen reader support
- Keyboard navigation
- High contrast mode support

## 🔧 Configuration

### Search Parameters:
```javascript
const searchParams = {
    searchTerm: '',           // Text search
    allergens: [],           // Array of allergen keys
    page: 1,                // Pagination
    limit: 20,              // Results per page
    userType: 'anonymous',   // 'anonymous' | 'authenticated'
    includeCount: true      // Include total count
};
```

### Allergen Mapping:
```javascript
const ALLERGEN_MAPPINGS = {
    'milk': 'milk',
    'eggs': 'eggs',
    'fish': 'fish',
    'shellfish': 'shellfish',
    'treenuts': 'treeNuts',
    'peanuts': 'peanuts',
    'wheat': 'wheat',
    'soy': 'soy',
    'sesame': 'sesame',
    'gluten': 'gluten'
};
```

## 🚀 Future Enhancements

### Planned Features:
- **Search Suggestions**: Auto-complete for search terms
- **Recent Searches**: History of user searches
- **Saved Searches**: User can save search + filter combinations
- **Advanced Filters**: Price, brand, category filters
- **Search Analytics**: Track popular searches and filters

### Performance Improvements:
- **Search Indexing**: Optimize database queries
- **Caching**: Cache frequent search results
- **Lazy Loading**: Load results as user scrolls
- **Virtual Scrolling**: Handle large result sets

## 📋 Testing Checklist

### Search Functionality:
- [ ] Empty search shows homepage content
- [ ] Search with no results shows "No products available"
- [ ] Search with results displays correctly
- [ ] Search term persists across page navigation

### Filter Functionality:
- [ ] Allergen toggle works correctly
- [ ] Multiple allergens can be selected
- [ ] Clear all filters works
- [ ] Filter state persists across page navigation

### Combined Functionality:
- [ ] Search + allergens work together
- [ ] Search first, then add allergens works
- [ ] Allergens first, then search works
- [ ] Clear search maintains filters
- [ ] Clear filters maintains search

### Error Handling:
- [ ] Network errors are handled gracefully
- [ ] Invalid search terms are handled
- [ ] Invalid allergens are handled
- [ ] Loading states are displayed correctly

### Mobile Testing:
- [ ] Touch interactions work on mobile
- [ ] Horizontal scrolling works smoothly
- [ ] Keyboard input works correctly
- [ ] Responsive design adapts properly

---

**Status**: ✅ Implemented and Ready for Testing
**Version**: 1.0.0
**Last Updated**: January 2025
