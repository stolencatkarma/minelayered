module.exports = async function craftPlanksAndTable(bot) {
  // Craft planks
  const log = bot.inventory.findInventoryItem(bot.registry.itemsByName['oak_log'].id)
  if (!log) {
    bot.chat('No logs to craft with.')
    return
  }

  const plankRecipe = bot.recipesFor(bot.registry.itemsByName['oak_planks'].id, null, 1, null)[0]
  await bot.craft(plankRecipe, log.count, null)

  // Craft a crafting table
  const craftingTableRecipe = bot.recipesFor(bot.registry.itemsByName['crafting_table'].id, null, 1, null)[0]
  await bot.craft(craftingTableRecipe, 1, null)

  // Place the crafting table
  const craftingTable = bot.inventory.findInventoryItem(bot.registry.itemsByName['crafting_table'].id)
  if (!craftingTable) {
    bot.chat('Could not craft a crafting table.')
    return
  }

  // Find a valid placement position
  const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0))
  const validPlacementPosition = await findValidPlacement(bot, referenceBlock)

  if (!validPlacementPosition) {
    bot.chat('Could not find a valid position to place the crafting table.')
    return
  }

  await bot.equip(craftingTable, 'hand')
  await bot.placeBlock(validPlacementPosition.referenceBlock, validPlacementPosition.faceVector)

  bot.chat('Crafted and placed a crafting table.')
}

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
