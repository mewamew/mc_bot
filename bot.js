const mineflayer = require('mineflayer')
const { pathfinder } = require('mineflayer-pathfinder')
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
const pvp = require('mineflayer-pvp').plugin
const llm = require('./llm')
const { KillTask, ComeTask, CollectTask } = require('./task')

const bot = mineflayer.createBot({
  host: 'localhost', // minecraft 服务器的 IP 地址
  username: 'huahua', // minecraft 用户名
  port: 25565 // 默认使用 25565，如果你的服务器端口不是这个请取消注释并填写。
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(pvp)
bot.once('spawn', () => {
  mineflayerViewer(bot, { port: 3007, firstPerson: false }) // port 是本地网页运行的端口 ，如果 firstPerson: false，那么将会显示鸟瞰图。
})

bot.loadPlugin(require('mineflayer-collectblock').plugin)

let task = null
bot.on('chat', async (username, message) => {
  if (username === bot.username) {
    return
  }

  try {
    const cmd = await llm.parse(message)
    let new_task = null;
    switch (cmd.type) {
      case 'come':
        new_task = new ComeTask(bot)
        break
      case 'kill':
        new_task = new KillTask(bot)
        break
      case 'collect':
        new_task = new CollectTask(bot)
        break
    }
    
    if (new_task){
        // 取消之前的任务
        if (task){
            await task.cancel();
        }
        task = new_task;
    }

    //任务执行完毕
    if (task){
        await task.run();
        task = null;
    }
    bot.chat(`${cmd.response}`)

  } catch (error) {
    console.error('Error parsing command:', error)
    bot.chat(`出错啦!`)
  }

})


bot.on('kicked', console.log)
bot.on('error', console.log)
