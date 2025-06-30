const { Schematic } = require('prismarine-schematic');
const fs = require('fs').promises;
const Vec3 = require('vec3');
const version = '1.21';
const mcData = require('minecraft-data')(version);

async function createPlaceholderSchematic(filename, blockName = 'dirt') {
  const size = new Vec3(1, 1, 1);
  const schematic = new Schematic(version, size, new Vec3(0, 0, 0), [], []);

  const block = mcData.blocksByName[blockName];
  if (block) {
    schematic.setBlock(new Vec3(0, 0, 0), block.defaultState);
  }

  const buffer = await schematic.write();
  await fs.writeFile(filename, buffer);
  console.log(`Schematic written to ${filename}`);
}

async function generateAllPlaceholders() {
  const schematicsToCreate = ['house', 'farm', 'pens', 'fishing', 'mine'];
  for (const name of schematicsToCreate) {
    await createPlaceholderSchematic(`schematics/${name}.schem`);
  }
}

generateAllPlaceholders();
