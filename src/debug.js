const mineflayer = require('mineflayer')
const { pathfinder } = require('mineflayer-pathfinder')
const logger = require('./utils/logger')
const Utils = require('./skills/utils');
const Vec3 = require('vec3')

const bot = mineflayer.createBot({
  host: 'localhost', // minecraft 服务器的 IP 地址
  username: 'huahua', // minecraft 用户名
  port: 25565 // 默认使用 25565，如果你的服务器端口不是这个请取消注释并填写。
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(require('mineflayer-collectblock').plugin)





bot.on('chat', async (username, message) => {

  if (message === 'mc') {
    const utils = new Utils(bot, logger);
    try { 
      await utils.mineBlock("coal_ore", 4, 64);
    } catch (err) {
      console.log(err);
    }
    return;
  }

  if (message === 'mi') {
    const utils = new Utils(bot, logger);
    try { 
      await utils.mineBlock("iron_ore", 4, 64);
    } catch (err) {
      console.log(err);
    }
    return;
  }

  if (message === 'lp') {
    const utils = new Utils(bot, logger);
    try { 
      await utils.lookAtNearestPlayer();
    } catch (err) {
      console.log(err);
    }
    return;
  }

  if (message === 'l') {
    const utils = new Utils(bot, logger);
    try { 
      await utils.mineBlock("oak_log", 4, 64);
      await utils.lookAtNearestPlayer();
    } catch (err) {
      console.log(err);
    }
    return;
  }

  if (message === 'g') {
    const utils = new Utils(bot, logger);
    try { 
      await utils.returnToGround();
    } catch (err) {
      console.log(err);
    }
    return;
  }

})

bot.on('kicked', console.log)
bot.on('error', console.log)
