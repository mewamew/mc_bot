async function placeCraftingTable(bot) {
    // 获取物品ID
    const craftingTableId = mcData.itemsByName.crafting_table.id;
    const oakPlanksId = mcData.itemsByName.oak_planks.id;
    
    // 先制作木板
    const logRecipes = bot.recipesFor(oakPlanksId, null, 1, null);
    if (logRecipes && logRecipes.length > 0) {
        await bot.craft(logRecipes[0], 1);
    }
    
    // 制作工作台
    const craftingTableRecipes = bot.recipesFor(craftingTableId, null, 1, null);
    if (craftingTableRecipes && craftingTableRecipes.length > 0) {
        await bot.craft(craftingTableRecipes[0], 1);
    }
    
    // 找到工作台物品
    const craftingTable = bot.inventory.findInventoryItem('crafting_table');
    if (!craftingTable) {
        logger.report('没有工作台可以放置', bot);
        return;
    }
    
    // 装备工作台到主手
    await bot.equip(craftingTable, 'hand');
    
    // 低头看地面
    await bot.look(bot.entity.yaw, -Math.PI/4);
    
    // 获取视线所指的方块
    const targetBlock = bot.blockAtCursor(3);
    if (!targetBlock) {
        logger.report('找不到可以放置的地方', bot);
        return;
    }
    
    // 放置工作台
    await bot.placeBlock(targetBlock, new Vec3(0, 1, 0));
}