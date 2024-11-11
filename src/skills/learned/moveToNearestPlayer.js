async function moveToNearestPlayer(bot) {
    // 找到最近的玩家实体
    const player = bot.nearestEntity(entity => entity.type === 'player')
    
    // 如果没有找到玩家，抛出错误
    if (!player) {
        throw new Error('找不到玩家')
    }
    
    // 获取玩家位置
    const playerPos = player.position
    logger.report(`正在移动到玩家位置: x=${playerPos.x}, y=${playerPos.y}, z=${playerPos.z}`, bot)
    
    // 移动到玩家2格范围内
    await bot.pathfinder.goto(new GoalNear(playerPos.x, playerPos.y, playerPos.z, 2))
    
    logger.report('已到达玩家身边', bot)
}