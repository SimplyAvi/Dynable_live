import React from 'react'
import { useNavigate } from 'react-router-dom';
import './FoodCard.css'

const FoodCard = ({foodItem, id}) =>{

    const navigate = useNavigate();

    const {label, image}= foodItem.food

    const handleClick  = () => {
        navigate(`/product/${id}`)
    }

    return(
        <div className='card-wrapper' onClick={handleClick}>
            <img className='card-img' src={image}/>
            <p className='card-label' >{label}</p>
        </div>
    )
}

export default FoodCard