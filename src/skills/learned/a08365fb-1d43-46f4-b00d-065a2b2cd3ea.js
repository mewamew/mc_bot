async function moveToPlayerNearby(bot) {
    const player = bot.players['_aya_abc'];
    
    if (!player || !player.entity) {
        logger.report('无法找到玩家 _aya_abc', bot);
        return;
    }

    const targetX = player.entity.position.x;
    const targetY = player.entity.position.y;
    const targetZ = player.entity.position.z;

    // 计算目标位置，确保距离小于 3 格
    const moveToX = targetX + 1; // 向玩家移动1格
    const moveToY = targetY; // 保持高度
    const moveToZ = targetZ + 1; // 向玩家移动1格

    await utils.moveTo({ x: moveToX, y: moveToY, z: moveToZ });
    logger.report('已移动到玩家附近', bot);
}