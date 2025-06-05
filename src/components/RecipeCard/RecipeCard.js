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

    return (
        
            <div className="recipe-card" onClick={handleClick}>
            <div className="recipe-image">
                <img 
                    src={image} 
                    alt={`${process.env.PUBLIC_URL}/default_img.png`} 
                />
            </div>
            <div className="recipe-title">
                {shortenedTitle.length > 20 
                    ? shortenedTitle.substring(0, 20) + '...' 
                    : shortenedTitle
                }
            </div>
        </div>
       
    )
}

export default RecipeCard