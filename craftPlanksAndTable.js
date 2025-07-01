module.exports = async function craftPlanksAndTable(bot) {
  const mcData = require('minecraft-data')(bot.version);

  // Find any type of log in the inventory
  const log = bot.inventory.items().find(item => item.name.endsWith('_log'));
  if (!log) {
    bot.chat("I don't have any logs to craft planks.");
    return;
  }

  // Determine the type of plank to craft
  const plankName = log.name.replace('_log', '_planks');
  const plank = mcData.itemsByName[plankName];

  // Craft planks
  const plankRecipe = bot.recipesFor(plank.id, null, 1, null)[0];
  if (plankRecipe) {
    try {
      await bot.craft(plankRecipe, 1, null);
      bot.chat(`Crafted ${plank.displayName}.`);
    } catch (err) {
      bot.chat(`Error crafting planks: ${err.message}`);
      return;
    }
  } else {
    bot.chat("I don't know how to craft planks.");
    return;
  }

  // Craft crafting table
  const craftingTableItem = mcData.itemsByName.crafting_table;
  const tableRecipe = bot.recipesFor(craftingTableItem.id, null, 1, null)[0];
  if (tableRecipe) {
    try {
      await bot.craft(tableRecipe, 1, null);
      bot.chat('Crafted a crafting table.');
    } catch (err) {
      bot.chat(`Error crafting table: ${err.message}`);
    }
  } else {
    bot.chat("I don't know how to craft a crafting table.");
  }
}
