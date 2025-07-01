const mineStaircase = require('./mineStaircase');

async function mineDiamonds(bot, count = 3) {
    const mcData = require('minecraft-data')(bot.version);

    // Check for iron pickaxe
    const ironPickaxe = bot.inventory.findInventoryItem(mcData.itemsByName.iron_pickaxe.id);
    if (!ironPickaxe) {
        bot.chat("I need an iron pickaxe to mine for diamonds.");
        // In a more robust system, we would queue a task to craft one.
        return;
    }

    // Mine down to a suitable level for diamonds
    bot.chat("Mining down to Y=-58 to find diamonds.");
    await mineStaircase(bot, -58);
    bot.chat("Reached diamond level. Now searching for ores.");

    // Equip iron pickaxe
    await bot.equip(ironPickaxe, 'hand');

    // Explore and mine for diamond ore
    const diamondOres = [mcData.blocksByName.diamond_ore.id, mcData.blocksByName.deepslate_diamond_ore.id];

    while (bot.inventory.count(mcData.itemsByName.diamond.id) < count) {
        const oreBlock = bot.findBlock({
            matching: diamondOres,
            maxDistance: 64,
            // Check if the block is reachable
            useExtraInfo: (block) => {
                const path = bot.pathfinder.getPathTo(block.position);
                return path.status === 'success';
            }
        });

        if (oreBlock) {
            bot.chat(`Found diamond ore at ${oreBlock.position}. Mining it.`);
            try {
                await bot.dig(oreBlock);
            } catch (err) {
                console.error("Error while digging diamond ore:", err);
                bot.chat("Couldn't mine the diamond ore, maybe it's obstructed.");
            }
        } else {
            bot.chat("Couldn't find any diamond ore nearby, exploring a bit.");
            // Simple exploration: just move forward for a bit
            await bot.pathfinder.move('forward', 10);
        }
    }

    bot.chat(`I have collected ${bot.inventory.count(mcData.itemsByName.diamond.id)} diamonds.`);
}

module.exports = mineDiamonds;
