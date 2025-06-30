const { Schematic } = require('prismarine-schematic');
const fs = require('fs').promises;
const Vec3 = require('vec3');
const version = '1.21';
const mcData = require('minecraft-data')(version);


async function createLogTorchSchematic(filename) {
  // 1x2x1 schematic: [y][z][x]
  const size = new Vec3(1, 2, 1);
  const schematic = new Schematic(version, size, new Vec3(0, 0, 0), [], []);

  // Place oak_log at (0,0,0)
  const logId = mcData.blocksByName.oak_log.defaultState;
  schematic.setBlock(new Vec3(0, 0, 0), logId);

  // Place torch at (0,1,0)
  const torchId = mcData.blocksByName.torch.defaultState;
  schematic.setBlock(new Vec3(0, 1, 0), torchId);

  // Write schematic to file
  const buffer = await schematic.write();
  await fs.writeFile(filename, buffer);
  console.log(`Schematic written to ${filename}`);
}

createLogTorchSchematic('schematics/log_torch.schem');
