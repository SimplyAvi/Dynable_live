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
 * - id: Input ID
 * - name: Input name
 * - otherProps: Additional input properties
 */

import React from 'react'

const FormInput = ({handleChange, label, id, name, ...otherProps}) => {
    // Generate a unique id if not provided
    const inputId = id || name || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    return(
        <div className="form-input-container">
            {label && <label className="form-input-label" htmlFor={inputId}>{label}</label>}
            <input 
                className='form-input' 
                id={inputId}
                name={name}
                onChange={handleChange} 
                placeholder={label}
                {...otherProps}
            />
        </div>
    )
}

export default FormInput