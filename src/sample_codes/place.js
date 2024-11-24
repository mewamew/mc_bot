//放置物品到地上的示例代码
//findPlaceBlock 返回一个可以放置东西的方块，这个方块的周围3x3x3区域是实心的，并且上面3格是空气
//注意：findPlaceBlock返回的是一个方块，而不是坐标
const referenceBlock = await world.findPlaceBlock();
if (referenceBlock) {
    const result = await action.moveTo(referenceBlock.position);
    if (result) {
        await action.placeBlock('stone', referenceBlock);
    } else {
        logger.report('移动失败了喵！', bot);
    }
} else {
    logger.report('没有找到可以放置的地方', bot);
}


