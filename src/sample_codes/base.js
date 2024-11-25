
// getItemCount用于获取背包中有多少指定的物品，注意不是获取环境中指定物品的数量
// 请一定调用getItemCount，禁止直接使用bot.inventory.count
// 示例:获取背包中oak_log的数量
const itemCount = action.getItemCount('oak_log');

// 为了让bot更有趣，下面是一些有趣的动作,参数是tick数
// 跳舞
await action.dance(100);
// 跳跃
await action.jump(3);
// 蹲下
await action.sneak(10);
// 挥手
await action.wave(3);
// 看向最近的玩家
await action.lookAtNearestPlayer();
