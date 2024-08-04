import React, {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios'
import './ProductPage.css'
import SearchAndFilter from '../../components/SearchAndFilter/SearchAndFilter';
import { useSelector } from 'react-redux';

const ProductPage = () =>{
    
    const { id } = useParams();
    const [item, setItem] = useState({})

    useEffect(()=>{
        //get product info via ID
        getProduct()
    },[])

    const getProduct = async () =>{
        try{
            const productResponse = await axios.get(`http://localhost:5001/api/product/?id=${id}`)
            setItem(productResponse.data)
        } catch(err){
            console.log(err)
        }
    }

    // const product = useSelector((state)=> state.products.productsResults.foods[id])
    // console.log('single product info:', product)
    const {description, ingredients, brandName } = item

    return(
        <div>
            <SearchAndFilter />
            <div className='img-wrapper'>
                <img className='img' src={`${process.env.PUBLIC_URL}/default_img.png`}/>
            </div>
            <div>
                <h3>{brandName}</h3>
                <h4>{description}</h4>
            </div>
            <div className='ingredients'>
                <h3 className='ingredients-title'>Ingredients:</h3>
                <p> {ingredients}</p>
            </div>
            <div>
                {/* {Object.keys(nutrients).map((nutrient,key)=>{
                    return(
                        <p key={key}>{nutrient}:{nutrients[nutrient]}</p>
                    )
                })} */}
            </div>
            <div>
                suggestions section (alt food cards can go here)
            </div>
        </div>
    )
}

export default ProductPage