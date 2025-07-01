// This module will handle schematic loading and building for the bot's home base.
// It assumes schematic files are in a 'schematics/' folder and named by type (e.g. 'house.schem').
const path = require('path');
const { Schematic } = require('prismarine-schematic');
const fs = require('fs').promises;
const mcData = require('minecraft-data')('1.21');
const { Vec3 } = require('vec3');

// Returns a list of unique block types needed for a schematic
async function getNeededBlockTypes(schematicName) {
  const schematicPath = path.join(__dirname, 'schematics', schematicName + '.schem');
  const buffer = await fs.readFile(schematicPath);
  const schematic = await Schematic.read(buffer, '1.21');
  const blockTypes = new Set();
  for (let y = 0; y < schematic.size.y; y++) {
    for (let z = 0; z < schematic.size.z; z++) {
      for (let x = 0; x < schematic.size.x; x++) {
        const stateId = schematic.getBlockStateId(new Vec3(x, y, z));
        if (stateId === 0) continue; // Air
        const block = mcData.blocksByStateId[stateId];
        if (block) blockTypes.add(block.name);
      }
    }
  }
  return Array.from(blockTypes);
}

async function buildSchematic(bot, schematicName, chunkX, chunkZ) {
  const schematicPath = path.join(__dirname, 'schematics', schematicName + '.schem');
  bot.chat(`Loading schematic: ${schematicName}`);
  const buffer = await fs.readFile(schematicPath);
  const schematic = await Schematic.read(buffer, bot.version);

  // Calculate world position for chunk origin
  const origin = {
    x: chunkX * 16,
    y: bot.entity.position.y, // Build at current Y
    z: chunkZ * 16
  };

  // Scan for missing blocks
  const mcData = require('minecraft-data')(bot.version);
  let missingBlocks = [];
  for (let y = 0; y < schematic.size.y; y++) {
    for (let z = 0; z < schematic.size.z; z++) {
      for (let x = 0; x < schematic.size.x; x++) {
        const stateId = schematic.getBlockStateId(new Vec3(x, y, z));
        if (stateId === 0) continue; // Air
        const block = mcData.blocksByStateId[stateId];
        if (!block) continue;
        const worldX = origin.x + x;
        const worldY = origin.y + y;
        const worldZ = origin.z + z;
        const pos = new Vec3(worldX, worldY, worldZ);
        const blockAt = bot.blockAt(pos);
        if (!blockAt || blockAt.name !== block.name) {
          missingBlocks.push({ pos, block });
        }
      }
    }
  }

  bot.chat(`Placing ${missingBlocks.length} blocks for ${schematicName}.`);
  for (const { pos, block } of missingBlocks) {
    // Check if we have the block in inventory
    const item = bot.inventory.findInventoryItem(mcData.itemsByName[block.name]?.id);
    if (!item) {
      bot.chat(`Missing ${block.name} for build at ${pos.x},${pos.y},${pos.z}`);
      continue;
    }
    try {
      await bot.equip(item, 'hand');
      // Place on top of a solid block below if possible
      const below = bot.blockAt(pos.offset(0, -1, 0));
      if (below && below.boundingBox === 'block') {
        await bot.placeBlock(below, { x: 0, y: 1, z: 0 });
        bot.chat(`Placed ${block.name} at ${pos.x},${pos.y},${pos.z}`);
      } else {
        bot.chat(`No valid support for ${block.name} at ${pos.x},${pos.y},${pos.z}`);
      }
    } catch (err) {
      bot.chat(`Error placing ${block.name} at ${pos.x},${pos.y},${pos.z}: ${err.message}`);
    }
  }
  bot.chat(`Finished building ${schematicName}.`);
}

async function fetchMaterialsFromBarrels(bot, chunkX, chunkZ, neededBlockTypes) {
  const { getBarrelPositions } = require('./homeDb');
  const barrelPositions = getBarrelPositions(chunkX, chunkZ);
  const mcData = require('minecraft-data')(bot.version);
  let fetched = {};
  for (const blockType of neededBlockTypes) {
    let found = false;
    for (const pos of barrelPositions) {
      const barrelPos = new Vec3(pos.x, bot.entity.position.y, pos.z);
      const barrelBlock = bot.blockAt(barrelPos);
      if (barrelBlock && barrelBlock.name === 'barrel') {
        try {
          const container = await bot.openContainer(barrelBlock);
          const item = container.containerItems().find(i => i && i.name === blockType);
          if (item) {
            await container.withdraw(item.type, null, item.count);
            bot.chat(`Fetched ${item.count} ${blockType} from barrel at ${barrelPos.x},${barrelPos.y},${barrelPos.z}`);
            fetched[blockType] = (fetched[blockType] || 0) + item.count;
          }
          await container.close();
          found = true;
          break;
        } catch (err) {
          bot.chat(`Error accessing barrel at ${barrelPos.x},${barrelPos.y},${barrelPos.z}: ${err.message}`);
        }
      }
    }
    if (!found) {
      bot.chat(`No ${blockType} found in barrels for this build.`);
    }
  }
  return fetched;
}

// Returns a map of blockType -> count needed, subtracting already-placed blocks
async function getNeededBlockCounts(bot, schematicName, chunkX, chunkZ) {
  const path = require('path');
  const mcData = require('minecraft-data')(bot.version);
  const schematicPath = path.join(__dirname, 'schematics', schematicName + '.schem');
  let schematic;
  try {
    const buffer = await fs.readFile(schematicPath);
    schematic = await Schematic.read(buffer, bot.version);
  } catch (err) {
    bot.chat(`Error loading schematic: ${schematicName} at ${schematicPath}`);
    bot.chat(`Schematic.read type: ${typeof Schematic.read}`);
    bot.chat(`Error: ${err && err.message}`);
    console.error('Schematic:', Schematic);
    throw err;
  }
  const needed = {};
  const origin = { x: chunkX * 16, y: bot.entity.position.y, z: chunkZ * 16 };
  for (let y = 0; y < schematic.size.y; y++) {
    for (let z = 0; z < schematic.size.z; z++) {
      for (let x = 0; x < schematic.size.x; x++) {
        const stateId = schematic.getBlockStateId(new Vec3(x, y, z));
        if (stateId === 0) continue; // Air
        const block = mcData.blocksByStateId[stateId];
        if (!block) continue;
        const worldX = origin.x + x;
        const worldY = origin.y + y;
        const worldZ = origin.z + z;
        const worldBlock = bot.blockAt(new Vec3(worldX, worldY, worldZ));
        if (!worldBlock || worldBlock.name !== block.name) {
          needed[block.name] = (needed[block.name] || 0) + 1;
        }
      }
    }
  }
  return needed;
}

module.exports = { buildSchematic, getNeededBlockTypes, fetchMaterialsFromBarrels, getNeededBlockCounts };
