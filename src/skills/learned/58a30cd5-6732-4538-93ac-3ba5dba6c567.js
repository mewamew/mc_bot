async function moveToNearestPlayer(bot) {
    const player = bot.nearestEntity(entity => entity.type === 'player')
    if (!player) {
        logger.report('找不到玩家', bot)
        return
    }
    
    logger.report('正在移动到玩家身边', bot)
    await bot.pathfinder.goto(new GoalFollow(player, 2))
    logger.report('已到达玩家身边', bot)
}