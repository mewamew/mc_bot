async function moveToNearestPlayer(bot) {
  const player = bot.nearestEntity(entity => entity.type === 'player');
  
  if (player) {
    const playerPos = player.position;
    await bot.pathfinder.goto(new GoalNear(playerPos.x, playerPos.y, playerPos.z, 2));
  }
}