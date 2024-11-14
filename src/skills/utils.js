async function mineBlock(bot, logger, blockType, count) {
    const mcData = require('minecraft-data')(bot.version);
    const blockID = mcData.blocksByName[blockType]?.id
    if (!blockID) {
        logger.report('方块类型错误:' + blockType, bot);
        return
    }

    // 初始化计数器
    let minedCount = 0
    logger.report('开始挖掘 ' + count + ' 个 ' + blockType, bot);
    while (minedCount < count) {
        // 寻找最近的目标方块
        const block = bot.findBlock({
            matching: blockID,
            maxDistance: 32
        })

        if (!block) {
            logger.report('附近找不到 ' + blockType, bot);
            break
        }

        try {
            // 使用 collectBlock 插件进行挖掘
            await bot.collectBlock.collect(block)
            minedCount++
            logger.report('已经挖了 ' + minedCount + ' 个 ' + blockType, bot);
        } catch (err) {
            logger.report('挖掘失败:' + err.message, bot);
            break
        }
    }

    logger.report('任务完成啦！一共挖到了 ' + minedCount + ' 个 ' + blockType, bot);
}

function getItemCount(bot, itemName) {
    // 获取所有匹配的物品
    const items = bot.inventory.items().filter(item => item.name === itemName);
    if (!items.length) return 0;
    // 计算总数量（将所有匹配物品的数量相加）
    return items.reduce((count, item) => count + item.count, 0);
}

async function craftItemWithoutCraftingTable(bot, logger, itemName, count) {
    const mcData = require('minecraft-data')(bot.version);
    const item = mcData.itemsByName[itemName];
    if (!item) {
        logger.report('找不到物品: ' + itemName, bot);
        return;
    }
    // 获取不需要工作台的合成配方
    const recipe = bot.recipesFor(item.id, null, 1, null)[0];
    if (!recipe) {
        logger.report('找不到 ' + itemName + ' 的合成配方喵！', bot);
        return;
    }

    try {
        // 开始合成
        let craftedCount = 0;
        while (craftedCount < count) {
            await bot.craft(recipe, 1);
            craftedCount += recipe.result.count;
            logger.report('已经合成了 ' + craftedCount + ' 个 ' + itemName, bot);
        }
        
        logger.report('!合成完成啦！一共合成了 ' + craftedCount + ' 个 ' + itemName, bot);
    } catch (err) {
        logger.report('合成失败了：' + err.message, bot);
    }
}

async function craftItemWithCraftingTable(bot, logger, itemName, count) {
    const mcData = require('minecraft-data')(bot.version);
    const { GoalNear} = require('mineflayer-pathfinder').goals;

    const item = mcData.itemsByName[itemName];
    if (!item) {
        logger.report('找不到物品: ' + itemName, bot);
        return;
    }

    // 寻找附近的工作台
    const craftingTable = bot.findBlock({
        matching: mcData.blocksByName.crafting_table.id,
        maxDistance: 32
    });

    if (!craftingTable) {
        logger.report('找不到工作台喵！', bot);
        return;
    }

    // 获取合成配方
    const recipe = bot.recipesFor(item.id, null, 1, craftingTable)[0];
    if (!recipe) {
        logger.report('找不到 ' + itemName + ' 的合成配方喵！', bot);
        return;
    }

    try {
        // 移动到工作台旁边
        await bot.pathfinder.goto(new GoalNear(craftingTable.position.x, craftingTable.position.y, craftingTable.position.z, 1));
        
        // 开始合成
        let craftedCount = 0;
        while (craftedCount < count) {
            // 每次只合成1次配方的量
            await bot.craft(recipe, 1, craftingTable);
            craftedCount += recipe.result.count;
            logger.report('已经合成了 ' + craftedCount + ' 个 ' + itemName, bot);
            
            // 如果已经超过需要的数量就退出
            if (craftedCount >= count) break;
        }
        
        logger.report('合成完成啦！一共合成了 ' + craftedCount + ' 个 ' + itemName, bot);
    } catch (err) {
        logger.report('合成失败了喵：' + err.message, bot);
        logger.error(err);
    }
}

async function moveTo(bot, logger, position) {
    const { GoalNear} = require('mineflayer-pathfinder').goals;
    await bot.pathfinder.goto(new GoalNear(position.x, position.y, position.z, 1));
    logger.report('到达目的地: ' + position.x + ' ' + position.y + ' ' + position.z, bot);
}

module.exports = {
    mineBlock,
    getItemCount,
    craftItemWithCraftingTable,
    craftItemWithoutCraftingTable,
    moveTo
}
