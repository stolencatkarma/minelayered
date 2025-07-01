const { Vec3 } = require('vec3');
const { GoalNear } = require('mineflayer-pathfinder').goals;

// A more robust function to flatten a chunk.
async function flattenChunk(bot, chunkX, chunkZ) {
  bot.chat(`Starting to flatten chunk at ${chunkX}, ${chunkZ}.`);

  const startX = chunkX * 16;
  const startZ = chunkZ * 16;
  const endX = startX + 16;
  const endZ = startZ + 16;

  // Determine a fixed Y level for the ground. Use the bot's starting foot position.
  const groundY = bot.entity.position.y - 1;

  // 1. Clear all blocks above the target ground level, layer by layer from the top.
  bot.chat('Clearing area above ground...');
  for (let y = groundY + 20; y > groundY; y--) {
    // bot.chat(`Clearing layer at Y=${y}.`);
    for (let x = startX; x < endX; x++) {
      for (let z = startZ; z < endZ; z++) {
        const pos = new Vec3(x, y, z);
        const block = bot.blockAt(pos);
        if (block && block.name !== 'air') {
          await digBlock(bot, block);
        }
      }
    }
  }

  // 2. Create a uniform cobblestone surface at the target ground level.
  bot.chat('Creating uniform ground level...');
  for (let x = startX; x < endX; x++) {
    for (let z = startZ; z < endZ; z++) {
      const pos = new Vec3(x, groundY, z);
      const block = bot.blockAt(pos);
      // If the block isn't cobblestone, dig it out.
      if (block && block.name !== 'cobblestone') {
        await digBlock(bot, block);
      }
      // Now, if the block is air, place cobblestone.
      if (bot.blockAt(pos)?.name === 'air') {
        await placeCobblestone(bot, pos);
      }
    }
  }

  bot.chat(`Finished flattening chunk at ${chunkX}, ${chunkZ}.`);
}

// Helper to safely dig a block, moving if necessary.
async function digBlock(bot, block) {
  try {
    // Check if bot can reach the block
    if (!bot.canDigBlock(block)) {
      await bot.pathfinder.goto(new GoalNear(block.position.x, block.position.y, block.position.z, 2));
    }
    // Equip the best tool
    const bestTool = bot.pathfinder.bestHarvestTool(block);
    if (bestTool) await bot.equip(bestTool, 'hand');
    await bot.dig(block);
  } catch (err) {
    // console.error(`Error digging block at ${block.position}:`, err.message);
  }
}

// Helper to place cobblestone, moving if necessary.
async function placeCobblestone(bot, position) {
  const cobblestone = bot.inventory.findInventoryItem(bot.registry.itemsByName['cobblestone'].id);
  if (!cobblestone) {
    bot.chat('I ran out of cobblestone!');
    // Here you could add logic to go mine more stone.
    return;
  }

  const referenceBlock = bot.blockAt(position.offset(0, -1, 0));
  if (!referenceBlock || referenceBlock.name === 'air') {
    // Cannot place on air. This implies the layer below is not solid.
    // For simplicity, we'll just report this. A more complex bot might fix the layer below.
    // console.log(`No solid block below ${position} to place cobblestone on.`);
    return;
  }

  try {
    await bot.equip(cobblestone, 'hand');
    await bot.pathfinder.goto(new GoalNear(referenceBlock.position.x, referenceBlock.position.y, referenceBlock.position.z, 2));
    await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
  } catch (err) {
    // console.error(`Error placing cobblestone at ${position}:`, err.message);
  }
}

module.exports = flattenChunk;
