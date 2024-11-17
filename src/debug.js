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




function show_recipe2(itemName, mcData) {
  const item = mcData.itemsByName[itemName];
  if (!item) {
    return [];
  }
  
  const recipes = mcData.recipes[item.id];
  if (!recipes) {
    return [];
  }

  // 获取第一个可用配方
  const recipe = recipes[0];
  console.log(recipes);
  
  // 用于统计材料数量的 Map
  const materials = new Map();
  
  // 记录是否为无序合成
  const isShapeless = !recipe.inShape;
  
  if (recipe.inShape) {
    // 处理有固定形状的配方
    for (const line of recipe.inShape) {
      for (const id of line) {
        if (id) {
          const materialName = mcData.items[id].name;
          materials.set(materialName, (materials.get(materialName) || 0) + 1);
        }
      }
    }
  } else if (recipe.ingredients) {
    // 处理无序合成配方
    for (const ingredient of recipe.ingredients) {
      const materialName = mcData.items[ingredient].name;
      materials.set(materialName, (materials.get(materialName) || 0) + 1);
    }
  }

  // 直接返回材料列表
  return Array.from(materials.entries()).map(([name, count]) => ({
    name,
    count
  }));
}

/**
 * 获取机器人周围4x4范围内的方块信息
 * @returns {Object} 包含相对位置和方块类型的信息
 */
function getSurroundingBlocks() {
  const result = {
    blocks: []
  };
  
  // 获取机器人当前位置
  const botPos = bot.entity.position;
  
  // 遍历4x4范围内的方块
  for (let x = -2; x <= 1; x++) {
    for (let y = -2; y <= 1; y++) {
      for (let z = -2; z <= 1; z++) {
        // 使用 Vec3 创建目标方块的坐标
        const blockPos = new Vec3(
          Math.floor(botPos.x) + x,
          Math.floor(botPos.y) + y,
          Math.floor(botPos.z) + z
        );
        
        // 获取方块信息
        const block = bot.blockAt(blockPos);
        
        // 添加到结果中
        result.blocks.push({
          relativePos: {x, y, z},  // 相对位置
          type: block.name,        // 方块类型名称
          position: {              // 绝对位置
            x: blockPos.x,
            y: blockPos.y,
            z: blockPos.z
          }
        });
      }
    }
  }
  
  return result;
}

// 获取基本方向
function getCardinalDirection(yaw) {
  // 将弧度转换为角度
  let degrees = yaw * 180 / Math.PI;
  
  // 标准化到0-360范围
  degrees = (degrees + 360) % 360;
  
  // 将360度分为四个方向
  if (degrees > 315 || degrees <= 45) return 'south';
  if (degrees > 45 && degrees <= 135) return 'west';
  if (degrees > 135 && degrees <= 225) return 'north';
  if (degrees > 225 && degrees <= 315) return 'east';
}

async function moveForward() {
  // 引入 goals
  const { goals } = require('mineflayer-pathfinder')
  
  // 获取机器人当前的朝向
  const direction = getCardinalDirection(bot.entity.yaw);
  
  // 获取机器人当前位置
  const currentPos = bot.entity.position;
  
  // 根据朝向计算目标位置
  let targetPos;
  switch(direction) {
    case 'north':
      targetPos = currentPos.offset(0, 0, -1);
      break;
    case 'south':
      targetPos = currentPos.offset(0, 0, 1);
      break;
    case 'east':
      targetPos = currentPos.offset(1, 0, 0);
      break;
    case 'west':
      targetPos = currentPos.offset(-1, 0, 0);
      break;
  }

  try {
    // 创建移动目标
    const goal = new goals.GoalBlock(
      Math.floor(targetPos.x),
      Math.floor(targetPos.y),
      Math.floor(targetPos.z)
    );
    
    // 使用 pathfinder 移动到目标位置
    await bot.pathfinder.goto(goal);
    logger.info('移动完成喵！');
  } catch (error) {
    logger.error('移动失败了喵...', error);
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

  if (message.startsWith('r')) {
    console.log(bot.version);
    const itemName = message.substring(1);
    const mcData = require('minecraft-data')(bot.version);
    const r = show_recipe2(itemName, mcData);
    //console.log(mcData.itemsByame['oak_planks']);
    //console.log(mcData.recipes[23][0]);
    console.log('合成' + itemName + '需要的材料：');
    console.log(r);
    for (const item of r) {
      const rr = show_recipe2(item.name, mcData);
      if (rr.length > 0) {
        console.log('合成' + item.name + '需要的材料：');
        console.log(rr);
        for (const item2 of rr) {
          const rrr = show_recipe2(item2.name, mcData);
          if (rrr.length > 0) {
            console.log('合成' + item2.name + '需要的材料：');
            console.log(rrr);
          }
        }
      }
    }
  }

  if (message === 'scan') {
    const surroundingBlocks = getSurroundingBlocks();
    console.log(JSON.stringify(surroundingBlocks, null, 2));
    return;
  }

  if (message === 'f') {
    moveForward();
    return;
  }

  if (message.startsWith('mine')) {
    const utils = new Utils(bot, logger);
    const itemName = message.substring(5);
    await utils.mineBlock(itemName, 4, 128);
    return;
  }
})

bot.on('kicked', console.log)
bot.on('error', console.log)
