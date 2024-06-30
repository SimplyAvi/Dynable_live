import React, { useEffect, useState } from 'react'
import {useCookies} from 'react-cookie'
import axios from 'axios'
import './RecipeToProductCards.css'

const RecipeToProductCard = ({ingredient}) => {

    const [item, setItem] = useState({})
    const [filters] = useCookies(['allergens'])
    const {allergens} = filters

    useEffect(()=>{
        getProduct()
    },[])

    const filteredAllergens = () => {
        let allergensArr = []
        Object.keys(allergens).map((key)=>{
            const lowerKey = key.toLowerCase()
            if (allergens[key]) allergensArr.push(lowerKey)
        })
        return allergensArr
    }

    const getProduct = async () =>{
        try{
            const sendAllergens = filteredAllergens()
            const productResponse = await axios.post(`http://localhost:5000/api/foods?page=1`, {
                name: ingredient, 
                excludeIngredients: sendAllergens
            })
            setItem(productResponse.data)
        } catch(err){
            console.log(err)
        }
    }

    return(
        <div className='products-in-recipe-card'>
            <h3>Brand Name</h3>
            <p>description</p>
            <img className='img' src={`https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg?w=996`} />
        </div>
    )
}

export default RecipeToProductCard