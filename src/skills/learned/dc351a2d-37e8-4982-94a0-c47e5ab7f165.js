async function moveToPlayer(bot) {
  // 获取最近的玩家实体
  const player = bot.nearestEntity(entity => entity.type === 'player');
  
  if (!player) {
    throw new Error('找不到玩家');
  }

  logger.report(`找到玩家,位置: x=${player.position.x}, y=${player.position.y}, z=${player.position.z}`, bot);
  
  // 使用pathfinder移动到玩家2格范围内
  await bot.pathfinder.goto(new GoalFollow(player, 2));
  
  logger.report('已到达玩家身边', bot);
}