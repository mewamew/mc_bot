async function collectFourWoodLogs(bot) {
  const mcData = require('minecraft-data')(bot.version);
  const woodType = mcData.blocksByName.oak_log.id;
  let woodCount = 0;
  
  while (woodCount < 4) {
    // 搜索最近的橡木原木
    const wood = bot.findBlock({
      matching: woodType,
      maxDistance: 32
    });
    
    if (!wood) {
      logger.report("找不到更多的橡木原木", bot);
      return;
    }
    
    // 移动到原木旁边
    await bot.pathfinder.goto(new GoalGetToBlock(wood.position.x, wood.position.y, wood.position.z));
    
    // 装备最适合的工具（如果有的话）
    const tool = bot.inventory.items().find(item => item.name.includes('_axe'));
    if (tool) {
      await bot.equip(tool, 'hand');
    }
    
    // 挖掘原木
    await bot.dig(wood);
    
    // 更新木头数量
    woodCount = bot.inventory.items()
      .filter(item => item.name === 'oak_log')
      .reduce((count, item) => count + item.count, 0);
      
    if (woodCount >= 4) {
      logger.report(`成功收集到${woodCount}块木头`, bot);
      break;
    }
  }
}