import React, {useState} from 'react'
import { useParams } from 'react-router-dom';

import './ProductPage.css'
import SearchAndFilter from '../../components/SearchAndFilter/SearchAndFilter';
import { useSelector } from 'react-redux';

const ProductPage = () =>{
    
    const { id } = useParams();

    const product = useSelector((state)=> state.products.productsResults.hints[id])
    console.log('single product info:', product)
    const {image, label, nutrients} = product.food

    return(
        <div>
            <SearchAndFilter />
            <div>
                <img src={image}/>
            </div>
            <div>
                <p>{label}</p>
            </div>
            <div>
                {Object.keys(nutrients).map((nutrient,key)=>{
                    return(
                        <p key={key}>{nutrient}:{nutrients[nutrient]}</p>
                    )
                })}
            </div>
            <div>
                suggestions section
            </div>
        </div>
    )
}

export default ProductPage