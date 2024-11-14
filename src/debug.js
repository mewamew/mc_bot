const mineflayer = require('mineflayer')
const { pathfinder } = require('mineflayer-pathfinder')
const logger = require('./utils/logger')
const { 
    craftItemWithCraftingTable,
    craftItemWithoutCraftingTable
 } = require('./skills/utils');

const bot = mineflayer.createBot({
  host: 'localhost', // minecraft 服务器的 IP 地址
  username: 'huahua', // minecraft 用户名
  port: 25565 // 默认使用 25565，如果你的服务器端口不是这个请取消注释并填写。
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(require('mineflayer-collectblock').plugin)


async function mineBlock(bot, blockType, count) {
    const mcData = require('minecraft-data')(bot.version);
    const blockID = mcData.blocksByName[blockType]?.id
    if (!blockID) {
        logger.report('方块类型错误:' + blockType, bot);
        return
    }

    // 初始化计数器
    let minedCount = 0
    logger.report('开始挖掘 ' + count + ' 个 ' + blockType, bot);
    while (minedCount < count) {
        // 寻找最近的目标方块
        const block = bot.findBlock({
            matching: blockID,
            maxDistance: 32
        })

        if (!block) {
            logger.report('附近找不到 ' + blockType, bot);
            break
        }

        try {
            // 使用 collectBlock 插件进行挖掘
            await bot.collectBlock.collect(block)
            minedCount++
            logger.report('已经挖了 ' + minedCount + ' 个 ' + blockType, bot);
        } catch (err) {
            logger.report('挖掘失败:' + err.message, bot);
            break
        }
    }

    logger.report('任务完成啦！一共挖到了 ' + minedCount + ' 个 ' + blockType, bot);
}

bot.on('chat', async (username, message) => {
  if (username === bot.username) {
    return
  }

  if (message === 'm') {
    await mineBlock(bot, 'oak_log', 4);
    return
  }

  if (message === 'c') {
    await craftItemWithCraftingTable(bot, logger, 'oak_planks', 4);
    logger.info('使用工作台合成完成');
    await craftItemWithoutCraftingTable(bot, logger, 'oak_planks', 4);
    logger.info('不使用工作台合成完成');
    return
  }


  bot.chat(message);
})


bot.on('kicked', console.log)
bot.on('error', console.log)
