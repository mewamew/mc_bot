async function mineOakLogs(bot) {
    // 移动到最近的 oak_log
    await utils.moveTo({x: -7.50, y: 173.00, z: -7.39});
    logger.report('已移动到 oak_log 的位置', bot);
    
    // 挖掘 oak_log
    await utils.mineBlock('oak_log', 3);
    logger.report('已成功挖掘3个 oak_log', bot);
}