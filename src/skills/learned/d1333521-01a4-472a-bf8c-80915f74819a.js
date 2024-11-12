async function moveToNearestPlayer(bot) {
  const player = bot.nearestEntity(entity => entity.type === 'player' && entity !== bot.entity);
  
  if (!player) {
    logger.report('找不到玩家', bot);
    return;
  }

  const { GoalFollow } = require('mineflayer-pathfinder').goals;
  await bot.pathfinder.goto(new GoalFollow(player, 2));
}