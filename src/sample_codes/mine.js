// 64格范围内挖掘指定数量的方块, 所以在调用时请先检查附近是否有目标方块
await utils.mineBlock('oak_log', 4, 64);
await utils.mineBlock('coal_ore', 4, 64);
//挖矿结束后，如果想返回地面，可以调用以下代码
await utils.returnToGround();