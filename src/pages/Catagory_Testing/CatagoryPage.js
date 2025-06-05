// components/FoodCategoryTable.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFoodCategories } from '../../redux/foodCatagorySlice';

const FoodCategoryTable = () => {
    console.log('Hello from catagory page')
  const dispatch = useDispatch();
  const { categories, status } = useSelector(state => state.foodCategory);

  useEffect(() => {
    dispatch(getFoodCategories());
  }, [dispatch]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'failed') {
    return <div>Error fetching categories</div>;
  }
console.log(categories)
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {categories.map(category => (
          <tr key={category.id}>
            <td>{category.id}</td>
            <td>{category.CategoryName}</td>
            <td>{category.name}</td>
            
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FoodCategoryTable;
