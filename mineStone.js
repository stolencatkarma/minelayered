const { Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder')
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async function mineStone(bot) {
  let stoneCollected = 0
  while (stoneCollected < 17) {
    const stone = bot.findBlock({
      matching: bot.registry.blocksByName['stone'].id,
      maxDistance: 64
    })

    if (!stone) {
      bot.chat('No stone found nearby.')
      return
    }

    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    bot.pathfinder.setMovements(movements)

    const goal = new GoalBlock(stone.position.x, stone.position.y, stone.position.z)
    await bot.pathfinder.goto(goal)

    await bot.equip(bot.inventory.findInventoryItem(bot.registry.itemsByName['wooden_pickaxe'].id), 'hand')

    try {
      await bot.lookAt(stone.position);
      await delay(500);
      await bot.dig(stone)
      stoneCollected++
    } catch (err) {
      console.log(err)
    }
  }

  bot.chat('Finished mining stone.')
}
