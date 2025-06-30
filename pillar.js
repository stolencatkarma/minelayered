const vec3 = require('vec3');

async function pillar(bot) {
  const blockInInventory = bot.inventory.items().find(item => bot.registry.blocksByName[item.name] && bot.registry.blocksByName[item.name].boundingBox === 'block');

  if (!blockInInventory) {
    bot.chat('I have no blocks to pillar with.');
    return;
  }

  const pillarBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
  if (!pillarBlock) {
      bot.chat('No block below me');
      return;
  }

  await bot.equip(blockInInventory, 'hand');
  bot.setControlState('jump', true);

  const interval = setInterval(() => {
    if (bot.entity.onGround) {
        bot.placeBlock(pillarBlock, vec3(0, 1, 0)).catch(err => {
            // ignore
        });
    }
  }, 10);

  setTimeout(() => {
    clearInterval(interval);
    bot.setControlState('jump', false);
  }, 5000); // Pillar for 5 seconds
}

module.exports = pillar;
