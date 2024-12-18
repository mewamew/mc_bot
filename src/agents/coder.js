const logger = require('../utils/logger');
const llm = require('../utils/llm');
const fs = require('fs');


class Coder {
    constructor(bot) {
        this.bot = bot;
        this._chatHistory = [];
        this._code = '';
        this._functionName = '';
        this._functionDescription = '';
        this._explanation = '';
    }

    reset() {
        this._chatHistory = [];
        this._code = '';
        this._functionName = '';
        this._functionDescription = '';
        this._explanation = '';
    }


    get code() {
        return this._code;
    }

    get functionName() {
        return this._functionName;
    }

    get functionDescription() {
        return this._functionDescription;
    }

    get explanation() {
        return this._explanation;
    }

    formatChatHistory() {
        let formattedHistory = '';
        for (let i = 0; i < this._chatHistory.length; i += 2) {
            formattedHistory += `玩家说: ${this._chatHistory[i]}\n`;
            if (i + 1 < this._chatHistory.length) {
                formattedHistory += `bot说: ${this._chatHistory[i + 1]}\n`;
            }
        }
        return formattedHistory;
    }

    loadSampleCode() {
        const base = fs.readFileSync(`src/sample_codes/base.js`, 'utf8');
        const move = fs.readFileSync(`src/sample_codes/move.js`, 'utf8');
        const craft = fs.readFileSync(`src/sample_codes/craft.js`, 'utf8');
        const place = fs.readFileSync(`src/sample_codes/place.js`, 'utf8');
        const mine = fs.readFileSync(`src/sample_codes/mine.js`, 'utf8');
        return base+move+craft+place+mine;
    }

    async gen(message, environment, inventory, bot_position) {
        this._chatHistory.push(message);
        const sampleCode = this.loadSampleCode();
        const chatHistory = this.formatChatHistory();
        let prompt = fs.readFileSync('src/prompts/coder.txt', 'utf8');

        // 替换提示词中的占位符
        prompt = prompt.replace('{{task}}', this._chatHistory[0]);
        prompt = prompt.replace('{{code}}', sampleCode);
        prompt = prompt.replace('{{bot_inventory}}', inventory);
        prompt = prompt.replace('{{environment}}', environment);
        prompt = prompt.replace('{{bot_position}}', bot_position);
        prompt = prompt.replace('{{chat_history}}', chatHistory);
        prompt = prompt.replace('{{last_code}}', this._code || '暂时没有上次代码');

        const messages = [
            { role: "user", content: prompt }
        ];
        
        const response = await llm.call(messages, 0.0);
        if (!response) {
            //TODO what to do?
            logger.error('代码生成失败');
            return false;
        }
        
        // 提取并保存解释文本
        /*
        const explanation = this.extractExplanationFromResponse(response);
        if (!explanation) {
            //TODO what to do?
            logger.error('无法找到解释');
            return false;
        }
        this._explanation = explanation;
        this._chatHistory.push(explanation);

        // 提取主函数功能说明
        const functionDescription = this.extractMainFunctionDescription(response);
        if (!functionDescription) {
            //TODO what to do?
            logger.error('无法找到主函数功能说明');
            return false;
        }
        this._functionDescription = functionDescription;
        */

        const functionName = this.extractMainFunctionName(response);
        if (!functionName) {
            //TODO what to do?
            logger.error('无法找到主函数名');
            return false;
        }
        this._functionName = functionName;

        const code = this.extractCodeFromResponse(response);    
        if (!code) {
            //TODO what to do?
            logger.error('无法找到代码');
            return false;
        }

        this._code = code;
        return true;
    }

    
    extractMainFunctionName(code) {
        // 匹配函数声明
        const match = code.match(/(?:async\s+)?function\s+(\w+)\s*\(\s*bot\s*\)/);
        return match ? match[1] : null;
    }

    extractExplanationFromResponse(response) {
        // 提取任务分析部分
        const match = response.match(/任务分析:[\s\S]*?(?=执行计划:)/);
        return match ? match[0].trim() : '';
    }

    extractMainFunctionDescription(response) {
        // 匹配函数说明部分的desc代码块
        const match = response.match(/```desc\n([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    }

    extractCodeFromResponse(response) {
        // 匹配代码实现部分的js代码块
        const match = response.match(/```js\n([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    }
}

module.exports = Coder; 