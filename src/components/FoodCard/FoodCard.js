import React from 'react'
import { useNavigate } from 'react-router-dom';
import './FoodCard.css'

const FoodCard = ({foodItem}) =>{

    const {label, image}= foodItem.food
    let navigate = useNavigate();

    const handleClick  = () => {
        navigate(`/product/${'12'}`)
    }

    return(
        <div className='card-wrapper' onClick={handleClick}>
            <img className='card-img' src={image}/>
            <p className='card-label' >{label}</p>
        </div>
    )
}

export default FoodCard