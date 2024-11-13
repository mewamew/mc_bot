async function collectRemainingOakLogs(bot) {
    // 计算还需要收集的数量
    const requiredLogs = 4;
    const currentLogs = bot.inventory.items().filter(item => item.name === 'oak_log')
        .reduce((count, item) => count + item.count, 0);
    const remainingLogs = requiredLogs - currentLogs;
    
    logger.report(`当前有 ${currentLogs} 个橡木原木，还需要收集 ${remainingLogs} 个`, bot);
    
    // 如果已经达到目标，直接返回
    if (currentLogs >= requiredLogs) {
        logger.report('已达到目标数量', bot);
        return;
    }
    
    // 循环收集剩余的木头
    for (let i = 0; i < remainingLogs; i++) {
        // 查找最近的橡木原木
        const oakLog = bot.findBlock({
            matching: mcData.blocksByName['oak_log'].id,
            maxDistance: 32
        });
        
        if (!oakLog) {
            logger.report('无法找到更多橡木原木', bot);
            return;
        }
        
        // 移动到原木旁边
        await bot.pathfinder.goto(new GoalGetToBlock(oakLog.position.x, oakLog.position.y, oakLog.position.z));
        
        // 挖掘原木
        logger.report(`正在挖掘位于 ${oakLog.position.x}, ${oakLog.position.y}, ${oakLog.position.z} 的橡木原木`, bot);
        await bot.dig(oakLog);
        
        // 检查当前数量
        const newCount = bot.inventory.items().filter(item => item.name === 'oak_log')
            .reduce((count, item) => count + item.count, 0);
            
        if (newCount >= requiredLogs) {
            logger.report('成功收集到目标数量的橡木原木', bot);
            return;
        }
    }
}