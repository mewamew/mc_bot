const { Vec3 } = require('vec3');
const { GoalBlock } = require('mineflayer-pathfinder').goals;

/**
 * 通用方块收集函数
 */
async function collectBlock(bot, blockType, count) {
    try {
        // 初始化计数器
        let collected = 0;
        
        // 循环直到收集足够数量
        while (collected < count) {
            // 寻找最近的目标方块
            const block = bot.findBlock({
                matching: blockType,
                maxDistance: 32
            });
            
            if (!block) {
                bot.chat(`找不到更多的 ${blockType} 方块了喵~`);
                return false;
            }
            
            // 使用 collectBlock 插件收集方块
            bot.chat(`发现 ${blockType} 方块，开始收集喵~`);
            await bot.collectBlock.collect(block);
            
            // 更新计数
            collected++;
            bot.chat(`已经收集了 ${collected}/${count} 个 ${blockType} 喵！`);
            
            // 等待一小段时间确保物品被收集
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        bot.chat(`成功收集了 ${count} 个 ${blockType} 喵！`);
        return true;
        
    } catch (error) {
        bot.chat(`收集失败了喵...${error.message}`);
        return false;
    }
}


module.exports = collectBlock; 