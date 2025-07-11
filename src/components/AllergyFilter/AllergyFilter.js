import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import './AllergyFilter.css'
import { useSearchCookieHandler } from '../../helperfunc/useCookieHandler'
import { setAllergies } from '../../redux/allergiesSlice'

const AllergyFilter = () => {
    const { saveAllergensToCookies, initializeAllergensFromCookies } = useSearchCookieHandler()
    const dispatch = useDispatch();

    const allergies = useSelector((state) => state.allergies?.allergies || {});
    const loading = useSelector((state) => state.allergies?.loading || false);

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

    // Only initialize Redux from cookies if Redux state is empty
    useEffect(() => {
        if (!Object.keys(allergies).length) {
            initializeAllergensFromCookies();
        }
    }, []); // Only run on mount

    // Simple click handler that works reliably on all devices
    const handleAllergyClick = (allergyKey, event) => {
        // Prevent any default behavior
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        const updatedAllergies = {
            ...allergies,
            [allergyKey]: !allergies[allergyKey]
        };
        
        // Update Redux first
        dispatch(setAllergies(updatedAllergies));
        
        // Then update cookies
        saveAllergensToCookies(updatedAllergies);
    };

    // Show loading state if allergens are still being fetched
    if (loading) {
        return (
            <div className="horizontal-scroll-container">
                <div className="horizontal-scroll">
                    <div className="scroll-item">Loading allergens...</div>
                </div>
            </div>
        );
    }

    // Use fallback allergens if no allergens are loaded
    const allergyKeys = Object.keys(allergies).length > 0 ? Object.keys(allergies) : Object.keys(fallbackAllergens);
    const displayAllergies = Object.keys(allergies).length > 0 ? allergies : fallbackAllergens;

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