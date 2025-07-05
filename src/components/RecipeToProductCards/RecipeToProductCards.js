import { useSelector } from 'react-redux';

const RecipeToProductCards = ({ recipes }) => {
    const allergies = useSelector((state) => state.allergies.allergies);
    return (
        <div className="recipe-to-product-cards">
            {recipes.map(recipe => (
                <RecipeToProductCard key={recipe.id} recipe={recipe} allergies={allergies} />
            ))}
        </div>
    );
};

export default RecipeToProductCards; 