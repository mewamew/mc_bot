const logger = require('../logger');
const llm = require('../llm');
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

    async gen(message, environment, inventory, bot_position) {
        this._chatHistory.push(message);
        const sampleCode = fs.readFileSync('sample_codes/base.js', 'utf8');
        const chatHistory = this.formatChatHistory();
        let prompt = fs.readFileSync('prompts/action.txt', 'utf8');

        // 替换提示词中的占位符
        prompt = prompt.replace('{{code}}', sampleCode);
        prompt = prompt.replace('{{bot_inventory}}', inventory);
        prompt = prompt.replace('{{environment}}', environment);
        prompt = prompt.replace('{{bot_position}}', bot_position);
        prompt = prompt.replace('{{chat_history}}', chatHistory);
        prompt = prompt.replace('{{last_code}}', this._code || '暂时没有上次代码');
        
        const messages = [
            { role: "system", content: "你是Minecraft控制代码生成器" },
            { role: "user", content: prompt }
        ];

        const response = await llm.call(messages, 0.0);
        if (!response) {
            //TODO what to do?
            logger.error('代码生成失败');
            return false;
        }
        
        // 提取并保存解释文本
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
        // 匹配所有的函数声明
        const matches = Array.from(code.matchAll(/(?:async\s+)?function\s+(\w+)/g));
        
        // 如果有匹配项，返回最后一个函数名
        if (matches.length > 0) {
            return matches[matches.length - 1][1];
        }
    
        return null;
    }

    extractExplanationFromResponse(response) {
        const match = response.match(/解释:([\s\S]*?)(?:计划:|代码:)/);
        return match ? match[1].trim() : '';
    }

    extractMainFunctionDescription(response) {
        // 修改正则表达式以匹配 ```desc 和下一个 ``` 之间的内容
        const match = response.match(/```desc\n([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    }

    extractCodeFromResponse(response) {
        const match = response.match(/```js\n([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    }
}

module.exports = Coder; 