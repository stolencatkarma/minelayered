const { GoalBlock } = require('mineflayer-pathfinder').goals;
const { Vec3 } = require('vec3');

async function mineStaircase(bot, depth = 5) {
  bot.chat(`Starting to mine a staircase ${depth} blocks down.`);

  for (let i = 0; i < depth; i++) {
    const forward = bot.entity.position.plus(bot.entity.velocity);
    const dx = Math.round(forward.x - bot.entity.position.x);
    const dz = Math.round(forward.z - bot.entity.position.z);

    const target1 = bot.blockAt(bot.entity.position.offset(dx, 0, dz));
    const target2 = bot.blockAt(bot.entity.position.offset(dx, 1, dz));
    const step = bot.blockAt(bot.entity.position.offset(dx, -1, dz));

    if (target1 && bot.canDigBlock(target1)) {
      await bot.dig(target1);
    }
    if (target2 && bot.canDigBlock(target2)) {
      await bot.dig(target2);
    }
    if (step && bot.canDigBlock(step)) {
      await bot.dig(step);
    }

    await bot.pathfinder.goto(new GoalBlock(bot.entity.position.x + dx, bot.entity.position.y - 1, bot.entity.position.z + dz));
    bot.chat(`Mined down ${i + 1}/${depth} levels.`);
  }

  bot.chat("Finished mining the staircase.");
}

module.exports = mineStaircase;
