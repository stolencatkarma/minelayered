const { GoalBlock } = require('mineflayer-pathfinder').goals;
const { Vec3 } = require('vec3');

async function mineStaircase(bot, targetY = 12) {
    bot.chat(`Mining a staircase down to Y=${targetY}.`);

    // Determine a direction to dig in based on where the bot is looking.
    const yaw = bot.entity.yaw;
    let digVec;
    if (yaw >= -Math.PI / 4 && yaw < Math.PI / 4) digVec = new Vec3(0, 0, 1); // South
    else if (yaw >= Math.PI / 4 && yaw < 3 * Math.PI / 4) digVec = new Vec3(-1, 0, 0); // West
    else if (yaw >= 3 * Math.PI / 4 || yaw < -3 * Math.PI / 4) digVec = new Vec3(0, 0, -1); // North
    else digVec = new Vec3(1, 0, 0); // East

    while (bot.entity.position.y > targetY) {
        const currentPos = bot.entity.position.floored();
        const targetForwardPos = currentPos.plus(digVec);

        // Equip best pickaxe
        const pickaxes = bot.inventory.items().filter(item => item.name.endsWith('_pickaxe'));
        pickaxes.sort((a, b) => {
            const tier = { 'netherite_pickaxe': 5, 'diamond_pickaxe': 4, 'iron_pickaxe': 3, 'stone_pickaxe': 2, 'wooden_pickaxe': 1 };
            return (tier[b.name] || 0) - (tier[a.name] || 0);
        });
        if (pickaxes.length === 0) {
            bot.chat("I need a pickaxe to mine a staircase.");
            return;
        }
        await bot.equip(pickaxes[0], 'hand');

        // Dig the two blocks in front
        const blockHead = bot.blockAt(targetForwardPos.offset(0, 1, 0));
        const blockFeet = bot.blockAt(targetForwardPos);
        if (blockHead && blockHead.type !== 0) await bot.dig(blockHead);
        if (blockFeet && blockFeet.type !== 0) await bot.dig(blockFeet);

        // Move forward
        try {
            await bot.pathfinder.goto(new GoalBlock(targetForwardPos.x, targetForwardPos.y, targetForwardPos.z));
        } catch (e) { /* ignore */ }

        // Dig down
        const blockDown = bot.blockAt(bot.entity.position.offset(0, -1, 0));
        if (blockDown && blockDown.type !== 0) await bot.dig(blockDown);
        
        // Wait for gravity
        await bot.waitForTicks(5);
    }
    bot.chat("Finished mining the staircase.");
}

module.exports = mineStaircase;
