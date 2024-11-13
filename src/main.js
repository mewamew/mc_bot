const mineflayer = require('mineflayer')
const { pathfinder } = require('mineflayer-pathfinder')
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
const pvp = require('mineflayer-pvp').plugin
const logger = require('./utils/logger')

const McBot = require('./mc_bot')
const bot = mineflayer.createBot({
  host: 'localhost', // minecraft 服务器的 IP 地址
  username: 'huahua', // minecraft 用户名
  port: 25565 // 默认使用 25565，如果你的服务器端口不是这个请取消注释并填写。
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(pvp)
bot.loadPlugin(require('mineflayer-collectblock').plugin)
bot.once('spawn', () => {
  mineflayerViewer(bot, { port: 3007, firstPerson: false }) // port 是本地网页运行的端口 ，如果 firstPerson: false，那么将会显示鸟瞰图。
})



const mc_bot = new McBot(bot);
bot.on('chat', async (username, message) => {
  if (username === bot.username) {
    return
  }

  try {
    mc_bot.handleMessage(message);
  } catch (error) {
    console.log('error')
  }
})

bot.on('spawn', () => {
  logger.pure('YELLOW', '=== 机器人已经重生 ===');
  mc_bot.init();
})


bot.on('kicked', console.log)
bot.on('error', console.log)
