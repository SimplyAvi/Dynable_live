// components/FoodCategoryTable.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Tree from 'react-d3-tree';
import './CatagoryPage.css';

const CatagoryPage = () => {
    const [hierarchy, setHierarchy] = useState(null);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                // Fetch categories from Supabase
                const { data: categories, error } = await supabase
                    .from('Categories')
                    .select('*');

                if (error) {
                    console.error('Error fetching categories:', error);
                    return;
                }

                // Fetch subcategories from Supabase
                const { data: subcategories, error: subError } = await supabase
                    .from('Subcategories')
                    .select('*');

                if (subError) {
                    console.error('Error fetching subcategories:', subError);
                    return;
                }

                // Build hierarchy structure
                const root = {
                    name: 'Categories',
                    children: categories.map(category => ({
                        name: category.CategoryName,
                        children: subcategories
                            .filter(sub => sub.CategoryId === category.id)
                            .map(sub => ({ name: sub.SubCategoryName }))
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
