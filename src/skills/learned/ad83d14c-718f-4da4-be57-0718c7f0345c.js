async function collectFourOakLogs(bot) {
    // 获取oak_log的方块ID
    const oakLogId = mcData.blocksByName.oak_log.id;
    
    // 在函数内定义获取物品数量的辅助函数
    const getItemCount = (itemName) => {
        const items = bot.inventory.items().filter(item => item.name === itemName);
        if (!items.length) return 0;
        return items.reduce((count, item) => count + item.count, 0);
    };
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (getItemCount('oak_log') < 4 && attempts < maxAttempts) {
        attempts++;
        
        // 找到最近的橡树原木
        const oakLog = bot.findBlock({
            matching: oakLogId,
            maxDistance: 32
        });
        
        if (!oakLog) {
            logger.report('找不到橡树原木', bot);
            return;
        }
        
        // 移动到橡树原木附近
        await bot.pathfinder.goto(new GoalGetToBlock(oakLog.position.x, oakLog.position.y, oakLog.position.z));
        
        // 开始挖掘
        await bot.dig(oakLog);
        
        // 等待更长时间确保物品被收集
        await bot.waitForTicks(20);
    }
    
    const finalCount = getItemCount('oak_log');
    logger.report(`已收集${finalCount}个橡树原木`, bot);
    
    if (finalCount < 4) {
        logger.report('未能收集到足够的橡树原木', bot);
    }
}