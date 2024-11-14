async function moveToPlayerAya(bot) {
    const player = bot.players['_aya_abc']
    
    if (!player || !player.entity) {
        logger.report('找不到玩家_aya_abc', bot)
        return
    }

    const targetPos = player.entity.position
    logger.report('正在移动到玩家_aya_abc附近', bot)
    
    await moveTo(bot, logger, targetPos)
    
    const distance = bot.entity.position.distanceTo(targetPos)
    if (distance <= 2) {
        logger.report('已到达玩家_aya_abc附近', bot)
    } else {
        logger.report('移动失败,未能到达目标位置', bot)
    }
}