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

    const handleAllergyClick = (allergyKey) => {
        const updatedAllergies = {
            ...allergies,
            [allergyKey]: !allergies[allergyKey]
        };
        dispatch(setAllergies(updatedAllergies)); // Update Redux first
        saveAllergensToCookies(updatedAllergies);  // Then update cookies
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
                {allergyKeys.map((allergyKey) => (
                    <div 
                        key={allergyKey}
                        className={`allergy-scroll-item${displayAllergies[allergyKey] ? ' selected' : ''}`}
                        onClick={() => handleAllergyClick(allergyKey)}
                    >
                        {allergyKey}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AllergyFilter