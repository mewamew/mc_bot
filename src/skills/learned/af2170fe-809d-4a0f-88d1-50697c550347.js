async function craftOakPlanks(bot) {
    // 获取MinecraftData
    const mcData = require('minecraft-data')(bot.version)
    
    // 检查原木数量
    const oakLogCount = bot.inventory.items()
        .filter(item => item.name === 'oak_log')
        .reduce((count, item) => count + item.count, 0)
    
    if (oakLogCount < 1) {
        logger.report('没有足够的橡木原木来制作木板', bot)
        return
    }
    
    // 获取木板的配方
    const planksRecipe = bot.recipesFor(mcData.itemsByName.oak_planks.id, null, 1, null)[0]
    
    if (!planksRecipe) {
        logger.report('无法找到橡木木板的合成配方', bot)
        return
    }
    
    // 记录初始木板数量
    const initialPlanksCount = bot.inventory.items()
        .filter(item => item.name === 'oak_planks')
        .reduce((count, item) => count + item.count, 0)
    
    // 执行合成
    await bot.craft(planksRecipe, 1)
    
    // 等待合成完成
    await bot.waitForTicks(10)
    
    // 检查结果
    const finalPlanksCount = bot.inventory.items()
        .filter(item => item.name === 'oak_planks')
        .reduce((count, item) => count + item.count, 0)
    
    if (finalPlanksCount >= initialPlanksCount + 4) {
        logger.report('成功制作了4个橡木木板', bot)
    } else {
        logger.report(`合成失败：只获得了${finalPlanksCount - initialPlanksCount}个木板`, bot)
    }
}