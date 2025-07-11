const { Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');
const mineStaircase = require('./mineStaircase');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function mineOre(bot, oreName, rawMaterialName, count) {
  let oreCollected = bot.inventory.count(bot.registry.itemsByName[rawMaterialName].id);

  bot.chat(`I have ${oreCollected} ${rawMaterialName}. Need ${count}.`);

  while (oreCollected < count) {
    const oreVein = bot.findBlock({
      matching: (block) => block.name === oreName || block.name === `deepslate_${oreName}`,
      maxDistance: 64,
      useExtraInfo: true,
    });

    if (!oreVein) {
      bot.chat(`No more ${oreName} found nearby. Mining a staircase down.`);
      await mineStaircase(bot, 5);
      continue; // Retry finding ore after digging down
    }

    const goal = new GoalBlock(oreVein.position.x, oreVein.position.y, oreVein.position.z);
    await bot.pathfinder.goto(goal);

    const stonePickaxe = bot.inventory.findInventoryItem(bot.registry.itemsByName['stone_pickaxe'].id);
    if (!stonePickaxe) {
        bot.chat('I don\'t have a stone pickaxe to mine with.');
        return;
    }
    await bot.equip(stonePickaxe, 'hand');

    try {
        await bot.lookAt(oreVein.position);
        await delay(500);
        await bot.dig(oreVein);
        oreCollected = bot.inventory.count(bot.registry.itemsByName[rawMaterialName].id);
        bot.chat(`Mined ${oreName}. Total ${rawMaterialName}: ${oreCollected}/${count}.`);
    } catch (err) {
        console.log(err);
    }
  }
  bot.chat(`Finished mining ${oreName}.`);
}


module.exports = async function mineResources(bot) {
  bot.chat('Starting to mine for resources...');

  // Mine Iron Ore
  await mineOre(bot, 'iron_ore', 'raw_iron', 26);

  // Mine Coal Ore
  await mineOre(bot, 'coal_ore', 'coal', 4);

  bot.chat('Finished mining all resources.');
};
