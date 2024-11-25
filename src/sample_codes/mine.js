// 自动搜索64格范围内挖掘一个指定的方块
// mineBlock会自动搜索，移动到方块附近，然后挖掘，所以不需要调用world.getNearestBlock和moveTo接口
// mineBlock会自动装备最合适的工具，所以不需要调用equipPickaxe和equipAxe接口
// 注意，原木可以徒手挖，不需要工具
const woodResult = await action.mineBlock('oak_log',  64);
if (!woodResult) {
    bot.chat('木头收集失败了喵~');
} else {
    bot.chat('木头收集完成啦！');
}

// 挖煤炭
const coalResult = await action.mineBlock('coal_ore', 64);
