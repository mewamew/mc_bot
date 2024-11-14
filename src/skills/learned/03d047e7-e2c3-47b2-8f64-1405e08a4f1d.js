async function mineTwoOakLogs(bot) {
    const currentCount = getItemCount(bot, 'oak_log');
    
    if (currentCount >= 2) {
        logger.report('Already have enough oak logs', bot);
        return;
    }
    
    const neededCount = 2 - currentCount;
    logger.report(`Mining ${neededCount} oak logs`, bot);
    
    await mineBlock(bot, logger, 'oak_log', neededCount);
    
    const finalCount = getItemCount(bot, 'oak_log');
    if (finalCount >= 2) {
        logger.report('Successfully collected 2 oak logs', bot);
    } else {
        logger.report(`Failed to collect enough oak logs, only got ${finalCount}`, bot);
    }
}