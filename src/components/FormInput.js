import React from 'react'

const FormInput = ({handleChange, label, ...otherProps}) => {

    return(
        <div>
            <input 
            className='form-input' 
            onChange={handleChange} 
            {...otherProps}/>
        </div>
    )
}

export default FormInput