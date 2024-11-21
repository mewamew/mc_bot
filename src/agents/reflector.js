const logger = require('../utils/logger');
const llm = require('../utils/llm');
const json = require('../utils/json_extractor');
const fs = require('fs');


class Reflector {
    constructor() {
    }

    async validate(message, environment, inventory, bot_position, last_code, last_report, last_error, complexTask, subTasks, currentTaskIndex) {
        let prompt = fs.readFileSync('src/prompts/reflect.txt', 'utf8');
        
        const numberedSubTasks = subTasks.map((task, index) => `${index + 1}. ${task}`);
        
        prompt = prompt.replace('{{complex_task}}', complexTask);
        prompt = prompt.replace('{{subtasks}}', numberedSubTasks.join('\n'));
        prompt = prompt.replace('{{current_task}}', message);
        
        prompt = prompt.replace('{{environment}}', environment);
        prompt = prompt.replace('{{inventory}}', inventory);    
        prompt = prompt.replace('{{task}}', message);
        prompt = prompt.replace('{{bot_position}}', bot_position);
        prompt = prompt.replace('{{last_code}}', last_code);
        prompt = prompt.replace('{{last_report}}', last_report);
        prompt = prompt.replace('{{last_error}}', last_error);

        const messages = [
            { role: "user", content: prompt}
        ];

        let attempts = 3;
        while (attempts > 0) {
            const response = await llm.call(messages);
            if (response == null) {
                logger.error('LLM返回为空，剩余重试次数: ' + attempts);
                attempts--;
                continue;
            }
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

module.exports = Reflector;