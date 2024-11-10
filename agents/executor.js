const logger = require('../logger');
const llm = require('../llm');
const fs = require('fs');
const CodeExecutor = require('./code_executor');

class Runtime {
    constructor() {
        this.lastFunctionName = '';
        this.lastCode = '';
        this.lastError = '';
        this.lastReport = '';
        this.lastFunctionDescription = '';
    }

    getLastFunctionName() {
        return this.lastFunctionName;
    }

    getLastCode() {
        return this.lastCode;
    }

    getLastError() {
        return this.lastError;
    }

    getLastReport() {
        return this.lastReport;
    }

    getLastFunctionDescription() {
        return this.lastFunctionDescription;
    }

    reset() {
        this.lastFunctionName = '';
        this.lastCode = '';
        this.lastError = '';
        this.lastReport = '';
        this.lastFunctionDescription = '';
    }

    setLastFunctionName(functionName) {
        this.lastFunctionName = functionName;
    }

    setLastCode(code) {
        this.lastCode = code;
    }

    setLastError(error) {
        this.lastError = error;
    }

    setLastReport(report) {
        this.lastReport = report;
    }

    setLastFunctionDescription(description) {
        this.lastFunctionDescription = description;
    }
}

class TaskExecutor {
    constructor(bot) {
        this.bot = bot;
        this.codeExecutor = new CodeExecutor(bot);
        this.chat_history = [];
        this.runtime = new Runtime();
    }

    getRuntime() {
        return this.runtime;
    }

    reset() {
        this.chat_history = [];
        this.runtime.reset();
    }

    async run(task, environment, inventory, bot_position) {
        try {
            // 生成代码
            const code = await this.generateCode(task, environment, inventory, bot_position);
            if (!code) {
                logger.error('代码生成失败');
                return false;
            }
            logger.info("==== 生成的代码: ====\n" + code);



            // 提取主函数名
            const functionName = this.extractMainFunctionName(code);
            if (!functionName) {
                logger.error('无法找到主函数名');
                return false;
            }
            logger.clearReport();
            this.runtime.setLastFunctionName(functionName);
            await this.codeExecutor.execute(code, functionName);

            this.runtime.setLastCode(code);
            this.runtime.setLastReport(logger.getLastReport());

            return true;
        } catch (error) {
            logger.error('任务执行失败:', error);
            this.runtime.setLastError(error.message);
            return false;
        }
    }

    async generateCode(task, environment, inventory, bot_position) {
        this.chat_history.push(task);
        let prompt = fs.readFileSync('prompts/action.txt', 'utf8');
        const code = fs.readFileSync('sample_codes/base.js', 'utf8');

        // 替换提示词中的占位符
        prompt = prompt.replace('{{code}}', code);
        prompt = prompt.replace('{{bot_inventory}}', inventory);
        prompt = prompt.replace('{{environment}}', environment);
        prompt = prompt.replace('{{bot_position}}', bot_position);
        prompt = prompt.replace('{{chat_history}}', this.getChatHistory());
        prompt = prompt.replace('{{last_code}}', this.runtime.getLastCode() || '暂时没有上次代码');
        
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

        // 提取主函数功能说明
        const functionDescription = this.extractMainFunctionDescription(response);
        if (!functionDescription) {
            logger.error('无法找到主函数功能说明');
            return null;
        }
        this.runtime.setLastFunctionDescription(functionDescription);
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
        logger.error('response: ' + response);
        // 修改正则表达式以匹配 ```desc 和下一个 ``` 之间的内容
        const match = response.match(/```desc\n([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    }

    extractCodeFromResponse(response) {
        const match = response.match(/```js\n([\s\S]*?)```/);
        return match ? match[1].trim() : null;
    }
}

module.exports = TaskExecutor; 