const { GoalNear } = require('mineflayer-pathfinder').goals;

async function findOrCreateCraftingTable(bot) {
    const craftingTable = bot.findBlock({
        matching: bot.registry.blocksByName.crafting_table.id,
        maxDistance: 32
    });

    if (craftingTable) {
        return craftingTable;
    }

    const craftingTableItem = bot.inventory.findInventoryItem(bot.registry.itemsByName.crafting_table.id);
    if (!craftingTableItem) {
        bot.chat('No crafting table in inventory, and none found nearby.');
        return null;
    }

    const referenceBlock = bot.blockAt(bot.entity.position.offset(2, 0, 0));
    if (!referenceBlock) {
        bot.chat('Could not find a suitable location to place crafting table.');
        return null;
    }

    try {
        await bot.equip(craftingTableItem, 'hand');
        await bot.placeBlock(referenceBlock, { x: 0, y: 1, z: 0 });
        bot.chat('Placed a crafting table.');
        return bot.findBlock({
            matching: bot.registry.blocksByName.crafting_table.id,
            maxDistance: 32
        });
    } catch (err) {
        bot.chat(`Error placing crafting table: ${err.message}`);
        return null;
    }
}

async function findAndKillMob(bot, mobName, searchRadius = 100) {
    const mob = bot.nearestEntity(e => e.name === mobName && e.position.distanceTo(bot.entity.position) < searchRadius && e.mobType !== 'Armor Stand');
    if (!mob) {
        bot.chat(`No ${mobName} found nearby.`);
        return;
    }

    // Equip best sword
    const swords = bot.inventory.items().filter(item => item.name.endsWith('_sword'));
    swords.sort((a, b) => {
        const tier = {
            'netherite_sword': 5,
            'diamond_sword': 4,
            'iron_sword': 3,
            'stone_sword': 2,
            'wooden_sword': 1
        };
        return (tier[b.name] || 0) - (tier[a.name] || 0);
    });

    if (swords.length > 0) {
        try {
            await bot.equip(swords[0], 'hand');
        } catch (err) {
            bot.chat(`Couldn't equip sword: ${err.message}`);
        }
    }

    bot.chat(`Found a ${mobName}, attacking it.`);
    while (mob.isValid) {
        const goal = new GoalNear(mob.position.x, mob.position.y, mob.position.z, 1);
        await bot.pathfinder.goto(goal);
        await bot.attack(mob);
        await bot.waitForTicks(5); // wait a bit between attacks
    }
    bot.chat(`Killed the ${mobName}.`);
}

async function craftItem(bot, itemName, count = 1) {
    const mcData = require('minecraft-data')(bot.version);
    const item = mcData.itemsByName[itemName];
    if (!item) {
        bot.chat(`Unknown item: ${itemName}`);
        return;
    }

    const craftingTable = bot.findBlock({
        matching: mcData.blocksByName.crafting_table.id,
        maxDistance: 32
    });

    const recipe = bot.recipesFor(item.id, null, 1, craftingTable ? craftingTable : null)[0];
    if (recipe) {
        bot.chat(`Crafting ${count} ${itemName}(s)...`);
        try {
            await bot.craft(recipe, count, craftingTable);
        } catch (err) {
            bot.chat(`Error crafting ${itemName}: ${err.message}`);
        }
    } else {
        bot.chat(`I don't know how to craft ${itemName}.`);
    }
}

module.exports = {
    findOrCreateCraftingTable,
    findAndKillMob,
    craftItem
};
