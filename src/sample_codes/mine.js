// 自动搜索64格范围内挖掘指定数量的方块，如果失败，可以扩大搜索范围
const woodResult = await action.mineBlock('oak_log', 4, 64);
if (!woodResult.success) {
    bot.chat(`只收集到了 ${woodResult.collectedCount} 个木头`);
} else {
    bot.chat('木头收集完成啦！');
}
const coalResult = await action.mineBlock('coal_ore', 4, 64);
if (!coalResult.success) {
    bot.chat(`只收集到了 ${coalResult.collectedCount} 个煤炭`);
} else {
    bot.chat('煤炭收集完成啦！');
}

//挖矿结束后，如果想返回地面，可以调用以下代码
await action.returnToGround();