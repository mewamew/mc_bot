const mineflayer = require('mineflayer')
const { pathfinder } = require('mineflayer-pathfinder')
const logger = require('./utils/logger')
const Action = require('./skills/action');
const World = require('./skills/world') 

const bot = mineflayer.createBot({
  host: 'localhost', // minecraft 服务器的 IP 地址
  username: 'huahua', // minecraft 用户名
  port: 25565 // 默认使用 25565，如果你的服务器端口不是这个请取消注释并填写。
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(require('mineflayer-collectblock').plugin)





bot.on('chat', async (username, message) => {
  if (message === 'place') {
    const world = new World(bot, logger);
    const action = new Action(bot, logger);
    const block = await world.findPlaceBlock();
    console.log(block);
    if (block) {
      const result = await action.moveTo(block.position);
      if (!result) {
        logger.report('移动失败了喵！', bot);
      } else {

        await action.placeBlock('crafting_table', block);
      }
    }
    return;
  }
  if (message === 'look') {
    const world = new World(bot, logger);
    const action = new Action(bot, logger);
    await action.lookAtNearestPlayer();
    return;
  }

  if (message === 'mine') {
    const action = new Action(bot, logger);
    await action.mineBlock('coal_ore', 1);
    return;
  }

  if (message === 'pick') {
    const action = new Action(bot, logger);
    await action.equipPickaxe();
    return;
  }
  if (message === 'axe') {
    const action = new Action(bot, logger);
    await action.equipAxe();
    return;
  }

})

bot.on('kicked', console.log)
bot.on('error', console.log)
