const db = require('../db/database')
const {Food} = require('../db/models')
const seedRecipes = require('./seedRecipe')

async function seed(){
    try {
        await db.sync({ force: true })
        console.log('db synced!')

        // console.log('trying to seed food:', brandedFoodData[0])
        let foods
        // for (let i=1; i<4; i++){
        //   console.log('trying to seed food')
        //   const foodArr = require(`./splitFiles2/split_${i}.js`)
        //   foods = await Food.bulkCreate(foodArr, { validate: true , logging: false });
        //   console.log(`completed bulkcreate${i}`, foods.length)
        // }
        for (let i=1; i<=16; i++){
          console.log('trying to seed food')
          const foodArr = require(`./seeding/splitFiles2/split_${i}.js`)
          foods = await Food.bulkCreate(foodArr, { validate: true , logging: false });
          console.log(`completed bulkcreate${i}`, foods.length)
        }
        for (let i=17; i<=32; i++){
          console.log('trying to seed food')
          const foodArr = require(`./seeding/splitFiles3/split_${i}.js`)
          foods = await Food.bulkCreate(foodArr, { validate: true , logging: false });
          console.log(`completed bulkcreate for splitFiles3/split_${i}`, foods.length)
        }
        for (let i=33; i<=47; i++){
          console.log('trying to seed food')
          const foodArr = require(`./seeding/splitFiles4/split_${i}.js`)
          foods = await Food.bulkCreate(foodArr, { validate: true , logging: false });
          console.log(`completed bulkcreate for splitFiles4/split_${i}`, foods.length)
        }
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
      await seed()
      await seedRecipes()
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