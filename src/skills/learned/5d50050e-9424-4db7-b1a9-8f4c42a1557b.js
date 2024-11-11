async function moveToNearestPlayer(bot) {
    // 获取最近的玩家实体
    const player = bot.nearestEntity(entity => entity.type === 'player');
    
    if (!player) {
        throw new Error('找不到玩家');
    }

    // 获取玩家位置
    const playerPos = player.position;
    
    logger.report(`正在移动到玩家位置: x=${Math.floor(playerPos.x)}, y=${Math.floor(playerPos.y)}, z=${Math.floor(playerPos.z)}`, bot);
    
    // 移动到玩家附近2格范围内
    await bot.pathfinder.goto(new GoalNear(playerPos.x, playerPos.y, playerPos.z, 2));
    
    logger.report('已到达玩家附近', bot);
}