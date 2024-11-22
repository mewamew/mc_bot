// 自动搜索64格范围内挖掘一个指定的方块
const woodResult = await action.mineBlock('oak_log',  64);
if (!woodResult) {
    bot.chat('木头收集失败了喵~');
} else {
    bot.chat('木头收集完成啦！');
}

// 挖煤炭
const coalResult = await action.mineBlock('coal_ore', 64);
