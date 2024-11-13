async function craftOakPlanks(bot) {
    // 获取橡木木板的物品ID
    const oakPlanksId = mcData.itemsByName['oak_planks'].id
    
    // 查找制作橡木木板的配方
    const recipes = bot.recipesFor(oakPlanksId, null, 1, null)
    
    // 制作木板
    await bot.craft(recipes[0], 1)
    
    // 检查结果并报告
    const planksCount = bot.inventory.items().filter(item => item.name === 'oak_planks').reduce((count, item) => count + item.count, 0)
    logger.report(`已制作木板，当前数量: ${planksCount}`, bot)
}