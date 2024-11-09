const logger = require('./logger');
const TaskPlanner = require('./agents/task_planner');
const TaskExecutor = require('./agents/task_executor');
const Reflector = require('./agents/reflect');

class McBot {
    constructor(bot) {
        this.bot = bot;

        this.taskPlanner = new TaskPlanner();
        this.taskExecutor = new TaskExecutor(bot);
        this.reflector = new Reflector();
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

    async handleMessage(message) {
        const maxRetries = 3;   
        let retries = 0;

        await this.taskExecutor.run(message, this.getEnvironment(), this.getInventories());
        while (retries < maxRetries) {
            const result = await this.reflector.validate(
                message.substring(1), 
                this.getEnvironment(), 
                this.getInventories(), 
                this.taskExecutor.getLastCode(),
                this.taskExecutor.getLastError()
            );
            
            this.bot.chat(result.success ? '任务完成' : '任务失败');
            this.bot.chat(result.reason);

            if (result.success) {
                this.taskExecutor.reset();
                break;
            } else {
                retries++;
                await this.taskExecutor.run(result.reason, this.getEnvironment(), this.getInventories());
            }
        }
    }

    getEnvironment() {
        let environment = {
            blocks: {},
            entities: {},
            items: {}
        };

        // 获取周围32格范围内的方块
        const nearbyBlocks = this.bot.findBlocks({
            matching: block => block.name !== 'air',
            maxDistance: 32,
            count: 100
        });

        // 统计方块数量
        for (const pos of nearbyBlocks) {
            const block = this.bot.blockAt(pos);
            if (block) {
                if (environment.blocks[block.name] == null) {
                    environment.blocks[block.name] = 0;
                }
                environment.blocks[block.name]++;
            }
        }

        // 获取周围的实体
        const nearbyEntities = this.bot.entities;
        for (const entity of Object.values(nearbyEntities)) {
            if (!entity || entity === this.bot.entity) continue;

            if (entity.type === 'item') {
                const itemName = entity.metadata[7]?.itemId?.replace('minecraft:', '');
                if (itemName) {
                    if (environment.items[itemName] == null) {
                        environment.items[itemName] = 0;
                    }
                    environment.items[itemName] += entity.metadata[7].itemCount || 1;
                }
            } else if (entity.type) {
                if (environment.entities[entity.type] == null) {
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
        
        if (Object.keys(environment.blocks).length > 0) {
            result += '周围的方块:\n';
            result += Object.entries(environment.blocks)
                .map(([blockName, count]) => `${blockName}: ${count}`)
                .join('\n');
        }
        
        if (Object.keys(environment.items).length > 0) {
            if (result) result += '\n\n';
            result += '周围的掉落物:\n';
            result += Object.entries(environment.items)
                .map(([itemName, count]) => `${itemName}: ${count}`)
                .join('\n');
        }
        
        if (Object.keys(environment.entities).length > 0) {
            if (result) result += '\n\n';
            result += '周围的实体:\n';
            result += Object.entries(environment.entities)
                .map(([entityType, count]) => `${entityType}: ${count}`)
                .join('\n');
        }

        return result;
    }
}

module.exports = McBot;