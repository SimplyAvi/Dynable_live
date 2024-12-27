import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setAllergies } from '../../redux/allergiesSlice'
import './AllergyFilter.css'

const AllergyFilter = () => {
    const dispatch = useDispatch()
    
    // Add console.log to check Redux state
    const allergies = useSelector((state) => {
        console.log('Redux State:', state); // Debug entire state
        console.log('Allergies State:', state.allergies); // Debug allergies slice
        return state.allergies?.allergies || {}; // Add fallback empty object
    })

    // Debug current allergies value
    console.log('Current Allergies:', allergies);

    const handleAllergyClick = (allergyKey) => {
        console.log('Clicking allergyKey:', allergyKey); // Debug click handler
        const updatedAllergies = {
            ...allergies,
            [allergyKey]: !allergies[allergyKey]
        }
        console.log('Updated Allergies:', updatedAllergies); // Debug updates
        dispatch(setAllergies(updatedAllergies))
    }

    const allergyKeys = Object.keys(allergies || {})

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