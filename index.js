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
const homeDb = require('./homeDb');

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
  homeDb.initDb();

  // Home base schematic assignments
  const SCHEMATICS = [
    { name: 'house', dx: 0, dz: 0 },
    { name: 'farm', dx: 1, dz: 0 },
    { name: 'pens', dx: 0, dz: 1 },
    { name: 'fishing', dx: -1, dz: 0 },
    { name: 'mine', dx: 0, dz: -1 },
    { name: 'log_torch', dx: 1, dz: 1 },
    { name: 'log_torch', dx: -1, dz: 1 },
    { name: 'log_torch', dx: 1, dz: -1 },
    { name: 'log_torch', dx: -1, dz: -1 }
  ];

  // Get bot's unique id (username for now)
  const botId = bot.username;
  const world = 'overworld';

  // Helper to get chunk coords from pos
  function getChunkCoords(pos) {
    return { x: Math.floor(pos.x / 16), z: Math.floor(pos.z / 16) };
  }

  // Check if home is already in DB
  homeDb.getHomeChunks(botId, world, async (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return;
    }
    if (!rows || rows.length < SCHEMATICS.length) {
      // Claim new home base
      const center = getChunkCoords(bot.entity.position);
      bot.chat(`Claiming home base at chunk ${center.x},${center.z}`);
      for (const s of SCHEMATICS) {
        const chunkX = center.x + s.dx;
        const chunkZ = center.z + s.dz;
        homeDb.saveHomeChunk(botId, s.name, chunkX, chunkZ, world);
        bot.chat(`Assigned ${s.name} to chunk ${chunkX},${chunkZ}`);
      }
    } else {
      bot.chat('Home base already claimed. Loaded from database:');
      for (const row of rows) {
        bot.chat(`${row.schematic} at chunk ${row.chunk_x},${row.chunk_z}`);
      }
    }

    // After home base claim/load, build all schematics (stub: just logs for now)
    const buildSchematic = require('./buildSchematic');
    const ensureBarrels = require('./ensureBarrels');
    for (const row of rows) {
      // Move to the center of the chunk before building
      const targetX = row.chunk_x * 16 + 8;
      const targetZ = row.chunk_z * 16 + 8;
      const targetY = bot.entity.position.y;
      const { GoalNear } = require('mineflayer-pathfinder').goals;
      await bot.pathfinder.goto(new GoalNear(targetX, targetY, targetZ, 2));
      bot.chat(`Arrived at ${row.schematic} chunk (${row.chunk_x},${row.chunk_z}), starting build.`);
      // Dynamically determine needed block types and counts for schematic
      const neededBlockCounts = await buildSchematic.getNeededBlockCounts(bot, row.schematic, row.chunk_x, row.chunk_z);
      const neededBlockTypes = Object.keys(neededBlockCounts);
      await ensureBarrels(bot, row.chunk_x, row.chunk_z, neededBlockTypes);
      // Fill barrels with needed blocks from inventory (only what is still needed)
      for (const blockType of neededBlockTypes) {
        const needed = neededBlockCounts[blockType];
        if (needed <= 0) continue;
        const item = bot.inventory.findInventoryItem(bot.registry.itemsByName[blockType]?.id);
        if (item) {
          const toDeposit = Math.min(item.count, needed);
          for (const dx of [0, 15]) {
            const barrelPos = bot.vec3(row.chunk_x * 16 + dx, bot.entity.position.y, row.chunk_z * 16);
            const barrelBlock = bot.blockAt(barrelPos);
            if (barrelBlock && barrelBlock.name === 'barrel') {
              try {
                const container = await bot.openContainer(barrelBlock);
                await container.deposit(item.type, null, toDeposit);
                await container.close();
                bot.chat(`Deposited ${toDeposit} ${blockType} in barrel at ${barrelPos.x},${barrelPos.y},${barrelPos.z}`);
                break;
              } catch (err) {
                bot.chat(`Error depositing to barrel at ${barrelPos.x},${barrelPos.y},${barrelPos.z}: ${err.message}`);
              }
            }
          }
        }
      }
      // Fetch materials from barrels before building
      await buildSchematic.fetchMaterialsFromBarrels(bot, row.chunk_x, row.chunk_z, neededBlockTypes);
      await buildSchematic(bot, row.schematic, row.chunk_x, row.chunk_z);
    }

    // === Only start survival logic after home base build is done ===
    await runSurvivalTasks();
  });

  async function runSurvivalTasks() {
    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    movements.allowSprinting = true
    movements.allowParkour = true
    movements.allow1by1towers = true
    movements.canDig = true
    // Make jumping more expensive than mining
    movements.jumpCost = 10; // Default is 1
    movements.digCost = 1;   // Default is 1
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
  }
})

bot.on('error', err => console.log(err))
bot.on('end', () => console.log('Bot disconnected'))
