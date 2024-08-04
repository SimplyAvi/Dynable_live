const db = require('../db/database')
const {Food} = require('../db/models')
const seedRecipes = require('./seedRecipe')

async function seed2(){
    try {
        await db.sync({})
        console.log('db synced!')

        let totalSeeded = 0
        let foods
        for (let i=26; i<=47; i++){
          const foodArr = require(`./Data/Products/split_${i}.js`)
          foods = await Food.bulkCreate(foodArr, { validate: true , logging: false });
          console.log(`completed bulkcreate${i}`, foods.length)
          totalSeeded+=foods.length
        }
        console.log(`2nd seed seeded ${totalSeeded} products!`)
    } catch(err) {
        console.error(err)
    }
}

module.exports = seed2