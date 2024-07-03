import React from 'react'
import { useNavigate } from 'react-router-dom';
import './FoodCard.css'

const FoodCard = ({foodItem, id}) =>{

    const navigate = useNavigate();

    const {description, brandName, image=`${process.env.PUBLIC_URL}/default_img.png`}= foodItem

    const handleClick  = () => {
        navigate(`/product/${id}`)
    }

    return(
        <div className='card-wrapper' onClick={handleClick}>
            <img className='card-img' src={image} alt={`${process.env.PUBLIC_URL}/default_img.png`}/>
            <p className='card-label' >{description.slice(0,40)}</p>
        </div>
    )
}

export default FoodCard