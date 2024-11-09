const logger = require('../logger');
const llm = require('./llm');
const fs = require('fs');
const CodeExecutor = require('./code_executor');

class TaskExecutor {
    constructor(bot) {
        this.bot = bot;
        this.codeExecutor = new CodeExecutor(bot);
        this.chat_history = [];
        this.last_code = '';
        this.last_error = '';
    }

    getLastCode() {
        return this.last_code;
    }

    getLastError() {
        return this.last_error;
    }


    async run(task, environment, inventory) {
        try {
            // 生成代码
            const code = await this.generateCode(task, environment, inventory);
            if (!code) {
                logger.error('代码生成失败');
                return false;
            }
            logger.info(code);

            // 提取主函数名
            const functionName = this.extractMainFunctionName(code);
            if (!functionName) {
                logger.error('无法找到主函数名');
                return false;
            }
            logger.info(functionName);

            // 保存代码到文件
            const filePath = `codes/${functionName}.js`;
            fs.writeFileSync(filePath, code, 'utf8');
            logger.info(`代码已保存到: ${filePath}`);

            // 执行代码
            await this.codeExecutor.execute(code, functionName);
            this.last_code = code;
            return true;
        } catch (error) {
            logger.error('任务执行失败:', error);
            this.last_error = error.message;
            return false;
        }
    }

    async generateCode(task, environment, inventory) {
        this.chat_history.push(task);
        let prompt = fs.readFileSync('prompts/action.txt', 'utf8');
        const code = fs.readFileSync('sample_codes/base.js', 'utf8');

        // 替换提示词中的占位符
        prompt = prompt.replace('{{code}}', code);
        prompt = prompt.replace('{{bot_inventory}}', inventory);
        prompt = prompt.replace('{{environment}}', environment);
        prompt = prompt.replace('{{chat_history}}', this.getChatHistory());
        prompt = prompt.replace('{{last_code}}', this.last_code || '暂时没有上次代码');
        
        const messages = [
            { role: "system", content: "你是Minecraft控制代码生成器" },
            { role: "user", content: prompt }
        ];

        const response = await llm.call(messages, 0.0);
        
        // 提取并保存解释文本
        const explanation = this.extractExplanationFromResponse(response);
        if (explanation) {
            this.bot.chat(explanation);
            this.chat_history.push(explanation);
        }
        return this.extractCodeFromResponse(response);
    }

    getChatHistory() {
        let formattedHistory = '';
        for (let i = 0; i < this.chat_history.length; i += 2) {
            formattedHistory += `玩家说: ${this.chat_history[i]}\n`;
            if (i + 1 < this.chat_history.length) {
                formattedHistory += `bot说: ${this.chat_history[i + 1]}\n`;
            }
        }
        return formattedHistory;
    }

    extractExplanationFromResponse(response) {
        const match = response.match(/解释:([\s\S]*?)(?:计划:|代码:)/);
        return match ? match[1].trim() : '';
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

    extractCodeFromResponse(response) {
        const match = response.match(/```js\n([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    }
}

module.exports = TaskExecutor; 