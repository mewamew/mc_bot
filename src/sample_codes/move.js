//查找128格内是不是有工作台
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
//如果在地底挖矿，想返回地面的话，可以调用returnToGround,无返回值
await action.returnToGround();
//查找128格内是不是有熔炉
const furnace = await world.getNearestFurnacePosition(128);
if (furnace) {
    await action.moveTo(furnace);
}
