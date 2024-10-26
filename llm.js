const axios = require('axios');
const { API_KEY } = require('./key');

const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';


async function callGLM4API(messages, temperature = 0.7) {
  try {
    const response = await axios.post(API_URL, {
      model: "glm-4-flash",
      messages: messages,
      temperature: temperature,
      top_p: 0.95,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('调用GLM-4 API时出错:', error);
    throw error;
  }
}

async function parse(message) {
  try {
    const messages = [
      { role: "system", content: "你的名字叫花花, 你是MC里面的一个玩家, 你风趣幽默，喜欢配合我在游戏干活。注意你的发言控制在3句话以内" },
      { role: "user", 
        content: `"${message}"是玩家对你下达的命令。判断是以下几种命令中的哪一种: 
                    build: 要求你建造。如果是build命令，请指明要建造的具体物品或结构(如house, wooden_house, stone_house, castle, tower, bridge, wall, farm, mine_shaft, nether_portal, enchanting_table, furnace, chest, crafting_table, bed, bookshelf, anvil, brewing_stand, cauldron, composter, grindstone, loom, smithing_table, stonecutter, barrel, smoker, blast_furnace, campfire, lantern, torch, fence, gate, door, ladder, stairs, slab, axe, pickaxe, shovel, hoe, sword, bow, arrow, shield, armor_stand, fishing_rod等)。
                    come: 要求你移动到玩家那里的命令, 比如"过来啊"，"来我这里"， "过来一下"
                    collect: 要求你收集素材。如果是collect命令，请指明具体要收集的素材类型(如wood, stone, iron_ore, diamond, coal, wheat, wool等)。
                    kill: 要求你攻击或者救援（比如"救救我"）。
                  如果是命令, 返回命令类型、响应和目标数组(targets可以为空数组), 如果不是命令, 返回"chat"
                  请严格按照json格式返回, 返回示例:
                  {
                    "type": "命令类型",
                    "response": "命令响应",
                    "targets": ["目标1", "目标2", ...]  // 可以是空数组，targets请用mc标准的物品名称
                  }
                  ` }
    ];
    const response = await callGLM4API(messages);
    console.log(response);
    
    // 尝试解析 JSON 字符串
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    } else {
      return JSON.parse(response);
    }

  } catch (error) {
    console.error('解析命令时出错:', error);
    return { type: 'chat', response: '解析命令时出错', targets: [] };
  }
}


module.exports = {
    parse
}
