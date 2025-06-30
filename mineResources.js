const { Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function mineOre(bot, oreName, count) {
  let oreCollected = bot.inventory.count(bot.registry.itemsByName[oreName].id);
  if (bot.registry.itemsByName[`deepslate_${oreName}`]) {
    oreCollected += bot.inventory.count(bot.registry.itemsByName[`deepslate_${oreName}`].id);
  }

  bot.chat(`I have ${oreCollected} ${oreName}. Need ${count}.`);

  while (oreCollected < count) {
    const oreVein = bot.findBlock({
      matching: (block) => block.name === oreName || block.name === `deepslate_${oreName}`,
      maxDistance: 64,
      useExtraInfo: true,
    });

    if (!oreVein) {
      bot.chat(`No more ${oreName} found nearby.`);
      return;
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
        oreCollected++;
        bot.chat(`Mined ${oreCollected}/${count} ${oreName}.`);
    } catch (err) {
        console.log(err);
    }
  }
  bot.chat(`Finished mining ${oreName}.`);
}


module.exports = async function mineResources(bot) {
  bot.chat('Starting to mine for resources...');

  // Mine Iron Ore
  await mineOre(bot, 'iron_ore', 26);

  // Mine Coal Ore
  await mineOre(bot, 'coal_ore', 4);

  bot.chat('Finished mining all resources.');
};
