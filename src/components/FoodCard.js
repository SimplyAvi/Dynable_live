import React from 'react'
import './FoodCard.css'

const FoodCard = ({foodItem}) =>{

    const {label, image}= foodItem.food
    return(
        <div className='card-wrapper'>
            <img className='card-img' src={image}/>
            <p className='card-label' >{label}</p>
        </div>
    )
}

export default FoodCard