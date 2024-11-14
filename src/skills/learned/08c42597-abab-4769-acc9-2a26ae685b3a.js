async function moveToNearestCraftingTableWithFallback(bot) {
    // 查找最近的工作台
    const craftingTable = bot.findBlock({
        matching: mcData.blocksByName.crafting_table.id,
        maxDistance: 32
    });
    
    if (!craftingTable) {
        logger.report('找不到工作台', bot);
        return;
    }
    
    logger.report(`找到工作台，距离约${craftingTable.position.distanceTo(bot.entity.position)}格`, bot);
    
    // 尝试直接移动到工作台位置
    const mainPath = craftingTable.position.offset(1, 0, 0);
    let success = false;
    
    // 尝试主路径
    try {
        await moveTo(bot, logger, mainPath);
        success = true;
    } catch {
        logger.report('主路径移动失败，尝试备选路径', bot);
    }
    
    // 如果主路径失败，尝试其他方向
    if (!success) {
        const offsets = [
            {x: -1, y: 0, z: 0},
            {x: 0, y: 0, z: 1},
            {x: 0, y: 0, z: -1}
        ];
        
        for (const offset of offsets) {
            if (success) break;
            
            const altPath = craftingTable.position.offset(offset.x, offset.y, offset.z);
            try {
                await moveTo(bot, logger, altPath);
                success = true;
            } catch {
                continue;
            }
        }
    }
    
    if (success) {
        logger.report('已到达工作台旁', bot);
    } else {
        logger.report('无法到达工作台，所有路径都失败', bot);
    }
}