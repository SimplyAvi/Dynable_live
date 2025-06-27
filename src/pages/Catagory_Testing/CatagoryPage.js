// components/FoodCategoryTable.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Tree from 'react-d3-tree';
import './CatagoryPage.css';

const CatagoryPage = () => {
    const [hierarchy, setHierarchy] = useState(null);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/foodCategories');
                // The root of the tree needs to be a single object.
                // We'll create a dummy root to hold all our categories.
                const root = {
                    name: 'Categories',
                    children: response.data.map(category => ({
                        name: category.CategoryName,
                        children: category.children.map(sub => ({ name: sub.SubCategoryName }))
                    }))
                };
                setHierarchy(root);
            } catch (error) {
                console.error('Error fetching category hierarchy:', error);
            }
        };

        fetchHierarchy();
    }, []);

    useEffect(() => {
        // Center the tree on initial render
        const dimensions = document.getElementById('tree-wrapper');
        if (dimensions) {
            setTranslate({
                x: dimensions.offsetWidth / 2,
                y: dimensions.offsetHeight / 5,
            });
        }
    }, []);

    if (!hierarchy) {
        return <div>Loading hierarchy...</div>;
    }

    return (
        <div id="tree-wrapper" style={{ width: '100vw', height: '100vh' }}>
            <Tree 
                data={hierarchy}
                orientation="vertical"
                translate={translate}
                pathFunc="step"
                rootNodeClassName="node__root"
                branchNodeClassName="node__branch"
                leafNodeClassName="node__leaf"
            />
        </div>
    );
};

export default CatagoryPage;
