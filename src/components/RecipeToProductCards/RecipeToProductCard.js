import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import './RecipeToProductCards.css'

const RecipeToProductCard = ({ingredient}) => {
    const [item, setItem] = useState({})
    const allergies = useSelector((state) => state.allergies.allergies);

    useEffect(() => {
        getProduct()
    }, [])

    const filteredAllergens = () => {
        let allergensArr = []
        Object.keys(allergies).map((key) => {
            const lowerKey = key.toLowerCase()
            if (allergies[key]) allergensArr.push(lowerKey)
        })
        return allergensArr
    }

    const getProduct = async () => {
        try {
            const subcat = ingredient.SubcategoryID
            const sendAllergens = filteredAllergens()
            console.log('sending allergens:', sendAllergens)
            if (subcat) {
                const productResponse = await axios.post(`https://dynable-backend-1514d5a9e35b.herokuapp.com/api/product/subcat`, {
                    id: subcat,
                    allergens: sendAllergens
                })
                setItem(productResponse.data)
                console.log('product response is:', productResponse)
            } else {
                const productResponse = await axios.post(`https://dynable-backend-1514d5a9e35b.herokuapp.com/api/product/nosubcat`, {
                    name: ingredient.name,
                    allergens: sendAllergens
                })
                setItem(productResponse)
                console.log('product response is:', productResponse)
            }
        } catch(err) {
            console.log(err)
        }
    }

    return(
        <div className='ingredients-list'>
            <div className='products-in-recipe-card'>
                <img className='img' src={`${process.env.PUBLIC_URL}/default_img.png`} alt={`${process.env.PUBLIC_URL}/default_img.png`} />
                <h3>{item.brandName}</h3>
                <p>{item.description ? item.description.slice(0,50) : ''}</p>
            </div>
            <div className='ingredient'>{ingredient.name}</div>
        </div>
    )
}

export default RecipeToProductCard