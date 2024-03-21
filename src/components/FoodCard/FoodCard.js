import React from 'react'
import { useNavigate } from 'react-router-dom';
import './FoodCard.css'

const FoodCard = ({foodItem, id}) =>{

    const navigate = useNavigate();

    const {description, brandName, image='https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg?w=996'}= foodItem

    const handleClick  = () => {
        navigate(`/product/${id}`)
    }

    return(
        <div className='card-wrapper' onClick={handleClick}>
            <img className='card-img' src={image} alt={'https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg?w=996'}/>
            <p className='card-label' >{description.slice(0,40)}</p>
        </div>
    )
}

export default FoodCard