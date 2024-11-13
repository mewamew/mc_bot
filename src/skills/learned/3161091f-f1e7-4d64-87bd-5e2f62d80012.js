async function moveToNearestPlayer(bot) {
    // 查找最近的玩家
    const player = bot.nearestEntity(entity => entity.type === 'player');
    if (!player) {
        logger.report('找不到玩家', bot);
        return;
    }
    
    logger.report(`找到玩家，正在移动到玩家身边...`, bot);
    
    // 移动到玩家身边2格范围内
    const goal = new GoalFollow(player, 2);
    await bot.pathfinder.goto(goal);
    
    logger.report('已到达玩家身边', bot);
}