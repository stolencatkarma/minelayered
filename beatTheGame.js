const mineDiamonds = require('./mineDiamonds');

async function beatTheGame(bot) {
    bot.chat("Initiating end-game sequence.");

    const hasItem = (name, count = 1) => {
        const item = bot.inventory.findInventoryItem(bot.registry.itemsByName[name]?.id);
        return item && item.count >= count;
    };

    // First, get diamonds
    if (!hasItem('diamond', 3)) {
        await mineDiamonds(bot, 3);
    } else {
        bot.chat("I already have enough diamonds.");
    }

    // Next steps will be added here, e.g., building a Nether portal.

    console.log('beatTheGame main function finished.');
}

module.exports = beatTheGame;
