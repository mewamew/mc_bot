//查找128格内是不是有工作台
// getNearestCraftingTablePosition用于获取指定格数内的crafting_table位置
// getNearestFurnacePosition用于获取指定格数内的furnace位置
const craftingTable = await world.getNearestCraftingTablePosition(128);
if (craftingTable) {
    // 移动到指定位置，注意不要随意臆造坐标，传入的坐标必须来自环境信息
    // moveTo 方法无返回值
    const result = await action.moveTo(craftingTable);
    if (result) {
        logger.report('移动成功', bot);
    } else {
        logger.report('移动失败', bot);
    }
}

//查找128格内是不是有熔炉
const furnace = await world.getNearestFurnacePosition(128);
if (furnace) {
    await action.moveTo(furnace);
}

//getNearestBlock用于获取指定格数内的指定方块的位置
//获取32格内最近的橡木原木的位置
const block = await world.getNearestBlock('oak_log', 32);
if (block) {
    await action.moveTo(block);
}
