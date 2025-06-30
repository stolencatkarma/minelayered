const { Movements, goals: { GoalNear } } = require('mineflayer-pathfinder')

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async function craftWoodenTools(bot) {
  // Find the crafting table
  const craftingTable = bot.findBlock({
    matching: bot.registry.blocksByName['crafting_table'].id,
    maxDistance: 64
  })

  if (!craftingTable) {
    bot.chat('No crafting table found nearby.')
    return
  }

  // Go to the crafting table
  const mcData = require('minecraft-data')(bot.version)
  const movements = new Movements(bot, mcData)
  bot.pathfinder.setMovements(movements)

  const goal = new GoalNear(craftingTable.position.x, craftingTable.position.y, craftingTable.position.z, 1)
  await bot.pathfinder.goto(goal)

  // Craft sticks
  const stickRecipe = bot.recipesFor(bot.registry.itemsByName['stick'].id, null, 1, craftingTable)[0]
  if (stickRecipe) {
    await bot.craft(stickRecipe, 2, craftingTable)
    await delay(1000); // Wait for inventory to update
  } else {
    bot.chat('Could not find recipe for sticks')
    return
  }

  // Craft wooden pickaxe
  const woodenPickaxeRecipe = bot.recipesFor(bot.registry.itemsByName['wooden_pickaxe'].id, null, 1, craftingTable)[0]
  if (woodenPickaxeRecipe) {
    await bot.craft(woodenPickaxeRecipe, 1, craftingTable)
    await delay(1000); // Wait for inventory to update
  } else {
    bot.chat('Could not find recipe for wooden pickaxe')
    return
  }

  // Craft wooden axe
  const woodenAxeRecipe = bot.recipesFor(bot.registry.itemsByName['wooden_axe'].id, null, 1, craftingTable)[0]
  if (woodenAxeRecipe) {
    await bot.craft(woodenAxeRecipe, 1, craftingTable)
    await delay(1000); // Wait for inventory to update
  } else {
    bot.chat('Could not find recipe for wooden axe')
    return
  }

  // Craft wooden sword
  const woodenSwordRecipe = bot.recipesFor(bot.registry.itemsByName['wooden_sword'].id, null, 1, craftingTable)[0]
  if (woodenSwordRecipe) {
    await bot.craft(woodenSwordRecipe, 1, craftingTable)
    await delay(1000); // Wait for inventory to update
  } else {
    bot.chat('Could not find recipe for wooden sword')
    return
  }

  bot.chat('Crafted wooden tools.')
}
