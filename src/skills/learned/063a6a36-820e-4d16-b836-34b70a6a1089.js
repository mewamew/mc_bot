async function moveToPlayerAya(bot) {
    const player = bot.players['_aya_abc'];
    
    if (!player || !player.entity) {
        logger.report('找不到玩家_aya_abc', bot);
        return;
    }

    const playerPos = player.entity.position;
    logger.report('正在移动到玩家_aya_abc附近', bot);
    
    await utils.moveTo(playerPos);
    
    logger.report('已到达玩家_aya_abc附近', bot);
}