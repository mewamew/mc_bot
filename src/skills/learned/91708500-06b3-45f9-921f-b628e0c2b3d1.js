async function craftEightOakPlanks(bot) {
    // 检查资源
    const oakLogCount = getItemCount(bot, 'oak_log');
    if (oakLogCount < 2) {
        logger.report('需要至少2个橡木原木来制作8个木板', bot);
        return;
    }

    // 尝试移动到工作台并合成，最多重试3次
    for (let attempt = 1; attempt <= 3; attempt++) {
        logger.report(`第${attempt}次尝试制作木板`, bot);
        
        await craftItemWithCraftingTable(bot, logger, 'oak_planks', 8);
        
        // 验证合成结果
        const planksCount = getItemCount(bot, 'oak_planks');
        if (planksCount >= 8) {
            logger.report('成功制作8个橡木木板', bot);
            return;
        }
        
        if (attempt < 3) {
            logger.report('合成失败，准备重试', bot);
        }
    }
    
    logger.report('多次尝试后仍无法完成木板制作', bot);
}