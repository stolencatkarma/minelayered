const { findOrCreateCraftingTable } = require('./utils');

async function craftBarrel(bot) {
  // Check if there is already a barrel in the inventory
  const existingBarrel = bot.inventory.findInventoryItem(bot.registry.itemsByName['barrel'].id);
  if (existingBarrel) {
    bot.chat('I already have a barrel.');
    return;
  }

  // Check for materials: 6 planks, 2 slabs
  const planks = bot.inventory.findInventoryItem(bot.registry.itemsByName['oak_planks'].id);
  const slabs = bot.inventory.findInventoryItem(bot.registry.itemsByName['oak_slab'].id);

  if (!planks || planks.count < 6) {
    bot.chat('I do not have enough planks to craft a barrel.');
    return;
  }

  if (!slabs || slabs.count < 2) {
    bot.chat('I do not have enough slabs, attempting to craft them now.');
    const craftingTable = await findOrCreateCraftingTable(bot);
    if (!craftingTable) {
      bot.chat('Could not find or create a crafting table to make slabs.');
      return;
    }

    const slabRecipe = bot.recipesFor('oak_slab', null, 1, craftingTable)[0];
    if (slabRecipe) {
      try {
        await bot.craft(slabRecipe, 1, craftingTable);
        bot.chat('Successfully crafted oak slabs.');
      } catch (err) {
        bot.chat(`Error crafting slabs: ${err.message}`);
        return;
      }
    } else {
      bot.chat('I do not know how to craft slabs.');
      return;
    }
  }

  // Now, craft the barrel
  const craftingTable = await findOrCreateCraftingTable(bot);
  if (!craftingTable) {
    bot.chat('Could not find or create a crafting table to make a barrel.');
    return;
  }

  const barrelRecipe = bot.recipesFor('barrel', null, 1, craftingTable)[0];
  if (barrelRecipe) {
    try {
      await bot.craft(barrelRecipe, 1, craftingTable);
      bot.chat('Successfully crafted a barrel.');
    } catch (err) {
      bot.chat(`Error crafting barrel: ${err.message}`);
    }
  } else {
    bot.chat('I do not know how to craft a barrel.');
  }
}

module.exports = craftBarrel;
