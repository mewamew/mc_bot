const logger = require('./logger');
const llm = require('./llm');
const fs = require('fs');
const json = require('./json_extractor');

class TaskPlanner {
    constructor() {
        this.prompt = fs.readFileSync('prompts/reason.txt', 'utf8');
    }

    async planTasks(message, inventory) {
        try {
            let prompt = this.prompt;
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
}

module.exports = TaskPlanner; 