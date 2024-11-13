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

async function placeCraftingTable() {
    const Vec3 = require('vec3');
    const craftingTableItem = bot.inventory.findInventoryItem('crafting_table');
    
    if (!craftingTableItem) {
        bot.chat('呜...背包里没有找到工作台呢...');
        return;
    }

    // 先将工作台拿到主手
    try {
        await bot.equip(craftingTableItem, 'hand');
        bot.chat('喵~已经把工作台拿在手里啦！');
    } catch (err) {
        bot.chat('呜...拿取工作台失败了...');
        logger.error('装备工作台失败:', err);
        return;
    }

    // 先低头看向地面
    await bot.look(bot.entity.yaw, -Math.PI/4);
    
    // 获取机器人视线所指的方块
    const targetBlock = bot.blockAtCursor(3);

    if (!targetBlock) {
        bot.chat('呜...找不到可以放置的地方呢...');
        return;
    }

    // 添加放置前的检查
    const faceVector = new Vec3(0, 1, 0);
    const placementPosition = targetBlock.position.plus(faceVector);
    


    logger.info("目标方块位置：" + targetBlock.position.toString());
    logger.info("目标方块类型：" + targetBlock.name);
    
    try {
        await bot.placeBlock(targetBlock, faceVector);
        bot.chat('喵~工作台放好啦！');
    } catch (err) {
        bot.chat('呜...放置失败了，可能是这个位置不能放置呢...');
        logger.error(err);
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

  if (message === 'p') {
    await placeCraftingTable()
    return
  }

  bot.chat(message);
})


bot.on('kicked', console.log)
bot.on('error', console.log)
