// Utility for managing build barrels at chunk corners
const mcData = require('minecraft-data')('1.21');
const { Vec3 } = require('vec3');
const craftBarrel = require('./craftBarrel');

async function ensureBarrels(bot, chunkX, chunkZ, neededBlockTypes) {
  // Place barrels at NW and NE corners of the chunk
  const corners = [
    { x: chunkX * 16, z: chunkZ * 16 }, // NW
    { x: chunkX * 16 + 15, z: chunkZ * 16 } // NE
  ];
  let barrelsPlaced = 0;
  for (const corner of corners) {
    const pos = new Vec3(corner.x, bot.entity.position.y, corner.z);
    const block = bot.blockAt(pos);
    if (!block || block.name !== 'barrel') {
      let barrelItem = bot.inventory.findInventoryItem(mcData.itemsByName['barrel'].id);
      if (!barrelItem) {
        bot.chat('No barrel in inventory, attempting to craft one.');
        await craftBarrel(bot);
        barrelItem = bot.inventory.findInventoryItem(mcData.itemsByName['barrel'].id);
      }

      if (barrelItem) {
        await bot.equip(barrelItem, 'hand');
        await bot.pathfinder.goto(new bot.pathfinder.goals.GoalNear(pos.x, pos.y, pos.z, 1));
        await bot.placeBlock(bot.blockAt(pos.offset(0, -1, 0)), { x: 0, y: 1, z: 0 });
        bot.chat(`Placed a barrel at ${pos.x},${pos.y},${pos.z}`);
        barrelsPlaced++;
      } else {
        bot.chat('No barrel in inventory to place!');
      }
    } else {
      barrelsPlaced++;
    }
    if (barrelsPlaced >= Math.min(2, Math.ceil(neededBlockTypes.length / 27))) break;
  }
}

module.exports = ensureBarrels;
