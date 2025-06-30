const { Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder')
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async function gatherWood(bot) {
  bot.chat("Looking for a tree...");
  // Find a tree
  const woodTypes = ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log']
  const tree = bot.findBlock({
    matching: (block) => woodTypes.includes(block.name),
    maxDistance: 64
  })

  if (!tree) {
    bot.chat('No trees found nearby.')
    return
  }
  bot.chat("Found a tree. Going to it...");

  // Go to the tree
  const mcData = require('minecraft-data')(bot.version)
  const movements = new Movements(bot, mcData)
  bot.pathfinder.setMovements(movements)

  const goal = new GoalBlock(tree.position.x, tree.position.y, tree.position.z)
  await bot.pathfinder.goto(goal)

  bot.chat("Arrived at the tree. Mining 5 logs...");
  // Collect 5 logs
  let logsCollected = 0
  while (logsCollected < 5) {
    const log = bot.findBlock({
      matching: (block) => woodTypes.includes(block.name),
      maxDistance: 2
    })

    if (!log) {
      bot.chat("No more logs in reach.");
      break
    }

    try {
      await bot.lookAt(log.position);
      await delay(500);
      await bot.dig(log)
      logsCollected++
      bot.chat(`Collected ${logsCollected}/5 logs.`);
    } catch (err) {
      console.log(err)
    }
  }

  bot.chat('Finished gathering wood.')
}
