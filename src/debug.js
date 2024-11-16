const mineflayer = require('mineflayer')
const { pathfinder } = require('mineflayer-pathfinder')
const logger = require('./utils/logger')
const Utils = require('./skills/utils');

const bot = mineflayer.createBot({
  host: 'localhost', // minecraft 服务器的 IP 地址
  username: 'huahua', // minecraft 用户名
  port: 25565 // 默认使用 25565，如果你的服务器端口不是这个请取消注释并填写。
})

bot.loadPlugin(pathfinder)
bot.loadPlugin(require('mineflayer-collectblock').plugin)

// 添加函数调用测试代码
const testFunctionCall = async (message) => {
  const llm = require('./utils/llm');
  // 定义可用的函数列表
  const tools = [
  {
    type: "function",
    function: {
      name: "query_recipe",
      description: "查询合成配方",
      parameters: {
        type: "object",
        properties: {
          recipeName: {
            type: "string",
            description: "配方名称，例如：crafting_table"
          },
          count: {
            type: "number",
            description: "数量"
          }
        },
        required: ["recipeName"]
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "find_crafting_table",
      description: "查找附近的工作台",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

  // 测试消息
  const messages = [{
    role: "user",
    content: message
  }];

  try {
    // 调用函数
    const functionCalls = await llm.callFunction(messages, tools);
    logger.info("函数调用结果：");

    if (functionCalls) {
      for (const call of functionCalls) {
        logger.info(call.function.name);
      }
    } else {
      logger.info ('不需要执行任何函数');
    }
  } catch (error) {
    logger.error('测试失败：', error);
  }
}

bot.on('chat', async (username, message) => {
  if (message === 'p') {
    const utils = new Utils(bot, logger);
    await utils.placeBlock("oak_planks", 1);
    return
  }
  
  // 添加新的测试命令
  if (message.startsWith('t')) {
    logger.info('开始函数调用测试...');
    await testFunctionCall(message.substring(1));
    return
  }
})

bot.on('kicked', console.log)
bot.on('error', console.log)
