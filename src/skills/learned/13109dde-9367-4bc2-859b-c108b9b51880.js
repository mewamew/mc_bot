async function mineOakLogs(bot) {
    // 获取当前背包中橡木原木数量
    const currentCount = getItemCount(bot, 'oak_log');
    
    // 输出开始信息
    logger.report(`开始挖掘橡木原木，当前已有: ${currentCount}个`, bot);
    
    // 调用工具函数挖掘橡木
    await mineBlock(bot, logger, 'oak_log', 4);
    
    // 输出完成信息
    logger.report('完成橡木原木挖掘任务', bot);
}