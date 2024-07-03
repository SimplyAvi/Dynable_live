const db = require('../db/database')
const {Food} = require('../db/models')
const seedRecipes = require('./seedRecipe')
const seedCategories = require('./seedCategories')
const assignSubcategories = require('./AssignSubcategories')

async function seed(){
    try {
        await db.sync()
        console.log('db synced!')

        let totalSeeded = 0
        let foods
        for (let i=38; i<=47; i++){
          const foodArr = require(`./Data/Products/split_${i}.js`)
          foods = await Food.bulkCreate(foodArr, { validate: true , logging: false });
          console.log(`completed bulkcreate${i}`, foods.length)
          totalSeeded+=foods.length
        }
        console.log(`seeded ${totalSeeded} products!`)
    } catch(err) {
        console.error(err)
    }
}

// We've separated the `seed` function from the `runSeed` function.
// This way we can isolate the error handling and exit trapping.
// The `seed` function is concerned only with modifying the database.
async function runSeed() {
    console.log('seeding...')
    try {
      // await seed()
      await seedRecipes()
      await seedCategories()
      await assignSubcategories()
    } catch(err) {
      console.error(err)
      process.exitCode = 1
    } finally {
      console.log('closing db connection')
      await db.close()
      console.log('db connection closed')
    }
  }
  
  // Execute the `seed` function, IF we ran this module directly (`node seed`).
  // `Async` functions always return a promise, so we can use `catch` to handle
  // any errors that might occur inside of `seed`.
  if (module === require.main) {
    runSeed()
  }
  
  // we export the seed function for testing purposes (see `./seed.spec.js`)
  module.exports = seed