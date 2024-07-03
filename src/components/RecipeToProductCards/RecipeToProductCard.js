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
            const subcat = ingredient.SubcategoryID
            const sendAllergens = filteredAllergens()
            if (subcat){
                const productResponse = await axios.post(`http://localhost:5000/api/product/subcat`, {
                    id: subcat,
                    allergens: sendAllergens
                })
            setItem(productResponse.data)
            } else {
                const productResponse = await axios.post(`https://localhost:5000/api/product/nosubcat`, {
                    name: ingredient.name,
                    allergens: sendAllergens
                })
                setItem(productResponse)
            }
        } catch(err){
            console.log(err)
        }
    }

    return(
        <div className='products-in-recipe-card'>
            <img className='img' src={`https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg?w=996`} />
            <h3>{item.brandName}</h3>
            <p>{item.description.slice(0,50)}</p>
        </div>
    )
}

export default RecipeToProductCard