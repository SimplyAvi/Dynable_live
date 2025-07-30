# Search Preferences System

**Author:** Justin Linzan  
**Date:** January 2025  
**Version:** 1.0.0

## Overview

The Search Preferences System implements database-first search persistence following the same successful pattern as the cart system. This ensures search terms and selected allergens persist through the anonymous → authenticated user flow using Supabase.

## Architecture

### Database-First Approach
- **No localStorage dependency** - All data stored in Supabase
- **Consistent with cart system** - Same patterns and reliability
- **Cross-device consistency** - Preferences available everywhere
- **Robust error handling** - Graceful degradation

### Key Components

1. **Database Schema** (`SearchPreferences` table)
2. **Database Functions** (save, get, merge, clear)
3. **Redux Integration** (state management)
4. **Authentication Flow** (save before OAuth, merge during callback)
5. **Component Integration** (Searchbar, AllergyFilter, App)

## Database Schema

### SearchPreferences Table
```sql
CREATE TABLE "SearchPreferences" (
    "id" SERIAL PRIMARY KEY,
    "supabase_user_id" UUID NOT NULL,
    "search_term" TEXT DEFAULT '',
    "selected_allergens" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS Policies
- **Admin access**: Can view all search preferences
- **User access**: Can only access own preferences
- **Anonymous access**: Can access own preferences

### Database Functions
- `save_search_preferences(userId, searchTerm, allergens)`
- `get_search_preferences(userId)`
- `merge_search_preferences(anonymousUserId, authenticatedUserId)`
- `clear_search_preferences(userId)`

## User Flows

### Anonymous User Flow
1. **Search**: User searches "pizza" → saved to database
2. **Filter**: User toggles "gluten" → saved to database
3. **Login**: User clicks login → preferences saved before OAuth
4. **OAuth**: OAuth redirect occurs
5. **Callback**: Preferences merged during OAuth callback
6. **Restore**: User sees "pizza" + "gluten" restored
7. **Logout**: User logs out → preferences cleared

### Authenticated User Flow
1. **Search**: User searches "chicken" → saved to database
2. **Filter**: User toggles "eggs" → saved to database
3. **Refresh**: User refreshes page → preferences loaded
4. **Restore**: User sees "chicken" + "eggs" restored

## Implementation Details

### Redux State Structure
```javascript
{
  searchPreferences: {
    searchTerm: '',
    selectedAllergens: [],
    isLoading: false,
    error: null,
    lastSaved: null,
    hasPreferences: false
  }
}
```

### Key Actions
- `saveSearchPreferencesAsync` - Save to database
- `loadSearchPreferencesAsync` - Load from database
- `mergeSearchPreferencesAsync` - Merge during login
- `clearSearchPreferencesAsync` - Clear on logout
- `setSearchTerm` - Update search term
- `setSelectedAllergens` - Update allergens
- `toggleAllergen` - Toggle specific allergen

### Component Integration

#### Searchbar Component
- Saves search term and allergens on form submission
- Integrates with existing search functionality
- Handles both anonymous and authenticated users

#### AllergyFilter Component
- Saves allergen preferences on toggle
- Updates Redux state immediately
- Persists to database for authenticated users

#### App Component
- Loads preferences on app startup
- Handles authentication state changes
- Clears preferences on logout

### Authentication Flow Integration

#### Login Process
1. **Save before OAuth**: Search preferences saved to database
2. **OAuth redirect**: User redirected to Google
3. **OAuth callback**: Preferences merged during callback
4. **State update**: Redux state updated with merged preferences

#### Logout Process
1. **Clear Redux**: Local state cleared
2. **Clear database**: Database preferences cleared (optional)
3. **Reset UI**: Search bar and filters reset

## Error Handling

### Database Errors
- Connection failures handled gracefully
- RLS policy violations logged
- Invalid data types validated

### Network Errors
- Retry logic for failed requests
- Fallback to local state
- User-friendly error messages

### Component Errors
- Graceful degradation
- Loading states during operations
- Error boundaries for React components

## Performance Optimizations

### Database
- Indexes on `supabase_user_id` and `createdAt`
- Efficient JSONB queries for allergens
- Minimal data transfer

### Redux
- Optimistic updates for better UX
- Debounced saves to reduce database calls
- Efficient state updates

### Components
- Memoized selectors for performance
- Minimal re-renders
- Lazy loading of preferences

## Testing

### Test Coverage
- Database schema and functions
- Redux integration
- Authentication flow
- Component integration
- Error handling
- Performance metrics

### Test Scripts
- `test_search_preferences_system.js` - Comprehensive system test
- Unit tests for individual functions
- Integration tests for user flows

## Migration Guide

### From localStorage
1. **Remove localStorage dependencies**
2. **Update components to use Redux**
3. **Test authentication flows**
4. **Verify data persistence**

### From cookies
1. **Remove cookie dependencies**
2. **Update AllergyFilter component**
3. **Test allergen persistence**
4. **Verify cross-device sync**

## Troubleshooting

### Common Issues

#### Preferences Not Saving
- Check user authentication status
- Verify database permissions
- Check Redux state updates
- Review console logs

#### Preferences Not Loading
- Check database connection
- Verify RLS policies
- Check user ID consistency
- Review authentication flow

#### Merge Not Working
- Check anonymous user ID storage
- Verify merge function calls
- Check database function permissions
- Review OAuth callback flow

### Debug Commands
```javascript
// Check current preferences
console.log('Search preferences:', store.getState().searchPreferences);

// Check database state
const { data } = await supabase.rpc('get_search_preferences', { p_user_id: userId });

// Check authentication status
const { data: { user } } = await supabase.auth.getUser();
```

## Future Enhancements

### Planned Features
- **Search history**: Track multiple searches
- **Preference sync**: Real-time sync across devices
- **Analytics**: Track search patterns
- **Personalization**: ML-based search suggestions

### Performance Improvements
- **Caching**: Redis cache for frequent queries
- **Compression**: Compress allergen arrays
- **Batch operations**: Batch multiple preference updates

## Conclusion

The Search Preferences System provides robust, database-first search persistence that seamlessly integrates with the existing authentication and cart systems. It ensures users never lose their search context when transitioning between anonymous and authenticated states.

The system follows established patterns, provides comprehensive error handling, and maintains excellent performance characteristics while delivering a superior user experience. 