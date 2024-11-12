/**
 * Pathfinder API 文档
 * 
 * bot.pathfinder.goto(goal)
 * 使机器人移动到指定目标位置。注意:此函数可能会改变主手装备。
 * 
 * 可用的目标类型:
 * 
 * 1. GoalNear(x, y, z, range)
 *    让机器人移动到指定方块的指定范围内
 *    参数:
 *    - x, y, z: number 类型,目标坐标
 *    - range: number 类型,可接受的距离范围
 * 
 * 2. GoalXZ(x, z) 
 *    适用于不需要指定Y坐标的远程目标
 *    参数:
 *    - x, z: number 类型,目标平面坐标
 * 
 * 3. GoalGetToBlock(x, y, z)
 *    移动到指定方块的相邻位置,不会进入方块内
 *    适用于钓鱼、农作、装水、使用床等场景
 *    参数:
 *    - x, y, z: number 类型,目标方块坐标
 * 
 * 4. GoalFollow(entity, range)
 *    跟随指定实体并保持在指定范围内
 *    参数:
 *    - entity: Entity 类型,要跟随的实体
 *    - range: number 类型,跟随距离
 * 
 * 5. GoalPlaceBlock(position, bot.world, {})
 *    移动到可以放置方块的位置
 *    参数:
 *    - position: Vec3 类型,目标位置
 * 
 * 6. GoalLookAtBlock(position, bot.world, {})
 *    移动到可以看到目标方块表面的位置
 *    参数:
 *    - position: Vec3 类型,目标方块位置
 */

// 移动到指定位置附近
await bot.pathfinder.goto(new GoalNear(100, 64, 100, 5));
//  移动到指定的XZ坐标
await bot.pathfinder.goto(new GoalXZ(200, 200));
// 移动到指定的方块旁边
await bot.pathfinder.goto(new GoalGetToBlock(150, 64, 150));
// 跟随指定的实体
const entity = bot.nearestEntity();
if (entity) {
  await bot.pathfinder.goto(new GoalFollow(entity, 2));
}
// 移动到指定位置以放置方块
const position = new Vec3(120, 64, 120);
await bot.pathfinder.goto(new GoalPlaceBlock(position, bot.world, {}));
//  移动到指定位置以观察方块
const lookAtPosition = new Vec3(130, 64, 130);
await bot.pathfinder.goto(new GoalLookAtBlock(lookAtPosition, bot.world, {}));

// 获取玩家位置
const player = bot.nearestEntity(entity => entity.type === 'player');
if (player) {
  const playerPos = player.position;
  console.log(`玩家位置: x=${playerPos.x}, y=${playerPos.y}, z=${playerPos.z}`);
}
// 获取背包中指定物品的数量示例
/**
 * 获取背包中指定物品的数量
 * @param {string} itemName - 物品名称，例如 'diamond', 'stone' 等
 * @returns {number} - 返回物品数量，如果没有则返回0
 */
function getItemCount(itemName) {
  // 获取所有匹配的物品
  const items = bot.inventory.items().filter(item => item.name === itemName);
  // 如果没有找到物品，返回0
  if (!items.length) return 0;
  // 计算总数量（将所有匹配物品的数量相加）
  return items.reduce((count, item) => count + item.count, 0);
}
