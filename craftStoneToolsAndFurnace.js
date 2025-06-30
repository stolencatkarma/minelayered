const { Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function findValidPlacement(bot, referenceBlock) {
    const offsets = [
      { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
    ];

    for (const offset of offsets) {
      const placementPos = referenceBlock.position.offset(offset.x, offset.y, offset.z);
      const blockAtPlacement = bot.blockAt(placementPos);
      const blockAbovePlacement = bot.blockAt(placementPos.offset(0, 1, 0));

      if (blockAtPlacement && blockAtPlacement.boundingBox === 'block' && blockAbovePlacement && blockAbovePlacement.name === 'air') {
        const playerPos = bot.entity.position.floored();
        const headPos = playerPos.offset(0, 1, 0);
        const placementAbove = placementPos.offset(0, 1, 0)

        if ((placementAbove.x === playerPos.x && placementAbove.y === playerPos.y && placementAbove.z === playerPos.z) ||
            (placementAbove.x === headPos.x && placementAbove.y === headPos.y && placementAbove.z === headPos.z)) {
          continue;
        }

        return { referenceBlock: blockAtPlacement, faceVector: { x: 0, y: 1, z: 0 } };
      }
    }
    return null;
  }


module.exports = async function craftStoneToolsAndFurnace(bot) {
  // Find the crafting table
  const craftingTable = bot.findBlock({
    matching: bot.registry.blocksByName['crafting_table'].id,
    maxDistance: 64
  });

  if (!craftingTable) {
    bot.chat('No crafting table found nearby.');
    return;
  }

  // Go to the crafting table
  const goal = new GoalNear(craftingTable.position.x, craftingTable.position.y, craftingTable.position.z, 1);
  await bot.pathfinder.goto(goal);

  // Craft stone pickaxe
  const stonePickaxeRecipe = bot.recipesFor(bot.registry.itemsByName['stone_pickaxe'].id, null, 1, craftingTable)[0];
  if (stonePickaxeRecipe) {
    await bot.craft(stonePickaxeRecipe, 1, craftingTable);
    await delay(1000);
  } else {
    bot.chat('Could not find recipe for stone pickaxe');
    return;
  }

  // Craft stone axe
  const stoneAxeRecipe = bot.recipesFor(bot.registry.itemsByName['stone_axe'].id, null, 1, craftingTable)[0];
  if (stoneAxeRecipe) {
    await bot.craft(stoneAxeRecipe, 1, craftingTable);
    await delay(1000);
  } else {
    bot.chat('Could not find recipe for stone axe');
    return;
  }

  // Craft stone sword
  const stoneSwordRecipe = bot.recipesFor(bot.registry.itemsByName['stone_sword'].id, null, 1, craftingTable)[0];
  if (stoneSwordRecipe) {
    await bot.craft(stoneSwordRecipe, 1, craftingTable);
    await delay(1000);
  } else {
    bot.chat('Could not find recipe for stone sword');
    return;
  }

  // Craft furnace
  const furnaceRecipe = bot.recipesFor(bot.registry.itemsByName['furnace'].id, null, 1, craftingTable)[0];
  if (furnaceRecipe) {
    await bot.craft(furnaceRecipe, 1, craftingTable);
    await delay(1000);
  } else {
    bot.chat('Could not find recipe for furnace');
    return;
  }

  bot.chat('Crafted stone tools and a furnace.');

  // Place the furnace
  const furnace = bot.inventory.findInventoryItem(bot.registry.itemsByName['furnace'].id);
  if (!furnace) {
    bot.chat('Could not find a furnace to place.');
    return;
  }

  const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
  const validPlacementPosition = await findValidPlacement(bot, referenceBlock);

  if (!validPlacementPosition) {
    bot.chat('Could not find a valid position to place the furnace.');
    return;
  }

  await bot.equip(furnace, 'hand');
  await bot.placeBlock(validPlacementPosition.referenceBlock, validPlacementPosition.faceVector);

  bot.chat('Placed a furnace.');
};
