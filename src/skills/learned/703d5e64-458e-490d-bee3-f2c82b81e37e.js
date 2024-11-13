async function collectFourOakLogs(bot) {
    // 检查当前木头数量
    const currentLogs = bot.inventory.items().filter(item => item.name === 'oak_log')
        .reduce((count, item) => count + item.count, 0);
    
    logger.report(`当前背包中有 ${currentLogs} 个橡木原木`, bot);
    
    if (currentLogs >= 4) {
        logger.report('已经有足够的橡木原木了', bot);
        return;
    }
    
    // 需要收集的数量
    const neededLogs = 4 - currentLogs;
    
    // 寻找最近的橡木原木方块
    const oakLog = bot.findBlock({
        matching: mcData.blocksByName['oak_log'].id,
        maxDistance: 32
    });
    
    if (!oakLog) {
        logger.report('找不到橡木原木方块', bot);
        return;
    }
    
    // 移动到木头旁边
    logger.report('正在移动到橡木原木旁', bot);
    await bot.pathfinder.goto(new GoalGetToBlock(oakLog.position.x, oakLog.position.y, oakLog.position.z));
    
    // 开始挖掘
    logger.report('开始挖掘橡木原木', bot);
    await bot.dig(oakLog);
    
    // 再次检查数量
    const finalLogs = bot.inventory.items().filter(item => item.name === 'oak_log')
        .reduce((count, item) => count + item.count, 0);
        
    logger.report(`已收集完成，现在有 ${finalLogs} 个橡木原木`, bot);
}