//放置物品到地上的示例代码
async function placeSomethingToGround(bot) {
    const something = bot.inventory.findInventoryItem('something');
    if (!something) {
        return;
    }
    //装备到主手
    await bot.equip(something, 'hand');
    // 先低头看向地面（pitch = -40度是完全向下看）
    await bot.look(bot.entity.yaw, -Math.PI/4);
    // 获取机器人视线所指的方块
    const targetBlock = bot.blockAtCursor(3);
    if (!targetBlock) {
        //找不到可以放置的地方
        return;
    }
        
    ///放置
    await bot.placeBlock(targetBlock, new Vec3(0, 1, 0));
}
