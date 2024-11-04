const logger = require('./logger');
const llm = require('./llm');
const json = require('./json_extractor');
const fs = require('fs');


class TaskValidator {
    constructor() {
    }

    async validate(message, inventory, last_code) {
        let prompt = fs.readFileSync('prompts/validate.txt', 'utf8');
        prompt = prompt.replace('{{inventory}}', inventory);
        prompt = prompt.replace('{{task}}', message);
        prompt = prompt.replace('{{last_code}}', last_code);

        const messages = [
            { role: "user", content: prompt}
        ];

        let attempts = 3;
        while (attempts > 0) {
            const response = await llm.call(messages);
            const json_result = json.extract(response);
            
            if (json_result) {
                return json_result;
            }
            
            logger.error(`JSON解析失败，剩余重试次数: ${attempts - 1}`);
            attempts--;
        }

        logger.error('JSON解析失败，已达到最大重试次数');
        return null;
    }
}

module.exports = TaskValidator;

