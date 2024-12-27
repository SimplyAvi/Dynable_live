import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    allergies: {
        // Common Allergens
        milk: false,
        eggs: false,
        fish: false,
        shellfish: false,
        treeNuts: false,
        peanuts: false,
        wheat: false,
        soy: false,
        sesame: false,

        // Additional Common Allergens
        gluten: false,
        lactose: false,
        mustard: false,
        celery: false,
        lupin: false,
        molluscs: false,
        sulphites: false,

        // Specific Tree Nuts
        almonds: false,
        cashews: false,
        walnuts: false,
        pecans: false,
        pistachios: false,
        macadamia: false,

        // Specific Seafood
        crab: false,
        lobster: false,
        shrimp: false,
        oysters: false,
        mussels: false,
        clams: false,

        // Add your complete list here...
    }
}

const allergiesSlice = createSlice({
    name: 'allergies',
    initialState,
    reducers: {
        setAllergies: (state, action) => {
            state.allergies = action.payload
        },
    },
})

export const { setAllergies } = allergiesSlice.actions
export default allergiesSlice.reducer