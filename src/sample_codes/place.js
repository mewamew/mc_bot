//放置物品到地上的示例代码
const referenceBlock = await world.findPlaceBlock();
if (referenceBlock) {
    await action.placeBlock('stone', referenceBlock);
} else {
    logger.report('没有找到可以放置的地方', bot);
}


