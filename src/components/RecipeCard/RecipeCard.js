import React from 'react'
import { useNavigate } from 'react-router-dom';
import './RecipeCard.css'

const RecipeCard = ({recipe, id}) =>{

    const navigate = useNavigate();

    const {title, image=`${process.env.PUBLIC_URL}/default_img.png`}= recipe
    
    let shortenedTitle = title
    if (title.length>50) shortenedTitle = title.slice(0,40) + '...'

    const handleClick  = () => {
        navigate(`/recipe/${id}`)
    }

    return(
        <div className='card-wrapper' onClick={handleClick}>
            <img className='card-img' src={image} alt={`${process.env.PUBLIC_URL}/default_img.png`}/>
            <p className='card-label' >{shortenedTitle}</p>
        </div>
    )
}

export default RecipeCard