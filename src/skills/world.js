const logger = require('../utils/logger');
const Vec3 = require('vec3');

class World {
    constructor(bot, logger) {
        this.bot = bot;  // 在构造函数中初始化 bot
        this.logger = logger;
    }

    async getNearestBlock(blockName, maxDistance = 128) {
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

    async findPlaceBlock() {
        // 获取机器人当前位置
        const botPos = this.bot.entity.position; 
        console.log(botPos);
        // 定义允许放置的基础方块列表
        const validBaseBlocks = [
            'grass_block',
            'dirt',
            'stone',
            'cobblestone',
            'andesite',
            'diorite',
            'granite',
            'deepslate',
            'tuff',
            'sandstone',
            'sand'
        ];

        // 搜索附近的实心方块
        const blocks = this.bot.findBlocks({
            matching: (block) => {
                return validBaseBlocks.includes(block.name);
            },
            maxDistance: 16,
            count: 32768
        });
        
        console.log("附近有" + blocks.length + "个可用的基础方块喵！");
        for (const blockPos of blocks) {
            const block = this.bot.blockAt(blockPos);
            const botPos = this.bot.entity.position;
            const isBotBlock = Math.abs(botPos.x - blockPos.x) < 1 &&
                                 Math.floor(botPos.y - 1) === blockPos.y && 
                                 Math.abs(botPos.z - blockPos.z) < 1; 
            if (isBotBlock) {
                continue;
            }
            
            // 检查3x3的基础方块区域
            let isValid = true;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const checkPos = blockPos.offset(dx, 0, dz);
                    const checkBlock = this.bot.blockAt(checkPos);
                    
                    // 如果任何一个位置不是实心方块，则这个位置不合适
                    if (!checkBlock || !validBaseBlocks.includes(checkBlock.name)) {
                        isValid = false;
                        break;
                    }
                }
                if (!isValid) break;
            }
            
            // 如果基础方块检查通过，检查3x3区域上方3格是否都为空气
            if (isValid) {
                for (let dy = 1; dy <= 3; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dz = -1; dz <= 1; dz++) {
                            const checkPos = blockPos.offset(dx, dy, dz);
                            const checkBlock = this.bot.blockAt(checkPos);
                            
                            // 只检查是否为空气
                            if (!checkBlock || checkBlock.name !== 'air') {
                                isValid = false;
                                break;
                            }
                        }
                        if (!isValid) break;
                    }
                    if (!isValid) break;
                }
                
                // 如果所有检查都通过，返回这个方块
                if (isValid) {
                    const block = this.bot.blockAt(blockPos);
                    this.logger.report('找到了合适的放置位置喵！', this.bot);
                    return block;
                }
            }
        }

        this.logger.report('找不到合适的放置位置喵！', this.bot);
        return null;
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
        return result;
    }
}

module.exports = World;