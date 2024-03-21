import React, {useState} from 'react'
import { useParams } from 'react-router-dom';

import './ProductPage.css'
import SearchAndFilter from '../../components/SearchAndFilter/SearchAndFilter';
import { useSelector } from 'react-redux';

const ProductPage = () =>{
    
    const { id } = useParams();

    const product = useSelector((state)=> state.products.productsResults.foods[id])
    // console.log('single product info:', product)
    const {description, ingredients, brandName } = product

    return(
        <div>
            <SearchAndFilter />
            <div>
                <img src={'https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg?w=996'}/>
            </div>
            <div>
                <p>{brandName}</p>
                <p>{description}</p>
            </div>
            <div>
                <p>{ingredients}</p>
            </div>
            <div>
                {/* {Object.keys(nutrients).map((nutrient,key)=>{
                    return(
                        <p key={key}>{nutrient}:{nutrients[nutrient]}</p>
                    )
                })} */}
            </div>
            <div>
                suggestions section
            </div>
        </div>
    )
}

export default ProductPage