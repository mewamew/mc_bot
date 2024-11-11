async function moveToNearestPlayer(bot) {
  // 获取最近的玩家实体
  const player = bot.nearestEntity(entity => entity.type === 'player')
  
  if (!player) {
    throw new Error('找不到玩家')
  }

  const playerPos = player.position
  logger.report(`找到玩家，位置: x=${playerPos.x}, y=${playerPos.y}, z=${playerPos.z}`, bot)

  // 移动到玩家5格范围内
  const { GoalNear } = require('mineflayer-pathfinder').goals
  await bot.pathfinder.goto(new GoalNear(playerPos.x, playerPos.y, playerPos.z, 5))
  
  logger.report('已到达玩家附近', bot)
}