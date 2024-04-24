import React, {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios'
import './RecipePage.css'
import SearchAndFilter from '../../components/SearchAndFilter/SearchAndFilter';
import { useSelector } from 'react-redux';

const RecipePage = () =>{
    
    // const { id } = useParams();
    // const [item, setItem] = useState({})

    // useEffect(()=>{
    //     //get product info via ID
    //     getProduct()
    // },[])

    // const getProduct = async () =>{
    //     try{
    //         // const productResponse = await axios.get(`http://localhost:5000/api/product/?id=${id}`)
    //         setItem(productResponse.data)
    //     } catch(err){
    //         console.log(err)
    //     }
    // }


    // const product = useSelector(( state)=> state.products.productsResults.foods[id])
    // console.log('single product info:', product)
    const {description, ingredients, source, ingredientLines } = recipe

    return(
        <div>
            <SearchAndFilter />
            <div className='img-wrapper'>
                <img className='img' src={'https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg?w=996'}/>
            </div>
            <div>
                <h3>Source: {source}</h3>
                <h4>{description}</h4>
            </div>
            <div>
                <p>{ingredients}</p>
            </div>
            <div>
            </div>
        </div>
    )
}

export default RecipePage