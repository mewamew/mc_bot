async function moveToNearestPlayer(bot) {
  const player = bot.nearestEntity(entity => entity.type === 'player');
  
  if (!player) {
    logger.report('找不到玩家', bot);
    return;
  }

  const playerPosition = player.position;
  await bot.pathfinder.goto(new GoalNear(playerPosition.x, playerPosition.y, playerPosition.z, 2));
  logger.report('已到达玩家身边', bot);
}