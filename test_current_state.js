console.log(`
📋 PLEASE TEST THE FOLLOWING AND REPORT BACK:

1️⃣ ALLERGEN FILTERING TEST:
   - Select 2 allergens (e.g., milk, eggs)
   - Check the browser console for:
     [ALLERGEN FLOW] 📤 Dispatching setSelectedAllergens(["milk","eggs"]) to Redux
   - Check Homepage logs:
     [HOMEPAGE] 🚀 Loading data with unified filtering: {selectedAllergens: ["milk","eggs"]...}
   - Do products get filtered? (Should exclude milk/egg products)

2️⃣ CART PERSISTENCE TEST:
   - Add 2-3 items to cart
   - Log out
   - Log back in
   - Are cart items still there?

3️⃣ CUSTOM ALLERGEN TEST:
   - Add a custom allergen (e.g., "apple")
   - Log out
   - Custom allergen should disappear
   - Log back in
   - Custom allergen should reappear

Please copy the exact console logs for each test so I can see what's happening!
`);
