const logger = require('../utils/logger');
const llm = require('../utils/llm');
const fs = require('fs');
const json = require('../utils/json_extractor');

class TaskPlanner {
    constructor() {
    }

    async planTasks(message, inventory) {
        try {
            let prompt = fs.readFileSync('../prompts/reason.txt', 'utf8');
            prompt = prompt.replace('{{inventory}}', inventory);
            prompt = prompt.replace('{{task}}', message);
            const messages = [
                { role: "user", content: prompt}
            ];
            const response = await llm.call(messages);
            const json_result = json.extract(response);
            
            if (!json_result) {
                logger.error('JSON解析失败');
                return null;
            }

            return json_result;
        } catch (error) {
            logger.error(error);
            return null;
        }
    }

    showMyTasks(tasks, bot) {
        for (const task of tasks) {
            let message = '';
            switch (task.type) {
                case 'mine':
                    message = `挖掘 ${task.block_type} x${task.count}`;
                    break;
                case 'craft':
                    message = `制作 ${task.item_type} x${task.count}`;
                    break;
                case 'smelt':
                    message = `冶炼 ${task.item_type} x${task.count}`;
                    break;
                case 'kill':
                    message = `击杀 ${task.mob_type} x${task.count}`;
                    break;
                case 'cook':
                    message = `烹饪 ${task.food_type} x${task.count}`;
                    break;
                case 'equip':
                    message = `装备 ${task.item_type}`;
                    break;
                default:
                    message = `未知任务类型: ${task.type}`;
            }
            bot.chat(message);
        }
    }
}

module.exports = TaskPlanner; 