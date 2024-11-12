
// 获取玩家位置
const player = bot.nearestEntity(entity => entity.type === 'player');
if (player) {
  const playerPos = player.position;
  console.log(`玩家位置: x=${playerPos.x}, y=${playerPos.y}, z=${playerPos.z}`);
}

// 获取背包中指定物品的数量示例
function getItemCount(itemName) {
  // 获取所有匹配的物品
  const items = bot.inventory.items().filter(item => item.name === itemName);
  if (!items.length) return 0;
  // 计算总数量（将所有匹配物品的数量相加）
  return items.reduce((count, item) => count + item.count, 0);
}
