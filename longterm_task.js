const { Task } = require('./task')
const llm = require('./llm')
const fs = require('fs')
const CodeExecutor = require('./code_executor');

let chat_history = [];
let last_code = '';

class LongTermTask extends Task {
    constructor(bot, message) {
        super(
            () => this.runLongTermTask(message),
            () => this.cancelLongTermTask()
        );
        this.bot = bot;
        this.codeExecutor = new CodeExecutor(bot);
        
    }

    getInventoryCounts() {
        let inventory = {};
        for (const item of this.bot.inventory.items()) {
            if (item != null) {
                if (inventory[item.name] == null) {
                    inventory[item.name] = 0;
                }
                inventory[item.name] += item.count;
            }
        }
        
        // 将inventory对象转换为字符串形式
        return Object.entries(inventory)
            .map(([itemName, count]) => `${itemName}: ${count}`)
            .join('\n');
    }

    getChatHistory() {
        let formattedHistory = '';
        for (let i = 0; i < chat_history.length; i += 2) {
            formattedHistory += `玩家说: ${chat_history[i]}\n`;
            if (i + 1 < chat_history.length) {
                formattedHistory += `bot说: ${chat_history[i + 1]}\n`;
            }
        }
        return formattedHistory;
    }

    extractExplanationFromResponse(response) {
        // 匹配"解释:"后面到"计划:"或"代码:"之前的内容
        const match = response.match(/解释:([\s\S]*?)(?:计划:|代码:)/);
        if (match && match[1]) {
            return match[1].trim();
        }
        return '';
    }

    async generateCode(message) {
        chat_history.push(message);
        const code = fs.readFileSync('sample_codes/base.js', 'utf8');
        let prompt = fs.readFileSync('prompts/action.txt', 'utf8');
        prompt = prompt.replace('{{code}}', code);
        prompt = prompt.replace('{{chat_history}}', this.getChatHistory());
        prompt = prompt.replace('{{bot_inventory}}', this.getInventoryCounts());
        if (last_code) {
            prompt = prompt.replace('{{last_code}}', last_code);
        } else {
            prompt = prompt.replace('{{last_code}}', '暂时没有上次代码');
        }

        // 写入 prompt 到文件
        fs.writeFileSync('p.txt', prompt, 'utf8');

        const messages = [
            { role: "system", content: "你是Minecraft控制代码生成器, 你根据玩家的需求生成代码" },
            { role: "user", content: prompt}
        ];
        const response = await llm.call(messages);
        
        // 写入 response 到文件
        fs.writeFileSync('r.txt', response, 'utf8');
        
        // 提取并保存解释文本
        const explanation = this.extractExplanationFromResponse(response);
        console.log('解释:', explanation);
        this.bot.chat(explanation);
        
        chat_history.push(explanation);
        return this.extractCodeFromResponse(response);
    }

    extractCodeFromResponse(response) {
        // 使用正则表达式匹配 ```js 和 ``` 之间的内容
        const match = response.match(/```js\n([\s\S]*?)```/);
        if (match && match[1]) {
            return match[1].trim();
        }
        // 如果没有找到代码块，返回空字符串或抛出错误
        return '';
    }

    extractMainFunctionName(code) {
        // 匹配 async function name 或 function name 格式
        const match = code.match(/(?:async\s+)?function\s+(\w+)/);
        if (match && match[1]) {
            return match[1];
        }
        return null;
    }

    async runLongTermTask(message) {
        try {
            let code = await this.generateCode(message);
            
            // 提取主函数名
            const functionName = this.extractMainFunctionName(code);
            if (!functionName) {
                console.error('无法找到主函数名');
                return;
            }

            last_code = code;

            // 使用 CodeExecutor 执行代码
            await this.codeExecutor.execute(code, functionName);
        } catch (error) {
            console.error('任务执行失败:', error);
            this.bot.chat('任务执行失败: ' + error.message);
        }
    }

    async cancelLongTermTask() {
        if (this.codeExecutor) {
            this.codeExecutor.cleanup();
        }
    }
}

module.exports = {
    LongTermTask
}
