const logger = require('../utils/logger');
const Vec3 = require('vec3');

class World {
    constructor(bot) {
        this.bot = bot;  // 在构造函数中初始化 bot
    }

    async getNearestBlock(blockName, maxDistance = 64) {
        const blocks = this.bot.findBlocks({
            matching: block => block.name === blockName,
            maxDistance: maxDistance    
        });

        if (blocks.length === 0) {
            logger.report(`附近没有${blockName}`, this.bot);
            return null;
        }

        // 计算每个方块到机器人的距离，返回最近的
        const botPosition = this.bot.entity.position;
        let nearestBlock = blocks[0];
        let minDistance = botPosition.distanceTo(nearestBlock);

        for (const blockPos of blocks) {
            const distance = botPosition.distanceTo(blockPos);
            if (distance < minDistance) {
                minDistance = distance;
                nearestBlock = blockPos;
            }
        }

        return nearestBlock;
    }

    async getNearestCraftingTablePosition(maxDistance = 64) {
        return this.getNearestBlock('crafting_table', maxDistance);
    }

    async getNearestFurnacePosition(maxDistance = 64) {
        return this.getNearestBlock('furnace', maxDistance);
    }

    getEnvironment() {
        // 初始化环境数据结构
        let environment = {
            blocks: {},          
            entities: {},        
            items: {},          
        };

        // 获取机器人当前位置
        const botPos = this.bot.entity.position;
        const scanRadius = 16;   
        
        // 初始化工作台和玩家距离追踪
        let nearestCraftingTable = null;
        let minCraftingTableDist = Infinity;
        let nearestFurnace = null;          // 新增熔炉追踪
        let minFurnaceDist = Infinity;      // 新增熔炉距离
        let nearestPlayer = null;
        let minPlayerDist = Infinity;
        
        // 扫描周围区域
        for (let x = -scanRadius; x <= scanRadius; x++) {
            for (let z = -scanRadius; z <= scanRadius; z++) {
                for (let y = Math.floor(botPos.y) + 32; y >= Math.floor(botPos.y) - 32; y--) {
                    const pos = new Vec3(
                        Math.floor(botPos.x) + x,
                        y,
                        Math.floor(botPos.z) + z
                    );
                    const block = this.bot.blockAt(pos);
                    
                    if (!block || block.name === 'air') continue;

                    // 检查工作台和熔炉并更新最近距离
                    if (block.name === 'crafting_table') {
                        const dist = pos.distanceTo(botPos);
                        if (dist < minCraftingTableDist) {
                            minCraftingTableDist = dist;
                            nearestCraftingTable = pos;
                        }
                    } else if (block.name === 'furnace') {    // 新增熔炉检查
                        const dist = pos.distanceTo(botPos);
                        if (dist < minFurnaceDist) {
                            minFurnaceDist = dist;
                            nearestFurnace = pos;
                        }
                    }

                    // 统计方块总数
                    if (!environment.blocks[block.name]) {
                        environment.blocks[block.name] = 0;
                    }
                    environment.blocks[block.name]++;
                }
            }
        }

        // 获取周围的实体
        const nearbyEntities = this.bot.entities;
        for (const entity of Object.values(nearbyEntities)) {
            if (!entity || entity === this.bot.entity) continue;

            if (entity.type === 'player') {
                const dist = entity.position.distanceTo(botPos);
                if (dist < minPlayerDist) {
                    minPlayerDist = dist;
                    nearestPlayer = entity;
                }
            } else if (entity.type === 'item') {
                const itemName = entity.metadata[7]?.itemId?.replace('minecraft:', '');
                if (itemName) {
                    if (!environment.items[itemName]) {
                        environment.items[itemName] = 0;
                    }
                    environment.items[itemName] += entity.metadata[7].itemCount || 1;
                }
            } else if (entity.type) {
                if (!environment.entities[entity.type]) {
                    environment.entities[entity.type] = 0;
                }
                environment.entities[entity.type]++;
            }
        }

        // 生成结果字符串
        let result = '';
        if (nearestCraftingTable) {
            result += `crafting_table: ${minCraftingTableDist.toFixed(2)} blocks away\n`;
        } else {
            result += "crafting_table: none nearby\n";
        }

        if (nearestFurnace) {
            result += `furnace: ${minFurnaceDist.toFixed(2)} blocks away\n`;
        } else {
            result += "furnace: none nearby\n";
        }

        if (nearestPlayer) {
            result += `nearest player ${nearestPlayer.username}: ${minPlayerDist.toFixed(2)} blocks away\n`;
        } else {
            result += "players: none nearby\n";
        }
        result += "\n";
        
        // 添加方块统计
        if (Object.keys(environment.blocks).length > 0) {
            result += 'blocks nearby:\n';
            result += Object.entries(environment.blocks)
                .map(([blockName, count]) => `${blockName}: ${count}`)
                .join('\n');
        }
        
        // 添加掉落物统计
        if (Object.keys(environment.items).length > 0) {
            if (result) result += '\n\n';
            result += 'items nearby:\n';
            result += Object.entries(environment.items)
                .map(([itemName, count]) => `${itemName}: ${count}`)
                .join('\n');
        }
        
        // 添加实体统计
        if (Object.keys(environment.entities).length > 0) {
            if (result) result += '\n\n';
            result += 'entities nearby:\n';
            result += Object.entries(environment.entities)
                .map(([entityType, count]) => `${entityType}: ${count}`)
                .join('\n');
        }

        logger.info("Environment information:");
        console.log(result);
        return result;
    }
}

module.exports = World;