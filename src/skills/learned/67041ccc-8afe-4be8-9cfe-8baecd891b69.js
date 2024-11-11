async function moveToPlayer(bot) {
    // 获取最近的玩家实体
    const player = bot.nearestEntity(entity => entity.type === 'player');
    
    if (!player) {
        logger.report("未找到玩家", bot);
        throw new Error("No player found");
    }

    logger.report(`找到玩家,正在移动到玩家位置`, bot);
    
    // 使用pathfinder移动到玩家2格范围内
    await bot.pathfinder.goto(new GoalFollow(player, 2));
    
    logger.report("已到达玩家身边", bot);
}