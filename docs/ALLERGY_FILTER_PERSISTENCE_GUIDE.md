# Allergy Filter Persistence System

## Overview

The enhanced allergy filter system provides persistent allergen toggling across sessions, similar to a shopping cart system. Users can toggle allergens while anonymous, have their selections persist, and then merge with their account when they log in.

## Key Features

### ✅ Persistent Allergen Toggling
- Users can toggle allergens while anonymous
- Preferences are saved to database and cookies
- Selections persist across browser sessions

### ✅ Authentication Flow Integration
- Anonymous preferences are saved before authentication
- Preferences are merged when user logs in
- Users continue where they left off

### ✅ Multi-Source Initialization
- Priority 1: Authenticated user preferences from database
- Priority 2: Anonymous user preferences from database  
- Priority 3: Cookie fallback for offline scenarios

### ✅ Search Integration
- Allergen preferences work with search terms
- Combined filtering for better user experience
- Persistent search + allergen combinations

## System Architecture

### Components

1. **AllergyFilter Component** (`src/components/AllergyFilter/AllergyFilter.js`)
   - Main UI component for toggling allergens
   - Integrates with Redux state management
   - Handles persistence to database and cookies

2. **Search Preferences Slice** (`src/redux/searchPreferencesSlice.js`)
   - Redux state management for search preferences
   - Handles async operations for database persistence
   - Manages authentication flow integration

3. **Search Preferences Manager** (`src/utils/searchPreferencesManager.js`)
   - Handles authentication flow for search preferences
   - Manages anonymous to authenticated user conversion
   - Provides utility functions for preference management

4. **Search Preferences Utils** (`src/utils/searchPreferences.js`)
   - Database operations for search preferences
   - CRUD operations for preferences storage
   - Merge functionality for authentication flow

### Data Flow

```
User Toggles Allergen
        ↓
AllergyFilter Component
        ↓
Redux State Update (allergiesSlice)
        ↓
Save to Database (searchPreferencesSlice)
        ↓
Save to Cookies (fallback)
        ↓
Persist Across Sessions
```

### Authentication Flow

```
Anonymous User Toggles Allergens
        ↓
Save to Database (anonymous user ID)
        ↓
User Logs In
        ↓
Save Current Preferences Before Auth
        ↓
Merge Anonymous + Authenticated Preferences
        ↓
Load Merged Preferences
        ↓
Continue Where Left Off
```

## Implementation Details

### AllergyFilter Component

The enhanced `AllergyFilter` component now:

1. **Multi-Source Initialization**: Checks multiple sources for existing preferences
2. **Database Persistence**: Saves allergen selections to database
3. **Authentication Integration**: Works with anonymous and authenticated users
4. **Error Handling**: Graceful fallback to cookies if database fails

```javascript
// Enhanced click handler with persistent storage
const handleAllergyClick = async (allergyKey, event) => {
    // Toggle in Redux
    dispatch(toggleAllergy(allergyKey));
    
    // Save to cookies (fallback)
    saveAllergensToCookies(updatedAllergies);
    
    // Save to database (persistent)
    await dispatch(saveSearchPreferencesAsync({
        searchTerm: searchPreferences.searchTerm || '',
        allergens: selectedAllergens,
        userId: userId // anonymous or authenticated
    }));
};
```

### Search Preferences Manager

The `searchPreferencesManager` provides:

1. **Before Auth Save**: Saves anonymous preferences before authentication
2. **After Auth Load**: Loads merged preferences after authentication
3. **Merge Operations**: Combines anonymous and authenticated preferences
4. **Cleanup**: Handles logout and session cleanup

```javascript
// Save before authentication
const saveResult = await searchPreferencesManager.saveSearchPreferencesBeforeAuth(
    searchTerm, 
    allergens, 
    anonymousUserId
);

// Merge on authentication
const mergeResult = await searchPreferencesManager.mergeSearchPreferencesOnLogin(
    anonymousUserId,
    authenticatedUserId
);
```

### Database Integration

The system uses Supabase RPC functions for database operations:

- `save_search_preferences`: Save preferences for any user
- `get_search_preferences`: Retrieve preferences for any user
- `merge_search_preferences`: Merge anonymous and authenticated preferences
- `clear_search_preferences`: Clear preferences on logout

## Usage Examples

### Basic Allergen Toggle

```javascript
// User toggles an allergen
const handleAllergyClick = async (allergyKey) => {
    // Toggle in Redux
    dispatch(toggleAllergy(allergyKey));
    
    // Save to database
    const selectedAllergens = Object.keys(allergies)
        .filter(key => allergies[key])
        .map(key => key.toLowerCase());
    
    await dispatch(saveSearchPreferencesAsync({
        searchTerm: currentSearchTerm,
        allergens: selectedAllergens,
        userId: currentUserId
    }));
};
```

### Authentication Flow

```javascript
// Before authentication (in Login component)
const saveResult = await searchPreferencesManager.saveSearchPreferencesBeforeAuth(
    searchTerm,
    selectedAllergens,
    anonymousUserId
);

// After authentication (in GoogleCallback component)
const mergeResult = await searchPreferencesManager.mergeSearchPreferencesOnLogin(
    anonymousUserId,
    authenticatedUserId
);
```

### Loading Preferences

```javascript
// Initialize preferences from multiple sources
const initializeAllergies = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && !isAnonymousUser(user.id)) {
        // Load authenticated user preferences
        await dispatch(loadSearchPreferencesAsync({ userId: user.id }));
    } else {
        // Load anonymous user preferences
        const anonymousId = getAnonymousUserId();
        if (anonymousId) {
            await dispatch(loadSearchPreferencesAsync({ userId: anonymousId }));
        } else {
            // Fallback to cookies
            initializeAllergensFromCookies();
        }
    }
};
```

## Testing

### Test Scripts

1. **Persistence Test**: Tests complete flow from anonymous to authenticated
2. **Component Test**: Tests UI component integration
3. **Integration Test**: Tests with existing authentication system

### Running Tests

```bash
# Run all allergy filter tests
node test_allergy_filter.js

# Run specific test
node -e "import('./src/tests/test_allergy_filter_persistence.js').then(m => m.testAllergyFilterPersistence())"
```

### Test Coverage

- ✅ Anonymous user allergen toggling
- ✅ Database persistence
- ✅ Authentication flow integration
- ✅ Preference merging
- ✅ Session persistence
- ✅ Error handling and fallbacks

## Error Handling

### Fallback Strategy

1. **Database First**: Try to save/load from database
2. **Cookie Fallback**: Use cookies if database fails
3. **Local State**: Use Redux state as last resort

### Error Recovery

```javascript
try {
    // Try database operation
    await dispatch(saveSearchPreferencesAsync(preferences));
} catch (error) {
    console.warn('Database save failed, using cookie fallback');
    // Fallback to cookies
    saveAllergensToCookies(allergies);
}
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Only load preferences when needed
2. **Debounced Saves**: Batch multiple allergen toggles
3. **Caching**: Cache preferences in Redux state
4. **Minimal Database Calls**: Use efficient RPC functions

### Memory Management

- Clean up anonymous data after successful merge
- Clear preferences on logout
- Handle session expiration gracefully

## Security Considerations

### Data Protection

1. **User Isolation**: Preferences are user-specific
2. **Anonymous Session Limits**: Temporary storage for anonymous users
3. **Authentication Required**: Sensitive operations require authentication
4. **Data Validation**: Validate allergen data before saving

### Privacy

- Anonymous preferences are temporary
- Data is cleared on logout
- No personal information in preferences

## Troubleshooting

### Common Issues

1. **Preferences Not Persisting**
   - Check database connection
   - Verify user ID is available
   - Check cookie permissions

2. **Merge Not Working**
   - Verify anonymous user ID exists
   - Check database merge function
   - Validate user authentication state

3. **Component Not Updating**
   - Check Redux state updates
   - Verify useEffect dependencies
   - Check for stale closures

### Debug Tools

```javascript
// Enable debug logging
console.log('[AllergyFilter] Debug mode enabled');

// Check current state
console.log('Current allergies:', allergies);
console.log('Current preferences:', searchPreferences);

// Verify database state
const prefs = await getSearchPreferences(userId);
console.log('Database preferences:', prefs);
```

## Future Enhancements

### Planned Features

1. **Allergen Categories**: Group allergens by type
2. **Custom Allergens**: User-defined allergen entries
3. **Allergen Severity**: Different levels of allergen sensitivity
4. **Cross-Platform Sync**: Sync preferences across devices
5. **Analytics**: Track allergen selection patterns

### API Extensions

```javascript
// Future API for enhanced features
const allergyAPI = {
    // Get allergen categories
    getCategories: () => {},
    
    // Add custom allergen
    addCustomAllergen: (name, severity) => {},
    
    // Get allergen recommendations
    getRecommendations: (userId) => {},
    
    // Export preferences
    exportPreferences: (userId) => {}
};
```

## Conclusion

The enhanced allergy filter persistence system provides a seamless user experience where allergen preferences persist across sessions and merge seamlessly during authentication. The system is robust, handles errors gracefully, and integrates well with the existing authentication and cart systems.

The implementation follows the same patterns as the cart system, ensuring consistency and maintainability across the application. 