async function craftCraftingTable(bot) {
  // 初始化 mcData
  const mcData = require('minecraft-data')(bot.version);
  
  // 检查木板数量
  const planksCount = bot.inventory.items().filter(item => item.name === 'oak_planks').reduce((count, item) => count + item.count, 0);
  if (planksCount < 4) {
    logger.report("没有足够的木板来制作工作台", bot);
    return false;
  }

  // 等待配方加载
  await bot.waitForTicks(20);

  // 获取工作台的配方
  const craftingTableId = mcData.itemsByName.crafting_table.id;
  const recipes = bot.recipesFor(craftingTableId, null, 1, null);
  
  if (!recipes || recipes.length === 0) {
    logger.report("找不到工作台的配方", bot);
    return false;
  }

  // 制作工作台
  await bot.craft(recipes[0], 1);
  
  // 验证制作结果
  const hasCraftingTable = bot.inventory.items().some(item => item.name === 'crafting_table');
  if (!hasCraftingTable) {
    logger.report("工作台制作失败", bot);
    return false;
  }

  logger.report("成功制作工作台", bot);
  return true;
}