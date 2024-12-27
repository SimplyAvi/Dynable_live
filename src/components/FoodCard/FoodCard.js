import React from 'react'
import { useNavigate } from 'react-router-dom';
import './FoodCard.css'

const FoodCard = ({foodItem, id}) =>{

    const navigate = useNavigate();

    const { description, brandName, image = `${process.env.PUBLIC_URL}/default_img.png` } = foodItem
    
    const handleClick  = () => {
        navigate(`/product/${id}`)
    }

    return (
        
        <div className="food-card" onClick={handleClick}>
            <div className="food-image">
                <img 
                    src={image} 
                    alt={`${process.env.PUBLIC_URL}/default_img.png`} 
                />
            </div>
            <div className="food-title">
                {description.length > 20 
                    ? description.substring(0, 20) + '...' 
                    : description
                }
            </div>
        </div>

    )
}

export default FoodCard