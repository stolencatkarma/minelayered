const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3');

const gatherWood = require('./gatherWood')
const craftPlanksAndTable = require('./craftPlanksAndTable')
const craftWoodenTools = require('./craftWoodenTools')
const mineStone = require('./mineStone')
const craftStoneToolsAndFurnace = require('./craftStoneToolsAndFurnace')
const gatherFood = require('./gatherFood')
const mineResources = require('./mineResources')
const makeIronGear = require('./makeIronGear')
const { gatherWool } = require('./gatherWool');
const { craftBed } = require('./craftBed');
const { placeBed } = require('./placeBed');
const setupBase = require('./setupBase');
const { loadHome, saveHome } = require('./homeManager');
const { TaskQueue } = require('./tasks');
const beatTheGame = require('./beatTheGame');

const bot = mineflayer.createBot({
  host: '158.69.4.14',
  port: 25565,
  username: 'SoulCrib2186857',
  version: '1.21.1',
  auth: 'microsoft'
})

bot.loadPlugin(pathfinder)

bot.on('chat', (username, message) => {
  console.log(`${username}: ${message}`)
})

bot.on('spawn', async () => {
  console.log('Bot has spawned!')

  // Configure pathfinder movements globally
  const mcData = require('minecraft-data')(bot.version)
  const movements = new Movements(bot, mcData)
  movements.allowSprinting = false
  movements.allowParkour = false
  movements.allow1by1towers = false // Prevent pillaring
  movements.allowStaircase = true
  movements.canDig = true
  movements.digCost = 10 // Make destroying blocks more expensive
  movements.jumpCost = 10 // Make jumping more expensive

  bot.pathfinder.setMovements(movements)

  await bot.waitForChunksToLoad()

  console.log('Bot logic starting.');

  let baseCenter = loadHome();
  if (!baseCenter) {
    baseCenter = bot.entity.position.floored();
    saveHome(baseCenter);
    bot.chat(`Home set to ${baseCenter}.`);
  } else {
    bot.chat(`Loaded home from file: ${baseCenter}.`);
  }

  await setupBase(bot, baseCenter);

  // === Only start survival logic after home base build is done ===
  runSurvivalTasks();


  function runSurvivalTasks() {
    const taskQueue = new TaskQueue();

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

    const hasAnyWool = (count = 3) => {
        const allWool = bot.inventory.items().filter(item => item.name.includes('wool'));
        let woolCount = allWool.reduce((acc, item) => acc + item.count, 0);
        return woolCount >= count;
    }

    const hasBed = () => {
        return bot.inventory.items().some(item => item.name.endsWith('_bed'));
    }

    if (!hasAnyLog(5)) {
      taskQueue.addTask(() => gatherWood(bot));
    } 

    if (!hasItem('wooden_pickaxe')) {
      taskQueue.addTask(() => craftWoodenTools(bot));
    }

    if (!hasItem('cobblestone', 17)) {
      taskQueue.addTask(() => mineStone(bot));
    }

    if (!hasItem('stone_pickaxe')) {
      taskQueue.addTask(() => craftStoneToolsAndFurnace(bot));
    }

    if (!hasAnyWool(3)) {
        taskQueue.addTask(() => gatherWool(bot));
    }

    if (!hasBed()) {
        taskQueue.addTask(() => craftBed(bot));
    }

    taskQueue.addTask(async () => {
      const bedBlock = bot.findBlock({ matching: (b) => b.name.endsWith('_bed'), maxDistance: 32 });
      if (hasBed() && !bedBlock) {
          await placeBed(bot, baseCenter);
      }
    });

    if (!hasCookedFood(5)) {
      taskQueue.addTask(() => gatherFood(bot));
    }

    if (!hasItem('iron_ore', 26) || !hasItem('coal', 4)) {
      taskQueue.addTask(() => mineResources(bot));
    }

    if (!hasItem('iron_helmet') || !hasItem('iron_chestplate') || !hasItem('iron_leggings') || !hasItem('iron_boots') || !hasItem('iron_sword')) {
      taskQueue.addTask(() => makeIronGear(bot));
    }

    taskQueue.addTask(() => beatTheGame(bot));

    taskQueue.addTask(() => {
      bot.chat("All tasks completed!");
      return Promise.resolve();
    });
  }
})

bot.on('error', err => console.log(err))
bot.on('end', () => console.log('Bot disconnected'))
