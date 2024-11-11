async function giveAllWoodToPlayer(bot) {
    // 获取最近的玩家
    const player = bot.nearestEntity(entity => entity.type === 'player');
    
    // 如果找不到玩家，报告并返回
    if (!player) {
        logger.report("找不到玩家", bot);
        return;
    }
    
    // 移动到玩家附近
    await bot.pathfinder.goto(new GoalNear(player.position.x, player.position.y, player.position.z, 2));
    
    // 获取所有木头类型的物品
    const woodItems = bot.inventory.items().filter(item => 
        item.name.includes('log')
    );
    
    // 如果没有木头，报告并返回
    if (woodItems.length === 0) {
        logger.report("背包里没有木头", bot);
        return;
    }
    
    // 对每个木头物品进行投掷
    for (const item of woodItems) {
        await bot.toss(item.type, null, item.count);
        logger.report(`已投掷 ${item.count} 个 ${item.name}`, bot);
    }
    
    logger.report("所有木头已交给玩家", bot);
}