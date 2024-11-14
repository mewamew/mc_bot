const logger = require('../utils/logger');
const llm = require('../utils/llm');
const fs = require('fs');
const json = require('../utils/json_extractor');

class Planner {
    constructor() {
    }

    async plan(message, inventory, environment, bot_position) {
        try {
            let prompt = fs.readFileSync('src/prompts/plan.txt', 'utf8');
            prompt = prompt.replace('{{inventory}}', inventory);
            prompt = prompt.replace('{{task}}', message);
            prompt = prompt.replace('{{bot_position}}', bot_position);
            prompt = prompt.replace('{{environment}}', environment);
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
            bot.chat(task);
        }
    }
}

module.exports = Planner; 