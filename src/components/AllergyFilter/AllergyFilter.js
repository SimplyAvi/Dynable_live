import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import './AllergyFilter.css'
import { useSearchCookieHandler } from '../../helperfunc/useCookieHandler'
import { setAllergies, toggleAllergy } from '../../redux/allergiesSlice'

const AllergyFilter = () => {
    const { saveAllergensToCookies, initializeAllergensFromCookies } = useSearchCookieHandler()
    const dispatch = useDispatch();

    const allergies = useSelector((state) => state.allergies?.allergies || {});
    const loading = useSelector((state) => state.allergies?.loading || false);
    const error = useSelector((state) => state.allergies?.error || null);

    // Fallback allergens in case API fails
    const fallbackAllergens = {
        milk: false,
        eggs: false,
        fish: false,
        shellfish: false,
        treeNuts: false,
        peanuts: false,
        wheat: false,
        soy: false,
        sesame: false,
        gluten: false,
    };

    // Debug logging
    useEffect(() => {
        console.log('[AllergyFilter] Component mounted');
        console.log('[AllergyFilter] Current Redux state:', {
            allergies: Object.keys(allergies),
            allergiesCount: Object.keys(allergies).length,
            loading,
            error
        });
    }, [allergies, loading, error]);

    // Only initialize Redux from cookies if Redux state is empty
    useEffect(() => {
        if (!Object.keys(allergies).length) {
            console.log('[AllergyFilter] No allergies in Redux, initializing from cookies');
            initializeAllergensFromCookies();
        } else {
            console.log('[AllergyFilter] Allergies already in Redux:', Object.keys(allergies));
        }
    }, []); // Only run on mount

    // Improved click handler that uses Redux toggleAllergy action
    const handleAllergyClick = (allergyKey, event) => {
        // Prevent any default behavior
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        console.log(`[AllergyFilter] Toggling allergen: ${allergyKey}`);
        console.log(`[AllergyFilter] Current state for ${allergyKey}:`, allergies[allergyKey]);
        
        // Use Redux action for toggling
        dispatch(toggleAllergy(allergyKey));
        
        // Update cookies with new state (will be handled by useEffect)
        const updatedAllergies = {
            ...allergies,
            [allergyKey]: !allergies[allergyKey]
        };
        saveAllergensToCookies(updatedAllergies);
    };

    // Show loading state if allergens are still being fetched
    if (loading) {
        console.log('[AllergyFilter] Showing loading state');
        return (
            <div className="horizontal-scroll-container">
                <div className="horizontal-scroll">
                    <div className="scroll-item">Loading allergens...</div>
                </div>
            </div>
        );
    }

    // Show error state if allergens failed to load
    if (error) {
        console.warn('[AllergyFilter] Using fallback allergens due to error:', error);
    }

    // Use fallback allergens if no allergens are loaded
    const allergyKeys = Object.keys(allergies).length > 0 ? Object.keys(allergies) : Object.keys(fallbackAllergens);
    const displayAllergies = Object.keys(allergies).length > 0 ? allergies : fallbackAllergens;

    console.log(`[AllergyFilter] Rendering ${allergyKeys.length} allergens:`, allergyKeys);
    console.log(`[AllergyFilter] Using ${Object.keys(allergies).length > 0 ? 'Redux state' : 'fallback'} allergens`);

    return (
        <div className="horizontal-scroll-container allergen-scroll-container">
            <div className="horizontal-scroll">
                {allergyKeys.map((allergyKey) => {
                    const isSelected = displayAllergies[allergyKey];
                    
                    return (
                        <div 
                            key={allergyKey}
                            className="allergy-scroll-item"
                            onClick={(e) => handleAllergyClick(allergyKey, e)}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            aria-label={`Toggle ${allergyKey} allergen filter`}
                            style={{ 
                                cursor: 'pointer',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                MozUserSelect: 'none',
                                msUserSelect: 'none',
                                backgroundColor: isSelected ? '#3a7bd5' : '#fff',
                                color: isSelected ? '#fff' : '#222',
                                border: isSelected ? '1.5px solid #3a7bd5' : '1.5px solid #bbb',
                                minWidth: '50px',
                                borderRadius: '16px',
                                padding: '8px 12px',
                                textAlign: 'center',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
                                flexShrink: 0,
                                fontWeight: '500',
                                fontSize: '14px',
                                transition: 'all 0.2s ease',
                                pointerEvents: 'auto',
                                position: 'relative',
                                zIndex: 1
                            }}
                        >
                            {allergyKey}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default AllergyFilter