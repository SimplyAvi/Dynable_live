import React, {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios'
import './RecipePage.css'
import SearchAndFilter from '../../components/SearchAndFilter/SearchAndFilter';
import { useSelector } from 'react-redux';
import RecipeToProductCard from '../../components/RecipeToProductCards/RecipeToProductCard';

const RecipePage = () =>{
    
    const { id } = useParams();
    const [item, setItem] = useState({})

    useEffect(()=>{
        //get product info via ID
        getProduct()
    },[])

    const getProduct = async () =>{
        try{
            const recipeResponse = await axios.get(`http://localhost:5000/api/recipe/?id=${id}`)
            console.log('product response:', recipeResponse)
            setItem(recipeResponse.data)
        } catch(err){
            console.log(err)
        }
    }


    // const recipe = useSelector(( state)=> state.recipe.recipeResults.foods[id])
    // console.log('single product info:', product)
    const {directions, Ingredients, source, ingredientLines, title } = item

    if (!directions) return (<div></div>)
    else {
        return(
            <div>
                <SearchAndFilter />
                <div className='img-wrapper'>
                    <img className='img' src={`${process.env.PUBLIC_URL}/default_img.png`}/>
                </div>
                <div>
                    <h1>{title}</h1>
                    <h3>Source: {source}</h3>
                    Directions:
                    {directions.map((text,key)=>{
                         <h4 key={key}>Step {key+1}: {text}</h4>
                    })}
                </div>
                <div>
                    <p>Ingredients:</p>
                    {console.log('ingredients:', Ingredients)}
                    {Ingredients? Ingredients.map((ingredient,key)=>{
                        return <RecipeToProductCard key={key} ingredient={ingredient} />
                    }):null}
                </div>
                <div>
                </div>
            </div>
    )
}
}

export default RecipePage