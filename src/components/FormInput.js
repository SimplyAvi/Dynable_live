/**
 * Form Input Component
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Reusable form input component:
 * - Handles text input fields
 * - Supports labels and placeholders
 * - Customizable through props
 * - Consistent styling across forms
 * 
 * Props:
 * - handleChange: Change event handler
 * - label: Input label text
 * - otherProps: Additional input properties
 */

import React from 'react'

const FormInput = ({handleChange, label, ...otherProps}) => {
    return(
        <div className="form-input-container">
            {label && <label className="form-input-label">{label}</label>}
            <input 
                className='form-input' 
                onChange={handleChange} 
                placeholder={label}
                {...otherProps}
            />
        </div>
    )
}

export default FormInput