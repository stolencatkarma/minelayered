const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('mineflayer-pathfinder')

const gatherWood = require('./gatherWood')
const craftPlanksAndTable = require('./craftPlanksAndTable')
const craftWoodenTools = require('./craftWoodenTools')
const mineStone = require('./mineStone')
const craftStoneToolsAndFurnace = require('./craftStoneToolsAndFurnace')
const gatherFood = require('./gatherFood')
const mineResources = require('./mineResources')
const makeIronGear = require('./makeIronGear')
const pillar = require('./pillar')

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'MineLayeredBot',
  version: '1.21'
})

bot.loadPlugin(pathfinder)

bot.on('chat', (username, message) => {
  console.log(`${username}: ${message}`)
})

bot.on('spawn', async () => {
  console.log('Bot has spawned!')
  await bot.waitForChunksToLoad()

  const mcData = require('minecraft-data')(bot.version)
  const movements = new Movements(bot, mcData)
  movements.allowSprinting = true
  movements.allowParkour = true
  movements.allow1by1towers = true
  movements.canDig = true
  bot.pathfinder.setMovements(movements)

  const hasItem = (name, count = 1) => {
    const item = bot.inventory.findInventoryItem(bot.registry.itemsByName[name]?.id);
    return item && item.count >= count;
  };

  const hasAnyLog = (count = 1) => {
    const woodTypes = ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log'];
    let totalLogs = 0;
    for (const type of woodTypes) {
      totalLogs += bot.inventory.count(bot.registry.itemsByName[type].id);
    }
    return totalLogs >= count;
  }

  const hasCookedFood = (count = 5) => {
    const cookedFoods = ['cooked_beef', 'cooked_porkchop', 'cooked_chicken', 'cooked_mutton', 'cooked_rabbit', 'cooked_cod', 'cooked_salmon'];
    let totalCooked = 0;
    for (const food of cookedFoods) {
        const item = bot.inventory.findInventoryItem(bot.registry.itemsByName[food]?.id);
        if (item) {
            totalCooked += item.count;
        }
    }
    return totalCooked >= count;
  }

  if (!hasAnyLog(5)) {
    await gatherWood(bot);
  } else {
    bot.chat("I already have enough wood.");
  }

  if (!hasItem('crafting_table')) {
    await craftPlanksAndTable(bot);
  } else {
    bot.chat("I already have a crafting table.");
  }

  if (!hasItem('wooden_pickaxe')) {
    await craftWoodenTools(bot);
  } else {
    bot.chat("I already have wooden tools.");
  }

  if (!hasItem('cobblestone', 17)) {
    await mineStone(bot);
  } else {
    bot.chat("I already have enough cobblestone.");
  }

  if (!hasItem('stone_pickaxe') || !hasItem('furnace')) {
    await craftStoneToolsAndFurnace(bot);
  } else {
    bot.chat("I already have stone tools and a furnace.");
  }

  if (!hasCookedFood(5)) {
    await gatherFood(bot);
  } else {
    bot.chat("I already have enough cooked food.");
  }

  if (!hasItem('iron_ore', 26) || !hasItem('coal', 4)) {
    await mineResources(bot);
  } else {
    bot.chat("I already have enough iron and coal.");
  }

  if (!hasItem('iron_helmet') || !hasItem('iron_chestplate') || !hasItem('iron_leggings') || !hasItem('iron_boots') || !hasItem('iron_sword')) {
    await makeIronGear(bot);
  } else {
    bot.chat("I already have full iron gear.");
  }

  console.log('All tasks completed!')
})

bot.on('error', err => console.log(err))
bot.on('end', () => console.log('Bot disconnected'))
