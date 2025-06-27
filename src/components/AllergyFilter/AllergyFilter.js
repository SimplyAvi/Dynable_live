import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import './AllergyFilter.css'
import { useSearchCookieHandler } from '../../helperfunc/useCookieHandler'
import allergenList from '../../allergensList'
import { setAllergies } from '../../redux/allergiesSlice'

const AllergyFilter = () => {
    const { saveAllergensToCookies, initializeAllergensFromCookies } = useSearchCookieHandler()
    const dispatch = useDispatch();

    const allergies = useSelector((state) => state.allergies?.allergies || {});

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

    const allergyKeys = Object.keys(allergies || allergenList)

    return (
        <div className="horizontal-scroll-container">
            <div className="horizontal-scroll">
                {allergyKeys.map((allergyKey) => (
                    <div 
                        key={allergyKey}
                        className={`scroll-item ${allergies[allergyKey] ? 'selected' : ''}`}
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