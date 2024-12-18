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
  if(message=="hold") {
    const action = new Action(bot, logger);
    const result =  await action.equipAndHold("iron_pickaxe");
    console.log(result);
  }
})

bot.on('kicked', console.log)
bot.on('error', console.log)
