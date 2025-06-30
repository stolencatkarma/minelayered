const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = async function gatherFood(bot) {
  const { pathfinder, Movements } = require('mineflayer-pathfinder');
  const { GoalNear } = require('mineflayer-pathfinder').goals;
  const mcData = require('minecraft-data')(bot.version);

  const foodToCook = [
    'beef',
    'porkchop',
    'chicken',
    'mutton',
    'rabbit',
    'cod',
    'salmon',
  ];

  const animals = [
    mcData.entitiesByName.cow.id,
    mcData.entitiesByName.pig.id,
    mcData.entitiesByName.sheep.id,
    mcData.entitiesByName.chicken.id,
  ];

  async function findAndKillAnimals(count) {
    for (let i = 0; i < count; i++) {
      const animal = bot.nearestEntity(
        (entity) =>
          animals.includes(entity.entityType) &&
          entity.position.distanceTo(bot.entity.position) < 64
      );

      if (!animal) {
        bot.chat('No animals found nearby. Wandering to find some.');
        // Wander randomly to find animals
        const goal = new GoalNear(
          bot.entity.position.x + (Math.random() * 20 - 10),
          bot.entity.position.y,
          bot.entity.position.z + (Math.random() * 20 - 10),
          1
        );
        await bot.pathfinder.goto(goal);
        i--; // Retry finding an animal
        continue;
      }

      bot.chat(`Found a ${animal.name}. Going to kill it.`);
      const sword = bot.inventory.items().find((item) => item.name.includes('sword'));
      if (sword) {
        await bot.equip(sword, 'hand');
      }

      try {
        await bot.lookAt(animal.position);
        await delay(500);
        await bot.pathfinder.goto(new GoalNear(animal.position.x, animal.position.y, animal.position.z, 1));
        await bot.attack(animal);
      } catch (e) {
        bot.chat(`Error killing animal: ${e.message}`);
      }
      await bot.waitForTicks(20); // Wait for drops
    }
  }

  async function cookFood() {
    const furnaceBlock = bot.findBlock({
      matching: mcData.blocksByName.furnace.id,
      maxDistance: 64,
    });

    if (!furnaceBlock) {
      bot.chat('No furnace found.');
      return;
    }

    const food = bot.inventory.items().find((item) => foodToCook.includes(item.name));
    if (!food) {
      bot.chat('No food to cook.');
      return;
    }

    const coal = bot.inventory.findInventoryItem(mcData.itemsByName.coal.id);
    if (!coal) {
      bot.chat('No coal to use as fuel.');
      return;
    }

    await bot.pathfinder.goto(new GoalNear(furnaceBlock.position.x, furnaceBlock.position.y, furnaceBlock.position.z, 2));
    const furnace = await bot.openFurnace(furnaceBlock);

    await furnace.putFuel(coal.type, null, bot.inventory.count(coal.type));
    await furnace.putInput(food.type, null, bot.inventory.count(food.type));

    bot.chat('Cooking food...');

    // Wait for the food to cook
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        const cookedFood = bot.inventory
          .items()
          .find((item) => item.name.includes('cooked'));
        if (cookedFood && cookedFood.count >= 5) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });

    await furnace.takeOutput();
    await furnace.close();
    bot.chat('Finished cooking food.');
  }

  await findAndKillAnimals(5);
  await cookFood();
};
