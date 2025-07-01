const { Vec3 } = require('vec3');
const { GoalNear } = require('mineflayer-pathfinder').goals;

async function setupBase(bot, baseCenter) {
  bot.chat('Setting up base...');

  // --- CRAFTING TABLE ---
  let craftingTable = bot.findBlock({ matching: b => b.name === 'crafting_table', maxDistance: 32 });
  if (!craftingTable) {
    bot.chat('No crafting table found nearby, I will craft and place one.');
    if (!bot.inventory.findInventoryItem(bot.registry.itemsByName['crafting_table'].id)) {
      await require('./craftPlanksAndTable')(bot);
    }
    const tableItem = bot.inventory.findInventoryItem(bot.registry.itemsByName['crafting_table'].id);
    if (tableItem) {
      const tablePos = baseCenter.offset(1, 0, 0);
      await placeItem(bot, 'crafting_table', tablePos);
    }
  }

  // --- FURNACE ---
  let furnace = bot.findBlock({ matching: b => b.name === 'furnace', maxDistance: 32 });
  if (!furnace) {
    bot.chat('No furnace found, I will craft and place one.');
    if (!bot.inventory.findInventoryItem(bot.registry.itemsByName['furnace'].id)) {
      await require('./craftStoneToolsAndFurnace')(bot);
    }
    const furnaceItem = bot.inventory.findInventoryItem(bot.registry.itemsByName['furnace'].id);
    if (furnaceItem) {
      const furnacePos = baseCenter.offset(-1, 0, 0);
      await placeItem(bot, 'furnace', furnacePos);
    }
  }

  bot.chat('Base setup complete.');
}

async function placeItem(bot, itemName, position) {
  const item = bot.inventory.findInventoryItem(bot.registry.itemsByName[itemName].id);
  if (!item) return;

  const referenceBlock = bot.blockAt(position.offset(0, -1, 0));
  try {
    await bot.pathfinder.goto(new GoalNear(position.x, position.y, position.z, 2));
    await bot.equip(item, 'hand');
    await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
    bot.chat(`Placed ${itemName}.`);
  } catch (err) {
    bot.chat(`Could not place ${itemName}: ${err.message}`);
  }
}

module.exports = setupBase;
