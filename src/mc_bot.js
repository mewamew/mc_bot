const logger = require('./utils/logger');
const TaskPlanner = require('./agents/planner');
const Coder = require('./agents/coder');
const Reflector = require('./agents/reflector');
const Executor = require('./agents/executor');
const Vec3 = require('vec3');
const SkillManager = require('./skills/skill_manager');
const fs = require('fs').promises;
const path = require('path');

class McBot {
    constructor(bot) {
        this.bot = bot;
        this.taskPlanner = new TaskPlanner();
        this.skillManager = new SkillManager();
        this.coder = new Coder(bot);
        this.executor = new Executor(bot);
        this.reflector = new Reflector();
    }

    async init() {
        await this.skillManager.init();
    }

    getInventories() {
        let inventory = {};
        for (const item of this.bot.inventory.items()) {
            if (item != null) {
                if (inventory[item.name] == null) {
                    inventory[item.name] = 0;
                }
                inventory[item.name] += item.count;
            }
        }
        
        // 如果物品栏为空，返回"当前为空"
        if (Object.keys(inventory).length === 0) {
            return "当前为空";
        }
        
        // 将inventory对象转换为字符串形式
        return Object.entries(inventory)
            .map(([itemName, count]) => `${itemName}: ${count}`)
            .join('\n');
    }

    //TODO 环境信息的获取会越来越复杂，可以考虑独立一个文件来维护
    getEnvironment() {
        // 初始化环境数据结构
        let environment = {
            blocks: {},          
            entities: {},        
            items: {},          
            terrain: {
                heightMap: {},   
                layers: [],      
                summary: ''      
            }
        };

        // 获取机器人当前位置
        const botPos = this.bot.entity.position;
        const scanRadius = 16;   
        
        // 记录每个y层的方块分布
        let layerDistribution = {};
        
        // 扫描周围区域的地形
        for (let x = -scanRadius; x <= scanRadius; x++) {
            for (let z = -scanRadius; z <= scanRadius; z++) {
                // 从上往下扫描获取地形信息
                for (let y = Math.floor(botPos.y) + 32; y >= Math.floor(botPos.y) - 32; y--) {
                    const pos = new Vec3(
                        Math.floor(botPos.x) + x,
                        y,
                        Math.floor(botPos.z) + z
                    );
                    const block = this.bot.blockAt(pos);
                    
                    if (!block || block.name === 'air') continue;

                    // 统计方块总数
                    if (!environment.blocks[block.name]) {
                        environment.blocks[block.name] = 0;
                    }
                    environment.blocks[block.name]++;
                    
                    // 记录每个高度层的方块分布
                    if (!layerDistribution[y]) {
                        layerDistribution[y] = {};
                    }
                    if (!layerDistribution[y][block.name]) {
                        layerDistribution[y][block.name] = 0;
                    }
                    layerDistribution[y][block.name]++;
                }
            }
        }

        // 分析地形层次
        let terrainDescription = [];
        
        // 找出主要的地层分布
        let significantLayers = [];
        Object.entries(layerDistribution).forEach(([y, blocks]) => {
            // 找出该层最主要的方块类型
            const mainBlock = Object.entries(blocks)
                .sort(([,a], [,b]) => b - a)[0];
            if (mainBlock && mainBlock[1] > 10) { // 只记录数量超过10个的主要方块
                significantLayers.push({
                    y: parseInt(y),
                    block: mainBlock[0],
                    count: mainBlock[1]
                });
            }
        });

        // 合并相邻的相同类型层
        let mergedLayers = [];
        let currentLayer = null;
        significantLayers.sort((a, b) => b.y - a.y).forEach(layer => {
            if (!currentLayer) {
                currentLayer = {...layer, thickness: 1};
            } else if (currentLayer.block === layer.block && 
                       Math.abs(currentLayer.y - layer.y) === 1) {
                currentLayer.thickness++;
                currentLayer.y = layer.y;
            } else {
                mergedLayers.push(currentLayer);
                currentLayer = {...layer, thickness: 1};
            }
        });
        if (currentLayer) {
            mergedLayers.push(currentLayer);
        }

        // 生成地形描述
        if (mergedLayers.length > 0) {
            terrainDescription.push('地层分布(从上到下):');
            mergedLayers.forEach(layer => {
                terrainDescription.push(
                    `- 高度 ${layer.y}: ${layer.block} (厚度: ${layer.thickness}层)`
                );
            });
        }

        // 获取周围的实体
        const nearbyEntities = this.bot.entities;
        for (const entity of Object.values(nearbyEntities)) {
            if (!entity || entity === this.bot.entity) continue;

            if (entity.type === 'item') {
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

        // 如果周围什么都没有，返回"当前为空"
        if (Object.keys(environment.blocks).length === 0 && 
            Object.keys(environment.entities).length === 0 &&
            Object.keys(environment.items).length === 0) {
            return "当前为空";
        }

        // 将environment对象转换为字符串形式
        let result = '';
        
        // 添加地形描述
        if (terrainDescription.length > 0) {
            result += terrainDescription.join('\n') + '\n\n';
        }
        
        // 添加方块统计
        if (Object.keys(environment.blocks).length > 0) {
            result += '周围的方块:\n';
            result += Object.entries(environment.blocks)
                .map(([blockName, count]) => `${blockName}: ${count}`)
                .join('\n');
        }
        
        // 添加掉落物统计
        if (Object.keys(environment.items).length > 0) {
            if (result) result += '\n\n';
            result += '周围的掉落物:\n';
            result += Object.entries(environment.items)
                .map(([itemName, count]) => `${itemName}: ${count}`)
                .join('\n');
        }
        
        // 添加实体统计
        if (Object.keys(environment.entities).length > 0) {
            if (result) result += '\n\n';
            result += '周围的实体:\n';
            result += Object.entries(environment.entities)
                .map(([entityType, count]) => `${entityType}: ${count}`)
                .join('\n');
        }

        return result;
    }

    getBotPosition() {
        const pos = this.bot.entity.position;
        // 将坐标四舍五入到2位小数，并格式化为易读的字符串
        return `x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)}`;
    }

    async handleMessage(message) {

        if (message == "e") {
            const env = this.getEnvironment();
            this.bot.chat(env);
            const inv = this.getInventories();
            this.bot.chat(inv);
            return;
        }

        let code = '';
        let functionName = '';

        const skill = await this.skillManager.getSkill(message);
        if (skill) {
            this.bot.chat(`已找到匹配的技能: ${skill.description}`);
            code = skill.code;
            functionName = skill.functionName;
        } else {
            // 生成代码
            const result = await this.coder.gen(message, this.getEnvironment(), this.getInventories(), this.getBotPosition());
            if (!result) {
                return; 
            }
            this.bot.chat(this.coder.explanation);
            code = this.coder.code;
            functionName = this.coder.functionName;
        }

        // 执行代码
        await this.executor.run(code, functionName);

        // 反思
        const reflection = await this.reflector.validate(
                                                    message, 
                                                    this.getEnvironment(), 
                                                    this.getInventories(), 
                                                    this.getBotPosition(), 
                                                    this.coder.code, 
                                                    this.coder.explanation, 
                                                    this.executor.lastError
                                                );
        if (reflection) {
            if (reflection.success) {
                this.bot.chat('任务完成');
                if (!skill) {
                    ///更新技能库
                    await this.skillManager.saveSkill(this.coder.functionDescription, this.coder.functionName, this.coder.code);
                }

                this.coder.reset();
                this.executor.reset();
            } else {
                this.bot.char('任务失败');
            }
            this.bot.chat(reflection.reason);
        }
    }

}

module.exports = McBot;