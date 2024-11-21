const vm = require('vm');
const { GoalNear, GoalFollow, GoalXZ, GoalGetToBlock, GoalLookAtBlock } = require('mineflayer-pathfinder').goals;
const Vec3 = require('vec3').Vec3;
const logger = require('../utils/logger');
const Action = require('../skills/action');

class Executor {
    constructor(bot, world) {
        this.bot = bot;
        this.world = world;
        this._currentTask = null;
        this._currentContext = null;
    }

    get lastError() {
        return this._lastError || '没有错误';
    }

    init(){
        this.initializeDependencies();
        this._lastError = '';
    }
    reset() {
        this._lastError = '';
    }

    // 初始化基础依赖
    initializeDependencies() {
        const mcData = require('minecraft-data')(this.bot.version);
        if(!mcData){
            throw new Error('mcData 初始化失败');
        }
        const action = new Action(this.bot, logger);
        this.dependencies = {
            bot: this.bot,
            require,
            console,
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
            Promise,
            // Mineflayer 相关依赖
            Vec3,
            GoalNear,
            GoalFollow,
            GoalXZ,
            GoalGetToBlock,
            GoalLookAtBlock,
            mcData,
            // 工具类
            action,
            logger,
            world: this.world
        };
    }

    // 准备执行环境
    prepareContext() {
        try {
            return vm.createContext(this.dependencies);
        } catch (error) {
            console.error('创建执行上下文失败:', error);
            throw error;
        }
    }

    // 构造可执行代码
    prepareExecutableCode(code, functionName) {
        return `
            shouldStop = false;
            hasStopped = false;

            ${code}
            (async () => {
                let interval = null;
                try {
                    const checkShouldStop = () => {
                        logger.info("检查是否应该停止:" + shouldStop);
                        if (shouldStop) {
                            throw new Error('任务被手动停止');
                        }
                    };
                    interval = setInterval(checkShouldStop, 1000);
                    await ${functionName}(bot);
                    clearInterval(interval);
                } catch (e) {
                    logger.warn("检测到任务强制停止");
                } finally {
                    clearInterval(interval);
                    hasStopped = true;
                }
            })();
        `;
    }

    // 执行代码
    async run(code, functionName) {
        try {
            // 清理之前的上下文
            if (this._currentContext) {
                await this.cleanup();
            }

            const executableCode = this.prepareExecutableCode(code, functionName);
            this._lastError = '';
            const script = new vm.Script(executableCode);
            this._currentContext = this.prepareContext();
            
            // 创建超时控制
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('任务执行超时'));
                }, 10000); // 30秒超时
            });
            
            // 执行主任务
            const executionPromise = script.runInContext(this._currentContext, {
                timeout: 30000,
                filename: 'dynamic-code.js'
            });

            // 使用 Promise.race 处理超时
            this._currentTask = Promise.race([
                executionPromise,
                timeoutPromise
            ]);

            await this._currentTask;

        } catch (error) {
            this._lastError = error.message;
            logger.error('代码执行错误');
            logger.pure('RED', error);
        } finally {
            await this.cleanup();
        }
    }

    async cleanup() {
        //停止当前任务
        if (this._currentContext && !this._currentContext.hasStopped) {
            // 设置停止标志
            logger.info("强制停止任务");
            this._currentContext.shouldStop = true;
            logger.info("等待任务结束");
            while(!this._currentContext.hasStopped){
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            logger.info("任务结束");
        }
        // 清空当前任务
        this._currentTask = null;
        
        // 释放 VM 上下文
        if (this._currentContext) {
            this._currentContext = null;
        }
    }
    
    async stopCurrentTask() {
        /*
        // 停止寻路
        if (this.bot.pathfinder) {
            this.bot.pathfinder.stop();
        }
        
        // 清除控制状态
        this.bot.clearControlStates();
        
        // 停止挖掘
        if (this.bot.targetDigBlock) {
            this.bot.stopDigging();
        }
        */
        
        if (this._currentContext && !this._currentContext.hasStopped) {
            // 设置停止标志
            logger.info("强制停止任务");
            this._currentContext.shouldStop = true;
            logger.info("等待任务结束");
            while(!this._currentContext.hasStopped){
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            logger.info("任务结束");
        }
        // 清空当前任务
        this._currentTask = null;
    }
}

module.exports = Executor; 