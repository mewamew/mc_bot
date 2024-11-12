async function craftCraftingTable(bot) {
    const mcData = require('minecraft-data')(bot.version)
    
    // 获取木板数量
    const planksCount = bot.inventory.items().filter(item => item.name === 'oak_planks').reduce((count, item) => count + item.count, 0)
    
    if (planksCount < 4) {
        logger.report('没有足够的木板来制作工作台', bot)
        return
    }
    
    // 获取工作台的配方
    const craftingTableId = mcData.itemsByName['crafting_table'].id
    const recipe = bot.recipesFor(craftingTableId, null, 1, null)[0]
    
    if (!recipe) {
        logger.report('找不到工作台的配方', bot)
        return
    }
    
    // 制作工作台
    await bot.craft(recipe, 1)
    logger.report('成功制作了工作台', bot)
}