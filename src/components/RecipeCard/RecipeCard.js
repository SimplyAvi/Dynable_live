import React from 'react'
import { useNavigate } from 'react-router-dom';
import './RecipeCard.css'

const RecipeCard = ({recipe, id}) =>{

    const navigate = useNavigate();

    const {title, image='https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg?w=996'}= recipe
    
    let shortenedTitle = title
    if (title.length>50) shortenedTitle = title.slice(0,40) + '...'

    const handleClick  = () => {
        navigate(`/recipe/${id}`)
    }

    return(
        <div className='card-wrapper' onClick={handleClick}>
            <img className='card-img' src={image} alt='https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg?w=996'/>
            <p className='card-label' >{shortenedTitle}</p>
        </div>
    )
}

export default RecipeCard