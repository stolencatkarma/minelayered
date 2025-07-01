const { findAndKillMob } = require('./utils');

async function gatherWool(bot, count = 3) {
    const requiredWool = count;
    const allWool = bot.inventory.items().filter(item => item.name.includes('wool'));
    let woolCount = allWool.reduce((acc, item) => acc + item.count, 0);

    if (woolCount >= requiredWool) {
        bot.chat(`Already have ${woolCount} wool.`);
        return;
    }

    bot.chat(`I need to gather ${requiredWool - woolCount} more wool.`);

    let attempts = 0;
    while (woolCount < requiredWool) {
        if (attempts > 5) { // Try 5 times
            bot.chat("Couldn't find any sheep after several attempts. Skipping wool gathering.");
            return;
        }
        await findAndKillMob(bot, 'sheep', 300);
        const allWoolAfter = bot.inventory.items().filter(item => item.name.includes('wool'));
        woolCount = allWoolAfter.reduce((acc, item) => acc + item.count, 0);
        if (woolCount < requiredWool) {
            attempts++;
            await bot.waitForTicks(20); // wait 1 second before retrying
        }
    }

    bot.chat(`Gathered enough wool: ${woolCount}`);
}

module.exports = { gatherWool };
