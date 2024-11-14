const vm = require('vm');
const { GoalNear, GoalFollow, GoalXZ, GoalGetToBlock, GoalLookAtBlock } = require('mineflayer-pathfinder').goals;
const Vec3 = require('vec3').Vec3;
const logger = require('../utils/logger');
const Utils = require('../skills/utils');

class Executor {
    constructor(bot) {
        this.bot = bot;
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
        const utils = new Utils(this.bot, logger);
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
            utils,
            logger
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
            ${code}
            (async () => {
                await ${functionName}(bot);
            })();
        `;
    }

    // 执行代码
    async run(code, functionName) {
        // 清理之前的上下文
        if (this._currentContext) {
            this.cleanup();
        }

        const executableCode = this.prepareExecutableCode(code, functionName);
        try {
            this._lastError = '';
            const script = new vm.Script(executableCode);
            
            //logger.info("=== 执行代码 ===");
            //logger.pure('YELLOW', executableCode);  
            // 创建新的上下文
            this._currentContext = this.prepareContext();
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    this.cleanup();
                    reject(new Error('任务执行超时'));
                }, 30000);
            });
            
            this._currentTask = Promise.race([
                script.runInContext(this._currentContext, {
                    timeout: 30000,
                    filename: 'dynamic-code.js'
                }),
                timeoutPromise
            ]);

            await this._currentTask;
            this.cleanup();
        } catch (error) {
            this.cleanup();
            this._lastError = error.message;
            logger.error('代码执行错误');
            logger.pure('RED', error);
        }
    }

    cleanup() {
        // 停止当前任务
        this.stopCurrentTask();
        
        // 释放 VM 上下文
        if (this._currentContext) {
            this._currentContext = null;
        }
    }

    stopCurrentTask() {
        //if (this.bot.pathfinder) {
        //    this.bot.pathfinder.stop();
        //}
        this.bot.clearControlStates();
        this._currentTask = null;
    }
}

module.exports = Executor; 