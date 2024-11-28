const Planner = require('./agents/planner');
const Coder = require('./agents/coder');
const Reflector = require('./agents/reflector');
const Executor = require('./agents/executor');
const SkillManager = require('./skills/skill_manager');
const logger = require('./utils/logger');
const World = require('./skills/world');

class McBot {
    constructor(bot) {
        this.bot = bot;
        this.world = new World(bot, logger);
        //this.skillManager = new SkillManager();
        this.planner = new Planner();
        this.coder = new Coder(bot);
        this.executor = new Executor(bot, this.world);
        this.reflector = new Reflector();
        
        // 新增属性
        this.complexTask = null;
        this.subTasks = [];
        this.currentTaskIndex = 0;
    }

    async init() {
        //await this.skillManager.init();
        this.executor.init();
    }

    getInventories() {
        let inventory = {};
        for (const item of this.bot.inventory.items()) {
            if (item != null) {
                if (inventory[item.name] == null) {
                    inventory[item.name] = 0;
                }
                inventory[item.name] += item.count;
            }
        }
        
        // 如果物品栏为空，返回"当前为空"
        if (Object.keys(inventory).length === 0) {
            return "当前为空";
        }

        const result = Object.entries(inventory)
            .map(([itemName, count]) => `${itemName}: ${count}`)
            .join('\n');
        logger.info("拥有的物品:");
        console.log(result);
        return result;
    }

    getBotPosition() {
        const pos = this.bot.entity.position;
        // 将坐标四舍五入到2位小数，并格式化为易读的字符串
        return `x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)}`;
    }

    chat(message) {
        logger.info(message);
        this.bot.chat(message);
    }

    async doSingleTask(message) {
        let code = '';
        let functionName = '';

        // 直接生成代码
        logger.info("正在生成技能代码");
        const result = await this.coder.gen(message, this.world.getEnvironment(), this.getInventories(), this.getBotPosition());
        if (!result) {
            return {
                success: false,
                explain: "代码生成失败",
                need_replan: false
            }; 
        }
        this.bot.chat(this.coder.explanation);
        code = this.coder.code;
        functionName = this.coder.functionName;
        //logger.info("=== 生成技能代码 ===");
        //logger.pure('YELLOW', code);

        // 执行代码和反思的部分
        let attempts = 0;
        const MAX_ATTEMPTS = 5;
        
        while (attempts < MAX_ATTEMPTS) {
            // 执行代码
            logger.clearReport();
            logger.info("=== 执行代码 ===");
            await this.executor.run(code, functionName);
            
            // 反思
            logger.info("===执行完毕，开始反思 ===");
            const reflection = await this.reflector.validate(
                message,
                this.world.getEnvironment(),
                this.getInventories(),
                this.getBotPosition(),
                code,
                logger.getLastReport(),
                this.executor.lastError,
                this.complexTask,
                this.subTasks,
                this.currentTaskIndex
            );

            if (reflection) {
                logger.pure('YELLOW', "反思: " + reflection.explain);
                if (reflection.success) {
                    this.coder.reset();
                    this.executor.reset();
                    return {
                        success: true,
                        explain: "任务完成",
                        need_replan: false
                    };
                } else {
                    if (reflection.need_replan) {
                        return {
                            success: false,
                            explain: reflection.explain,
                            need_replan: true
                        };
                    }

                    //任务失败，重试
                    attempts++;
                    if (attempts >= MAX_ATTEMPTS) {
                        this.chat(`任务失败，已重试${MAX_ATTEMPTS}次`);
                        return {
                            success: false,
                            explain: "子任务失败，已重试" + MAX_ATTEMPTS + "次",
                            need_replan: false
                        };
                    }
                    
                    this.chat(`第${attempts}次尝试失败，正在重新生成代码...`);
                    // 根据反思结果重新生成代码
                    const result = await this.coder.gen(reflection.explain, this.world.getEnvironment(), this.getInventories(), this.getBotPosition());
                    if (!result) {
                        return {
                            success: false,
                            explain: "代码生成失败",
                            need_replan: false
                        };
                    }
                    this.chat(this.coder.explanation);
                    code = this.coder.code;
                    functionName = this.coder.functionName;
                }
            }
        }
    }

    async handleMessage(message) {
        logger.info("===== 收到任务 ==== ");
        logger.pure('YELLOW', " ***** " + message + " *****");
        
        //最多尝试3次
        const MAX_ATTEMPTS = 10;
        let attempts = 0;
        let reflection = null;

        // 保存复杂任务
        this.complexTask = message;
        
        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            // 获取任务分解
            const plan = await this.planner.plan(message, 
                        this.getInventories(), 
                        this.world.getEnvironment(), 
                        this.getBotPosition(), reflection);
            if (!plan) {
                return;
            }
            
            // 保存子任务列表
            this.subTasks = plan.sub_tasks;
            this.currentTaskIndex = 0;
            
            this.chat("任务分解理由: " + plan.reason);
            for (const task of plan.sub_tasks) {
                logger.pure("GREEN", "子任务: " + task);
            }

            for (const task of plan.sub_tasks) {
                this.chat("执行任务: " + task);
                const result = await this.doSingleTask(task);
                if (result.success) {
                    this.currentTaskIndex++;
                    this.chat("任务完成:");
                    this.chat(result.explain);
                } else {
                    this.chat("任务失败");
                    this.chat(result.explain);
                    if (result.need_replan) {
                        // 直接将失败原因作为反思结果
                        reflection = `上一次失败的任务分解:\n${plan.sub_tasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}\n失败反思: ${result.explain}`
                        //重置
                        this.coder.reset();
                        this.executor.reset();
                        break;
                    }
                }
            }
            if (this.currentTaskIndex >= plan.sub_tasks.length) {
                this.chat("所有任务完成");
                const Action = require('./skills/action');
                const action = new Action(this.bot, logger);
                await action.equipAndHold("iron_pickaxe");
                break;
            }
        }
        if (attempts >= MAX_ATTEMPTS) {
            this.chat("任务失败，已重试" + MAX_ATTEMPTS + "次");
        }
    }
}



module.exports = McBot;