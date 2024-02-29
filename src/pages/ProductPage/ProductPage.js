import React, {useState} from 'react'
import { useParams } from 'react-router-dom';

import './ProductPage.css'

const ProductPage = () =>{
    
    const { id } = useParams();
    console.log('PRODUCT PAGE PROPS:', id)

    return(
        <div>
            <div>
                Image
            </div>
            <div>
                Title
            </div>
            <div>
                description
            </div>
            <div>
                suggestions section
            </div>
        </div>
    )
}

export default ProductPage