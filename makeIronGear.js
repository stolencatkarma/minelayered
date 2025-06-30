const { goals: { GoalNear } } = require('mineflayer-pathfinder');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function smeltItem(bot, itemName, fuelName, count) {
  const item = bot.registry.itemsByName[itemName];
  const fuel = bot.registry.itemsByName[fuelName];

  const furnaceBlock = bot.findBlock({
    matching: bot.registry.blocksByName.furnace.id,
    maxDistance: 64
  });

  if (!furnaceBlock) {
    bot.chat('No furnace found nearby.');
    return;
  }

  const goal = new GoalNear(furnaceBlock.position.x, furnaceBlock.position.y, furnaceBlock.position.z, 1);
  await bot.pathfinder.goto(goal);

  const furnace = await bot.openFurnace(furnaceBlock);

  const itemsToSmelt = bot.inventory.count(item.id);
  const fuelToUse = bot.inventory.count(fuel.id);

  if (itemsToSmelt === 0) {
    bot.chat(`No ${itemName} to smelt.`);
    await furnace.close();
    return;
  }

  if (fuelToUse === 0) {
    bot.chat(`No ${fuelName} to use as fuel.`);
    await furnace.close();
    return;
  }

  await furnace.putFuel(fuel.id, null, fuelToUse);
  await furnace.putInput(item.id, null, itemsToSmelt);

  bot.chat(`Smelting ${itemsToSmelt} ${itemName}(s).`);

  let smeltedCount = 0;
  while (smeltedCount < itemsToSmelt) {
    await new Promise(resolve => bot.once('furnace:update', resolve));
    const output = furnace.outputItem();
    if (output) {
      smeltedCount = output.count;
      await furnace.takeOutput();
      await delay(100);
    }
  }

  await furnace.close();
  bot.chat('Finished smelting.');
}

async function craftItem(bot, itemName, craftingTable) {
    const item = bot.registry.itemsByName[itemName];
    if (!item) {
        bot.chat(`Unknown item: ${itemName}`);
        return;
    }
    const recipe = bot.recipesFor(item.id, null, 1, craftingTable)[0];
    if (recipe) {
        try {
            await bot.craft(recipe, 1, craftingTable);
            bot.chat(`Crafted ${itemName}.`);
            await delay(1000);
        } catch (err) {
            bot.chat(`Error crafting ${itemName}: ${err.message}`);
        }
    } else {
        bot.chat(`No recipe for ${itemName}`);
    }
}

module.exports = async function makeIronGear(bot) {
    const ironOreCount = bot.inventory.count(bot.registry.itemsByName['iron_ore'].id) + bot.inventory.count(bot.registry.itemsByName['deepslate_iron_ore'].id);
    const coalCount = bot.inventory.count(bot.registry.itemsByName['coal'].id);

    if (ironOreCount > 0 && coalCount > 0) {
        await smeltItem(bot, 'iron_ore', 'coal', ironOreCount);
    } else if (bot.inventory.count(bot.registry.itemsByName['deepslate_iron_ore'].id) > 0 && coalCount > 0) {
        await smeltItem(bot, 'deepslate_iron_ore', 'coal', ironOreCount);
    } else {
        bot.chat("Not enough iron ore or coal to smelt.");
    }

    const craftingTable = bot.findBlock({
        matching: bot.registry.blocksByName['crafting_table'].id,
        maxDistance: 64
    });

    if (!craftingTable) {
        bot.chat('No crafting table found nearby.');
        return;
    }

    const goal = new GoalNear(craftingTable.position.x, craftingTable.position.y, craftingTable.position.z, 1);
    await bot.pathfinder.goto(goal);

    bot.chat("Crafting iron gear...");

    await craftItem(bot, 'iron_sword', craftingTable);
    await craftItem(bot, 'iron_helmet', craftingTable);
    await craftItem(bot, 'iron_chestplate', craftingTable);
    await craftItem(bot, 'iron_leggings', craftingTable);
    await craftItem(bot, 'iron_boots', craftingTable);

    bot.chat("Iron gear crafted.");

    // Equip armor
    await bot.equip(bot.inventory.findInventoryItem(bot.registry.itemsByName['iron_helmet'].id), 'head');
    await bot.equip(bot.inventory.findInventoryItem(bot.registry.itemsByName['iron_chestplate'].id), 'torso');
    await bot.equip(bot.inventory.findInventoryItem(bot.registry.itemsByName['iron_leggings'].id), 'legs');
    await bot.equip(bot.inventory.findInventoryItem(bot.registry.itemsByName['iron_boots'].id), 'feet');
    await bot.equip(bot.inventory.findInventoryItem(bot.registry.itemsByName['iron_sword'].id), 'hand');

    bot.chat("Iron gear equipped.");
};
