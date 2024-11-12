const mineflayer = require('mineflayer')
const { pathfinder } = require('mineflayer-pathfinder')
const logger = require('./utils/logger')
const bot = mineflayer.createBot({
  host: 'localhost', // minecraft 服务器的 IP 地址
  username: 'huahua', // minecraft 用户名
  port: 25565 // 默认使用 25565，如果你的服务器端口不是这个请取消注释并填写。
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(require('mineflayer-collectblock').plugin)



async function craftCraftingTable() {
    const mcData = require('minecraft-data')(bot.version);
    const craftingTableId = mcData.itemsByName['crafting_table'].id;
    const recipes = bot.recipesFor(craftingTableId, null, 1, null);
    if (!recipes || recipes.length === 0) {
        logger.error('找不到工作台的配方');
        return;
    }

    try {
        await bot.craft(recipes[0], 1)
        bot.chat('喵~工作台制作完成了！')
    } catch (err) {
        bot.chat('呜...制作失败了，可能是材料不够呢...')
        logger.error('制作工作台失败:', err)
    }
}



bot.on('chat', async (username, message) => {
  if (username === bot.username) {
    return
  }

  if (message === 'c') {
    await craftCraftingTable()
    return
  }

  bot.chat(message);
})

bot.on('kicked', console.log)
bot.on('error', console.log)
