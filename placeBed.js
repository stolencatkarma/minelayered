const { Vec3 } = require('vec3');
const { GoalNear } = require('mineflayer-pathfinder').goals;

async function placeBed(bot, baseCenter) {
    const bedItem = bot.inventory.items().find(item => item.name.endsWith('_bed'));
    if (!bedItem) {
        bot.chat("I don't have a bed to place.");
        return;
    }

    const bedPos = baseCenter.offset(0, 1, 0);

    const referenceBlock = bot.blockAt(bedPos.offset(0, -1, 0));
    try {
        await bot.pathfinder.goto(new GoalNear(bedPos.x, bedPos.y, bedPos.z, 2));
        await bot.equip(bedItem, 'hand');
        await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
        bot.chat('Placed the bed.');
        bot.setSpawnPoint(bedPos);
        bot.chat('Spawn point set.');
    } catch (err) {
        bot.chat(`Could not place bed: ${err.message}`);
        // Try to find another spot
        const newBedPos = bot.entity.position.offset(2,0,0).floored();
        const newRefBlock = bot.blockAt(newBedPos.offset(0, -1, 0));
        try {
            await bot.pathfinder.goto(new GoalNear(newBedPos.x, newBedPos.y, newBedPos.z, 2));
            await bot.equip(bedItem, 'hand');
            await bot.placeBlock(newRefBlock, new Vec3(0, 1, 0));
            bot.chat('Placed the bed in a different location.');
            bot.setSpawnPoint(newBedPos);
            bot.chat('Spawn point set.');
        } catch (e) {
            bot.chat(`Failed to place bed again: ${e.message}`);
        }
    }
}

module.exports = { placeBed };
