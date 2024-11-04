const logger = require('./logger');
const TaskPlanner = require('./task_planner');
const TaskExecutor = require('./task_executor');
const TaskValidator = require('./task_validator');

class McBot {
    constructor(bot) {
        this.bot = bot;

        this.taskPlanner = new TaskPlanner();
        this.taskExecutor = new TaskExecutor(bot);
        this.taskValidator = new TaskValidator();
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
        
        if (message.startsWith('c')) {
            //测试用，c开头的直接执行任务
            await this.taskExecutor.run(message.substring(1), this.getInventories());
        } else if (message.startsWith('d')) {
            await this.taskExecutor.debugJs("codes/"+message.substring(1)+".js");
        } else {
            const json_result = await this.taskPlanner.planTasks(message, this.getInventories());
            if (json_result) {
                logger.info(json_result);
                this.bot.chat(json_result.reason);
                this.taskPlanner.showMyTasks(json_result.sub_tasks, this.bot);
            }
        }
    }
}

module.exports = McBot;