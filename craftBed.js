const { craftItem } = require('./utils');

async function craftBed(bot) {
    const mcData = require('minecraft-data')(bot.version);
    const bedItem = bot.inventory.items().find(item => item.name.endsWith('_bed'));
    if (bedItem) {
        bot.chat('I already have a bed.');
        return;
    }

    // Check for 3 wool of the same color
    const wools = bot.inventory.items().filter(item => item.name.endsWith('_wool'));
    const woolCounts = {};
    for (const wool of wools) {
        if (woolCounts[wool.name]) {
            woolCounts[wool.name] += wool.count;
        } else {
            woolCounts[wool.name] = wool.count;
        }
    }

    let craftableBed = null;
    for (const woolColor in woolCounts) {
        if (woolCounts[woolColor] >= 3) {
            const bedName = woolColor.replace('_wool', '_bed');
            craftableBed = mcData.itemsByName[bedName];
            break;
        }
    }

    if (!craftableBed) {
        bot.chat("I don't have 3 wool of the same color to craft a bed.");
        return;
    }

    // Check for 3 planks
    const plankCount = bot.inventory.count(mcData.itemsByName.oak_planks.id) + 
                       bot.inventory.count(mcData.itemsByName.birch_planks.id) + 
                       bot.inventory.count(mcData.itemsByName.spruce_planks.id) + 
                       bot.inventory.count(mcData.itemsByName.jungle_planks.id) + 
                       bot.inventory.count(mcData.itemsByName.acacia_planks.id) + 
                       bot.inventory.count(mcData.itemsByName.dark_oak_planks.id);

    if (plankCount < 3) {
        bot.chat("I don't have enough planks to craft a bed.");
        return;
    }

    await craftItem(bot, craftableBed.name, 1);
}

module.exports = { craftBed };
