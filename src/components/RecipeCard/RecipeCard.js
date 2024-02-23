import React from 'react'
import './RecipeCard.css'

const RecipeCard = ({recipe}) =>{

    const {label, image}= recipe.recipe
    return(
        <div className='card-wrapper'>
            <img className='card-img' src={image}/>
            <p className='card-label' >{label}</p>
        </div>
    )
}

export default RecipeCard