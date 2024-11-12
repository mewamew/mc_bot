async function collectFourOakLogs(bot) {
  let currentLogCount = bot.inventory.items().filter(item => item.name === 'oak_log').reduce((count, item) => count + item.count, 0);
  
  while (currentLogCount < 4) {
    const log = bot.findBlock({
      matching: block => block.name === 'oak_log',
      maxDistance: 32
    });
    
    if (!log) {
      break;
    }
    
    await bot.pathfinder.goto(new GoalGetToBlock(log.position.x, log.position.y, log.position.z));
    await bot.lookAt(log.position.offset(0.5, 0.5, 0.5));
    await bot.dig(log);
    
    // 等待更长时间确保物品被收集
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    currentLogCount = bot.inventory.items().filter(item => item.name === 'oak_log').reduce((count, item) => count + item.count, 0);
  }
}